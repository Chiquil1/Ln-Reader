import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

class RittoPlugin implements Plugin.PluginBase {
  id = 'ritto';

  name = 'Ritto';

  icon = 'https://ritto.cc/logo/ritto1w.png';

  site = 'https://ritto.cc/';

  version = '1.0.2';

  filters = undefined;

  /**
   * Extrae las novelas del catálogo.
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    const seenPaths = new Set<string>();

    $('a.ritto-work-card').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (!href.startsWith('/obra/')) {
        return;
      }

      if (seenPaths.has(href)) {
        return;
      }

      const name =
        $(el).find('h3').first().text().trim() ||
        $(el).find('img').first().attr('alt')?.trim() ||
        '';

      const img = $(el).find('img').first();

      const coverSrc = img.attr('src') || img.attr('data-src') || '';

      const cover = coverSrc
        ? coverSrc.startsWith('http')
          ? coverSrc
          : this.site.slice(0, -1) + coverSrc
        : defaultCover;

      if (!name) {
        return;
      }

      seenPaths.add(href);

      novels.push({
        name,
        path: href,
        cover,
      });
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const orden = showLatestNovels ? 'reciente' : 'vistas';

    const url =
      `${this.site}catalogo?tipo=NOVELA` +
      `&orden=${orden}` +
      `&pagina=${pageNo}`;

    const body = await fetchApi(url).then(res => res.text());

    return this.parseNovelCards(body);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url =
      `${this.site}catalogo?busqueda=${encodeURIComponent(searchTerm)}` +
      `&tipo=NOVELA` +
      `&orden=reciente` +
      `&pagina=${pageNo}`;

    const body = await fetchApi(url).then(res => res.text());

    return this.parseNovelCards(body);
  }

  /**
   * Extrae TODOS los capítulos desde el payload de Next.js.
   *
   * IMPORTANTE:
   *
   * Ritto no renderiza necesariamente todos los capítulos como
   * elementos <a> normales.
   *
   * Ejemplo comprobado con Yokuoni:
   *
   * enlaces HTML visibles -> 11
   * payload Next.js       -> 30
   *
   * Dentro del payload aparecen:
   *
   * \"href\":\"/obra/yokuoni/capitulo/capitulo-30?scan=...\"
   *
   * Por eso buscamos directamente esos href.
   */
  private extractChapters(
    body: string,
    novelPath: string,
  ): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];

    const seenPaths = new Set<string>();

    /**
     * Next.js escapa las comillas dentro de self.__next_f:
     *
     * \"href\":\"...\"
     *
     * Las normalizamos:
     *
     * "href":"..."
     */
    const normalizedBody = body
      .replace(/\\"/g, '"')
      .replace(/\\u0026/gi, '&')
      .replace(/\\u003d/gi, '=')
      .replace(/\\u003f/gi, '?')
      .replace(/\\\//g, '/');

    /**
     * novelPath:
     *
     * /obra/yokuoni
     *
     * Queremos solamente capítulos pertenecientes a ESTA obra.
     */
    const cleanNovelPath = novelPath.split('?')[0].replace(/\/+$/, '');

    /**
     * Escapamos el path para utilizarlo dentro de RegExp.
     */
    const escapedNovelPath = cleanNovelPath.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    /**
     * Este es el equivalente al patrón que comprobamos en Terminal
     * y que encontró los 30 capítulos de Yokuoni.
     */
    const chapterRegex = new RegExp(
      `"href"\\s*:\\s*"(${escapedNovelPath}\\/capitulo\\/[^"]+)"`,
      'g',
    );

    let match: RegExpExecArray | null;

    while ((match = chapterRegex.exec(normalizedBody)) !== null) {
      let href = match[1];

      /**
       * Convertimos entidades HTML por si & aparece escapado.
       */
      href = href.replace(/&amp;/g, '&').replace(/\\u0026/gi, '&');

      if (seenPaths.has(href)) {
        continue;
      }

      /**
       * Ejemplos:
       *
       * capitulo-30
       * capitulo-116
       * capitulo-449-5
       * capitulo-12.5
       */
      const slugMatch = href.match(/\/capitulo\/capitulo-(\d+(?:[.-]\d+)?)/i);

      let chapterNumber: number | undefined;

      if (slugMatch) {
        /**
         * Si algún sitio representa:
         *
         * capitulo-449-5
         *
         * lo interpretamos como:
         *
         * 449.5
         */
        const rawNumber = slugMatch[1].replace(/^(\d+)-(\d+)$/, '$1.$2');

        const parsedNumber = Number(rawNumber);

        if (Number.isFinite(parsedNumber)) {
          chapterNumber = parsedNumber;
        }
      }

      /**
       * Solo aceptamos URLs que realmente tengan estructura
       * de capítulo.
       */
      if (chapterNumber === undefined) {
        continue;
      }

      seenPaths.add(href);

      chapters.push({
        name: `Cap. ${chapterNumber}`,
        path: href,
        chapterNumber,
      });
    }

    /**
     * Fallback.
     *
     * Si Ritto cambia el payload de Next.js en el futuro,
     * intentamos recuperar los enlaces HTML normales.
     */
    if (chapters.length === 0) {
      const $ = cheerio.load(body);

      $(`a[href*="${cleanNovelPath}/capitulo/"]`).each((_, el) => {
        const href = $(el).attr('href') || '';

        if (!href || seenPaths.has(href)) {
          return;
        }

        const slugMatch = href.match(/\/capitulo\/capitulo-(\d+(?:[.-]\d+)?)/i);

        if (!slugMatch) {
          return;
        }

        const rawNumber = slugMatch[1].replace(/^(\d+)-(\d+)$/, '$1.$2');

        const chapterNumber = Number(rawNumber);

        if (!Number.isFinite(chapterNumber)) {
          return;
        }

        seenPaths.add(href);

        chapters.push({
          name: `Cap. ${chapterNumber}`,
          path: href,
          chapterNumber,
        });
      });
    }

    /**
     * Ritto devuelve normalmente:
     *
     * 30
     * 29
     * 28
     * ...
     * 1
     *
     * LNReader debe recibir:
     *
     * 1
     * 2
     * 3
     * ...
     * 30
     */
    chapters.sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));

    return chapters;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + novelPath.replace(/^\//, '');

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    /**
     * Título
     */
    const name =
      $('.obra-hub h1').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /**
     * Portada
     */
    let coverSrc =
      $('.obra-hub__cover img').first().attr('src') ||
      $('img[src*="/covers/"]').first().attr('src') ||
      '';

    if (!coverSrc) {
      coverSrc = $('meta[property="og:image"]').attr('content') || '';
    }

    const cover = coverSrc
      ? coverSrc.startsWith('http')
        ? coverSrc
        : this.site.slice(0, -1) + coverSrc
      : defaultCover;

    /**
     * Sinopsis
     */
    let summary = $('.obra-hub__description').first().text().trim();

    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /**
     * Estado
     */
    const pageText = $('.obra-hub').first().text();

    const status = /Finalizado/i.test(pageText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    /**
     * TODOS los capítulos desde el payload de Next.js.
     */
    const chapters = this.extractChapters(body, novelPath);

    return {
      path: novelPath,
      name,
      cover,
      summary,
      status,
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    /**
     * Abrimos la página del capítulo.
     */
    const chapterUrl = this.site + chapterPath.replace(/^\//, '');

    const body = await fetchApi(chapterUrl).then(res => res.text());

    /**
     * Ritto incluye en el payload:
     *
     * "archivoUrl":"/api/capitulos/{ID}/archivo"
     *
     * Puede venir normal o escapado.
     */
    const archivoMatch =
      body.match(
        /\\"archivoUrl\\"\s*:\s*\\"(\/api\/capitulos\/[^"\\]+\/archivo)\\"/,
      ) ||
      body.match(/"archivoUrl"\s*:\s*"(\/api\/capitulos\/[^"]+\/archivo)"/);

    if (!archivoMatch) {
      throw new Error(
        'Ritto: no se pudo encontrar archivoUrl para este capítulo.',
      );
    }

    const archivoUrl = archivoMatch[1];

    /**
     * El endpoint devuelve directamente el texto del capítulo.
     */
    const text = await fetchApi(this.site.slice(0, -1) + archivoUrl).then(res =>
      res.text(),
    );

    if (!text.trim()) {
      throw new Error('Ritto: el capítulo no contiene texto.');
    }

    /**
     * Escapamos HTML para no romper el documento de LNReader.
     */
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    /**
     * Conservamos los párrafos para LNReader y TTS.
     */
    return text
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean)
      .map(paragraph => {
        const safeText = escapeHtml(paragraph).replace(/\n/g, '<br>');

        return `<p>${safeText}</p>`;
      })
      .join('');
  }
}

export default new RittoPlugin();

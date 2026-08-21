import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

class RittoPlugin implements Plugin.PluginBase {
  id = 'ritto';

  name = 'Ritto';

  icon = 'src/es/ritto/icon.png';

  site = 'https://ritto.cc/';

  version = '1.0.0';

  filters = undefined;

  /**
   * Extrae las novelas mostradas en el catálogo.
   *
   * Ritto mezcla manga, manhwa, novelas, etc., por lo que las URLs
   * que llaman a este método deben incluir tipo=NOVELA.
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    $('a.ritto-work-card').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (!href.startsWith('/obra/')) {
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

      if (name && href) {
        novels.push({
          name,
          path: href,
          cover,
        });
      }
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

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + novelPath.replace(/^\//, '');

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    /*
     * Título
     */
    const name =
      $('.obra-hub h1').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /*
     * Portada
     *
     * No usamos og:image como primera opción porque Ritto utiliza
     * un banner distinto a la portada de la obra.
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

    /*
     * Sinopsis
     *
     * La ficha renderizada por Ritto contiene la descripción completa.
     * Como respaldo utilizamos meta description.
     */
    let summary = $('.obra-hub__description').first().text().trim();

    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /*
     * Estado
     */
    const pageText = $('.obra-hub').first().text();

    let status = NovelStatus.Ongoing;

    if (/Finalizado/i.test(pageText)) {
      status = NovelStatus.Completed;
    } else if (/En emisión/i.test(pageText)) {
      status = NovelStatus.Ongoing;
    }

    /*
     * Capítulos
     */
    const chapters: Plugin.ChapterItem[] = [];

    const seenPaths = new Set<string>();

    /*
     * Ritto incluye los enlaces de los capítulos en el HTML generado
     * por Next.js.
     *
     * Ejemplo:
     *
     * /obra/slug/capitulo/capitulo-116?scan=riomy-scan
     */
    $('a[href*="/capitulo/"]').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (!href.includes('/obra/') || !href.includes('/capitulo/')) {
        return;
      }

      if (seenPaths.has(href)) {
        return;
      }

      const text = $(el).text().replace(/\s+/g, ' ').trim();

      /*
       * Sacamos el número principalmente del slug.
       *
       * Ejemplo:
       * capitulo-116 -> 116
       */
      const numberMatch =
        href.match(/\/capitulo\/capitulo-(\d+(?:\.\d+)?)/i) ||
        text.match(/(?:Cap(?:ítulo)?\.?\s*)(\d+(?:\.\d+)?)/i);

      const chapterNumber = numberMatch ? Number(numberMatch[1]) : undefined;

      let chapterName = text;

      /*
       * Algunos enlaces contienen texto adicional de botones.
       * Si conocemos el número usamos un nombre limpio.
       */
      if (chapterNumber !== undefined) {
        chapterName = `Cap. ${chapterNumber}`;
      }

      if (!chapterName) {
        chapterName = 'Capítulo';
      }

      seenPaths.add(href);

      chapters.push({
        name: chapterName,
        path: href,
        chapterNumber,
      });
    });

    /*
     * La ficha normalmente muestra capítulos del más nuevo al más viejo.
     *
     * Ordenamos explícitamente para no depender del orden del HTML.
     */
    chapters.sort((a, b) => {
      const aNumber = a.chapterNumber ?? 0;
      const bNumber = b.chapterNumber ?? 0;

      return aNumber - bNumber;
    });

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
    /*
     * PASO 1
     *
     * Abrimos la página del capítulo.
     */
    const chapterUrl = this.site + chapterPath.replace(/^\//, '');

    const body = await fetchApi(chapterUrl).then(res => res.text());

    /*
     * PASO 2
     *
     * Ritto incluye dentro del payload de Next.js:
     *
     * "archivoUrl":"/api/capitulos/{ID}/archivo"
     *
     * El contenido puede aparecer escapado dentro de los scripts,
     * así que contemplamos ambas variantes.
     */
    const archivoMatch =
      body.match(
        /\\?"archivoUrl\\?"\s*:\s*\\?"(\/api\/capitulos\/[^"\\]+\/archivo)\\?"/,
      ) ||
      body.match(/"archivoUrl"\s*:\s*"(\/api\/capitulos\/[^"]+\/archivo)"/);

    if (!archivoMatch) {
      throw new Error(
        'Ritto: no se pudo encontrar archivoUrl para este capítulo.',
      );
    }

    const archivoUrl = archivoMatch[1];

    /*
     * PASO 3
     *
     * Este endpoint devuelve directamente el texto de la novela.
     */
    const text = await fetchApi(this.site.slice(0, -1) + archivoUrl).then(res =>
      res.text(),
    );

    if (!text.trim()) {
      throw new Error('Ritto: el capítulo no contiene texto.');
    }

    /*
     * LNReader espera contenido HTML.
     *
     * Escapamos HTML antes de crear los párrafos para que símbolos
     * presentes en la novela no puedan romper el documento.
     */
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    /*
     * Conservamos los párrafos del capítulo.
     *
     * Dos saltos de línea = nuevo párrafo.
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

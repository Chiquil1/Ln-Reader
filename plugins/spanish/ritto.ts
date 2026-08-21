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

  version = '1.0.4';

  filters = undefined;

  /**
   * Normaliza el contenido escapado que Next.js guarda
   * dentro de self.__next_f.
   */
  private normalizeNextPayload(body: string): string {
    return body
      .replace(/\\"/g, '"')
      .replace(/\\u0026/gi, '&')
      .replace(/\\u003d/gi, '=')
      .replace(/\\u003f/gi, '?')
      .replace(/\\u002f/gi, '/')
      .replace(/\\\//g, '/');
  }

  /**
   * Convierte una portada relativa en absoluta.
   */
  private normalizeCover(src?: string): string {
    if (!src) {
      return defaultCover;
    }

    if (src.startsWith('http')) {
      return src;
    }

    if (src.startsWith('//')) {
      return `https:${src}`;
    }

    return this.site.slice(0, -1) + (src.startsWith('/') ? src : `/${src}`);
  }

  /**
   * Extrae las obras del catálogo.
   *
   * Primero utiliza las tarjetas HTML normales.
   * Después revisa también el payload de Next.js.
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    const seen = new Set<string>();

    const addNovel = (path: string, name: string, cover?: string) => {
      path = path.replace(/&amp;/g, '&').split('?')[0];

      if (
        !path.startsWith('/obra/') ||
        path.includes('/capitulo/') ||
        seen.has(path)
      ) {
        return;
      }

      const cleanName = name.replace(/\s+/g, ' ').trim();

      if (!cleanName) {
        return;
      }

      seen.add(path);

      novels.push({
        name: cleanName,
        path,
        cover: this.normalizeCover(cover),
      });
    };

    /**
     * Tarjetas HTML normales.
     */
    $('a.ritto-work-card').each((_, el) => {
      const href = $(el).attr('href') || '';

      const name =
        $(el).find('h3').first().text().trim() ||
        $(el).find('[class*="title"]').first().text().trim() ||
        $(el).find('img').first().attr('alt') ||
        '';

      const img = $(el).find('img').first();

      const cover =
        img.attr('src') ||
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        '';

      addNovel(href, name, cover);
    });

    /**
     * Fallback para cualquier enlace de obra.
     */
    $('a[href^="/obra/"]').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (href.includes('/capitulo/')) {
        return;
      }

      const parent = $(el).closest('article, [class*="card"], [class*="item"]');

      const name =
        $(el).find('h2, h3, h4').first().text().trim() ||
        parent.find('h2, h3, h4').first().text().trim() ||
        $(el).find('img').first().attr('alt') ||
        parent.find('img').first().attr('alt') ||
        $(el).text().replace(/\s+/g, ' ').trim();

      const img =
        $(el).find('img').first().length > 0
          ? $(el).find('img').first()
          : parent.find('img').first();

      const cover = img.attr('src') || img.attr('data-src') || '';

      addNovel(href, name, cover);
    });

    /**
     * Payload de Next.js.
     */
    const normalized = this.normalizeNextPayload(body);

    const payloadRegex = /"href"\s*:\s*"(\/obra\/[^"]+)"/g;

    let match: RegExpExecArray | null;

    while ((match = payloadRegex.exec(normalized)) !== null) {
      const href = match[1].replace(/&amp;/g, '&').replace(/\\u0026/gi, '&');

      if (
        href.includes('/capitulo/') ||
        href.split('?')[0].split('/').filter(Boolean).length !== 2
      ) {
        continue;
      }

      const start = Math.max(0, match.index - 1500);

      const end = Math.min(normalized.length, match.index + 1500);

      const context = normalized.slice(start, end);

      const titleMatches = [
        ...context.matchAll(/"(?:titulo|nombre|title)"\s*:\s*"([^"]+)"/gi),
      ];

      let name = '';

      if (titleMatches.length > 0) {
        name = titleMatches[titleMatches.length - 1][1];
      }

      if (seen.has(href.split('?')[0])) {
        continue;
      }

      if (name) {
        addNovel(href, name);
      }
    }

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
   * Extrae TODOS los capítulos desde el payload
   * de Next.js.
   *
   * Para Yokuoni comprobamos:
   *
   * HTML normal -> 11
   * payload     -> 30
   *
   * Para Solo Necesito Al Hijo Del Duque:
   *
   * payload -> 116
   */
  private extractChapters(
    body: string,
    novelPath: string,
  ): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    const cleanNovelPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const escapedNovelPath = cleanNovelPath.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    /**
     * Buscamos las dos representaciones:
     *
     * \"href\":\"/obra/.../capitulo/...\"
     *
     * y
     *
     * "href":"/obra/.../capitulo/..."
     */
    const patterns = [
      new RegExp(
        `\\\\?"href\\\\?"\\s*:\\s*\\\\?"(${escapedNovelPath}\\/capitulo\\/[^"\\\\]+)`,
        'g',
      ),

      new RegExp(
        `"href"\\s*:\\s*"(${escapedNovelPath}\\/capitulo\\/[^"]+)"`,
        'g',
      ),
    ];

    const addChapter = (rawHref: string) => {
      const href = rawHref
        .replace(/\\"/g, '"')
        .replace(/\\u0026/gi, '&')
        .replace(/\\u003d/gi, '=')
        .replace(/\\u003f/gi, '?')
        .replace(/\\\//g, '/')
        .replace(/&amp;/g, '&');

      if (!href.startsWith(`${cleanNovelPath}/capitulo/`) || seen.has(href)) {
        return;
      }

      const numberMatch = href.match(/\/capitulo\/capitulo-(\d+(?:[.-]\d+)?)/i);

      if (!numberMatch) {
        return;
      }

      let rawNumber = numberMatch[1];

      /**
       * Ejemplo:
       *
       * 449-5 -> 449.5
       */
      rawNumber = rawNumber.replace(/^(\d+)-(\d+)$/, '$1.$2');

      const chapterNumber = Number(rawNumber);

      if (!Number.isFinite(chapterNumber)) {
        return;
      }

      seen.add(href);

      chapters.push({
        name: `Cap. ${chapterNumber}`,
        path: href,
        chapterNumber,
      });
    };

    /**
     * Primero buscamos sobre el HTML bruto.
     */
    for (const regex of patterns) {
      let match: RegExpExecArray | null;

      while ((match = regex.exec(body)) !== null) {
        addChapter(match[1]);
      }
    }

    /**
     * Después sobre el payload normalizado.
     */
    const normalized = this.normalizeNextPayload(body);

    const normalizedRegex = new RegExp(
      `"href"\\s*:\\s*"(${escapedNovelPath}\\/capitulo\\/[^"]+)"`,
      'g',
    );

    let normalizedMatch: RegExpExecArray | null;

    while ((normalizedMatch = normalizedRegex.exec(normalized)) !== null) {
      addChapter(normalizedMatch[1]);
    }

    /**
     * Fallback HTML.
     */
    if (chapters.length === 0) {
      const $ = cheerio.load(body);

      $('a[href*="/capitulo/"]').each((_, el) => {
        const href = $(el).attr('href') || '';

        if (href.startsWith(`${cleanNovelPath}/capitulo/`)) {
          addChapter(href);
        }
      });
    }

    /**
     * Orden ascendente para LNReader.
     */
    chapters.sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));

    return chapters;
  }

  /**
   * Procesa una ficha descargada.
   */
  private parseNovelBody(
    body: string,
    cleanPath: string,
  ): {
    name: string;
    cover: string;
    summary: string;
    status: string;
    chapters: Plugin.ChapterItem[];
  } {
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
    const coverSrc =
      $('.obra-hub__cover img').first().attr('src') ||
      $('img[src*="/covers/"]').first().attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    const cover = this.normalizeCover(coverSrc);

    /**
     * Sinopsis.
     */
    let summary = $('.obra-hub__description')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    /**
     * Fallback independiente del contenido
     * renderizado de la ficha.
     */
    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /**
     * Estado.
     */
    const pageText = $('.obra-hub').first().text();

    const status = /Finalizado/i.test(pageText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    /**
     * Capítulos.
     */
    const chapters = this.extractChapters(body, cleanPath);

    return {
      name,
      cover,
      summary,
      status,
      chapters,
    };
  }

  /**
   * Ficha de novela.
   *
   * Ritto utiliza Next.js y hemos observado que
   * algunas fichas pueden requerir una recarga en
   * LNReader antes de mostrar toda la información.
   *
   * Ahora el plugin hace esa recarga automáticamente.
   */
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.split('?')[0];

    const baseUrl = this.site + cleanPath.replace(/^\//, '');

    let bestName = '';

    let bestCover = defaultCover;

    let bestSummary = '';

    let bestStatus = NovelStatus.Ongoing;

    let bestChapters: Plugin.ChapterItem[] = [];

    /**
     * Hasta tres intentos.
     *
     * Si el primero está completo, solamente
     * hacemos una petición.
     */
    for (let attempt = 1; attempt <= 3; attempt++) {
      const requestUrl =
        attempt === 1
          ? baseUrl
          : `${baseUrl}?_lnreader=${Date.now()}-${attempt}`;

      try {
        const response = await fetchApi(requestUrl, {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (!response.ok) {
          continue;
        }

        const body = await response.text();

        /**
         * Evitamos intentar procesar respuestas
         * claramente vacías.
         */
        if (!body || body.length < 1000) {
          continue;
        }

        const parsed = this.parseNovelBody(body, cleanPath);

        if (parsed.name) {
          bestName = parsed.name;
        }

        if (parsed.cover && parsed.cover !== defaultCover) {
          bestCover = parsed.cover;
        }

        if (parsed.summary) {
          bestSummary = parsed.summary;
        }

        bestStatus =
          parsed.status === NovelStatus.Completed
            ? NovelStatus.Completed
            : NovelStatus.Ongoing;

        /**
         * Conservamos siempre la respuesta que
         * haya encontrado más capítulos.
         */
        if (parsed.chapters.length > bestChapters.length) {
          bestChapters = parsed.chapters;
        }

        /**
         * Si ya tenemos título, sinopsis y
         * capítulos, no necesitamos más intentos.
         */
        if (bestName && bestSummary && bestChapters.length > 0) {
          break;
        }
      } catch {
        /**
         * Si Ritto falla temporalmente,
         * probamos otra vez.
         */
        continue;
      }
    }

    return {
      path: cleanPath,
      name: bestName,
      cover: bestCover,
      summary: bestSummary,
      status: bestStatus,
      chapters: bestChapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const chapterUrl = this.site + chapterPath.replace(/^\//, '');

    const body = await fetchApi(chapterUrl).then(res => res.text());

    /**
     * Normalizamos el payload Next.js.
     */
    const normalized = this.normalizeNextPayload(body);

    /**
     * Los capítulos de texto incluyen:
     *
     * "archivoUrl":
     * "/api/capitulos/{ID}/archivo"
     */
    const archivoMatch = normalized.match(
      /"archivoUrl"\s*:\s*"(\/api\/capitulos\/[^"]+\/archivo)"/,
    );

    if (!archivoMatch) {
      throw new Error(
        'Ritto: no se pudo encontrar archivoUrl para este capítulo.',
      );
    }

    const archivoUrl = archivoMatch[1];

    /**
     * Descargamos el texto real.
     */
    const text = await fetchApi(this.site.slice(0, -1) + archivoUrl).then(res =>
      res.text(),
    );

    if (!text.trim()) {
      throw new Error('Ritto: el capítulo no contiene texto.');
    }

    /**
     * Escapamos HTML.
     */
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    /**
     * Conservamos párrafos para LNReader/TTS.
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

import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

class RitiScanPlugin implements Plugin.PluginBase {
  id = 'ritiscan';

  name = "Rit'i Scan";

  icon = 'src/es/ritiscan/icon.png';

  site = 'https://riti-scan.com/';

  version = '2.0.2';

  filters = undefined;

  /**
   * Headers para las páginas HTML normales.
   *
   * Rit'i Scan devuelve 403 en algunas páginas si la petición
   * no parece provenir de un navegador.
   */
  private browserHeaders = {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
    Referer: 'https://riti-scan.com/',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/151.0.0.0 Safari/537.36',
  };

  /**
   * Convierte URL absoluta en path de LNReader.
   *
   * https://riti-scan.com/serie/ejemplo/
   *
   * ->
   *
   * /serie/ejemplo/
   */
  private getPath(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith(this.site)) {
      return '/' + url.slice(this.site.length);
    }

    if (url.startsWith('/')) {
      return url;
    }

    return `/${url}`;
  }

  /**
   * Convierte un path de LNReader en URL absoluta.
   */
  private getUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    return this.site + path.replace(/^\//, '');
  }

  /**
   * Normaliza las portadas.
   */
  private getCover(src?: string): string {
    if (!src) {
      return defaultCover;
    }

    if (src.startsWith('http')) {
      return src;
    }

    if (src.startsWith('//')) {
      return `https:${src}`;
    }

    return this.site + src.replace(/^\//, '');
  }

  /**
   * Descarga HTML usando headers de navegador.
   */
  private async fetchHtml(url: string): Promise<string> {
    const response = await fetchApi(url, {
      headers: this.browserHeaders,
    });

    if (!response.ok) {
      throw new Error(`Rit'i Scan: HTTP ${response.status} al cargar ${url}`);
    }

    const body = await response.text();

    if (
      /403 Forbidden/i.test(body) ||
      /Access to this resource on the server is denied/i.test(body)
    ) {
      throw new Error("Rit'i Scan: el servidor devolvió 403 Forbidden.");
    }

    return body;
  }

  /**
   * ============================================================
   * CATÁLOGO
   * ============================================================
   *
   * Estructura comprobada:
   *
   * <div class="slider__item">
   *
   *   <div class="slider__thumb_item">
   *     <a href="https://riti-scan.com/serie/.../">
   *       <img src="PORTADA">
   *     </a>
   *   </div>
   *
   *   <div class="post-title">
   *     <h4>
   *       <a href="https://riti-scan.com/serie/.../">
   *         NOMBRE
   *       </a>
   *     </h4>
   *   </div>
   *
   * </div>
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    const seen = new Set<string>();

    /**
     * Una sola estrategia para evitar novelas duplicadas.
     */
    $('.slider__item').each((_, el) => {
      const item = $(el);

      const titleLink = item.find('.post-title a[href*="/serie/"]').first();

      const href = titleLink.attr('href') || '';

      const name = titleLink.text().replace(/\s+/g, ' ').trim();

      if (!href || !name) {
        return;
      }

      if (!href.includes('/serie/')) {
        return;
      }

      const path = this.getPath(href);

      /**
       * /serie/foo
       * /serie/foo/
       *
       * se consideran la misma novela.
       */
      const key = path.replace(/\/+$/, '');

      if (seen.has(key)) {
        return;
      }

      const img = item.find('.slider__thumb_item img').first();

      const coverSrc =
        img.attr('data-src-webp') ||
        img.attr('data-src-img') ||
        img.attr('data-src') ||
        img.attr('src') ||
        '';

      seen.add(key);

      novels.push({
        name,
        path,
        cover: this.getCover(coverSrc),
      });
    });

    return novels;
  }

  /**
   * ============================================================
   * POPULARES / RECIENTES
   * ============================================================
   */
  async popularNovels(
    pageNo: number,
    {
      showLatestNovels: _showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * El catálogo comprobado actualmente está en la portada.
     */
    if (pageNo > 1) {
      return [];
    }

    const body = await this.fetchHtml(this.site);

    return this.parseNovelCards(body);
  }

  /**
   * ============================================================
   * BÚSQUEDA
   * ============================================================
   */
  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) {
      return [];
    }

    const url =
      `${this.site}?s=${encodeURIComponent(searchTerm)}` +
      '&post_type=wp-manga';

    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    const seen = new Set<string>();

    $('a[href*="/serie/"]').each((_, el) => {
      const link = $(el);

      const href = link.attr('href') || '';

      if (!href.includes('/serie/')) {
        return;
      }

      const path = this.getPath(href);

      const key = path.replace(/\/+$/, '');

      if (seen.has(key)) {
        return;
      }

      const parent = link.closest(
        '.c-tabs-item__content, .row, .page-item-detail, .item-summary',
      );

      const titleLink = parent.find('.post-title a[href*="/serie/"]').first();

      const name =
        titleLink.text().replace(/\s+/g, ' ').trim() ||
        link.text().replace(/\s+/g, ' ').trim();

      if (!name) {
        return;
      }

      const img = parent.find('img').first();

      const coverSrc =
        img.attr('data-src-webp') ||
        img.attr('data-src-img') ||
        img.attr('data-src') ||
        img.attr('src') ||
        '';

      seen.add(key);

      novels.push({
        name,
        path,
        cover: this.getCover(coverSrc),
      });
    });

    return novels;
  }

  /**
   * ============================================================
   * PARSEAR CAPÍTULOS
   * ============================================================
   *
   * Respuesta real comprobada:
   *
   * <li class="wp-manga-chapter">
   *
   *   <a
   *     href="https://riti-scan.com/serie/el-reformador-de-villanos/capitulo-26/"
   *   >
   *     Capítulo 26
   *   </a>
   *
   * </li>
   */
  private parseChapters(
    body: string,
    chapters: Plugin.ChapterItem[],
    seen: Set<string>,
  ): number {
    const $ = cheerio.load(body);

    let added = 0;

    $('li.wp-manga-chapter a').each((_, el) => {
      const href = $(el).attr('href') || '';

      const name = $(el).text().replace(/\s+/g, ' ').trim();

      if (!href || !name) {
        return;
      }

      const path = this.getPath(href);

      if (!path.includes('/capitulo-')) {
        return;
      }

      const key = path.replace(/\/+$/, '');

      if (seen.has(key)) {
        return;
      }

      /**
       * Primero intentamos sacar el número del texto.
       *
       * Capítulo 26
       * Capitulo 01
       * Capítulo 449.5
       */
      const numberMatch = name.match(
        /(?:cap[ií]tulo|capitulo|cap\.?)\s*([0-9]+(?:\.[0-9]+)?)/i,
      );

      let chapterNumber: number | undefined;

      if (numberMatch) {
        const parsed = Number(numberMatch[1]);

        if (Number.isFinite(parsed)) {
          chapterNumber = parsed;
        }
      }

      /**
       * Fallback al slug.
       *
       * /capitulo-26/
       *
       * -> 26
       *
       * /capitulo-449-5/
       *
       * -> 449.5
       */
      if (chapterNumber === undefined) {
        const slugMatch = path.match(/\/capitulo-(\d+(?:[-.]\d+)?)/i);

        if (slugMatch) {
          const rawNumber = slugMatch[1].replace(/^(\d+)-(\d+)$/, '$1.$2');

          const parsed = Number(rawNumber);

          if (Number.isFinite(parsed)) {
            chapterNumber = parsed;
          }
        }
      }

      seen.add(key);

      chapters.push({
        name,
        path,
        chapterNumber,
      });

      added++;
    });

    return added;
  }

  /**
   * ============================================================
   * OBTENER TODOS LOS CAPÍTULOS
   * ============================================================
   *
   * Petición REAL comprobada en Network:
   *
   * POST
   *
   * /serie/{slug}/ajax/chapters/?t=1
   *
   * Body vacío.
   *
   * La respuesta contiene HTML con:
   *
   * li.wp-manga-chapter
   *
   * y:
   *
   * <a href="/?t=2" data-page="2">
   */
  private async getChapters(novelPath: string): Promise<Plugin.ChapterItem[]> {
    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const baseUrl = this.getUrl(cleanPath);

    /**
     * Petición de una página concreta de capítulos.
     */
    const fetchChapterPage = async (page: number): Promise<string> => {
      const url = `${baseUrl}/ajax/chapters/?t=${page}`;

      const response = await fetchApi(url, {
        method: 'POST',
        headers: {
          Accept: '*/*',

          'Accept-Language': 'es-419,es;q=0.6',

          Origin: this.site.replace(/\/$/, ''),

          Referer: `${baseUrl}/`,

          'X-Requested-With': 'XMLHttpRequest',

          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/151.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Rit'i Scan: HTTP ${response.status} cargando capítulos.`,
        );
      }

      const body = await response.text();

      if (!body.trim()) {
        throw new Error("Rit'i Scan: la respuesta de capítulos está vacía.");
      }

      return body;
    };

    /**
     * ==========================================================
     * PÁGINA 1
     * ==========================================================
     */
    const firstBody = await fetchChapterPage(1);

    this.parseChapters(firstBody, chapters, seen);

    /**
     * ==========================================================
     * DETECTAR PAGINACIÓN
     * ==========================================================
     *
     * HTML real:
     *
     * <span class="page current page-1">
     *   1
     * </span>
     *
     * <span class="page page-2">
     *   <a href="/?t=2" data-page="2">
     *     2
     *   </a>
     * </span>
     *
     * <span class="page page-3">
     *   <a href="/?t=3" data-page="3">
     *     3
     *   </a>
     * </span>
     */
    const $ = cheerio.load(firstBody);

    let maxPage = 1;

    $('a[data-page]').each((_, el) => {
      const raw = $(el).attr('data-page');

      if (!raw) {
        return;
      }

      const page = Number(raw);

      if (Number.isFinite(page) && page > maxPage) {
        maxPage = page;
      }
    });

    /**
     * Fallback por href en caso de que data-page cambie.
     */
    $('a[href*="?t="]').each((_, el) => {
      const href = $(el).attr('href') || '';

      const match = href.match(/[?&]t=(\d+)/);

      if (!match) {
        return;
      }

      const page = Number(match[1]);

      if (Number.isFinite(page) && page > maxPage) {
        maxPage = page;
      }
    });

    /**
     * ==========================================================
     * PÁGINAS RESTANTES
     * ==========================================================
     */
    for (let page = 2; page <= maxPage; page++) {
      try {
        const body = await fetchChapterPage(page);

        this.parseChapters(body, chapters, seen);
      } catch {
        /**
         * Si falla una página concreta conservamos
         * los capítulos obtenidos de las demás.
         */
        continue;
      }
    }

    /**
     * Orden ascendente:
     *
     * Capítulo 1
     * Capítulo 2
     * ...
     * Capítulo 26
     */
    chapters.sort((a, b) => {
      const aNumber = a.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      const bNumber = b.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      return aNumber - bNumber;
    });

    return chapters;
  }

  /**
   * ============================================================
   * FICHA DE LA NOVELA
   * ============================================================
   */
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const url = this.getUrl(cleanPath) + '/';

    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    /**
     * ==========================================================
     * TÍTULO
     * ==========================================================
     */
    const name =
      $('.post-title h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /**
     * ==========================================================
     * PORTADA
     * ==========================================================
     */
    const coverImg = $('img.img-responsive').first();

    const coverSrc =
      coverImg.attr('data-src-webp') ||
      coverImg.attr('data-src-img') ||
      coverImg.attr('data-src') ||
      coverImg.attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    const cover = this.getCover(coverSrc);

    /**
     * ==========================================================
     * SINOPSIS
     * ==========================================================
     */
    let summary =
      $('.summary__content p').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary p').first().text().replace(/\s+/g, ' ').trim() ||
      $('.summary__content').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary').first().text().replace(/\s+/g, ' ').trim();

    /**
     * Si no encontramos un wrapper conocido,
     * buscamos un párrafo largo.
     */
    if (!summary) {
      const candidates: string[] = [];

      $('p').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();

        if (text.length >= 100) {
          candidates.push(text);
        }
      });

      if (candidates.length > 0) {
        summary = candidates[0];
      }
    }

    /**
     * Último fallback.
     */
    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /**
     * ==========================================================
     * ESTADO
     * ==========================================================
     */
    const bodyText = $('body').text().replace(/\s+/g, ' ');

    const status = /completo|completado|finalizado|terminado/i.test(bodyText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    /**
     * ==========================================================
     * CAPÍTULOS
     * ==========================================================
     */
    const chapters = await this.getChapters(cleanPath);

    return {
      path: cleanPath,
      name,
      cover,
      summary,
      status,
      chapters,
    };
  }

  /**
   * ============================================================
   * LECTURA DEL CAPÍTULO
   * ============================================================
   */
  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.getUrl(chapterPath);

    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    /**
     * Contenedores habituales de Madara.
     */
    const containers = [
      '.reading-content',
      '.entry-content',
      '.chapter-content',
      '.text-left',
    ];

    for (const selector of containers) {
      const container = $(selector).first();

      if (!container.length) {
        continue;
      }

      /**
       * Eliminamos elementos que no forman parte
       * del texto de la novela.
       */
      container
        .find(
          'script, style, iframe, ins, .adsbygoogle, .code-block, .sharedaddy',
        )
        .remove();

      const paragraphs: string[] = [];

      container.find('p').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();

        if (!text) {
          return;
        }

        paragraphs.push(`<p>${this.escapeHtml(text)}</p>`);
      });

      if (paragraphs.length > 0) {
        return paragraphs.join('');
      }
    }

    /**
     * Fallback:
     *
     * <p>Capitulo 01</p>
     * <p>Texto...</p>
     */
    const paragraphs: string[] = [];

    $('p').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();

      if (!text) {
        return;
      }

      if (/cookie|privacy policy|política de privacidad/i.test(text)) {
        return;
      }

      paragraphs.push(`<p>${this.escapeHtml(text)}</p>`);
    });

    if (paragraphs.length === 0) {
      throw new Error("Rit'i Scan: no se encontró texto en el capítulo.");
    }

    return paragraphs.join('');
  }

  /**
   * Escapa texto antes de devolver HTML a LNReader.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default new RitiScanPlugin();

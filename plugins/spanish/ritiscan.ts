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
  version = '2.0.6';
  filters = undefined;

  /**
   * La ficha individual de Rit'i devuelve 403 con una petición
   * demasiado genérica. Estos headers ya fueron comprobados:
   *
   * sin ellos -> 403
   * con ellos -> 200
   *
   * Los usamos SOLO para páginas HTML normales.
   */
  private pageHeaders = {
    Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    Referer: 'https://riti-scan.com/',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/151.0.0.0 Safari/537.36',
  };

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

  private getUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    return this.site + path.replace(/^\//, '');
  }

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
   * Páginas HTML normales.
   */
  private async fetchHtml(url: string): Promise<string> {
    const response = await fetchApi(url, {
      headers: this.pageHeaders,
    });

    if (!response.ok) {
      throw new Error(`Rit'i Scan: HTTP ${response.status} al cargar ${url}`);
    }

    const body = await response.text();

    if (
      /403 Forbidden/i.test(body) ||
      /Access to this resource on the server is denied/i.test(body)
    ) {
      throw new Error("Rit'i Scan: 403 Forbidden.");
    }

    return body;
  }

  /**
   * ============================================================
   * CATÁLOGO
   * ============================================================
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('.slider__item').each((_, el) => {
      const item = $(el);

      const titleLink = item.find('.post-title a[href*="/serie/"]').first();

      const href = titleLink.attr('href') || '';

      const name = titleLink.text().replace(/\s+/g, ' ').trim();

      if (!href || !name || !href.includes('/serie/')) {
        return;
      }

      const path = this.getPath(href);
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

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels: _showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
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
        '.c-tabs-item__content, .page-item-detail, .item-summary, .row',
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
   * PARSER DE CAPÍTULOS
   * ============================================================
   *
   * Respuesta real:
   *
   * <li class="wp-manga-chapter">
   *   <a href=".../capitulo-26/">
   *     Capítulo 26
   *   </a>
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

      let chapterNumber: number | undefined;

      /**
       * Capítulo 26
       * Capitulo 26
       * Cap. 26
       * Capítulo 449.5
       */
      const textMatch = name.match(
        /(?:cap[ií]tulo|capitulo|cap\.?)\s*([0-9]+(?:\.[0-9]+)?)/i,
      );

      if (textMatch) {
        const parsed = Number(textMatch[1]);

        if (Number.isFinite(parsed)) {
          chapterNumber = parsed;
        }
      }

      /**
       * Fallback al slug:
       *
       * capitulo-26
       * capitulo-449-5
       */
      if (chapterNumber === undefined) {
        const slugMatch = path.match(/\/capitulo-(\d+(?:[-.]\d+)?)/i);

        if (slugMatch) {
          const raw = slugMatch[1].replace(/^(\d+)-(\d+)$/, '$1.$2');

          const parsed = Number(raw);

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
   * PETICIÓN DE CAPÍTULOS
   * ============================================================
   *
   * Petición comprobada:
   *
   * POST
   * /serie/{slug}/ajax/chapters/?t=N
   *
   * Body vacío.
   *
   * Importante:
   * no forzamos Referer, Origin, User-Agent ni X-Requested-With.
   * Dejamos que fetchApi/React Native manejen la petición.
   */
  private async fetchChapterPage(
    baseUrl: string,
    page: number,
  ): Promise<string> {
    const url = `${baseUrl}/ajax/chapters/?t=${page}`;

    const response = await fetchApi(url, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(
        `Rit'i Scan: HTTP ${response.status} cargando página ${page}.`,
      );
    }

    return response.text();
  }

  /**
   * ============================================================
   * OBTENER TODOS LOS CAPÍTULOS
   * ============================================================
   *
   * Seguimos un flujo simple:
   *
   * t=1
   * t=2
   * t=3
   *
   * Nada de Promise.all.
   * Nada de concurrencia.
   */
  private async getChapters(novelPath: string): Promise<Plugin.ChapterItem[]> {
    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();

    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const baseUrl = this.getUrl(cleanPath);

    /**
     * Primera página.
     */
    const firstBody = await this.fetchChapterPage(baseUrl, 1);

    if (!firstBody.trim()) {
      return chapters;
    }

    this.parseChapters(firstBody, chapters, seen);

    /**
     * Detectar cuántas páginas existen.
     *
     * <a href="/?t=2" data-page="2">
     */
    const $ = cheerio.load(firstBody);

    let maxPage = 1;

    $('a[data-page]').each((_, el) => {
      const page = Number($(el).attr('data-page'));

      if (Number.isFinite(page) && page > maxPage) {
        maxPage = page;
      }
    });

    /**
     * Fallback:
     *
     * href="/?t=3"
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
     * Carga secuencial, igual que el enfoque sencillo
     * que funciona correctamente en otros plugins.
     */
    for (let page = 2; page <= maxPage; page++) {
      try {
        const body = await this.fetchChapterPage(baseUrl, page);

        if (!body.trim()) {
          continue;
        }

        this.parseChapters(body, chapters, seen);
      } catch {
        /**
         * Una página fallida no elimina
         * las demás.
         */
        continue;
      }
    }

    chapters.sort((a, b) => {
      const aNumber = a.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      const bNumber = b.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      return aNumber - bNumber;
    });

    return chapters;
  }

  /**
   * ============================================================
   * FICHA DE NOVELA
   * ============================================================
   */
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const url = this.getUrl(cleanPath) + '/';

    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    /**
     * Título.
     */
    const name =
      $('.post-title h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /**
     * Portada.
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
     * Sinopsis.
     */
    let summary =
      $('.summary__content p').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary p').first().text().replace(/\s+/g, ' ').trim() ||
      $('.summary__content').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary').first().text().replace(/\s+/g, ' ').trim();

    /**
     * Fallback a párrafo largo.
     */
    if (!summary) {
      $('p').each((_, el) => {
        if (summary) {
          return;
        }

        const text = $(el).text().replace(/\s+/g, ' ').trim();

        if (text.length >= 100) {
          summary = text;
        }
      });
    }

    /**
     * Fallback final.
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
    const pageText = $('body').text().replace(/\s+/g, ' ');

    const status = /completo|completado|finalizado|terminado/i.test(pageText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    /**
     * Capítulos.
     *
     * Si el endpoint falla, conservamos la ficha.
     */
    let chapters: Plugin.ChapterItem[] = [];

    try {
      chapters = await this.getChapters(cleanPath);
    } catch {
      chapters = [];
    }

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
   * CONTENIDO DEL CAPÍTULO
   * ============================================================
   */
  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.getUrl(chapterPath);

    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    /**
     * Contenedores habituales.
     */
    const selectors = [
      '.reading-content',
      '.entry-content_wrap .reading-content',
      '.chapter-content',
      '.entry-content',
    ];

    for (const selector of selectors) {
      const container = $(selector).first();

      if (!container.length) {
        continue;
      }

      /**
       * Eliminar basura.
       */
      container
        .find(
          'script, style, iframe, ins, ' +
            '.adsbygoogle, .code-block, .sharedaddy',
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
     * Fallback general.
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

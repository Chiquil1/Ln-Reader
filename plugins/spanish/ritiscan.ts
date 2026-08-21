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

  version = '2.0.5';

  filters = undefined;

  /**
   * Headers necesarios para las páginas normales.
   *
   * En nuestras pruebas:
   *
   * sin headers -> 403
   * con User-Agent/Referer -> 200
   */
  private pageHeaders = {
    Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',

    Referer: 'https://riti-scan.com/',

    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/151.0.0.0 Safari/537.36',
  };

  /**
   * ============================================================
   * HELPERS DE URL
   * ============================================================
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
   * ============================================================
   * GET HTML
   * ============================================================
   *
   * Esta función tiene logs temporales para comprobar qué
   * ocurre realmente dentro de Android.
   */
  private async fetchHtml(url: string): Promise<string> {
    console.log('[RITI] GET START:', url);

    try {
      const response = await fetchApi(url, {
        headers: this.pageHeaders,
      });

      console.log('[RITI] GET RESPONSE:', response.status, url);

      const body = await response.text();

      console.log('[RITI] GET BODY:', body.length, url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (
        /403 Forbidden/i.test(body) ||
        /Access to this resource on the server is denied/i.test(body)
      ) {
        throw new Error('403 Forbidden en HTML');
      }

      return body;
    } catch (error) {
      console.error('[RITI] GET ERROR:', url, error);

      throw error;
    }
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

      if (!href || !name) {
        return;
      }

      if (!href.includes('/serie/')) {
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

    console.log('[RITI] CATALOG NOVELS:', novels.length);

    return novels;
  }

  /**
   * ============================================================
   * POPULARES
   * ============================================================
   */

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
      `${this.site}?s=` +
      `${encodeURIComponent(searchTerm)}` +
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
        '.c-tabs-item__content, ' +
          '.page-item-detail, ' +
          '.item-summary, ' +
          '.row',
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

      const textMatch = name.match(
        /(?:cap[ií]tulo|capitulo|cap\.?)\s*([0-9]+(?:\.[0-9]+)?)/i,
      );

      if (textMatch) {
        const parsed = Number(textMatch[1]);

        if (Number.isFinite(parsed)) {
          chapterNumber = parsed;
        }
      }

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
   * POST DE CAPÍTULOS
   * ============================================================
   *
   * Request comprobado en Chrome:
   *
   * POST
   * /serie/{slug}/ajax/chapters/?t=N
   *
   * Body vacío.
   *
   * Aquí están los logs más importantes para Android.
   */
  private async fetchChapterPage(
    baseUrl: string,
    page: number,
  ): Promise<string> {
    const url = `${baseUrl}/ajax/chapters/` + `?t=${page}`;

    console.log('[RITI] CHAPTER POST START:', page, url);

    try {
      const response = await fetchApi(url, {
        method: 'POST',

        headers: {
          Accept: '*/*',

          Referer: `${baseUrl}/`,

          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      console.log('[RITI] CHAPTER RESPONSE:', page, response.status);

      const body = await response.text();

      console.log('[RITI] CHAPTER BODY:', page, body.length);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const chapterCount = (body.match(/wp-manga-chapter/g) || []).length;

      console.log('[RITI] CHAPTER HTML COUNT:', page, chapterCount);

      return body;
    } catch (error) {
      console.error('[RITI] CHAPTER ERROR:', page, url, error);

      throw error;
    }
  }

  /**
   * ============================================================
   * OBTENER TODOS LOS CAPÍTULOS
   * ============================================================
   */

  private async getChapters(novelPath: string): Promise<Plugin.ChapterItem[]> {
    console.log('[RITI] GET CHAPTERS START:', novelPath);

    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const baseUrl = this.getUrl(cleanPath);

    /**
     * Página 1.
     */
    const firstBody = await this.fetchChapterPage(baseUrl, 1);

    const firstAdded = this.parseChapters(firstBody, chapters, seen);

    console.log('[RITI] PAGE 1 ADDED:', firstAdded);

    /**
     * Detectar paginación.
     */
    const $ = cheerio.load(firstBody);

    let maxPage = 1;

    $('a[data-page]').each((_, el) => {
      const value = $(el).attr('data-page');

      const page = Number(value);

      if (Number.isFinite(page) && page > maxPage) {
        maxPage = page;
      }
    });

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

    console.log('[RITI] MAX PAGE:', maxPage);

    if (maxPage <= 1) {
      const sorted = this.sortChapters(chapters);

      console.log('[RITI] CHAPTERS FINISHED:', sorted.length);

      return sorted;
    }

    /**
     * Máximo dos solicitudes simultáneas.
     */
    const pages = Array.from(
      {
        length: maxPage - 1,
      },
      (_, index) => index + 2,
    );

    const concurrency = 2;

    for (let index = 0; index < pages.length; index += concurrency) {
      const batch = pages.slice(index, index + concurrency);

      console.log('[RITI] CHAPTER BATCH:', batch.join(','));

      const results = await Promise.allSettled(
        batch.map(page => this.fetchChapterPage(baseUrl, page)),
      );

      results.forEach((result, resultIndex) => {
        const page = batch[resultIndex];

        if (result.status !== 'fulfilled') {
          console.error('[RITI] PAGE FAILED:', page);

          return;
        }

        const added = this.parseChapters(result.value, chapters, seen);

        console.log('[RITI] PAGE ADDED:', page, added);
      });
    }

    const sorted = this.sortChapters(chapters);

    console.log('[RITI] CHAPTERS FINISHED:', sorted.length);

    return sorted;
  }

  /**
   * Orden ascendente.
   */
  private sortChapters(chapters: Plugin.ChapterItem[]): Plugin.ChapterItem[] {
    chapters.sort((a, b) => {
      const aNumber = a.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      const bNumber = b.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      return aNumber - bNumber;
    });

    return chapters;
  }

  /**
   * ============================================================
   * FICHA
   * ============================================================
   */

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    console.log('[RITI] PARSE NOVEL START:', novelPath);

    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const url = this.getUrl(cleanPath) + '/';

    /**
     * Ficha.
     */
    const body = await this.fetchHtml(url);

    console.log('[RITI] NOVEL HTML RECEIVED:', body.length);

    const $ = cheerio.load(body);

    /**
     * Título.
     */
    const name =
      $('.post-title h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    console.log('[RITI] NOVEL NAME:', name);

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

    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    console.log('[RITI] SUMMARY LENGTH:', summary.length);

    /**
     * Estado.
     */
    const pageText = $('body').text().replace(/\s+/g, ' ');

    const status = /completo|completado|finalizado|terminado/i.test(pageText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    console.log('[RITI] STATUS:', status);

    /**
     * Capítulos.
     *
     * Si falla, la ficha igualmente debe poder terminar.
     */
    let chapters: Plugin.ChapterItem[] = [];

    console.log('[RITI] BEFORE CHAPTERS');

    try {
      chapters = await this.getChapters(cleanPath);
    } catch (error) {
      console.error('[RITI] GET CHAPTERS ERROR:', error);

      chapters = [];
    }

    console.log('[RITI] AFTER CHAPTERS:', chapters.length);

    const novel: Plugin.SourceNovel = {
      path: cleanPath,
      name,
      cover,
      summary,
      status,
      chapters,
    };

    console.log('[RITI] PARSE NOVEL FINISHED:', name, chapters.length);

    return novel;
  }

  /**
   * ============================================================
   * CAPÍTULO
   * ============================================================
   */

  async parseChapter(chapterPath: string): Promise<string> {
    console.log('[RITI] PARSE CHAPTER:', chapterPath);

    const url = this.getUrl(chapterPath);

    const body = await this.fetchHtml(url);

    console.log('[RITI] CHAPTER PAGE BODY:', body.length);

    const $ = cheerio.load(body);

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

      container
        .find(
          'script, style, iframe, ins, ' +
            '.adsbygoogle, .code-block, ' +
            '.sharedaddy',
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
        console.log('[RITI] CHAPTER PARAGRAPHS:', paragraphs.length);

        return paragraphs.join('');
      }
    }

    /**
     * Fallback.
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

    console.log('[RITI] CHAPTER FALLBACK PARAGRAPHS:', paragraphs.length);

    if (paragraphs.length === 0) {
      throw new Error("Rit'i Scan: no se encontró texto en el capítulo.");
    }

    return paragraphs.join('');
  }

  /**
   * ============================================================
   * ESCAPE HTML
   * ============================================================
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

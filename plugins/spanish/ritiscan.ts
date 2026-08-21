import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

class RitiScanPlugin implements Plugin.PluginBase {
  id = 'ritiscan';

  name = "Rit'i Scan";

  icon = 'src/es/ritiscan/icon.png';

  site = 'https://riti-scan.com/h2copia/';

  version = '1.0.1';

  filters = undefined;

  /**
   * Convierte URLs absolutas de Rit'i Scan en paths
   * que LNReader pueda guardar.
   */
  private normalizePath(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith(this.site)) {
      return '/' + url.slice(this.site.length);
    }

    try {
      const parsed = new URL(url);

      if (
        parsed.hostname === 'riti-scan.com' &&
        parsed.pathname.startsWith('/h2copia/')
      ) {
        return '/' + parsed.pathname.slice('/h2copia/'.length) + parsed.search;
      }
    } catch {
      // Ya puede ser un path relativo.
    }

    if (url.startsWith('/h2copia/')) {
      return '/' + url.slice('/h2copia/'.length);
    }

    if (url.startsWith('/')) {
      return url;
    }

    return `/${url}`;
  }

  /**
   * Convierte un path de LNReader en URL absoluta.
   */
  private absoluteUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    if (path.startsWith('/h2copia/')) {
      return `https://riti-scan.com${path}`;
    }

    return this.site + path.replace(/^\//, '');
  }

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

    if (src.startsWith('/h2copia/')) {
      return `https://riti-scan.com${src}`;
    }

    return this.site + src.replace(/^\//, '');
  }

  /**
   * Extrae obras de una página de listado.
   *
   * Rit'i Scan utiliza Madara/WordPress.
   */
  private parseNovelCards(body: string): Plugin.NovelItem[] {
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    const seen = new Set<string>();

    const addNovel = (href: string, name: string, coverSrc?: string) => {
      if (!href || !href.includes('/serie/')) {
        return;
      }

      const path = this.normalizePath(href).split('#')[0];

      if (
        !path.startsWith('/serie/') ||
        path.includes('/capitulo-') ||
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
        cover: this.normalizeCover(coverSrc),
      });
    };

    /**
     * Estructura habitual de Madara.
     */
    $('.c-tabs-item__content').each((_, el) => {
      const item = $(el);

      const link = item
        .find(
          '.post-title a, .tab-summary .post-title a, .item-summary .post-title a',
        )
        .first();

      const href = link.attr('href') || '';

      const name = link.text().trim();

      const img = item.find('img').first();

      const cover =
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('src') ||
        '';

      addNovel(href, name, cover);
    });

    /**
     * Otro formato habitual del listado Madara.
     */
    $('.row.c-tabs-item__content').each((_, el) => {
      const item = $(el);

      const link = item
        .find('a[href*="/serie/"]')
        .filter((_, linkEl) => {
          const href = $(linkEl).attr('href') || '';

          return !href.includes('/capitulo-');
        })
        .first();

      const href = link.attr('href') || '';

      const name =
        item.find('.post-title').first().text().trim() ||
        link.attr('title') ||
        link.text().trim();

      const img = item.find('img').first();

      const cover =
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('src') ||
        '';

      addNovel(href, name, cover);
    });

    /**
     * Fallback:
     *
     * busca directamente enlaces /serie/.
     */
    $('a[href*="/h2copia/serie/"], a[href*="/serie/"]').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (href.includes('/capitulo-')) {
        return;
      }

      const parent = $(el).closest(
        '.c-tabs-item__content, .page-item-detail, .item-summary, .row',
      );

      const name =
        $(el).attr('title') ||
        $(el).find('h2, h3, h4').first().text().trim() ||
        parent.find('.post-title, h2, h3, h4').first().text().trim() ||
        $(el).find('img').first().attr('alt') ||
        '';

      const img =
        $(el).find('img').first().length > 0
          ? $(el).find('img').first()
          : parent.find('img').first();

      const cover =
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('src') ||
        '';

      addNovel(href, name, cover);
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * Madara utiliza /manga/?page=N para sus listados.
     *
     * También acepta m_orderby para ordenar.
     */
    const order = showLatestNovels ? 'latest' : 'views';

    const urls = [
      `${this.site}manga/?page=${pageNo}&m_orderby=${order}`,
      `${this.site}series/page/${pageNo}/?m_orderby=${order}`,
    ];

    /**
     * Probamos primero el listado estándar.
     *
     * Si no devuelve obras, usamos el segundo formato.
     */
    for (const url of urls) {
      try {
        const response = await fetchApi(url);

        if (!response.ok) {
          continue;
        }

        const body = await response.text();

        const novels = this.parseNovelCards(body);

        if (novels.length > 0) {
          return novels;
        }
      } catch {
        continue;
      }
    }

    return [];
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * Búsqueda estándar de WordPress/Madara.
     */
    const urls = [
      `${this.site}?s=${encodeURIComponent(
        searchTerm,
      )}&post_type=wp-manga&page=${pageNo}`,

      `${this.site}page/${pageNo}/?s=${encodeURIComponent(
        searchTerm,
      )}&post_type=wp-manga`,
    ];

    for (const url of urls) {
      try {
        const response = await fetchApi(url);

        if (!response.ok) {
          continue;
        }

        const body = await response.text();

        const novels = this.parseNovelCards(body);

        if (novels.length > 0) {
          return novels;
        }
      } catch {
        continue;
      }
    }

    return [];
  }

  /**
   * Extrae TODOS los capítulos mediante el endpoint real
   * utilizado por Rit'i Scan:
   *
   * POST
   * /serie/{slug}/ajax/chapters/?t=1
   *
   * La respuesta contiene:
   *
   * <li class="wp-manga-chapter">
   *   <a href=".../capitulo-449-5/">
   *     Capitulo 449.5
   *   </a>
   * </li>
   */
  private async getChapters(novelPath: string): Promise<Plugin.ChapterItem[]> {
    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const chaptersUrl = this.absoluteUrl(cleanPath) + '/ajax/chapters/?t=1';

    const response = await fetchApi(chaptersUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/html, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: this.absoluteUrl(cleanPath) + '/',
      },
    });

    if (!response.ok) {
      return [];
    }

    const body = await response.text();

    if (!body.trim()) {
      return [];
    }

    const $ = cheerio.load(body);

    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    $('li.wp-manga-chapter a').each((_, el) => {
      const href = $(el).attr('href') || '';

      const name = $(el).text().replace(/\s+/g, ' ').trim();

      if (!href || !name) {
        return;
      }

      const path = this.normalizePath(href);

      if (!path || seen.has(path)) {
        return;
      }

      /**
       * Primero obtenemos el número del texto:
       *
       * Capitulo 449.5 -> 449.5
       *
       * Esto es más fiable que interpretar:
       *
       * capitulo-449-5
       */
      const textNumberMatch = name.match(
        /(?:cap[ií]tulo|capitulo|cap\.?)\s*([0-9]+(?:\.[0-9]+)?)/i,
      );

      /**
       * Fallback al slug.
       */
      const slugNumberMatch = path.match(/\/capitulo-(\d+(?:[-.]\d+)?)/i);

      let chapterNumber: number | undefined;

      if (textNumberMatch) {
        const number = Number(textNumberMatch[1]);

        if (Number.isFinite(number)) {
          chapterNumber = number;
        }
      } else if (slugNumberMatch) {
        let rawNumber = slugNumberMatch[1];

        /**
         * 449-5 -> 449.5
         */
        rawNumber = rawNumber.replace(/^(\d+)-(\d+)$/, '$1.$2');

        const number = Number(rawNumber);

        if (Number.isFinite(number)) {
          chapterNumber = number;
        }
      }

      seen.add(path);

      chapters.push({
        name,
        path,
        chapterNumber,
      });
    });

    /**
     * El endpoint devuelve más nuevo -> más viejo.
     *
     * LNReader necesita más viejo -> más nuevo.
     */
    chapters.sort((a, b) => {
      const aNumber = a.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      const bNumber = b.chapterNumber ?? Number.MAX_SAFE_INTEGER;

      return aNumber - bNumber;
    });

    return chapters;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const url = this.absoluteUrl(cleanPath) + '/';

    const response = await fetchApi(url);

    const body = await response.text();

    const $ = cheerio.load(body);

    /**
     * Título.
     */
    const name =
      $('.post-title h1').first().text().trim() ||
      $('.post-title').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /**
     * Portada.
     */
    const coverImg = $('.summary_image img').first();

    const coverSrc =
      coverImg.attr('data-src') ||
      coverImg.attr('data-lazy-src') ||
      coverImg.attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    const cover = this.normalizeCover(coverSrc);

    /**
     * Sinopsis.
     */
    let summary =
      $('.summary__content').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary').first().text().replace(/\s+/g, ' ').trim();

    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /**
     * Estado.
     */
    let status = NovelStatus.Ongoing;

    $('.post-content_item').each((_, el) => {
      const heading = $(el)
        .find('.summary-heading')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      if (!/status|estado/i.test(heading)) {
        return;
      }

      const value = $(el)
        .find('.summary-content')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      if (/completed|complete|finalizado|completado|terminado/i.test(value)) {
        status = NovelStatus.Completed;
      }
    });

    /**
     * TODOS los capítulos vienen del endpoint AJAX real.
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

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.absoluteUrl(chapterPath);

    const response = await fetchApi(url);

    const body = await response.text();

    const $ = cheerio.load(body);

    /**
     * Madara normalmente coloca el contenido textual aquí.
     */
    const selectors = [
      '.reading-content',
      '.text-left',
      '.entry-content',
      '.chapter-content',
      '.c-page__content',
    ];

    let content = '';

    for (const selector of selectors) {
      const element = $(selector).first();

      if (!element.length) {
        continue;
      }

      /**
       * Quitamos elementos que no forman parte de la novela.
       */
      element
        .find(
          'script, style, iframe, ins, .adsbygoogle, .code-block, .sharedaddy',
        )
        .remove();

      const html = element.html()?.trim();

      if (html && html.length > content.length) {
        content = html;
      }
    }

    if (!content) {
      throw new Error(
        "Rit'i Scan: no se pudo encontrar el contenido del capítulo.",
      );
    }

    return content;
  }
}

export default new RitiScanPlugin();

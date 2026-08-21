import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

class RitiScanPlugin implements Plugin.PluginBase {
  id = 'ritiscan';

  name = "Rit'i Scan";

  icon = 'src/es/ritiscan/icon.png';

  /**
   * El contenido real de Rit'i Scan está instalado bajo /h2copia/.
   */
  site = 'https://riti-scan.com/h2copia/';

  version = '1.0.0';

  filters = undefined;

  /**
   * Convierte una URL absoluta de Rit'i Scan a un path que pueda guardar
   * LNReader.
   */
  private getPath(url?: string): string {
    if (!url) {
      return '';
    }

    try {
      const parsed = new URL(url);

      if (parsed.hostname === 'riti-scan.com') {
        let path = parsed.pathname;

        if (path.startsWith('/h2copia/')) {
          path = path.slice('/h2copia'.length);
        }

        return path.startsWith('/') ? path : `/${path}`;
      }
    } catch {
      // Puede que ya sea un path relativo.
    }

    return url.startsWith('/') ? url : `/${url}`;
  }

  /**
   * Convierte un path guardado por LNReader a la URL real de Rit'i Scan.
   */
  private getUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return this.site + path.replace(/^\/+/, '');
  }

  private getCover($: cheerio.CheerioAPI): string {
    const coverSrc =
      $('.summary_image img').first().attr('data-src') ||
      $('.summary_image img').first().attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    if (!coverSrc) {
      return defaultCover;
    }

    if (coverSrc.startsWith('//')) {
      return `https:${coverSrc}`;
    }

    if (coverSrc.startsWith('http')) {
      return coverSrc;
    }

    try {
      return new URL(coverSrc, this.site).href;
    } catch {
      return defaultCover;
    }
  }

  /**
   * Obtiene el valor de un campo de información de Madara.
   *
   * Ejemplo:
   *
   * <div class="post-content_item">
   *   <div class="summary-heading"><h5>Status</h5></div>
   *   <div class="summary-content">OnGoing</div>
   * </div>
   */
  private getInfoValue($: cheerio.CheerioAPI, label: string): string {
    let result = '';

    $('.post-content_item').each((_, el) => {
      if (result) {
        return;
      }

      const heading = $(el)
        .find('.summary-heading')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      if (heading === label.toLowerCase()) {
        result = $(el)
          .find('.summary-content')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim();
      }
    });

    return result;
  }

  private parseStatus(statusText: string): NovelStatus {
    const status = statusText.toLowerCase();

    if (
      status.includes('completed') ||
      status.includes('complete') ||
      status.includes('completado') ||
      status.includes('finalizado') ||
      status.includes('finalizada')
    ) {
      return NovelStatus.Completed;
    }

    return NovelStatus.Ongoing;
  }

  /**
   * Extrae el número de:
   *
   * Capitulo 449   -> 449
   * Capitulo 449.5 -> 449.5
   * Capitulo 01    -> 1
   */
  private getChapterNumber(name: string): number | undefined {
    const match = name
      .replace(',', '.')
      .match(/(?:cap[ií]tulo|capitulo|chapter)?\s*(\d+(?:\.\d+)?)/i);

    if (!match) {
      return undefined;
    }

    const number = Number(match[1]);

    return Number.isFinite(number) ? number : undefined;
  }

  /**
   * Madara carga el listado completo mediante este endpoint.
   *
   * En la ficha encontramos:
   *
   * <div id="manga-chapters-holder" data-id="3202">
   */
  private async getChapters(
    mangaId: string,
    fallbackHtml?: string,
  ): Promise<Plugin.ChapterItem[]> {
    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();

    const extract = ($: cheerio.CheerioAPI) => {
      $('li.wp-manga-chapter a').each((_, el) => {
        const href = $(el).attr('href')?.trim();

        const name = $(el).text().replace(/\s+/g, ' ').trim();

        if (!href || !name) {
          return;
        }

        const path = this.getPath(href);

        if (!path || seen.has(path)) {
          return;
        }

        seen.add(path);

        chapters.push({
          name,
          path,
          chapterNumber: this.getChapterNumber(name),
        });
      });
    };

    /**
     * Primero intentamos los capítulos que ya estén incluidos en el HTML
     * principal.
     */
    if (fallbackHtml) {
      extract(cheerio.load(fallbackHtml));
    }

    /**
     * Algunas configuraciones de Madara incluyen todos los capítulos
     * directamente. Si ya encontramos una lista razonable, no hacemos
     * otra petición.
     */
    if (chapters.length > 0) {
      return chapters.reverse();
    }

    /**
     * Endpoint estándar utilizado por Madara para cargar todos los
     * capítulos de una obra.
     */
    if (mangaId) {
      try {
        const response = await fetchApi(
          `${this.site}ajax/chapters/?manga=${encodeURIComponent(mangaId)}`,
        );

        if (response.ok) {
          const html = await response.text();

          if (html) {
            extract(cheerio.load(html));
          }
        }
      } catch {
        // Probamos el endpoint POST de Madara debajo.
      }
    }

    /**
     * Algunas instalaciones de Madara no utilizan /ajax/chapters/.
     *
     * En ellas el endpoint suele ser:
     *
     * POST /wp-admin/admin-ajax.php
     *
     * con action=manga_get_chapters.
     */
    if (chapters.length === 0 && mangaId) {
      try {
        const form = new URLSearchParams();

        form.set('action', 'manga_get_chapters');
        form.set('manga', mangaId);

        const response = await fetchApi(`${this.site}wp-admin/admin-ajax.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: form.toString(),
        });

        if (response.ok) {
          const html = await response.text();

          if (html) {
            extract(cheerio.load(html));
          }
        }
      } catch {
        // Devolvemos lo que hayamos conseguido.
      }
    }

    /**
     * Rit'i Scan devuelve los capítulos del más nuevo al más antiguo.
     * LNReader los necesita del más antiguo al más nuevo.
     */
    return chapters.reverse();
  }

  private parseNovelCards($: cheerio.CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    /**
     * Madara utiliza c-tabs-item__content para el catálogo y los
     * resultados de búsqueda.
     */
    $('.c-tabs-item__content, .row.c-tabs-item__content').each((_, el) => {
      const root = $(el);

      const link =
        root.find('.post-title h3 a').first().attr('href') ||
        root.find('.post-title a').first().attr('href') ||
        root.find('.tab-thumb a').first().attr('href') ||
        '';

      const name =
        root.find('.post-title h3 a').first().text().trim() ||
        root.find('.post-title a').first().text().trim() ||
        '';

      if (!link || !name) {
        return;
      }

      /**
       * Las obras viven bajo /serie/.
       */
      if (!link.includes('/serie/')) {
        return;
      }

      const path = this.getPath(link);

      if (!path || seen.has(path)) {
        return;
      }

      const img = root.find('img').first();

      let cover =
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('src') ||
        defaultCover;

      if (cover.startsWith('//')) {
        cover = `https:${cover}`;
      } else if (!cover.startsWith('http') && cover !== defaultCover) {
        try {
          cover = new URL(cover, this.site).href;
        } catch {
          cover = defaultCover;
        }
      }

      seen.add(path);

      novels.push({
        name,
        path,
        cover,
      });
    });

    /**
     * Fallback para otros layouts de Madara.
     */
    if (novels.length === 0) {
      $('.post-title a').each((_, el) => {
        const link = $(el).attr('href') || '';

        if (!link.includes('/serie/')) {
          return;
        }

        const name = $(el).text().replace(/\s+/g, ' ').trim();
        const path = this.getPath(link);

        if (!name || !path || seen.has(path)) {
          return;
        }

        const parent = $(el).closest(
          '.c-tabs-item__content, .page-item-detail, .row',
        );

        const img = parent.find('img').first();

        let cover =
          img.attr('data-src') ||
          img.attr('data-lazy-src') ||
          img.attr('src') ||
          defaultCover;

        if (cover.startsWith('//')) {
          cover = `https:${cover}`;
        } else if (!cover.startsWith('http') && cover !== defaultCover) {
          try {
            cover = new URL(cover, this.site).href;
          } catch {
            cover = defaultCover;
          }
        }

        seen.add(path);

        novels.push({
          name,
          path,
          cover,
        });
      });
    }

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const order = showLatestNovels ? 'latest' : 'trending';

    const url =
      `${this.site}series/page/${pageNo}/` +
      `?m_orderby=${encodeURIComponent(order)}`;

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    return this.parseNovelCards($);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * Madara acepta búsquedas mediante ?s=...
     */
    const params = new URLSearchParams();

    params.set('s', searchTerm);
    params.set('post_type', 'wp-manga');

    if (pageNo > 1) {
      params.set('paged', String(pageNo));
    }

    const url = `${this.site}?${params.toString()}`;

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    return this.parseNovelCards($);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.getUrl(novelPath);

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    const name =
      $('.post-title h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('meta[property="og:title"]')
        .attr('content')
        ?.replace(/\s*[–|-]\s*Rit.*$/i, '')
        .trim() ||
      '';

    const cover = this.getCover($);

    const summary = $('.description-summary .summary__content')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    const statusText = this.getInfoValue($, 'Status');

    const status = this.parseStatus(statusText);

    /**
     * En Heroína Obsecionada:
     *
     * <div id="manga-chapters-holder" data-id="3202">
     */
    const mangaId =
      $('#manga-chapters-holder').attr('data-id') ||
      $('.rating-post-id').attr('value') ||
      '';

    const chapters = await this.getChapters(mangaId, body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
      summary,
      status,
      chapters,
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.getUrl(chapterPath);

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    /**
     * Madara normalmente coloca el contenido del capítulo aquí.
     */
    let content = $('.reading-content').first();

    /**
     * Dependiendo de la plantilla, el contenido puede estar directamente
     * dentro de text-left.
     */
    if (!content.length) {
      content = $('.text-left').first();
    }

    if (!content.length) {
      return '';
    }

    /**
     * Eliminamos elementos del lector que no pertenecen al texto.
     */
    content
      .find(
        [
          'script',
          'style',
          'noscript',
          'iframe',
          '.ads',
          '.adsbygoogle',
          '.code-block',
          '.chapter-warning',
          '.select-pagination',
          '.c-select-bottom',
          '.reading-control',
          '.chapter-selection',
        ].join(','),
      )
      .remove();

    /**
     * En novelas Madara suele meter el texto dentro de
     * .text-left / .page-break.
     *
     * Conservamos los <p>, <br>, <strong>, etc. para que LNReader y
     * el TTS puedan procesar correctamente los párrafos.
     */
    const textContainer = content.find('.text-left').first();

    if (textContainer.length) {
      return textContainer.html()?.trim() || '';
    }

    return content.html()?.trim() || '';
  }
}

export default new RitiScanPlugin();

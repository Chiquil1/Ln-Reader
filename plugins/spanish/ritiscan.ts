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

  version = '2.0.0';

  filters = undefined;

  /**
   * Convierte una URL absoluta de Rit'i Scan en una ruta
   * que LNReader pueda guardar.
   *
   * https://riti-scan.com/serie/ejemplo/
   * ->
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
   * Convierte una ruta de LNReader en URL absoluta.
   */
  private getUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    return this.site + path.replace(/^\//, '');
  }

  /**
   * Portadas.
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
   * ============================================================
   * CATÁLOGO
   * ============================================================
   *
   * HTML comprobado:
   *
   * <div class="slider__item">
   *
   *   <div class="slider__thumb_item">
   *     <a href=".../serie/vete-de-aqui-fantasma/">
   *       <img src="PORTADA">
   *     </a>
   *   </div>
   *
   *   <div class="post-title">
   *     <h4>
   *       <a href=".../serie/vete-de-aqui-fantasma/">
   *         vete de aquí fantasma
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
     * UNA sola estrategia.
     *
     * No usamos múltiples fallbacks porque eso fue lo que provocó
     * novelas repetidas anteriormente.
     */
    $('.slider__item').each((_, el) => {
      const item = $(el);

      /**
       * Nombre y URL.
       */
      const titleLink = item.find('.post-title a[href*="/serie/"]').first();

      const href = titleLink.attr('href') || '';

      const name = titleLink.text().replace(/\s+/g, ' ').trim();

      if (!href || !name) {
        return;
      }

      /**
       * Solo aceptamos fichas /serie/.
       */
      if (!href.includes('/serie/')) {
        return;
      }

      const path = this.getPath(href);

      /**
       * Evitamos duplicados.
       *
       * Quitamos slash final para comparar:
       *
       * /serie/foo/
       * /serie/foo
       *
       * se consideran la misma novela.
       */
      const key = path.replace(/\/+$/, '');

      if (seen.has(key)) {
        return;
      }

      /**
       * Portada.
       */
      const img = item.find('.slider__thumb_item img').first();

      const coverSrc =
        img.attr('data-src-webp') ||
        img.attr('data-src') ||
        img.attr('src') ||
        '';

      const cover = this.getCover(coverSrc);

      seen.add(key);

      novels.push({
        name,
        path,
        cover,
      });
    });

    return novels;
  }

  /**
   * ============================================================
   * NOVELAS POPULARES / RECIENTES
   * ============================================================
   */
  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * Por ahora usamos el HTML principal que contiene
     * .slider__item.
     *
     * No inventamos paginación hasta comprobarla en el HTML.
     */
    if (pageNo > 1) {
      return [];
    }

    const url = this.site;

    const body = await fetchApi(url).then(res => res.text());

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
    /**
     * Búsqueda normal de WordPress.
     *
     * Aquí sí utilizamos el HTML resultante, pero seguimos buscando
     * únicamente fichas /serie/.
     */
    const url =
      `${this.site}?s=${encodeURIComponent(searchTerm)}` +
      `&post_type=wp-manga`;

    const body = await fetchApi(url).then(res => res.text());

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
        '.c-tabs-item__content, .row, .page-item-detail',
      );

      const name =
        parent
          .find('.post-title a[href*="/serie/"]')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim() || link.text().replace(/\s+/g, ' ').trim();

      if (!name) {
        return;
      }

      const img = parent.find('img').first();

      const coverSrc =
        img.attr('data-src-webp') ||
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
   * CAPÍTULOS
   * ============================================================
   *
   * HTML comprobado:
   *
   * <li class="wp-manga-chapter">
   *
   *   <a href="
   *     https://riti-scan.com/serie/.../capitulo-02/
   *   ">
   *     Capitulo 02
   *   </a>
   *
   * </li>
   *
   *
   * También comprobamos paginación:
   *
   * <span class="page current page-1">1</span>
   *
   * <span class="page page-2">
   *   <a href="/?t=2" data-page="2">2</a>
   * </span>
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

      if (seen.has(path)) {
        return;
      }

      /**
       * Preferimos sacar el número del texto.
       *
       * Capitulo 01
       * Capitulo 02
       * Capitulo 449.5
       */
      const numberMatch = name.match(
        /(?:cap[ií]tulo|capitulo|cap\.?)\s*([0-9]+(?:\.[0-9]+)?)/i,
      );

      let chapterNumber: number | undefined;

      if (numberMatch) {
        const number = Number(numberMatch[1]);

        if (Number.isFinite(number)) {
          chapterNumber = number;
        }
      }

      /**
       * Fallback al slug.
       *
       * capitulo-449-5
       * ->
       * 449.5
       */
      if (chapterNumber === undefined) {
        const slugMatch = path.match(/\/capitulo-(\d+(?:[-.]\d+)?)/i);

        if (slugMatch) {
          const raw = slugMatch[1].replace(/^(\d+)-(\d+)$/, '$1.$2');

          const number = Number(raw);

          if (Number.isFinite(number)) {
            chapterNumber = number;
          }
        }
      }

      seen.add(path);

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
   * Descarga las páginas de capítulos:
   *
   * ?t=1
   * ?t=2
   * ...
   */
  private async getChapters(novelPath: string): Promise<Plugin.ChapterItem[]> {
    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    const baseUrl = this.getUrl(novelPath.replace(/\/+$/, ''));

    /**
     * Empezamos por la ficha normal.
     *
     * Si ya contiene capítulos, los recogemos.
     */
    const mainBody = await fetchApi(`${baseUrl}/`).then(res => res.text());

    this.parseChapters(mainBody, chapters, seen);

    const $main = cheerio.load(mainBody);

    /**
     * Buscamos el número máximo de página directamente
     * en data-page.
     *
     * Ejemplo:
     *
     * data-page="2"
     */
    let maxPage = 1;

    $('a[data-page]').each((_, el) => {
      const page = Number($main(el).attr('data-page'));

      if (Number.isFinite(page) && page > maxPage) {
        maxPage = page;
      }
    });

    /**
     * Si el HTML dice que hay página 2, 3, etc.,
     * las recorremos.
     */
    for (let page = 2; page <= maxPage; page++) {
      try {
        const pageUrl = `${baseUrl}/?t=${page}`;

        const body = await fetchApi(pageUrl).then(res => res.text());

        this.parseChapters(body, chapters, seen);
      } catch {
        continue;
      }
    }

    /**
     * Orden:
     *
     * Cap 1
     * Cap 2
     * Cap 3
     * ...
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
   * FICHA
   * ============================================================
   */
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const url = this.getUrl(cleanPath) + '/';

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    /**
     * TÍTULO
     */
    const name =
      $('.post-title h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('h1').first().text().replace(/\s+/g, ' ').trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    /**
     * PORTADA
     *
     * HTML que nos pasaste:
     *
     * <img
     *   class="img-responsive"
     *   src="https://riti-scan.com/wp-content/..."
     * >
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
     * SINOPSIS
     *
     * Primero buscamos los contenedores normales de
     * descripción.
     */
    let summary =
      $('.summary__content p').first().text().replace(/\s+/g, ' ').trim() ||
      $('.description-summary p').first().text().replace(/\s+/g, ' ').trim();

    /**
     * Si la descripción no tiene esos wrappers,
     * buscamos un párrafo suficientemente largo.
     *
     * La sinopsis que nos pasaste es un <p> largo.
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
     * Fallback meta description.
     */
    if (!summary) {
      summary =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    }

    /**
     * ESTADO
     */
    const pageText = $('body').text().replace(/\s+/g, ' ');

    const status = /completo|completado|finalizado|terminado/i.test(pageText)
      ? NovelStatus.Completed
      : NovelStatus.Ongoing;

    /**
     * CAPÍTULOS
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
   * LECTURA
   * ============================================================
   */
  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.getUrl(chapterPath);

    const body = await fetchApi(url).then(res => res.text());

    const $ = cheerio.load(body);

    /**
     * Buscamos primero el contenedor típico de Madara.
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
       * Solo nos interesan párrafos con texto.
       */
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
     * Fallback.
     *
     * El HTML que nos pasaste tiene:
     *
     * <p>Capitulo 01</p>
     * <p>Hablar conmigo mismo...</p>
     *
     * Si no encontramos contenedor conocido, buscamos
     * párrafos que tengan contenido significativo.
     */
    const paragraphs: string[] = [];

    $('p').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();

      if (!text) {
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
   * Evita que símbolos del texto rompan el HTML
   * entregado a LNReader.
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

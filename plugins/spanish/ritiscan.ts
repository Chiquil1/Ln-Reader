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

  version = '2.0.1';

  filters = undefined;

  /**
   * Rit'i Scan devuelve 403 en las fichas de las novelas
   * cuando la petición no parece venir de un navegador.
   *
   * Estos headers fueron comprobados directamente:
   *
   * Sin headers:
   * HTTP 403
   *
   * Con estos headers:
   * HTTP 200
   */
  private browserHeaders = {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
    Referer: 'https://riti-scan.com/',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36',
  };

  /**
   * URL absoluta -> path para LNReader.
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
   * Path de LNReader -> URL absoluta.
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
   * Descarga HTML utilizando los headers necesarios
   * para evitar el 403 de LiteSpeed.
   */
  private async fetchHtml(url: string): Promise<string> {
    const response = await fetchApi(url, {
      headers: this.browserHeaders,
    });

    if (!response.ok) {
      throw new Error(`Rit'i Scan: HTTP ${response.status} al cargar ${url}`);
    }

    const body = await response.text();

    /**
     * Evitamos intentar parsear la página 403 como si fuera
     * una novela.
     */
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
   * HTML comprobado:
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
     * Utilizamos únicamente slider__item.
     *
     * Esto evita el problema anterior donde una misma novela
     * aparecía varias veces.
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
       * Quitamos slash final únicamente para comparar duplicados.
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

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels: _showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    /**
     * Actualmente el catálogo comprobado está en la portada.
     *
     * No inventamos paginación del catálogo.
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

    /**
     * En resultados de búsqueda buscamos fichas /serie/.
     */
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
   * PARSER DE CAPÍTULOS
   * ============================================================
   *
   * HTML comprobado:
   *
   * <li class="wp-manga-chapter">
   *
   *   <a href="https://riti-scan.com/serie/.../capitulo-02/">
   *     Capitulo 02
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
       * Preferimos obtener el número desde el texto.
       *
       * Capitulo 01     -> 1
       * Capitulo 02     -> 2
       * Capitulo 449.5  -> 449.5
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
       * Fallback al slug:
       *
       * capitulo-449-5
       *
       * ->
       *
       * 449.5
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
   * Detecta cuántas páginas de capítulos existen.
   *
   * HTML comprobado:
   *
   * <span class="page current page-1">1</span>
   *
   * <span class="page page-2">
   *   <a href="/?t=2" data-page="2">2</a>
   * </span>
   */
  private getMaxChapterPage(body: string): number {
    const $ = cheerio.load(body);

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
     * Fallback al href ?t=N.
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

    return maxPage;
  }

  /**
   * ============================================================
   * OBTENER TODOS LOS CAPÍTULOS
   * ============================================================
   */
  private async getChapters(
    novelPath: string,
    initialBody?: string,
  ): Promise<Plugin.ChapterItem[]> {
    const chapters: Plugin.ChapterItem[] = [];

    const seen = new Set<string>();

    const cleanPath = novelPath.split('?')[0].replace(/\/+$/, '');

    const baseUrl = this.getUrl(cleanPath);

    /**
     * Reutilizamos el HTML que parseNovel ya descargó.
     *
     * Así evitamos pedir dos veces la misma ficha.
     */
    const firstBody = initialBody || (await this.fetchHtml(`${baseUrl}/`));

    this.parseChapters(firstBody, chapters, seen);

    let maxPage = this.getMaxChapterPage(firstBody);

    /**
     * Algunas fichas muestran la primera página mediante ?t=1.
     *
     * Si el HTML normal no contiene capítulos, probamos explícitamente
     * ?t=1 con los headers que evitan el 403.
     */
    if (chapters.length === 0) {
      try {
        const pageOneBody = await this.fetchHtml(`${baseUrl}/?t=1`);

        this.parseChapters(pageOneBody, chapters, seen);

        maxPage = Math.max(maxPage, this.getMaxChapterPage(pageOneBody));
      } catch {
        // Continuamos con lo que tengamos.
      }
    }

    /**
     * Recorremos las páginas adicionales.
     */
    for (let page = 2; page <= maxPage; page++) {
      try {
        const pageUrl = `${baseUrl}/?t=${page}`;

        const body = await this.fetchHtml(pageUrl);

        this.parseChapters(body, chapters, seen);
      } catch {
        continue;
      }
    }

    /**
     * Orden ascendente para LNReader.
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

    /**
     * IMPORTANTE:
     *
     * Esta petición utiliza los headers de navegador.
     *
     * Sin ellos Rit'i Scan devuelve:
     *
     * 403 Forbidden
     *
     * Con ellos devuelve el HTML real.
     */
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
     *
     * HTML comprobado:
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
     * Fallback:
     *
     * buscamos un párrafo largo dentro de la zona de contenido.
     */
    if (!summary) {
      const candidates: string[] = [];

      $('p').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();

        if (text.length >= 100) {
          candidates.push(text);
        }
      });

      /**
       * Normalmente la sinopsis será uno de los primeros
       * párrafos largos.
       */
      if (candidates.length > 0) {
        summary = candidates[0];
      }
    }

    /**
     * Último fallback: metadatos.
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
     *
     * Reutilizamos el HTML ya descargado.
     */
    const chapters = await this.getChapters(cleanPath, body);

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

    /**
     * También usamos headers aquí porque las páginas individuales
     * están protegidas por LiteSpeed.
     */
    const body = await this.fetchHtml(url);

    const $ = cheerio.load(body);

    /**
     * Contenedores conocidos.
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
       * Quitamos elementos que claramente no son texto
       * del capítulo.
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
     * Fallback.
     *
     * HTML comprobado:
     *
     * <p>Capitulo 01</p>
     *
     * <p>
     *   Hablar conmigo mismo en la azotea...
     * </p>
     */
    const paragraphs: string[] = [];

    $('p').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();

      if (!text) {
        return;
      }

      /**
       * Evitamos algunos textos típicos del sitio.
       */
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

import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { NovelStatus } from '@libs/novelStatus';

import { defaultCover } from '@libs/defaultCover';

import * as cheerio from 'cheerio';

type RittoChapter = {
  id?: string;
  nombre?: string;
  href?: string;
  numero?: number | string;
};

class RittoPlugin implements Plugin.PluginBase {
  id = 'ritto';

  name = 'Ritto';

  icon = 'https://ritto.cc/logo/ritto1w.png';

  site = 'https://ritto.cc/';

  version = '1.0.1';

  filters = undefined;

  /**
   * Extrae las novelas mostradas en el catálogo.
   *
   * Ritto mezcla manga, manhwa, novelas, etc., por lo que las URLs
   * que llaman a este método incluyen tipo=NOVELA.
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

      if (name && href) {
        seenPaths.add(href);

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

  /**
   * Convierte secuencias escapadas habituales de los payloads de Next.js.
   */
  private decodePayloadString(value: string): string {
    return value
      .replace(/\\"/g, '"')
      .replace(/\\u0026/g, '&')
      .replace(/\\u003d/g, '=')
      .replace(/\\u003f/g, '?')
      .replace(/\\u002f/gi, '/')
      .replace(/\\\//g, '/');
  }

  /**
   * Busca los capítulos que Ritto incluye dentro del payload de Next.js.
   *
   * Ejemplo:
   *
   * "items":[
   *   {
   *     "id":"...",
   *     "nombre":"Cap. 30",
   *     "href":"/obra/yokuoni/capitulo/capitulo-30?scan=...",
   *     "numero":30
   *   }
   * ]
   */
  private extractPayloadChapters(body: string): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];

    const seenPaths = new Set<string>();

    /*
     * El HTML de Next.js puede contener el JSON normal:
     *
     * "nombre":"Cap. 30"
     *
     * o escapado:
     *
     * \"nombre\":\"Cap. 30\"
     *
     * Normalizamos ambas variantes.
     */
    const normalizedBody = this.decodePayloadString(body);

    /*
     * En lugar de intentar JSON.parse() sobre todo el payload de Next.js,
     * buscamos directamente objetos que tengan nombre/href/numero.
     *
     * Esto evita depender de la estructura interna exacta de Next.js.
     */
    const objectRegex = /\{[^{}]*\}/g;

    const objects = normalizedBody.match(objectRegex) || [];

    for (const objectText of objects) {
      if (
        !objectText.includes('"href"') ||
        !objectText.includes('/capitulo/')
      ) {
        continue;
      }

      const hrefMatch = objectText.match(
        /"href"\s*:\s*"([^"]*\/capitulo\/[^"]+)"/i,
      );

      if (!hrefMatch) {
        continue;
      }

      const href = this.decodePayloadString(hrefMatch[1]);

      if (
        !href.includes('/obra/') ||
        !href.includes('/capitulo/') ||
        seenPaths.has(href)
      ) {
        continue;
      }

      const nameMatch = objectText.match(/"nombre"\s*:\s*"([^"]+)"/i);

      const numberMatch = objectText.match(
        /"numero"\s*:\s*(?:"([^"]+)"|(-?\d+(?:\.\d+)?))/i,
      );

      let chapterNumber: number | undefined;

      if (numberMatch) {
        const rawNumber = numberMatch[1] || numberMatch[2];

        const parsedNumber = Number(rawNumber);

        if (Number.isFinite(parsedNumber)) {
          chapterNumber = parsedNumber;
        }
      }

      /*
       * Si por alguna razón numero no está presente, intentamos obtenerlo
       * del nombre o del slug.
       */
      if (chapterNumber === undefined) {
        const fallbackNumber =
          href.match(/\/capitulo\/capitulo-(\d+(?:[-.]\d+)?)/i) ||
          nameMatch?.[1]?.match(/(\d+(?:\.\d+)?)/);

        if (fallbackNumber) {
          const parsedNumber = Number(fallbackNumber[1].replace('-', '.'));

          if (Number.isFinite(parsedNumber)) {
            chapterNumber = parsedNumber;
          }
        }
      }

      const chapterName =
        nameMatch?.[1]?.trim() ||
        (chapterNumber !== undefined ? `Cap. ${chapterNumber}` : 'Capítulo');

      seenPaths.add(href);

      chapters.push({
        name: chapterName,
        path: href,
        chapterNumber,
      });
    }

    return chapters;
  }

  /**
   * Método de respaldo.
   *
   * Si Ritto cambia el payload pero continúa renderizando enlaces
   * de capítulos en el HTML, todavía podremos obtenerlos.
   */
  private extractHtmlChapters($: cheerio.CheerioAPI): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];

    const seenPaths = new Set<string>();

    $('a[href*="/capitulo/"]').each((_, el) => {
      const href = $(el).attr('href') || '';

      if (!href.includes('/obra/') || !href.includes('/capitulo/')) {
        return;
      }

      if (seenPaths.has(href)) {
        return;
      }

      const text = $(el).text().replace(/\s+/g, ' ').trim();

      const numberMatch =
        href.match(/\/capitulo\/capitulo-(\d+(?:[-.]\d+)?)/i) ||
        text.match(/(?:Cap(?:ítulo)?\.?\s*)(\d+(?:\.\d+)?)/i);

      let chapterNumber: number | undefined;

      if (numberMatch) {
        const parsedNumber = Number(numberMatch[1].replace('-', '.'));

        if (Number.isFinite(parsedNumber)) {
          chapterNumber = parsedNumber;
        }
      }

      const chapterName =
        text ||
        (chapterNumber !== undefined ? `Cap. ${chapterNumber}` : 'Capítulo');

      seenPaths.add(href);

      chapters.push({
        name: chapterName,
        path: href,
        chapterNumber,
      });
    });

    return chapters;
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
     * CAPÍTULOS
     *
     * Primero usamos el payload de Ritto.
     *
     * Este es el cambio importante respecto a la versión 1.0.0.
     */
    let chapters = this.extractPayloadChapters(body);

    /*
     * Si no encontramos capítulos en el payload, conservamos el método
     * antiguo como respaldo.
     */
    if (chapters.length === 0) {
      chapters = this.extractHtmlChapters($);
    }

    /*
     * Eliminamos posibles duplicados una segunda vez porque Next.js puede
     * repetir información en diferentes partes del payload.
     */
    const uniqueChapters = new Map<string, Plugin.ChapterItem>();

    for (const chapter of chapters) {
      if (!uniqueChapters.has(chapter.path)) {
        uniqueChapters.set(chapter.path, chapter);
      }
    }

    chapters = Array.from(uniqueChapters.values());

    /*
     * Ritto normalmente entrega:
     *
     * 30
     * 29
     * 28
     * ...
     * 1
     *
     * LNReader debe recibirlos en orden ascendente.
     */
    chapters.sort((a, b) => {
      const aNumber =
        typeof a.chapterNumber === 'number'
          ? a.chapterNumber
          : Number.MAX_SAFE_INTEGER;

      const bNumber =
        typeof b.chapterNumber === 'number'
          ? b.chapterNumber
          : Number.MAX_SAFE_INTEGER;

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
     * Ritto incluye:
     *
     * "archivoUrl":"/api/capitulos/{ID}/archivo"
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

    /*
     * PASO 3
     *
     * El endpoint devuelve directamente el texto.
     */
    const text = await fetchApi(this.site.slice(0, -1) + archivoUrl).then(res =>
      res.text(),
    );

    if (!text.trim()) {
      throw new Error('Ritto: el capítulo no contiene texto.');
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    /*
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

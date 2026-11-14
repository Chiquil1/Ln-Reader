import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import * as cheerio from 'cheerio';

class SaitouTranslationsPlugin implements Plugin.PluginBase {
  id = 'saitoutl';
  name = 'Saitou Translations';
  icon = 'src/es/saitou/icon.png';
  site = 'https://saitoutl.com';
  version = '1.0.17';

  // Guarda lo ya enviado para cortar la paginación si el sitio repite resultados
  private seenPaths = new Set<string>();

  private async getCheerio(url: string): Promise<cheerio.CheerioAPI> {
    const res = await fetchApi(url, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (open in WebView?)`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    if (
      title === 'Just a moment...' ||
      title === 'Bot Verification' ||
      title === 'Attention Required! | Cloudflare'
    ) {
      throw new Error('Captcha error, please open in webview');
    }
    return $;
  }

  private absUrl(src: string): string {
    if (!src) return defaultCover;
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    return `${this.site}${src.startsWith('/') ? '' : '/'}${src}`;
  }

  private parseNovelCards($: cheerio.CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>(); // evita duplicados en la misma página

    $('.obra').each((i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      if (!href) return;

      const path = href.replace(this.site, '') || href;
      if (seen.has(path)) return;
      seen.add(path);

      const rawName = $el.find('.obra__titulo').text().trim();
      const name =
        rawName.length > 40 ? `${rawName.slice(0, 37).trim()}...` : rawName;
      const cover = this.absUrl($el.find('img').attr('src') || '');

      if (name && path) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  // Corta la paginación si el sitio repite resultados
  private dedupePages(novels: Plugin.NovelItem[], pageNo: number) {
    if (pageNo === 1) this.seenPaths.clear();
    const fresh = novels.filter(n => !this.seenPaths.has(n.path));
    fresh.forEach(n => this.seenPaths.add(n.path));
    return fresh; // si viene vacío, la app deja de paginar
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    // El sitio no pagina /buscar (devuelve siempre los mismos 30).
    // Agregamos todos los autores para obtener el catálogo completo.
    const $authors = await this.getCheerio(`${this.site}/autores`);
    const authorSlugs: string[] = [];
    $authors('a[href^="/a/"]').each((i, el) => {
      const href = $authors(el).attr('href') || '';
      const slug = href.replace('/a/', '').replace(/\/+$/, '');
      if (slug && !authorSlugs.includes(slug)) {
        authorSlugs.push(slug);
      }
    });

    const all: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    for (const slug of authorSlugs) {
      try {
        const $ = await this.getCheerio(`${this.site}/a/${slug}`);
        const cards = this.parseNovelCards($);
        for (const novel of cards) {
          if (seen.has(novel.path)) continue;
          seen.add(novel.path);
          all.push(novel);
        }
      } catch (e) {
        // Ignorar autores que fallen y continuar
      }
    }

    return this.dedupePages(all, pageNo);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const encodedTerm = encodeURIComponent(searchTerm);
    const url = `${this.site}/buscar?q=${encodedTerm}&page=${pageNo}`;
    const $ = await this.getCheerio(url);
    return this.dedupePages(this.parseNovelCards($), pageNo);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    // Normalizar la ruta por si la app envía variaciones (con/sin barra final, URL completa, etc.)
    let normalizedPath = (novelPath || '').trim();
    if (normalizedPath.startsWith('http')) {
      normalizedPath = normalizedPath.replace(this.site, '');
    }
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    normalizedPath = normalizedPath.replace(/\/+$/, '');
    if (!normalizedPath) normalizedPath = '/';

    const url = `${this.site}${normalizedPath}`;
    const $ = await this.getCheerio(url);

    const name =
      $('.ficha__titulo').first().text().trim() ||
      $('h1').first().text().trim();

    const coverRel =
      $('.ficha__portada img').first().attr('src') ||
      $('img').first().attr('src') ||
      '';
    const cover = coverRel ? this.absUrl(coverRel) : defaultCover;

    const author = $('.ficha__autor')
      .text()
      .replace('Autor del sitio', '')
      .trim();

    const summary =
      $('.ficha__sinopsis').first().text().trim() ||
      $('p').first().text().trim();

    const statusText = $('.ficha__cifras').text().toLowerCase();
    let status = NovelStatus.Unknown;
    if (
      statusText.includes('completado') ||
      statusText.includes('finalizado')
    ) {
      status = NovelStatus.Completed;
    } else if (
      statusText.includes('en curso') ||
      statusText.includes('activo')
    ) {
      status = NovelStatus.Ongoing;
    }

    const chapters: Plugin.ChapterItem[] = [];
    let chapterIndex = 0;

    // Selector principal + fallbacks por si la estructura varía
    const chapterSelectors = ['.cap', 'a[href*="capitulo"]'];
    let $chapters = $();
    for (const selector of chapterSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        $chapters = found;
        break;
      }
    }

    // Si no se encontraron con selectores, buscar cualquier enlace que contenga "capitulo"
    if ($chapters.length === 0) {
      $chapters = $('a').filter((i, el) => {
        const href = $(el).attr('href') || '';
        return href.includes('capitulo');
      });
    }

    $chapters.each((i, element) => {
      const $chapter = $(element);
      const href = $chapter.attr('href');
      if (!href) return;

      const path = href.replace(this.site, '') || href;
      // Solo enlaces de capítulos de esta novela
      if (!path.includes('/capitulo-')) return;

      const chapterName =
        $chapter.find('.cap__titulo').text().trim() || $chapter.text().trim();
      const chapterNumberText = $chapter.find('.cap__num').text().trim();
      const chapterNumber = parseInt(chapterNumberText, 10) || chapterIndex + 1;

      if (!path) return;

      chapters.push({
        name: chapterName,
        path,
        releaseTime: '',
        chapterNumber,
      });

      chapterIndex++;
    });

    if (!name) {
      throw new Error(`Novel not found (${normalizedPath})`);
    }
    if (chapters.length === 0) {
      throw new Error(`No chapters found (${normalizedPath})`);
    }

    const novel: Plugin.SourceNovel = {
      path: normalizedPath,
      name,
      cover,
      summary,
      author,
      status,
      chapters,
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    let normalizedPath = (chapterPath || '').trim();
    if (normalizedPath.startsWith('http')) {
      normalizedPath = normalizedPath.replace(this.site, '');
    }
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    normalizedPath = normalizedPath.replace(/\/+$/, '');

    const url = `${this.site}${normalizedPath}`;
    const $ = await this.getCheerio(url);

    const $content = $('.lector__texto');
    $content.find('script, style, iframe').remove();

    // Convertir URLs relativas de imágenes a absolutas y quitar lazy-loading
    $content.find('img').each((i, img) => {
      const $img = $(img);
      const src = $img.attr('src') || '';
      if (!src) {
        $img.remove();
        return;
      }
      $img.attr('src', this.absUrl(src));
      $img.removeAttr('loading');
      $img.removeAttr('decoding');
    });

    const html = $content.html() || '';
    if (!html.trim()) {
      throw new Error('Empty chapter, please open in webview');
    }
    return html;
  }
}

export default new SaitouTranslationsPlugin();

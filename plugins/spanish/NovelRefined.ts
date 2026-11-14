import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import * as cheerio from 'cheerio';

class NovelRefinedPlugin implements Plugin.PluginBase {
  id = 'novelrefined';
  name = 'NovelRefined';
  icon = 'src/es/novelrefined/icon.png';
  site = 'https://novelrefined.com';
  version = '1.0.0';

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

    $('a').each((i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      if (!href || !href.startsWith('/novela/')) return;
      if (href.includes('capitulo')) return;

      const path = href.replace(this.site, '') || href;
      const name = $el.text().trim();
      const coverRel = $el.find('img').attr('src') || '';
      const cover = coverRel ? this.absUrl(coverRel) : defaultCover;

      if (name && path) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/novelas/?page=${pageNo}`;
    const $ = await this.getCheerio(url);
    return this.parseNovelCards($);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    const encodedTerm = encodeURIComponent(searchTerm);
    const url = `${this.site}/buscar?q=${encodedTerm}`;

    let $: cheerio.CheerioAPI;
    try {
      $ = await this.getCheerio(url);
    } catch (e) {
      // Si no existe endpoint de buscar, devolver vacío
      return [];
    }

    return this.parseNovelCards($);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${this.site}${novelPath}`;
    const $ = await this.getCheerio(url);

    const name = $('h1').first().text().trim();

    const coverRel =
      $('img[src*="catalog-covers"]').first().attr('src') ||
      $('img').first().attr('src') ||
      '';
    const cover = coverRel ? this.absUrl(coverRel) : defaultCover;

    // Autor desde JSON-LD si está disponible
    let author = '';
    const jsonLd = $('script[type="application/ld+json"]').html() || '';
    const authorMatch = jsonLd.match(/"name"\s*:\s*"([^"]+)"/);
    if (authorMatch) author = authorMatch[1];

    const summary = $('meta[name="description"]').attr('content') || '';

    let status = NovelStatus.Unknown;
    const statusText = $.text().toLowerCase();
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

    // Obtener todos los capítulos desde ?view=chapters
    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();
    let chapterIndex = 0;

    const chaptersUrl = `${url}?view=chapters`;
    try {
      const $chapters = await this.getCheerio(chaptersUrl);
      $chapters('a').each((i, element) => {
        const href = $chapters(element).attr('href');
        if (!href || !href.includes('/capitulo-')) return;
        const path = href.replace(this.site, '') || href;
        if (seen.has(path)) return;
        seen.add(path);

        const name =
          $chapters(element).text().trim() || path.split('/').pop() || '';
        const numMatch = path.match(/capitulo-(\d+)/i);
        const chapterNumber = numMatch
          ? parseInt(numMatch[1], 10)
          : chapterIndex + 1;

        chapters.push({
          name,
          path,
          releaseTime: '',
          chapterNumber,
        });

        chapterIndex++;
      });
    } catch (e) {
      // Si falla ?view=chapters, intentar enlaces directos en la página normal
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        if (!href || !href.includes('/capitulo-')) return;
        const path = href.replace(this.site, '') || href;
        if (seen.has(path)) return;
        seen.add(path);

        chapters.push({
          name: $(element).text().trim() || path.split('/').pop() || '',
          path,
          releaseTime: '',
          chapterNumber: chapterIndex + 1,
        });
        chapterIndex++;
      });
    }

    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
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
    const url = `${this.site}${chapterPath}`;
    const $ = await this.getCheerio(url);

    const $content = $('article.chapter-content').first();
    $content.find('script, style, iframe').remove();

    const html = $content.html() || '';
    if (!html.trim()) {
      throw new Error('Empty chapter, please open in webview');
    }
    return html;
  }
}

export default new NovelRefinedPlugin();

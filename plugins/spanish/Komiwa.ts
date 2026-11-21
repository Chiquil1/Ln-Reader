import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import * as cheerio from 'cheerio';

const SITE = 'https://www.komiwa.net';

class KomiwaPlugin implements Plugin.PluginBase {
  id = 'komiwa';
  name = 'Komiwa';
  icon = 'src/es/komiwa/icon.png';
  site = SITE;
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
    return `${SITE}${src.startsWith('/') ? '' : '/'}${src}`;
  }

  private parseNovelCards($: cheerio.CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('a').each((i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      if (!href || !href.startsWith('/manga/')) return;
      if (!href.includes('-novela')) return;

      const path = href.replace(SITE, '') || href;
      if (seen.has(path)) return;
      seen.add(path);

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
    const url = `${SITE}/tipo/novela?page=${pageNo}`;
    const $ = await this.getCheerio(url);
    return this.parseNovelCards($);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    const url = `${SITE}/buscar?q=${encodeURIComponent(searchTerm)}`;
    try {
      const $ = await this.getCheerio(url);
      return this.parseNovelCards($);
    } catch (e) {
      return [];
    }
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${SITE}${novelPath.startsWith('/') ? novelPath : `/${novelPath}`}`;
    const $ = await this.getCheerio(url);

    const name = $('h1').first().text().trim() || $('title').text().trim();

    const coverRel =
      $('img[src*="covers"]').first().attr('src') ||
      $('img').first().attr('src') ||
      '';
    const cover = coverRel ? this.absUrl(coverRel) : defaultCover;

    const summary = $('meta[name="description"]').attr('content')?.trim() || '';

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

    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();
    let chapterIndex = 0;

    $('a[href*="/chapter/"]').each((i, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      const path = href.replace(SITE, '') || href;
      if (seen.has(path)) return;
      seen.add(path);

      const name = $(element).text().trim() || `Capítulo ${chapterIndex + 1}`;

      chapters.push({
        name,
        path,
        releaseTime: '',
        chapterNumber: chapterIndex + 1,
      });

      chapterIndex++;
    });

    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
      summary,
      author: '',
      status,
      chapters,
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = `${SITE}${chapterPath.startsWith('/') ? chapterPath : `/${chapterPath}`}`;
    const $ = await this.getCheerio(url);

    // Komiwa capítulos son imágenes (páginas)
    const images: string[] = [];
    $('img').each((i, img) => {
      const $img = $(img);
      const src = $img.attr('src') || $img.attr('data-src') || '';
      if (!src || src.includes('favicon') || src.includes('sprite')) return;
      images.push(this.absUrl(src));
    });

    const html = images
      .map(
        src =>
          `<img src="${src}" alt="" style="display:block; margin:auto;" />`,
      )
      .join('\n');

    if (!html.trim()) {
      throw new Error('Empty chapter, please open in webview');
    }

    return html;
  }
}

export default new KomiwaPlugin();

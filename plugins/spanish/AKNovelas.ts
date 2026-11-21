import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import * as cheerio from 'cheerio';

class AKNovelasPlugin implements Plugin.PluginBase {
  id = 'aknovelas';
  name = 'AKNovelas';
  icon = 'src/es/aknovelas/icon.png';
  site = 'https://aknovelas.com';
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

  private isMainNovelUrl(url: string, slug?: string): boolean {
    if (!url.startsWith(this.site)) return false;
    if (url.includes('-capitulo-')) return false;
    if (/-\d+-\d+\/?$/.test(url)) return false;
    if (/(volumen|libro|arco)-\d+\/?$/.test(url)) return false;
    if (slug && !url.includes(`/${slug}/`) && !url.includes(`/${slug}`)) {
      // keep only urls that contain the slug
    }
    return true;
  }

  private slugFromPath(novelPath: string): string {
    return novelPath.replace(/^\/+/, '').replace(/\/+$/, '');
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const url =
      pageNo === 1
        ? `${this.site}/category/novelas/`
        : `${this.site}/category/novelas/page/${pageNo}/`;
    const $ = await this.getCheerio(url);
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('article').each((i, element) => {
      const $article = $(element);
      const $link = $article.find('.entry-title a').first();
      const href = $link.attr('href');
      if (!href) return;
      const path = href.replace(this.site, '') || href;
      if (seen.has(path)) return;
      seen.add(path);

      const name = $link.text().trim();
      const cover =
        $article.find('img').first().attr('src') ||
        $article.find('img').first().attr('data-src') ||
        '';

      if (name && path && !path.includes('-capitulo-')) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const encodedTerm = encodeURIComponent(searchTerm);
    const url = `${this.site}/?s=${encodedTerm}&paged=${pageNo}`;
    const $ = await this.getCheerio(url);
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('.entry-title a').each((i, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      if (!href || !href.startsWith(this.site)) return;
      const path = href.replace(this.site, '') || href;
      if (seen.has(path)) return;
      seen.add(path);

      if (path.includes('-capitulo-')) return;
      if (/-\d+-\d+\/?$/.test(path)) return;
      if (/(volumen|libro|arco)-\d+\/?$/.test(path)) return;

      const name = $link.text().trim();
      if (name && path) {
        novels.push({ name, path, cover: '' });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${this.site}${novelPath}`;
    const $ = await this.getCheerio(url);
    const slug = this.slugFromPath(novelPath);

    const name = $('.entry-title').first().text().trim();
    const cover =
      $('article img, .entry-content img, .post-thumbnail img')
        .first()
        .attr('src') ||
      $('article img, .entry-content img, .post-thumbnail img')
        .first()
        .attr('data-src') ||
      '';

    // Resumen: párrafos anteriores a "Leer online"
    let summary = '';
    const $content = $('.entry-content').first();
    $content.children().each((i, el) => {
      const $el = $(el);
      if ($el.is('h3') && /leer online/i.test($el.text())) {
        return false;
      }
      if ($el.is('p')) {
        summary += ($el.html() || '') + '\n';
      }
    });
    summary = summary.trim();

    const statusText = $content.text().toLowerCase();
    let status = NovelStatus.Unknown;
    if (statusText.includes('completad')) {
      status = NovelStatus.Completed;
    } else if (statusText.includes('en curso')) {
      status = NovelStatus.Ongoing;
    }

    // Autor (opcional)
    const authorMatch = $content.text().match(/Traducción[^:]*:\s*([^\n<]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : '';

    // Recopilar URLs de lotes (batches)
    const batchUrls = new Set<string>();
    $content.find('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href || !href.startsWith(this.site)) return;
      if (!href.includes(slug)) return;
      if (href.includes('-capitulo-')) return;
      if (
        href.endsWith(novelPath) ||
        href.endsWith(novelPath.replace(/\/$/, ''))
      ) {
        return;
      }
      batchUrls.add(href);
    });

    // Recopilar capítulos
    const chapterMap = new Map<string, Plugin.ChapterItem>();
    const batches = Array.from(batchUrls);

    // Si no hay lotes detectados, intentar con la propia página
    if (batches.length === 0) {
      batches.push(url);
    }

    for (const batchUrl of batches) {
      try {
        const $batch = await this.getCheerio(batchUrl);
        $batch('a').each((i, el) => {
          const href = $batch(el).attr('href');
          if (!href || !href.startsWith(this.site)) return;
          if (!href.includes(slug)) return;
          if (!href.includes('-capitulo-')) return;

          const path = href.replace(this.site, '') || href;
          if (chapterMap.has(path)) return;

          const name = $batch(el).text().trim();
          const numMatch = path.match(/capitulo-(\d+)/i);
          const chapterNumber = numMatch
            ? parseInt(numMatch[1], 10)
            : chapterMap.size + 1;

          chapterMap.set(path, {
            name,
            path,
            releaseTime: '',
            chapterNumber,
          });
        });
      } catch (e) {
        // Ignorar lotes que fallen y continuar
      }
    }

    const chapters = Array.from(chapterMap.values()).sort(
      (a, b) => a.chapterNumber - b.chapterNumber,
    );

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
    const $content = $('.entry-content').first();
    $content.find('script, style, iframe').remove();
    const html = $content.html() || '';
    if (!html.trim()) {
      throw new Error('Empty chapter, please open in webview');
    }
    return html;
  }
}

export default new AKNovelasPlugin();

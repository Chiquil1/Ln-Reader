import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import * as cheerio from 'cheerio';

class BakaTsukiESPlugin implements Plugin.PluginBase {
  id = 'bakatsuki-es';
  name = 'Baka-Tsuki (ES)';
  icon = 'src/es/bakatsuki/icon.png';
  site = 'https://www.baka-tsuki.org';
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

  private isChapterLink(href: string, text: string): boolean {
    if (!href.includes('title=')) return false;
    if (href.includes('redlink=1') || href.includes('action=edit'))
      return false;
    if (
      href.includes('Category:') ||
      href.includes('Special:') ||
      href.includes('User:') ||
      href.includes('File:')
    ) {
      return false;
    }
    return /cap[ií]tulo|pr[oó]logo|ep[ií]logo|interludio|subcap[ií]tulo|volumen/i.test(
      text,
    );
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    const url = `${this.site}/project/index.php?title=Category:Light_novel_(Spanish)`;
    const $ = await this.getCheerio(url);
    const novels: Plugin.NovelItem[] = [];
    const seen = new Set<string>();

    $('a').each((i, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      const text = $link.text().trim();
      if (!href || !href.includes('title=')) return;
      if (
        href.includes('Category:') ||
        href.includes('Special:') ||
        href.includes('redlink=1')
      )
        return;

      const path = href.startsWith('http') ? href.replace(this.site, '') : href;
      if (seen.has(path)) return;
      seen.add(path);

      // Los títulos de novelas en español suelen contener "Spanish" o "(Spanish)" o "Español"
      if (!/spanish|español/i.test(text)) return;

      if (text && path) {
        novels.push({
          name: text,
          path,
          cover: '',
        });
      }
    });

    return novels;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    const all = await this.popularNovels(1);
    const term = searchTerm.toLowerCase();
    return all.filter(novel => novel.name.toLowerCase().includes(term));
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${this.site}${novelPath}`;
    const $ = await this.getCheerio(url);

    const name =
      $('#firstHeading').first().text().trim() || $('h1').first().text().trim();

    // Resumen: primeros párrafos del contenido
    const $content = $('#mw-content-text').first();
    let summary = '';
    $content.find('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && summary.length < 1500) {
        summary += text + '\n';
      }
    });
    summary = summary.trim().slice(0, 2000);

    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();
    let chapterIndex = 0;

    $content.find('a').each((i, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      const text = $link.text().trim();
      if (!href || !this.isChapterLink(href, text)) return;

      const path = href.startsWith('http') ? href.replace(this.site, '') : href;
      if (seen.has(path)) return;
      seen.add(path);

      chapters.push({
        name: text,
        path,
        releaseTime: '',
        chapterNumber: chapterIndex + 1,
      });
      chapterIndex++;
    });

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover: '',
      summary,
      status: NovelStatus.Unknown,
      chapters,
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = `${this.site}${chapterPath}`;
    const $ = await this.getCheerio(url);

    const $content = $('#mw-content-text').first();
    $content.find('.mw-editsection, .printfooter, script, style').remove();
    $content.find('.catlinks, .navbox, .toc').remove();

    const html = $content.html() || '';
    if (!html.trim() || /There is currently no text in this page/i.test(html)) {
      throw new Error('Empty chapter, please open in webview');
    }
    return html;
  }
}

export default new BakaTsukiESPlugin();

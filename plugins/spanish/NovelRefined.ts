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
  version = '2.1.0';

  private async getCheerio(url: string): Promise<cheerio.CheerioAPI | null> {
    try {
      const res = await fetchApi(url, {
        headers: {
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) return null;
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $('title').text().trim();
      if (
        title === 'Just a moment...' ||
        title === 'Bot Verification' ||
        title === 'Attention Required! | Cloudflare'
      ) {
        return null;
      }
      return $;
    } catch {
      return null;
    }
  }

  private absUrl(src: string): string {
    if (!src) return defaultCover;
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    return `${this.site}${src.startsWith('/') ? '' : '/'}${src}`;
  }

  private nameFromSlug(path: string): string {
    const slug = path.split('/').filter(Boolean).pop() || '';
    return slug
      .replace(/-novela.*$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseNovelCards($: cheerio.CheerioAPI): Plugin.NovelItem[] {
    const map = new Map<string, Plugin.NovelItem>();

    $('a[href]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href') || '';
      if (!href.startsWith('/novela/') || href.includes('capitulo')) return;

      const path = href.replace(this.site, '') || href;
      if (!path || map.has(path)) return;

      let name = $el.text().trim();
      if (!name) {
        name =
          $el
            .find('img')
            .attr('alt')
            ?.replace('Portada de la novela ', '')
            .trim() || '';
      }
      if (!name) {
        name = this.nameFromSlug(path);
      }

      let coverRel = $el.find('img').attr('src') || '';
      if (!coverRel) {
        coverRel =
          $el.closest('.nr-novel-card').find('img').first().attr('src') || '';
      }

      map.set(path, {
        name,
        path,
        cover: coverRel ? this.absUrl(coverRel) : defaultCover,
      });
    });

    return [...map.values()];
  }

  async popularNovels(_pageNo: number): Promise<Plugin.NovelItem[]> {
    const $ = await this.getCheerio(`${this.site}/novelas/`);
    if (!$) return [];
    return this.parseNovelCards($);
  }

  async searchNovels(
    searchTerm: string,
    _pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const term = searchTerm.trim();
    if (!term) return [];

    // Una sola petición al catálogo, sin paginación infinita
    const $ = await this.getCheerio(`${this.site}/novelas/`);
    if (!$) return [];

    const all = this.parseNovelCards($);
    const tokens = this.normalize(term).split(' ').filter(Boolean);
    if (tokens.length === 0) return all;

    return all.filter(novel => {
      const slug = novel.path.split('/').filter(Boolean).pop() || '';
      const slugName = this.nameFromSlug(slug);
      const text = this.normalize(`${novel.name} ${slugName}`);
      return tokens.every(t => text.includes(t));
    });
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const $ = await this.getCheerio(`${this.site}${novelPath}`);
    if (!$) {
      return {
        path: novelPath,
        name: 'Novela',
        cover: defaultCover,
        status: NovelStatus.Unknown,
        chapters: [],
      };
    }

    const name = $('h1').first().text().trim() || 'Novela';

    const coverRel =
      $('img[src*="catalog-covers"]').first().attr('src') ||
      $('img').first().attr('src') ||
      '';
    const cover = coverRel ? this.absUrl(coverRel) : defaultCover;

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

    const chapters: Plugin.ChapterItem[] = [];
    const seen = new Set<string>();
    let chapterIndex = 0;

    const $chapters = await this.getCheerio(
      `${this.site}${novelPath}?view=chapters`,
    );
    if ($chapters) {
      $chapters('a').each((_, element) => {
        const href = $chapters(element).attr('href');
        if (!href || !href.includes('/capitulo-')) return;
        const path = href.replace(this.site, '') || href;
        if (seen.has(path)) return;
        seen.add(path);

        const chapName =
          $chapters(element).text().trim() || path.split('/').pop() || '';
        const numMatch = path.match(/capitulo-(\d+)/i);
        const chapterNumber = numMatch
          ? parseInt(numMatch[1], 10)
          : chapterIndex + 1;

        chapters.push({ name: chapName, path, releaseTime: '', chapterNumber });
        chapterIndex++;
      });
    }

    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    return {
      path: novelPath,
      name,
      cover,
      summary,
      author,
      status,
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const $ = await this.getCheerio(`${this.site}${chapterPath}`);
    if (!$) return '<p>No se pudo cargar el capítulo</p>';

    const $content = $('article.chapter-content').first();
    $content.find('script, style, iframe').remove();

    const html = $content.html() || '';
    if (!html.trim()) {
      return '<p>Capítulo vacío</p>';
    }
    return html;
  }
}

export default new NovelRefinedPlugin();

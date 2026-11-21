import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import * as cheerio from 'cheerio';

type BookEntry = {
  book_id: string;
  slug: string;
  title: string;
  title_es: string;
  title_en: string;
  author: string;
  category: string;
  category_slug_es: string;
  tags: string[];
  one_liner: string;
  description: string;
  chapters: number;
  latest_chapter: number;
  status: string;
  url: string;
  cover: string;
  language: string;
};

const PAGE_SIZE = 24;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

class NovelRefinedPlugin implements Plugin.PluginBase {
  id = 'novelrefined';
  name = 'NovelRefined';
  icon = 'src/es/novelrefined/icon.png';
  site = 'https://novelrefined.com';
  version = '3.0.0';

  private booksCache: { time: number; books: BookEntry[] } | null = null;

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

  private async getBooks(): Promise<BookEntry[]> {
    if (this.booksCache && Date.now() - this.booksCache.time < CACHE_TTL_MS) {
      return this.booksCache.books;
    }
    try {
      const res = await fetchApi(`${this.site}/data/books.json?v=20260715d`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      this.booksCache = { time: Date.now(), books: data };
      return data;
    } catch {
      return [];
    }
  }

  private absUrl(src: string): string {
    if (!src) return defaultCover;
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    return `${this.site}${src.startsWith('/') ? '' : '/'}${src}`;
  }

  private bookToNovel(b: BookEntry): Plugin.NovelItem {
    return {
      name: b.title_es || b.title || b.slug,
      path: b.url || `/novela/${b.slug}/`,
      cover: b.cover ? this.absUrl(b.cover) : defaultCover,
    };
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

  private statusFromString(s: string): NovelStatus {
    const t = s.toLowerCase();
    if (t.includes('completad') || t.includes('finalizad') || t === 'completed')
      return NovelStatus.Completed;
    if (t.includes('curso') || t.includes('activo') || t === 'ongoing')
      return NovelStatus.Ongoing;
    return NovelStatus.Unknown;
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const books = await this.getBooks();
    const start = (pageNo - 1) * PAGE_SIZE;
    if (start >= books.length) return [];
    return books.slice(start, start + PAGE_SIZE).map(b => this.bookToNovel(b));
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];
    const term = this.normalize(searchTerm);
    if (!term) return [];

    const books = await this.getBooks();
    const tokens = term.split(' ').filter(Boolean);
    if (tokens.length === 0) return [];

    return books
      .filter(b => {
        const text = this.normalize(
          `${b.title_es} ${b.title} ${b.title_en} ${b.author} ${b.tags.join(' ')}`,
        );
        return tokens.every(t => text.includes(t));
      })
      .map(b => this.bookToNovel(b));
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    // Buscar metadatos en el catálogo
    const books = await this.getBooks();
    const slug = novelPath.replace(/^\/novela\//, '').replace(/\/$/, '');
    const meta = books.find(b => b.slug === slug || b.url === novelPath);

    const name = meta ? meta.title_es || meta.title : 'Novela';
    const cover = meta && meta.cover ? this.absUrl(meta.cover) : defaultCover;
    const summary = meta ? meta.description || meta.one_liner : '';
    const author = meta ? meta.author : '';
    const status = meta
      ? this.statusFromString(meta.status)
      : NovelStatus.Unknown;

    // Obtener capítulos del HTML
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

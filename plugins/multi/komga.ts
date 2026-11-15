import { fetchApi } from '@libs/fetch';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { NovelStatus } from '@libs/novelStatus';
import { Plugin } from '@/types/plugin';
import { load as parseHTML } from 'cheerio';
import { storage } from '@libs/storage';

type Author = {
  name: string;
  role: string;
};

type TocItem = {
  title?: string;
  href?: string;
  children?: TocItem[];
};

type SeriesResponse = {
  id: string;
  name: string;
  metadata: {
    status: string;
    genres: string[];
  };
  booksMetadata: {
    authors: Author[];
    summary: string;
  };
};

type BookResponse = {
  id: string;
  metadata: {
    title: string;
  };
};

type BookManifest = {
  toc: TocItem[];
  readingOrder: { href: string }[];
};

class KomgaPlugin implements Plugin.PluginBase {
  id = 'komga';
  name = 'Komga';
  icon = 'src/multi/komga/icon.png';
  version = '1.1.0';

  rawSite = (storage.get('url') as string) || '';
  email = (storage.get('email') as string) || '';
  password = (storage.get('password') as string) || '';

  get site(): string {
    const url = this.rawSite.trim().replace(/\/+$/, '');
    return url ? url + '/' : '';
  }

  private ensureConfigured(): void {
    if (!this.site) {
      throw new Error(
        'Komga: URL not set. Open plugin settings and enter your Komga server URL.',
      );
    }
    if (!this.email || !this.password) {
      throw new Error(
        'Komga: email or password not set. Open plugin settings and save your credentials, then restart the app.',
      );
    }
  }

  private parseJson<T>(body: string, context: string): T {
    try {
      return JSON.parse(body) as T;
    } catch {
      const snippet = body.slice(0, 120).replace(/\s+/g, ' ');
      throw new Error(
        `Komga: invalid JSON from ${context}. Response: ${snippet}`,
      );
    }
  }

  async makeRequest(url: string, context = url): Promise<string> {
    this.ensureConfigured();

    let res: Response;
    try {
      res = await fetchApi(url, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=utf-8',
          'Authorization': `Basic ${this.btoa(this.email + ':' + this.password)}`,
          'Referer': this.site,
        },
      });
    } catch (e) {
      throw new Error(
        `Komga: cannot reach ${this.site} (${e instanceof Error ? e.message : e}). Check the URL and your network.`,
      );
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Komga: unauthorized (HTTP ' +
            res.status +
            '). Check your email and password in plugin settings.',
        );
      }
      if (res.status === 404) {
        throw new Error(`Komga: not found (HTTP 404) at ${context}`);
      }
      throw new Error(`Komga: server error (HTTP ${res.status}) at ${context}`);
    }

    return await res.text();
  }

  btoa(input = '') {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const str = input;
    let output = '';

    for (
      let block = 0, charCode, i = 0, map = chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));

      if (charCode > 0xff) {
        throw new Error(
          "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.",
        );
      }

      block = (block << 8) | charCode;
    }

    return output;
  }

  flattenArray(arr: TocItem[]): TocItem[] {
    return arr.reduce((acc: TocItem[], obj: TocItem) => {
      const { children, ...rest } = obj;
      acc.push(rest);

      if (children) {
        const nested = this.flattenArray(children);
        for (const n of nested) {
          acc.push(n);
        }
      }

      return acc;
    }, []);
  }

  async getSeries(url: string): Promise<Plugin.NovelItem[]> {
    const response = await this.makeRequest(url, 'series list');
    const data = this.parseJson<{ content?: SeriesResponse[] }>(
      response,
      'series list',
    );

    const series = data.content;
    if (!Array.isArray(series)) {
      throw new Error(
        'Komga: unexpected response for series list (no content array).',
      );
    }

    const novels: Plugin.NovelItem[] = [];
    for (const s of series) {
      novels.push({
        name: s.name,
        path: 'api/v1/series/' + s.id,
        cover: this.site + `api/v1/series/${s.id}/thumbnail`,
      });
    }

    return novels;
  }

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    this.ensureConfigured();

    const read_status = filters?.read_status.value
      ? '&read_status=' + filters?.read_status.value
      : '';
    const status = filters?.status.value
      ? '&status=' + filters?.status.value
      : '';
    const sort = showLatestNovels ? 'lastModified,desc' : 'name,asc';

    const url = `${this.site}api/v1/series?page=${pageNo - 1}${read_status}${status}&sort=${sort}`;

    return await this.getSeries(url);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    this.ensureConfigured();

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: 'Untitled',
    };

    const url = this.site + novelPath;
    const response = await this.makeRequest(url, 'series details');
    const series = this.parseJson<SeriesResponse>(response, 'series details');

    novel.name = series.name;
    novel.author = (series.booksMetadata?.authors || [])
      .filter((author: Author) => author.role === 'writer')
      .reduce(
        (accumulated: string, current: Author) =>
          accumulated + (accumulated !== '' ? ', ' : '') + current.name,
        '',
      );
    novel.cover = this.site + `api/v1/series/${series.id}/thumbnail`;
    novel.genres = (series.metadata?.genres || []).join(', ');

    switch (series.metadata?.status) {
      case 'ENDED':
        novel.status = NovelStatus.Completed;
        break;
      case 'ONGOING':
        novel.status = NovelStatus.Ongoing;
        break;
      case 'ABANDONED':
        novel.status = NovelStatus.Cancelled;
        break;
      case 'HIATUS':
        novel.status = NovelStatus.OnHiatus;
        break;
      default:
        novel.status = NovelStatus.Unknown;
    }

    novel.summary = series.booksMetadata?.summary || '';

    const chapters: Plugin.ChapterItem[] = [];

    const booksResponse = await this.makeRequest(
      this.site + `api/v1/series/${series.id}/books?unpaged=true`,
      'books list',
    );
    const booksDataParsed = this.parseJson<{ content?: BookResponse[] }>(
      booksResponse,
      'books list',
    );
    const booksData = Array.isArray(booksDataParsed.content)
      ? booksDataParsed.content
      : [];

    for (const book of booksData) {
      const bookManifestResponse = await this.makeRequest(
        this.site + `opds/v2/books/${book.id}/manifest`,
        `manifest for ${book.metadata?.title || book.id}`,
      );

      const bookManifest = this.parseJson<BookManifest>(
        bookManifestResponse,
        `manifest for ${book.metadata?.title || book.id}`,
      );

      const toc = this.flattenArray(bookManifest.toc || []);
      const readingOrder = bookManifest.readingOrder || [];

      let i = 1;
      for (const page of readingOrder) {
        const tocItem = toc.find(
          (v: TocItem) => v.href?.split('#')[0] === page.href,
        );
        const title = tocItem ? tocItem.title : null;
        chapters.push({
          name: `${i}/${readingOrder.length} - ${book.metadata?.title || 'Book'}${title ? ' - ' + title : ''}`,
          path: 'opds/v2' + page.href?.split('opds/v2').pop(),
        });
        i++;
      }
    }

    novel.chapters = chapters;
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const chapterText = await this.makeRequest(
      this.site + chapterPath,
      'chapter',
    );
    return this.addUrlToImageHref(
      chapterText,
      this.site + chapterPath.split('/').slice(0, -1).join('/') + '/',
    );
  }

  // Convert images to <img> tag and correct url
  addUrlToImageHref(htmlString: string, baseUrl: string): string {
    const $ = parseHTML(htmlString, { xmlMode: true });

    // Convert SVG <image> elements to <img> and add baseUrl if necessary
    $('svg image').each((_, image) => {
      const href = $(image).attr('href') || $(image).attr('xlink:href');
      const width = $(image).attr('width');
      const height = $(image).attr('height');

      if (href) {
        const img = $('<img />').attr({
          src: new URL(href, baseUrl).href,
          width: width || '',
          height: height || '',
        });
        $(image).closest('svg').replaceWith(img);
      }
    });

    // Update <img> elements to include the base URL if their src is relative
    $('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && !src.startsWith('http')) {
        $(img).attr('src', `${baseUrl}${src}`);
      }
    });

    // Replace <a> tags with the text inside so its not blue
    $('a').each((_, a) => {
      $(a).replaceWith($(a).text());
    });

    return $.xml();
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    this.ensureConfigured();

    const url = `${this.site}api/v1/series?search=${encodeURIComponent(searchTerm)}&page=${pageNo - 1}`;

    return await this.getSeries(url);
  }

  filters = {
    status: {
      value: '',
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Completed', value: NovelStatus.Completed },
        { label: 'Ongoing', value: NovelStatus.Ongoing },
        { label: 'Cancelled', value: NovelStatus.Cancelled },
        { label: 'OnHiatus', value: NovelStatus.OnHiatus },
      ],
      type: FilterTypes.Picker,
    },
    read_status: {
      value: '',
      label: 'Read status',
      options: [
        { label: 'All', value: '' },
        { label: 'Unread', value: 'UNREAD' },
        { label: 'Read', value: 'READ' },
        { label: 'In progress', value: 'IN_PROGRESS' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;

  pluginSettings = {
    email: {
      value: '',
      label: 'Email',
      type: 'Text',
    },
    password: {
      value: '',
      label: 'Password',
    },
    url: {
      value: '',
      label: 'URL',
    },
  };
}

export default new KomgaPlugin();

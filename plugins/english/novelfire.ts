import { CheerioAPI, load } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { defaultCover } from '@libs/defaultCover';
import { storage } from '@libs/storage';

class NovelFire implements Plugin.PluginBase {
  id = 'novelfire';
  name = 'Novel Fire';
  version = '1.4.10';
  icon = 'src/en/novelfire/icon.png';
  site = 'https://novelfire.net/';
  webStorageUtilized = true;
  novelList = new Set<string>();
  draw = 0;

  pluginSettings = {
    pageLength: {
      value: '',
      label: 'Page Mode (Change if Broken)',
      type: 'Switch',
    },
    singlePage: {
      value: '',
      label:
        'Force load all chapters on a single page (Slower & use more data)',
      type: 'Switch',
    },
  };
  singlePage = storage.get('singlePage');
  pageLength = storage.get('pageLength');

  async getCheerio(url: string, search: boolean): Promise<CheerioAPI> {
    const r = await fetchApi(url);
    if (!r.ok && search != true)
      throw new Error(
        'Could not reach site (' + r.status + ') try to open in webview.',
      );
    const $ = load(await r.text());

    if ($('title').text().includes('Cloudflare')) {
      throw new Error('Cloudflare is blocking requests. Try again later.');
    }

    return $;
  }

  parseNovels(
    loadedCheerio: CheerioAPI,
    selector = '.novel-item',
    isFirstPage = false,
  ): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    const elements = loadedCheerio(selector).toArray();
    for (const el of elements) {
      const $el = loadedCheerio(el);

      const novelName =
        $el.find('a').attr('title') ?? $el.find('h4').text().trim();
      const novelPath =
        $el.children('a').attr('href') ?? $el.find('h4 a').attr('href');

      if (!novelPath) continue;

      const path = new URL(novelPath, this.site).pathname.substring(1);

      if (!isFirstPage) {
        if (this.novelList.has(path)) continue;
        this.novelList.add(path);
      } else {
        this.novelList.add(path);
      }

      const imgElement = $el.find('.novel-cover > img');
      const rawSrc = imgElement.attr('data-src') ?? imgElement.attr('src');
      const novelCover = rawSrc
        ? new URL(rawSrc, this.site).href
        : defaultCover;

      novels.push({
        name: novelName,
        cover: novelCover,
        path,
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
    if (pageNo === 1) {
      this.novelList.clear();
      this.draw = 0;
    }

    const url = this.site + 'search-adv';
    const params = new URLSearchParams();

    for (const language of filters.language.value) {
      params.append('country_id[]', language);
    }
    params.append('ctgcon', filters.genre_operator.value);
    for (const genre of filters.genres.value) {
      params.append('categories[]', genre);
    }
    params.append('totalchapter', filters.chapters.value);
    params.append('ratcon', filters.rating_operator.value);
    params.append('rating', filters.rating.value);
    params.append('status', filters.status.value);
    params.append('sort', showLatestNovels ? 'date' : filters.sort.value);
    params.append('tagcon', 'and');
    params.append('page', pageNo.toString());

    const loadedCheerio = await this.getCheerio(
      `${url}?${params.toString()}`,
      false,
    );

    return this.parseNovels(loadedCheerio, '.novel-item', pageNo === 1);
  }

  async getAllChapters(
    novelPath: string,
    post_id: string,
    page: string,
  ): Promise<Plugin.ChapterItem[]> {
    const length = this.pageLength ? 100 : -1;
    const url = `${this.site}ajax/listChapterDataAjax`;
    const start = length === -1 ? 0 : (parseInt(page) - 1) * length;
    this.draw++;
    const params = new URLSearchParams({
      'options': { 'versionIncrements': 70 },
      draw: this.draw.toString(),
      'columns[0][data]': 'n_sort',
      'columns[0][name]': 'cmm_posts_detail.n_sort',
      'columns[0][searchable]': 'true',
      'columns[0][orderable]': 'true',
      'columns[0][search][value]': '',
      'columns[0][search][regex]': 'false',

      'columns[1][data]': 'bookmark_created_at',
      'columns[1][name]': 'bookmark_chapters.created_at',
      'columns[1][searchable]': 'false',
      'columns[1][orderable]': 'true',
      'columns[1][search][value]': '',
      'columns[1][search][regex]': 'false',

      'order[0][column]': '0',
      'order[0][dir]': 'asc',
      'order[0][name]': 'cmm_posts_detail.n_sort',

      start: start.toString(),
      length: length.toString(),
      'search[value]': '',
      'search[regex]': 'false',
      post_id: post_id,
      only_bookmark: 'false',
      _: Date.now().toString(),
    });

    const result = await fetchApi(`${url}?${params.toString()}`);
    if (result.status === 429) throw new NovelFireThrottlingError();

    const body = await result.text();
    if (body.includes('You are being rate limited'))
      throw new NovelFireThrottlingError();
    if (body.includes('Page Not Found 404')) throw new NovelFireAjaxNotFound();

    return (JSON.parse(body).data || [])
      .flatMap(
        (idx: { title?: string; slug: string; n_sort: string | number }) => {
          const name = load(idx.title || idx.slug)
            .text()
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .trim();
          const num = Number(idx.n_sort);

          return name && !isNaN(num)
            ? [
                {
                  name,
                  path: `${novelPath}/chapter-${num}`,
                  chapterNumber: num,
                },
              ]
            : [];
        },
      )
      .sort(
        (a: Plugin.ChapterItem, b: Plugin.ChapterItem) =>
          (a.chapterNumber || 0) - (b.chapterNumber || 0),
      );
  }

  async getAllChaptersForce(
    novelPath: string,
    pages: number,
  ): Promise<Plugin.ChapterItem[]> {
    const pagesArray = Array.from({ length: pages }, (_, i) => i + 1);
    const allChapters: Plugin.ChapterItem[] = [];

    // When pages > ~30, we get rate limited. To mitigate, split into chunks and retry chunk on rate limit with delay.
    const chunkSize = 5; // 5 pages per chunk was tested to be a good balance between speed and rate limiting.
    const retryCount = 10;

    const chaptersArray: Plugin.SourcePage[] = [];

    for (let i = 0; i < pagesArray.length; i += chunkSize) {
      const pagesArrayChunk = pagesArray.slice(i, i + chunkSize);

      const firstPage = pagesArrayChunk[0];
      const lastPage = pagesArrayChunk[pagesArrayChunk.length - 1];

      let attempt = 0;

      while (attempt < retryCount) {
        try {
          // Parse all pages in chunk in parallel
          const chaptersArrayChunk = await Promise.all(
            pagesArrayChunk.map(page =>
              this.parsePage(novelPath, page.toString()),
            ),
          );

          chaptersArray.push(...chaptersArrayChunk);
          break;
        } catch (err) {
          if (err instanceof NovelFireThrottlingError) {
            attempt += 1;
            console.warn(
              `[pages=${firstPage}-${lastPage}] Novel Fire is rate limiting requests. Retry attempt ${attempt + 1}...`,
            );
            if (attempt === retryCount) {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    }

    // Merge all chapters into a single array
    for (const page of chaptersArray) {
      if (page.chapters) {
        for (const chapter of page.chapters) {
          allChapters.push(chapter);
        }
      }
    }
    return allChapters;
  }

  async parseNovel(
    novelPath: string,
  ): Promise<Plugin.SourceNovel & { totalPages: number }> {
    this.draw = 0;
    const $ = await this.getCheerio(this.site + novelPath, false);
    const baseUrl = this.site;

    const post_id = $('#novel-report').attr('report-post_id');
    if (post_id) {
      storage.set(`${this.id}_${novelPath.split('/').pop()}`, post_id);
    }

    const novel: Partial<Plugin.SourceNovel & { totalPages: number }> = {
      path: novelPath,
      totalPages: 1,
    };

    novel.name =
      $('.novel-title').text().trim() ??
      $('.cover > img').attr('alt') ??
      'No Titled Found';
    const coverUrl =
      $('.cover > img').attr('data-src') ?? $('.cover > img').attr('src');

    if (coverUrl) {
      novel.cover = new URL(coverUrl, baseUrl).href;
    } else {
      novel.cover = defaultCover;
    }

    novel.genres = $('.categories .property-item')
      .map((_, el) => $(el).text())
      .toArray()
      .join(',');

    const summary = $('.summary .content');
    summary.find('.expand').remove();
    summary.find('br').replaceWith('\n');
    summary.find('p').before('\n').after('\n\n');

    novel.summary =
      summary
        .text()
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        ?.replace(/\n{3,}/g, '\n\n')
        .trim() || 'Summary Not Found';

    novel.author = $('.author .property-item > span').text();

    const rawStatus =
      $('.header-stats .ongoing').text() ||
      $('.header-stats .completed').text() ||
      'Unknown';
    const map: Record<string, string> = {
      ongoing: NovelStatus.Ongoing,
      hiatus: NovelStatus.OnHiatus,
      dropped: NovelStatus.Cancelled,
      cancelled: NovelStatus.Cancelled,
      completed: NovelStatus.Completed,
      unknown: NovelStatus.Unknown,
    };
    novel.status = map[rawStatus.toLowerCase()] ?? NovelStatus.Unknown;

    novel.rating = parseFloat($('.nub').text().trim());

    const totalChapters = $('.header-stats i.icon-book-open')
      .parent()
      .text()
      .trim();
    const length = this.pageLength ? 100 : -1;
    novel.totalPages =
      length === -1 ? 1 : Math.ceil(parseInt(totalChapters) / length) || 1;
    if (post_id) {
      try {
        novel.chapters = await this.getAllChapters(novelPath, post_id, '1');
      } catch (e) {
        // ignore, app will paginate
      }
    }
    if (length === 100 && this.singlePage) {
      novel.chapters = await this.getAllChaptersForce(
        novel.path as string,
        novel.totalPages,
      );
      novel.totalPages = 1;
    }

    return novel as Plugin.SourceNovel & { totalPages: number };
  }

  async parsePage(novelPath: string, page: string): Promise<Plugin.SourcePage> {
    let post_id = storage.get(`${this.id}_${novelPath.split('/').pop()}`);

    if (!post_id || isNaN(Number(post_id))) {
      try {
        const $ = await this.getCheerio(this.site + novelPath, false);
        const fetched = $('#novel-report').attr('report-post_id');
        if (fetched) {
          post_id = fetched;
          storage.set(`${this.id}_${novelPath.split('/').pop()}`, post_id);
        }
      } catch (e) {
        // ignore
      }
    }

    if (post_id && !isNaN(Number(post_id))) {
      try {
        const chapters = await this.getAllChapters(
          novelPath,
          String(post_id),
          page,
        );
        return { chapters };
      } catch (e) {
        // Fallback to scraping if AJAX fails
      }
    }

    // Fallback only works for multiples of 100
    const length = this.pageLength ? 100 : -1;
    if (length === 100) {
      const url = `${this.site}${novelPath}/chapters?page=${page}`;
      const result = await fetchApi(url);
      const body = await result.text();

      const loadedCheerio = load(body);

      const chapters = loadedCheerio('.chapter-list li')
        .map((_, ele) => {
          const chapterName =
            loadedCheerio(ele).find('a').attr('title') || 'No Title Found';
          const chapterPath = loadedCheerio(ele).find('a').attr('href');

          if (!chapterPath) return null;

          return {
            name: chapterName,
            path: new URL(chapterPath, this.site).pathname.substring(1),
          };
        })
        .get()
        .filter(chapter => chapter !== null) as Plugin.ChapterItem[];

      return {
        chapters,
      };
    }

    return {
      chapters: [],
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath;
    const loadedCheerio = await this.getCheerio(url, false);

    const chapterText = loadedCheerio('#content');
    const odds = chapterText.find(
      ':not(p, h1, span, i, b, u, img, a, div, strong)',
    );
    for (const ele of odds.toArray()) {
      const tag = ele.name.toString();
      if (tag.length > 5 && ele.name.toString().substring(0, 1) == 'nf') {
        loadedCheerio(ele).remove();
      }
    }

    return chapterText.html()?.replace(/&nbsp;/g, ' ') || '';
  }

  async searchNovels(
    searchTerm: string,
    page: number,
  ): Promise<Plugin.NovelItem[]> {
    // Fetch every page so the user sees all matches instead of just the first 20.
    // The app may call with page 0 or 1 for the first request.
    if (page > 1) {
      return [];
    }
    this.novelList.clear();
    this.draw = 0;

    const allNovels: Plugin.NovelItem[] = [];
    let currentPage = 1;
    let hasMore = true;
    while (hasMore) {
      const params = new URLSearchParams();
      params.append('keyword', searchTerm);
      params.append('page', currentPage.toString());
      const url = `${this.site}search?${params.toString()}`;
      const result = await fetchApi(url);
      const body = await result.text();

      const loadedCheerio = load(body);

      const pageNovels = this.parseNovels(
        loadedCheerio,
        '.novel-list.chapters .novel-item',
        currentPage === 1,
      );

      if (!pageNovels.length) {
        hasMore = false;
        break;
      }
      allNovels.push(...pageNovels);

      // Stop when there is no "next page" link.
      const hasNext =
        loadedCheerio('a[href*="page=' + (currentPage + 1) + '"]').length > 0 ||
        loadedCheerio('.pagination a')
          .toArray()
          .some(el => {
            const href = loadedCheerio(el).attr('href') || '';
            return href.includes('page=' + (currentPage + 1));
          });
      if (!hasNext) {
        hasMore = false;
      } else {
        currentPage += 1;
      }
      // Safety cap to avoid runaway loops.
      if (currentPage > 50) hasMore = false;
    }

    // If the site search returned nothing (e.g. a Spanish query that did not
    // translate well), fall back to the popular list so the (translated)
    // titles can still be filtered by the user's original query.
    if (allNovels.length === 0 && page <= 1) {
      const fallback: Plugin.NovelItem[] = [];
      for (let p = 1; p <= 5; p++) {
        try {
          const more = await this.popularNovels(p, {
            showLatestNovels: false,
            filters: this.filters,
          });
          if (!Array.isArray(more) || !more.length) break;
          fallback.push(...more);
        } catch (e) {
          break;
        }
      }
      if (fallback.length) return fallback;
    }

    return allNovels;
  }

  filters = {
    sort: {
      label: 'Sort Results By',
      value: 'rank-top',
      options: [
        { label: 'Rank (Top)', value: 'rank-top' },
        { label: 'Rating Score (Top)', value: 'rating-score-top' },
        { label: 'Review Count (Most)', value: 'review' },
        { label: 'Comment Count (Most)', value: 'comment' },
        { label: 'Bookmark Count (Most)', value: 'bookmark' },
        { label: 'Today Views (Most)', value: 'today-view' },
        { label: 'Monthly Views (Most)', value: 'monthly-view' },
        { label: 'Total Views (Most)', value: 'total-view' },
        { label: 'Title (A>Z)', value: 'abc' },
        { label: 'Title (Z>A)', value: 'cba' },
        { label: 'Last Updated (Newest)', value: 'date' },
        { label: 'Chapter Count (Most)', value: 'chapter-count-most' },
      ],
      type: FilterTypes.Picker,
    },
    status: {
      label: 'Translation Status',
      value: '-1',
      options: [
        { label: 'All', value: '-1' },
        { label: 'Completed', value: '1' },
        { label: 'Ongoing', value: '0' },
      ],
      type: FilterTypes.Picker,
    },
    genre_operator: {
      label: 'Genres (And/Or/Exclude)',
      value: 'and',
      options: [
        { label: 'AND', value: 'and' },
        { label: 'OR', value: 'or' },
        { label: 'EXCLUDE', value: 'exclude' },
      ],
      type: FilterTypes.Picker,
    },
    genres: {
      label: 'Genres',
      value: [],
      options: [
        { label: 'Action', value: '3' },
        { label: 'Adult', value: '28' },
        { label: 'Adventure', value: '4' },
        { label: 'Anime', value: '46' },
        { label: 'Arts', value: '47' },
        { label: 'Comedy', value: '5' },
        { label: 'Drama', value: '24' },
        { label: 'Eastern', value: '44' },
        { label: 'Ecchi', value: '26' },
        { label: 'Fan-fiction', value: '48' },
        { label: 'Fantasy', value: '6' },
        { label: 'Game', value: '19' },
        { label: 'Gender Bender', value: '25' },
        { label: 'Harem', value: '7' },
        { label: 'Historical', value: '12' },
        { label: 'Horror', value: '37' },
        { label: 'Isekai', value: '49' },
        { label: 'Josei', value: '2' },
        { label: 'Lgbt+', value: '45' },
        { label: 'Magic', value: '50' },
        { label: 'Magical Realism', value: '51' },
        { label: 'Manhua', value: '52' },
        { label: 'Martial Arts', value: '15' },
        { label: 'Mature', value: '8' },
        { label: 'Mecha', value: '34' },
        { label: 'Military', value: '53' },
        { label: 'Modern Life', value: '54' },
        { label: 'Movies', value: '55' },
        { label: 'Mystery', value: '16' },
        { label: 'Other', value: '64' },
        { label: 'Psychological', value: '9' },
        { label: 'Realistic Fiction', value: '56' },
        { label: 'Reincarnation', value: '43' },
        { label: 'Romance', value: '1' },
        { label: 'School Life', value: '21' },
        { label: 'Sci-fi', value: '20' },
        { label: 'Seinen', value: '10' },
        { label: 'Shoujo', value: '38' },
        { label: 'Shoujo Ai', value: '57' },
        { label: 'Shounen', value: '17' },
        { label: 'Shounen Ai', value: '39' },
        { label: 'Slice of Life', value: '13' },
        { label: 'Smut', value: '29' },
        { label: 'Sports', value: '42' },
        { label: 'Supernatural', value: '18' },
        { label: 'System', value: '58' },
        { label: 'Tragedy', value: '32' },
        { label: 'Urban', value: '63' },
        { label: 'Urban Life', value: '59' },
        { label: 'Video Games', value: '60' },
        { label: 'War', value: '61' },
        { label: 'Wuxia', value: '31' },
        { label: 'Xianxia', value: '23' },
        { label: 'Xuanhuan', value: '22' },
        { label: 'Yaoi', value: '14' },
        { label: 'Yuri', value: '62' },
      ],
      type: FilterTypes.CheckboxGroup,
    },
    language: {
      label: 'Language',
      value: [],
      options: [
        { label: 'Chinese', value: '1' },
        { label: 'Korean', value: '2' },
        { label: 'Japanese', value: '3' },
        { label: 'English', value: '4' },
      ],
      type: FilterTypes.CheckboxGroup,
    },
    rating_operator: {
      label: 'Rating (Min/Max)',
      value: 'min',
      options: [
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
      ],
      type: FilterTypes.Picker,
    },
    rating: {
      label: 'Rating',
      value: '0',
      options: [
        { label: 'All', value: '0' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
      ],
      type: FilterTypes.Picker,
    },
    chapters: {
      label: 'Chapters',
      value: '0',
      options: [
        { label: 'All', value: '0' },
        { label: '<50', value: '1,49' },
        { label: '50-100', value: '50,100' },
        { label: '100-200', value: '100,200' },
        { label: '200-500', value: '200,500' },
        { label: '500-1000', value: '500,1000' },
        { label: '>1000', value: '1001,1000000' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;
}

const plugin = new NovelFire();

/* __ENTranslationInjected v2 */
import { fetchApi as __translatorFetch } from '@libs/fetch';
import { load as __translatorParse } from 'cheerio';
import { storage as __translatorStorage } from '@libs/storage';

const __ENTranslation = (function () {
  const CFG = {
    enabled: true,
    targetLang: 'es',
    sourceLang: 'auto',
    maxBatchChars: 1600,
    maxConcurrent: 4,
    translateNovelNames: true,
    translateSummaries: true,
    translateChapterNames: true,
    maxChapterNames: 5000,
    translateContent: true,
    translateQuery: true,
    initialPrefetch: 7,
    prefetchAhead: 10,
    cacheMaxEntries: 100,
    maxIndexedNovels: 5,
  };
  const providers = ['google', 'google_repeated', 'mymemory', 'libretranslate'];
  const providerMaxChars = {
    google: 2000,
    google_repeated: 1800,
    mymemory: 420,
    libretranslate: 1800,
  };
  const cache = new Map();
  const inflight = new Map();
  const MAP_KEY = 'es3:map';
  const ORDER_KEY = 'es3:order';
  const CH_PREFIX = 'es3:ch:';
  let map = null;
  let order = null;
  let stateReady = false;
  let chainToken = 0;
  let origParseChapter = null;
  let active = 0;
  const queue = [];
  const norm = s =>
    String(s || '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\r/g, '')
      .trim();
  const guard = fn =>
    new Promise((resolve, reject) => {
      const start = () => {
        active += 1;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            const next = queue.shift();
            if (next) next();
          });
      };
      if (active < CFG.maxConcurrent) start();
      else queue.push(start);
    });
  const buildUrl = (provider, text, sl, tl) => {
    const enc = encodeURIComponent(text);
    const src = provider === 'mymemory' && sl === 'auto' ? 'en' : sl;
    if (provider === 'google_repeated') {
      return (
        'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
        src +
        '&tl=' +
        tl +
        '&q=' +
        enc
      );
    }
    if (provider === 'mymemory') {
      return (
        'https://api.mymemory.translated.net/get?q=' +
        enc +
        '&langpair=' +
        src +
        '|' +
        tl
      );
    }
    if (provider === 'libretranslate') {
      return (
        'https://libretranslate.de/translate?q=' +
        enc +
        '&source=' +
        (sl === 'auto' ? 'en' : sl) +
        '&target=' +
        tl +
        '&format=text'
      );
    }
    return (
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
      sl +
      '&tl=' +
      tl +
      '&dt=t&q=' +
      enc
    );
  };
  const extract = (json, provider) => {
    try {
      if (provider === 'google') {
        if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
          return json[0]
            .map(item => (Array.isArray(item) ? item[0] : null))
            .filter(Boolean)
            .join('');
        }
      } else if (provider === 'google_repeated') {
        if (Array.isArray(json) && typeof json[0] === 'string') {
          return json[0];
        }
      } else if (provider === 'mymemory') {
        if (
          json &&
          json.responseStatus === 200 &&
          json.responseData &&
          typeof json.responseData.translatedText === 'string'
        ) {
          return json.responseData.translatedText;
        }
      } else if (provider === 'libretranslate') {
        if (json && typeof json.translatedText === 'string') {
          return json.translatedText;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };
  async function translateText(text, target, source) {
    const t = norm(text);
    if (!t) return '';
    const tl = target || CFG.targetLang;
    const sl = source || CFG.sourceLang;
    const ck = sl + ':' + tl + ':' + t;
    if (cache.has(ck)) return cache.get(ck);
    for (const provider of providers) {
      try {
        const cap = providerMaxChars[provider] || Infinity;
        if (t.length > cap) continue;
        const res = await __translatorFetch(buildUrl(provider, t, sl, tl));
        if (!res || !res.ok) continue;
        const json = await res.json();
        const out = extract(json, provider);
        if (typeof out === 'string' && out) {
          cache.set(ck, out);
          return out;
        }
      } catch (e) {
        // probar siguiente proveedor
      }
    }
    return text;
  }
  function ensureState() {
    if (stateReady) return;
    stateReady = true;
    try {
      const saved = __translatorStorage.get(MAP_KEY);
      if (saved && typeof saved === 'object' && saved.novels && saved.c2n) {
        map = saved;
      }
    } catch (e) {}
    if (!map) map = { novels: {}, c2n: {} };
    try {
      const savedOrder = __translatorStorage.get(ORDER_KEY);
      if (Array.isArray(savedOrder)) order = savedOrder;
    } catch (e) {}
    if (!order) order = [];
  }
  function persistMap() {
    try {
      __translatorStorage.set(MAP_KEY, map);
    } catch (e) {}
  }
  function persistOrder() {
    try {
      __translatorStorage.set(ORDER_KEY, order);
    } catch (e) {}
  }
  function getCached(path) {
    if (!path) return null;
    try {
      const v = __translatorStorage.get(CH_PREFIX + path);
      if (typeof v === 'string' && v) return v;
    } catch (e) {}
    return null;
  }
  function setCached(path, html) {
    if (!path || !html) return;
    try {
      __translatorStorage.set(CH_PREFIX + path, html);
      const at = order.indexOf(path);
      if (at >= 0) order.splice(at, 1);
      order.push(path);
      while (order.length > CFG.cacheMaxEntries) {
        const evicted = order.shift();
        if (evicted) {
          try {
            __translatorStorage.delete(CH_PREFIX + evicted);
          } catch (e) {}
        }
      }
      persistOrder();
    } catch (e) {}
  }
  function indexNovel(novelPath, chapters) {
    ensureState();
    const paths = [];
    if (Array.isArray(chapters)) {
      for (let i = 0; i < chapters.length; i++) {
        const c = chapters[i];
        if (c && typeof c.path === 'string' && c.path) paths.push(c.path);
      }
    }
    const keys = Object.keys(map.novels);
    if (keys.indexOf(novelPath) === -1) {
      while (keys.length >= CFG.maxIndexedNovels) {
        const oldKey = keys.shift();
        delete map.novels[oldKey];
        const c2nKeys = Object.keys(map.c2n);
        for (let i = 0; i < c2nKeys.length; i++) {
          const entry = map.c2n[c2nKeys[i]];
          if (entry && entry.n === oldKey) delete map.c2n[c2nKeys[i]];
        }
      }
    }
    map.novels[novelPath] = paths;
    for (let i = 0; i < paths.length; i++) {
      map.c2n[paths[i]] = { n: novelPath, i: i };
    }
    persistMap();
  }
  async function translateLines(values) {
    const clean = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      clean.push(typeof v === 'string' ? v.replace(/\n/g, ' ').trim() : '');
    }
    const batches = [];
    let current = null;
    let len = 0;
    for (let i = 0; i < clean.length; i++) {
      const line = clean[i];
      if (!line) continue;
      if (!current || len + 1 + line.length > CFG.maxBatchChars) {
        current = { idxs: [], texts: [] };
        batches.push(current);
        len = 0;
      }
      current.idxs.push(i);
      current.texts.push(line);
      len += 1 + line.length;
    }
    const results = await Promise.all(
      batches.map(batch =>
        guard(() => {
          const joined = batch.texts.join('\n');
          return translateText(joined).then(t => ({ batch: batch, text: t }));
        }),
      ),
    );
    const out = clean.slice();
    for (const result of results) {
      const batch = result.batch;
      const text = result.text;
      if (!text || !text.trim()) continue;
      const parts = text.split('\n');
      if (parts.length === batch.texts.length) {
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].trim()) out[batch.idxs[i]] = parts[i];
        }
      } else if (batch.texts.length <= 8) {
        for (let i = 0; i < batch.texts.length; i++) {
          try {
            const one = await translateText(batch.texts[i]);
            if (one && one.trim()) out[batch.idxs[i]] = one;
          } catch (e) {}
        }
      }
    }
    return out;
  }
  async function translateNovelItems(items) {
    if (!Array.isArray(items) || !items.length) return items;
    try {
      const names = items.map(item =>
        item && typeof item.name === 'string' ? item.name : '',
      );
      const translated = await translateLines(names);
      return items.map((item, i) => ({
        ...item,
        name: translated[i] && translated[i].trim() ? translated[i] : item.name,
      }));
    } catch (e) {
      return items;
    }
  }
  async function translateChapterNames(chapters) {
    const capped = Array.isArray(chapters)
      ? chapters.slice(0, CFG.maxChapterNames)
      : [];
    if (!capped.length) return [];
    try {
      const names = capped.map(ch =>
        ch && typeof ch.name === 'string' ? ch.name : '',
      );
      const translated = await translateLines(names);
      return capped.map((ch, i) => ({
        ...ch,
        name: translated[i] && translated[i].trim() ? translated[i] : ch.name,
      }));
    } catch (e) {
      return capped;
    }
  }
  async function translateSourceNovel(novel) {
    try {
      const updated = { ...novel };
      if (CFG.translateNovelNames && typeof updated.name === 'string') {
        const name = await translateText(updated.name);
        if (name && name.trim()) updated.name = name;
      }
      if (
        CFG.translateSummaries &&
        typeof updated.summary === 'string' &&
        updated.summary
      ) {
        const summary = await translateText(updated.summary);
        if (summary && summary.trim()) updated.summary = summary;
      }
      if (CFG.translateChapterNames && Array.isArray(updated.chapters)) {
        const translatedChapters = await translateChapterNames(
          updated.chapters,
        );
        if (translatedChapters.length < updated.chapters.length) {
          const rest = updated.chapters.slice(translatedChapters.length);
          updated.chapters = translatedChapters.concat(rest);
        } else {
          updated.chapters = translatedChapters;
        }
      }
      return updated;
    } catch (e) {
      return novel;
    }
  }
  function collectTextNodes($) {
    const nodes = [];
    const root = $('body');
    if (!root.length) return nodes;
    root.find('*').each((i, el) => {
      const tag = (el.tagName || '').toLowerCase();
      if (['script', 'style', 'pre', 'code', 'svg', 'noscript'].includes(tag))
        return;
      $(el)
        .contents()
        .each((j, child) => {
          if (child.type === 'text') {
            const value = child.data || '';
            if (value.trim()) {
              nodes.push({ el: child, value });
            }
          }
        });
    });
    return nodes;
  }
  function segmentizeText(s, max) {
    const out = [];
    let cur = '';
    for (const word of s.split(/(\s+)/)) {
      if (word.length > max) {
        if (cur) {
          out.push(cur);
          cur = '';
        }
        let rest = word;
        while (rest.length > max) {
          out.push(rest.slice(0, max));
          rest = rest.slice(max);
        }
        cur = rest;
        continue;
      }
      if ((cur + word).length > max && cur) {
        out.push(cur);
        cur = word;
      } else {
        cur += word;
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  async function translateHTMLContent(html) {
    try {
      if (typeof html !== 'string' || !html.trim()) {
        return { html: html, ok: false };
      }
      const $ = __translatorParse(html);
      const nodes = collectTextNodes($);
      if (!nodes.length) return { html: html, ok: false };
      const batches = [];
      let batch = null;
      for (const node of nodes) {
        const value = node.value;
        if (value.trim().length > CFG.maxBatchChars) {
          if (batch) {
            batches.push(batch);
            batch = null;
          }
          batches.push({
            lines: [node.el],
            texts: segmentizeText(value, CFG.maxBatchChars),
            chunked: true,
          });
          continue;
        }
        if (!batch) batch = { lines: [], texts: [] };
        if (
          batch.lines.length &&
          (batch.texts.join('\n') + '\n' + value).length > CFG.maxBatchChars
        ) {
          batches.push(batch);
          batch = { lines: [], texts: [] };
        }
        batch.lines.push(node.el);
        batch.texts.push(value);
      }
      if (batch) batches.push(batch);
      let originalTotalLen = 0;
      let changedLen = 0;
      for (const chunk of batches) {
        if (!chunk.lines.length) continue;
        if (chunk.chunked) {
          const translated = [];
          for (const seg of chunk.texts) {
            const t = await translateText(seg);
            if (t && t.trim() && t !== seg) {
              changedLen += t.length;
              translated.push(t);
            } else {
              translated.push(seg);
            }
          }
          originalTotalLen += chunk.texts.join(' ').length;
          chunk.lines[0].data = translated.join(' ');
          continue;
        }
        const joined = chunk.texts.join('\n');
        originalTotalLen += joined.length;
        const translated = await translateText(joined);
        if (!translated || !translated.trim() || translated === joined) {
          continue;
        }
        const parts = translated.split('\n');
        if (parts.length === chunk.lines.length) {
          for (let i = 0; i < chunk.lines.length; i += 1) {
            if (parts[i] && parts[i].trim()) {
              if (parts[i] !== chunk.texts[i]) changedLen += parts[i].length;
              chunk.lines[i].data = parts[i];
            }
          }
        } else {
          for (let i = 0; i < chunk.lines.length; i += 1) {
            const t = await translateText(chunk.texts[i] || '');
            if (t && t.trim()) {
              if (t !== chunk.texts[i]) changedLen += t.length;
              chunk.lines[i].data = t;
            }
          }
        }
      }
      const tooShort =
        originalTotalLen > 200 && changedLen < originalTotalLen * 0.4;
      if (tooShort) {
        if (changedLen === 0) {
          return { html: html, ok: false };
        }
        console.warn('[translate] RESULT TOO SHORT - returning original');
        return { html: html, ok: false };
      }
      return { html: $.html(), ok: changedLen > 0 };
    } catch (e) {
      return { html: html, ok: false };
    }
  }
  async function runDirect(path, args) {
    if (!origParseChapter) return '';
    const raw =
      args && args.length
        ? await origParseChapter.apply(null, args)
        : await origParseChapter(path);
    if (typeof raw !== 'string' || !raw) return raw;
    if (!CFG.translateContent) return raw;
    const res = await translateHTMLContent(raw);
    const out =
      res && typeof res.html === 'string' && res.html ? res.html : raw;
    if (res && res.ok && out && out !== raw) setCached(path, out);
    return out;
  }
  function startJob(path, args) {
    if (path) {
      const existing = inflight.get(path);
      if (existing) return existing;
    }
    const job = runDirect(path, args).then(
      value => {
        if (path && inflight.get(path) === job) inflight.delete(path);
        return value;
      },
      error => {
        if (path && inflight.get(path) === job) inflight.delete(path);
        throw error;
      },
    );
    if (path) inflight.set(path, job);
    return job;
  }
  async function ensureBackground(path) {
    try {
      const hit = getCached(path);
      if (hit) return hit;
      return await startJob(path, null);
    } catch (e) {
      return '';
    }
  }
  function scheduleWindow(novelPath, afterIdx, count) {
    try {
      ensureState();
      const paths = map.novels[novelPath];
      if (!paths || !paths.length) return;
      const start = afterIdx + 1;
      const end = Math.min(paths.length, afterIdx + 1 + count);
      if (start >= end) return;
      const token = ++chainToken;
      console.warn('[translate] prefetch', novelPath, start, '->', end - 1);
      (async () => {
        for (let i = start; i < end; i++) {
          if (token !== chainToken) return;
          const p = paths[i];
          if (!p) continue;
          if (getCached(p)) continue;
          const out = await ensureBackground(p);
          if (!out) return;
        }
      })();
    } catch (e) {}
  }
  function scheduleForPath(path) {
    try {
      ensureState();
      const entry = map.c2n[path];
      if (!entry) return;
      scheduleWindow(entry.n, entry.i, CFG.prefetchAhead);
    } catch (e) {}
  }
  function wrapPlugin(plugin) {
    if (!plugin || !CFG.enabled) return;
    if (typeof plugin.popularNovels === 'function') {
      const orig = plugin.popularNovels.bind(plugin);
      plugin.popularNovels = async (pageNo, options) => {
        let opts = options;
        try {
          if (CFG.translateQuery && options && options.filters) {
            const next = {};
            let changed = false;
            for (const key in options.filters) {
              const f = options.filters[key];
              next[key] = f && typeof f === 'object' ? { ...f } : f;
              const value = next[key] && next[key].value;
              if (
                typeof value === 'string' &&
                value.trim() &&
                !/^\d+$/.test(value.trim()) &&
                key !== 'm_orderby' &&
                key !== 'adult'
              ) {
                const translated = await translateText(
                  value,
                  'en',
                  CFG.sourceLang,
                ).catch(() => value);
                if (translated && translated.trim()) {
                  next[key].value = translated;
                  changed = true;
                }
              }
            }
            if (changed) opts = { ...options, filters: next };
          }
        } catch (e) {}
        const res = await orig(pageNo, opts);
        if (Array.isArray(res)) return translateNovelItems(res);
        return res;
      };
    }
    if (typeof plugin.searchNovels === 'function') {
      const orig = plugin.searchNovels.bind(plugin);
      plugin.searchNovels = async (searchTerm, pageNo) => {
        const query = typeof searchTerm === 'string' ? searchTerm : '';
        const effectiveQuery = CFG.translateQuery
          ? (await translateText(query, 'en', CFG.sourceLang).catch(
              () => query,
            )) || query
          : query;
        let raw = await orig(effectiveQuery, pageNo);
        if (Array.isArray(raw) && !raw.length && effectiveQuery !== query) {
          raw = await orig(query, pageNo);
        }
        if (!Array.isArray(raw)) return raw;
        const fold = s => {
          try {
            return String(s || '')
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
          } catch (e) {
            return String(s || '').toLowerCase();
          }
        };
        const enQ = effectiveQuery ? fold(effectiveQuery) : '';
        const esQ = query ? fold(query) : '';
        const translated = await translateNovelItems(raw);
        const containsQ = (name, path, q) =>
          q &&
          q.length >= 2 &&
          (name.indexOf(q) !== -1 ||
            path.indexOf(q.replace(/\s+/g, '-')) !== -1);
        let out = translated;
        if (enQ.length >= 2 || esQ.length >= 2) {
          const exact = [];
          const partial = [];
          translated.forEach((n, i) => {
            const name = fold(n.name);
            const path = fold(n.path);
            const rawName = fold(raw[i] ? raw[i].name : '');
            const rawPath = fold(raw[i] ? raw[i].path : '');
            if (
              (enQ.length >= 2 && (name === enQ || rawName === enQ)) ||
              (esQ.length >= 2 && name === esQ)
            ) {
              exact.push(n);
              return;
            }
            if (
              containsQ(name, path, enQ) ||
              containsQ(rawName, rawPath, enQ) ||
              containsQ(name, path, esQ)
            ) {
              partial.push(n);
            }
          });
          if (exact.length) out = exact;
          else if (partial.length) out = partial;
          else out = translated;
        }
        return out;
      };
    }
    if (typeof plugin.parseNovel === 'function') {
      const orig = plugin.parseNovel.bind(plugin);
      plugin.parseNovel = async novelPath => {
        const res = await orig(novelPath);
        if (res && typeof res === 'object') {
          try {
            ensureState();
            indexNovel(
              String(novelPath || ''),
              Array.isArray(res.chapters) ? res.chapters : [],
            );
            scheduleWindow(String(novelPath || ''), -1, CFG.initialPrefetch);
          } catch (e) {}
          return translateSourceNovel(res);
        }
        return res;
      };
    }
    if (typeof plugin.parseChapter === 'function') {
      const orig = plugin.parseChapter.bind(plugin);
      origParseChapter = orig;
      plugin.parseChapter = async (...args) => {
        const path = String((args && args[0]) || '');
        ensureState();
        let out;
        const cached = getCached(path);
        if (cached) {
          out = cached;
        } else if (!path) {
          out = await orig(...args);
          if (CFG.translateContent && typeof out === 'string') {
            const res = await translateHTMLContent(out);
            if (res && typeof res.html === 'string' && res.html) out = res.html;
          }
        } else {
          out = await startJob(path, args);
        }
        if (path) scheduleForPath(path);
        return out;
      };
    }
  }
  return wrapPlugin;
})();
__ENTranslation(plugin);
/* __ENTranslationInjected END */

export default plugin;

// Custom error for when Novel Fire is rate limiting requests
class NovelFireThrottlingError {
  constructor(message = 'Novel Fire is rate limiting requests') {
    this.message = message;
  }
}

class NovelFireAjaxNotFound {
  constructor(message = 'Novel Fire says its Ajax interface is not found') {
    this.message = message;
    this.name = 'NovelFireAjaxError';
  }
}

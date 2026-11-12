import { fetchApi } from '@libs/fetch';
import { Filters } from '@libs/filterInputs';
import { Plugin } from '@/types/plugin';
import { Cheerio, CheerioAPI, load as parseHTML } from 'cheerio';
import { AnyNode } from 'domhandler';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import dayjs from 'dayjs';
import { storage } from '@libs/storage';

const includesAny = (str: string, keywords: string[]) =>
  new RegExp(keywords.join('|')).test(str);

type MadaraOptions = {
  useNewChapterEndpoint?: boolean;
  lang?: string;
  orderBy?: string;
  versionIncrements?: number;
  customJs?: string;
  hasLocked?: boolean;
};

export type MadaraMetadata = {
  id: string;
  sourceSite: string;
  sourceName: string;
  options?: MadaraOptions;
  filters?: Filters;
};

export class MadaraPlugin implements Plugin.PluginBase {
  id: string;
  name: string;
  icon: string;
  site: string;
  version: string;
  options?: MadaraOptions;
  filters?: Filters | undefined;

  hideLocked = storage.get('hideLocked');
  pluginSettings?: Filters;

  constructor(metadata: MadaraMetadata) {
    this.id = metadata.id;
    this.name = metadata.sourceName;
    this.icon = `multisrc/madara/${metadata.id.toLowerCase()}/icon.png`;
    this.site = metadata.sourceSite;
    const versionIncrements = metadata.options?.versionIncrements || 0;
    this.version = `2.2.${versionIncrements}`;
    this.options = metadata.options;
    this.filters = metadata.filters;

    if (this.options?.hasLocked) {
      this.pluginSettings = {
        hideLocked: {
          value: '',
          label: 'Hide locked chapters',
          type: 'Switch',
        },
      };
    }
  }

  translateDragontea(text: Cheerio<AnyNode>): Cheerio<AnyNode> {
    if (this.id !== 'dragontea') return text;

    const $ = parseHTML(
      text
        .html()
        ?.replace('\n', '')
        .replace(/<br\s*\/?>/g, '\n') || '',
    );
    const reverseAlpha = 'zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA';
    const forwardAlpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    text.html($.html());
    text
      .find('*')
      .addBack()
      .contents()
      .filter((_, el) => el.nodeType === 3)
      .each((_, el) => {
        const $el = $(el);
        const translated = $el
          .text()
          .normalize('NFD')
          .split('')
          .map(char => {
            const base = char.normalize('NFC');
            const idx = forwardAlpha.indexOf(base);
            return idx >= 0
              ? reverseAlpha[idx] + char.slice(base.length)
              : char;
          })
          .join('');
        $el.replaceWith(translated.replace('\n', '<br>'));
      });

    return text;
  }

  getHostname(url: string): string {
    url = url.split('/')[2];
    const url_parts = url.split('.');
    url_parts.pop(); // remove TLD
    return url_parts.join('.');
  }

  async getCheerio(url: string, search: boolean): Promise<CheerioAPI> {
    const r = await fetchApi(url);
    if (!r.ok && search != true)
      throw new Error(
        'Could not reach site (' + r.status + ') try to open in webview.',
      );
    const $ = parseHTML(await r.text());
    const title = $('title').text().trim();
    if (
      this.getHostname(url) != this.getHostname(r.url) ||
      title == 'Bot Verification' ||
      title == 'You are being redirected...' ||
      title == 'Un instant...' ||
      title == 'Just a moment...' ||
      title == 'Redirecting...'
    )
      throw new Error('Captcha error, please open in webview');
    return $;
  }

  parseNovels(loadedCheerio: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('.manga-title-badges').remove();

    loadedCheerio('.page-item-detail, .c-tabs-item__content').each(
      (index, element) => {
        const novelName = loadedCheerio(element)
          .find('.post-title')
          .text()
          .trim();
        const novelUrl =
          loadedCheerio(element).find('.post-title').find('a').attr('href') ||
          '';
        if (!novelName || !novelUrl) return;
        const image = loadedCheerio(element).find('img');
        const novelCover =
          image.attr('data-src') ||
          image.attr('src') ||
          image.attr('data-lazy-srcset') ||
          defaultCover;
        const novel: Plugin.NovelItem = {
          name: novelName,
          cover: novelCover,
          path: novelUrl.replace(/https?:\/\/.*?\//, ''),
        };
        novels.push(novel);
      },
    );

    return novels;
  }

  async popularNovels(
    pageNo: number,
    {
      filters,
      showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    let url = this.site + '/page/' + pageNo + '/?s=&post_type=wp-manga';
    if (!filters) filters = this.filters || {};
    if (showLatestNovels) url += '&m_orderby=latest';
    for (const key in filters) {
      if (typeof filters[key].value === 'object')
        for (const value of filters[key].value as string[])
          url += `&${key}=${value}`;
      else if (filters[key].value) url += `&${key}=${filters[key].value}`;
    }
    const loadedCheerio = await this.getCheerio(url, pageNo != 1);
    return this.parseNovels(loadedCheerio);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    let loadedCheerio = await this.getCheerio(this.site + novelPath, false);

    loadedCheerio('.manga-title-badges, #manga-title span').remove();
    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name:
        loadedCheerio('.post-title h1').text().trim() ||
        loadedCheerio('#manga-title h1').text().trim() ||
        loadedCheerio('.manga-title').text().trim() ||
        '',
    };

    novel.cover =
      loadedCheerio('.summary_image > a > img').attr('data-lazy-src') ||
      loadedCheerio('.summary_image > a > img').attr('data-src') ||
      loadedCheerio('.summary_image > a > img').attr('src') ||
      defaultCover;

    loadedCheerio('.post-content_item, .post-content').each(function () {
      const detailName = loadedCheerio(this).find('h5').text().trim();
      const detail =
        loadedCheerio(this).find('.summary-content') ||
        loadedCheerio(this).find('.summary_content');

      switch (detailName) {
        case 'Genre(s)':
        case 'Genre':
        case 'Tags(s)':
        case 'Tag(s)':
        case 'Tags':
        case 'Género(s)':
        case 'Kategori':
        case 'التصنيفات':
          if (novel.genres)
            novel.genres +=
              ', ' +
              detail
                .find('a')
                .map((i, el) => loadedCheerio(el).text())
                .get()
                .join(', ');
          else
            novel.genres = detail
              .find('a')
              .map((i, el) => loadedCheerio(el).text())
              .get()
              .join(', ');
          break;
        case 'Author(s)':
        case 'Author':
        case 'Autor(es)':
        case 'المؤلف':
        case 'المؤلف (ين)':
          novel.author = detail.text().trim();
          break;
        case 'Status':
        case 'Novel':
        case 'Estado':
        case 'Durum':
          novel.status =
            detail.text().trim().includes('OnGoing') ||
            detail.text().trim().includes('مستمرة')
              ? NovelStatus.Ongoing
              : NovelStatus.Completed;
          break;
        case 'Artist(s)':
          novel.artist = detail.text().trim();
          break;
      }
    });

    // Checks for "Madara NovelHub" version
    {
      if (!novel.genres)
        novel.genres = loadedCheerio('.genres-content').text().trim();
      if (!novel.status)
        novel.status = loadedCheerio('.manga-status')
          .text()
          .trim()
          .includes('OnGoing')
          ? NovelStatus.Ongoing
          : NovelStatus.Completed;
      if (!novel.author)
        novel.author = loadedCheerio('.manga-author a').text().trim();
      if (!novel.rating)
        novel.rating = parseFloat(
          loadedCheerio('.post-rating span').text().trim(),
        );
    }

    if (!novel.author)
      novel.author = loadedCheerio('.manga-authors').text().trim();

    loadedCheerio('div.summary__content .code-block,script,noscript').remove();
    novel.summary =
      this.translateDragontea(loadedCheerio('div.summary__content'))
        .text()
        .trim() ||
      loadedCheerio('#tab-manga-about').text().trim() ||
      loadedCheerio('.post-content_item h5:contains("Summary")')
        .next()
        .find('span')
        .map((i, el) => loadedCheerio(el).text())
        .get()
        .join('\n\n')
        .trim() ||
      loadedCheerio('.manga-summary p')
        .map((i, el) => loadedCheerio(el).text())
        .get()
        .join('\n\n')
        .trim() ||
      loadedCheerio('.manga-excerpt p')
        .map((i, el) => loadedCheerio(el).text())
        .get()
        .join('\n\n')
        .trim();
    const chapters: Plugin.ChapterItem[] = [];
    let html = '';

    if (this.options?.useNewChapterEndpoint) {
      html = await fetchApi(this.site + novelPath + 'ajax/chapters/', {
        method: 'POST',
        referrer: this.site + novelPath,
      }).then((res: Response) => res.text());
    } else {
      const novelId =
        loadedCheerio('.rating-post-id').attr('value') ||
        loadedCheerio('#manga-chapters-holder').attr('data-id') ||
        '';

      const formData = new FormData();
      formData.append('action', 'manga_get_chapters');
      formData.append('manga', novelId);

      html = await fetchApi(this.site + 'wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData,
      }).then((res: Response) => res.text());
    }

    if (html !== '0') {
      loadedCheerio = parseHTML(html);
    }

    const totalChapters = loadedCheerio('.wp-manga-chapter').length;
    loadedCheerio('.wp-manga-chapter').each((chapterIndex, element) => {
      let chapterName = loadedCheerio(element).find('a').text().trim();
      const locked = element.attribs['class'].includes('premium-block');
      if (locked) {
        chapterName = '🔒 ' + chapterName;
      }

      let releaseDate = loadedCheerio(element)
        .find('span.chapter-release-date')
        .text()
        .trim();

      if (releaseDate) {
        releaseDate = this.parseData(releaseDate);
      } else {
        releaseDate = dayjs().format('LL');
      }

      const chapterUrl = loadedCheerio(element).find('a').attr('href') || '';

      if (chapterUrl && chapterUrl != '#' && !(locked && this.hideLocked)) {
        chapters.push({
          name: chapterName,
          path: chapterUrl.replace(/https?:\/\/.*?\//, ''),
          releaseTime: releaseDate || null,
          chapterNumber: totalChapters - chapterIndex,
        });
      }
    });

    novel.chapters = chapters.reverse();
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const loadedCheerio = await this.getCheerio(this.site + chapterPath, false);
    const chapterText =
      loadedCheerio('.text-left') ||
      loadedCheerio('.text-right') ||
      loadedCheerio('.entry-content') ||
      loadedCheerio('.c-blog-post > div > div:nth-child(2)');

    if (this.options?.customJs) {
      try {
      } catch (error) {
        console.error('Error executing customJs:', error);
        throw error;
      }
    }

    return this.translateDragontea(chapterText).html() || '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo?: number | undefined,
  ): Promise<Plugin.NovelItem[]> {
    const url =
      this.site +
      '/page/' +
      pageNo +
      '/?s=' +
      encodeURIComponent(searchTerm) +
      '&post_type=wp-manga';
    const loadedCheerio = await this.getCheerio(url, true);
    return this.parseNovels(loadedCheerio);
  }

  parseData = (date: string) => {
    let dayJSDate = dayjs(); // today
    const timeAgo = date.match(/\d+/)?.[0] || '';
    const timeAgoInt = parseInt(timeAgo, 10);

    if (!timeAgo) return date; // there is no number!

    if (includesAny(date, ['detik', 'segundo', 'second', 'วินาที'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'second'); // go back N seconds
    } else if (
      includesAny(date, [
        'menit',
        'dakika',
        'min',
        'minute',
        'minuto',
        'นาที',
        'دقائق',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'minute'); // go back N minute
    } else if (
      includesAny(date, [
        'jam',
        'saat',
        'heure',
        'hora',
        'hour',
        'ชั่วโมง',
        'giờ',
        'ore',
        'ساعة',
        '小时',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'hours'); // go back N hours
    } else if (
      includesAny(date, [
        'hari',
        'gün',
        'jour',
        'día',
        'dia',
        'day',
        'วัน',
        'ngày',
        'giorni',
        'أيام',
        '天',
      ])
    ) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'days'); // go back N days
    } else if (includesAny(date, ['week', 'semana'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'week'); // go back N a week
    } else if (includesAny(date, ['month', 'mes'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'month'); // go back N months
    } else if (includesAny(date, ['year', 'año'])) {
      dayJSDate = dayJSDate.subtract(timeAgoInt, 'year'); // go back N years
    } else {
      if (dayjs(date).format('LL') !== 'Invalid Date') {
        return dayjs(date).format('LL');
      }
      return date;
    }

    return dayJSDate.format('LL');
  };
}

const plugin = new MadaraPlugin({
  'id': 'wuxiaworld.site',
  'sourceSite': 'https://wuxiaworld.site/',
  'sourceName': 'WuxiaWorld.Site',
  'options': { 'versionIncrements': 71, 'useNewChapterEndpoint': true },
  'filters': {
    'genre[]': {
      'type': 'Checkbox',
      'label': 'Genre',
      'value': [],
      'options': [
        { 'label': 'Action', 'value': 'action' },
        { 'label': 'Adult', 'value': 'adult' },
        { 'label': 'Adventure', 'value': 'adventure' },
        { 'label': 'Comedy', 'value': 'comedy' },
        { 'label': 'Drama', 'value': 'drama-genre' },
        { 'label': 'Ecchi', 'value': 'ecchi' },
        { 'label': 'Fantasy', 'value': 'fantasy' },
        { 'label': 'Gender Bender', 'value': 'gender-bender' },
        { 'label': 'Harem', 'value': 'harems-novel' },
        { 'label': 'Historical', 'value': 'historical' },
        { 'label': 'Horror', 'value': 'horror' },
        { 'label': 'Isekai', 'value': 'isekai' },
        { 'label': 'Josei', 'value': 'josei' },
        { 'label': 'LGBT+', 'value': 'lgbt' },
        { 'label': 'Magical Realism', 'value': 'magical-realism' },
        { 'label': 'Manhwa', 'value': 'manhwa' },
        { 'label': 'Martial Arts', 'value': 'martial-arts-genre' },
        { 'label': 'Mature', 'value': 'mature' },
        { 'label': 'Mecha', 'value': 'mecha' },
        { 'label': 'Mystery', 'value': 'mystery' },
        { 'label': 'Psychological', 'value': 'psychological' },
        { 'label': 'Reincarnation', 'value': 'reincarnation' },
        { 'label': 'Romance', 'value': 'romance' },
        { 'label': 'School Life', 'value': 'school-life' },
        { 'label': 'Sci-fi', 'value': 'sci-fi' },
        { 'label': 'Seinen', 'value': 'seinen' },
        { 'label': 'Shoujo', 'value': 'shoujo-genre' },
        { 'label': 'Shoujo Ai', 'value': 'shoujo-ai' },
        { 'label': 'Shounen', 'value': 'shounen' },
        { 'label': 'Shounen Ai', 'value': 'shounen-ai' },
        { 'label': 'Slice of Life', 'value': 'slice-of-life' },
        { 'label': 'Smut', 'value': 'smut' },
        { 'label': 'Sports', 'value': 'sports' },
        { 'label': 'Supernatural', 'value': 'supernatural' },
        { 'label': 'Teen', 'value': 'teen' },
        { 'label': 'Thriller', 'value': 'thriller' },
        { 'label': 'Tragedy', 'value': 'tragedy' },
        { 'label': 'Video Games', 'value': 'video-games' },
        { 'label': 'Webcomics', 'value': 'webcomics' },
        { 'label': 'Wuxia', 'value': 'wuxia' },
        { 'label': 'Xianxia', 'value': 'xianxia' },
        { 'label': 'Xuanhuan', 'value': 'xuanhuan' },
        { 'label': 'Yaoi', 'value': 'yaoi' },
        { 'label': 'Yuri', 'value': 'yuri' },
      ],
    },
    'op': {
      'type': 'Switch',
      'label': 'having all selected genres',
      'value': false,
    },
    'author': { 'type': 'Text', 'label': 'Author', 'value': '' },
    'artist': { 'type': 'Text', 'label': 'Artist', 'value': '' },
    'release': { 'type': 'Text', 'label': 'Year of Released', 'value': '' },
    'adult': {
      'type': 'Picker',
      'label': 'Adult content',
      'value': '',
      'options': [
        { 'label': 'All', 'value': '' },
        { 'label': 'None adult content', 'value': '0' },
        { 'label': 'Only adult content', 'value': '1' },
      ],
    },
    'status[]': {
      'type': 'Checkbox',
      'label': 'Status',
      'value': [],
      'options': [
        { 'label': 'OnGoing', 'value': 'on-going' },
        { 'label': 'Completed', 'value': 'end' },
        { 'label': 'Canceled', 'value': 'canceled' },
        { 'label': 'On Hold', 'value': 'on-hold' },
        { 'label': 'Upcoming', 'value': 'upcoming' },
      ],
    },
    'm_orderby': {
      'type': 'Picker',
      'label': 'Order by',
      'value': '',
      'options': [
        { 'label': 'Relevance', 'value': '' },
        { 'label': 'Latest', 'value': 'latest' },
        { 'label': 'A-Z', 'value': 'alphabet' },
        { 'label': 'Rating', 'value': 'rating' },
        { 'label': 'Trending', 'value': 'trending' },
        { 'label': 'Most Views', 'value': 'views' },
        { 'label': 'New', 'value': 'new-manga' },
      ],
    },
  },
});

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
        const raw = await orig(effectiveQuery, pageNo);
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

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

const plugin = new MadaraPlugin({"id":"wuxiaworld.site","sourceSite":"https://wuxiaworld.site/","sourceName":"WuxiaWorld.Site","options":{"versionIncrements":71,"useNewChapterEndpoint":true},"filters":{"genre[]":{"type":"Checkbox","label":"Genre","value":[],"options":[{"label":"Action","value":"action"},{"label":"Adult","value":"adult"},{"label":"Adventure","value":"adventure"},{"label":"Comedy","value":"comedy"},{"label":"Drama","value":"drama-genre"},{"label":"Ecchi","value":"ecchi"},{"label":"Fantasy","value":"fantasy"},{"label":"Gender Bender","value":"gender-bender"},{"label":"Harem","value":"harems-novel"},{"label":"Historical","value":"historical"},{"label":"Horror","value":"horror"},{"label":"Isekai","value":"isekai"},{"label":"Josei","value":"josei"},{"label":"LGBT+","value":"lgbt"},{"label":"Magical Realism","value":"magical-realism"},{"label":"Manhwa","value":"manhwa"},{"label":"Martial Arts","value":"martial-arts-genre"},{"label":"Mature","value":"mature"},{"label":"Mecha","value":"mecha"},{"label":"Mystery","value":"mystery"},{"label":"Psychological","value":"psychological"},{"label":"Reincarnation","value":"reincarnation"},{"label":"Romance","value":"romance"},{"label":"School Life","value":"school-life"},{"label":"Sci-fi","value":"sci-fi"},{"label":"Seinen","value":"seinen"},{"label":"Shoujo","value":"shoujo-genre"},{"label":"Shoujo Ai","value":"shoujo-ai"},{"label":"Shounen","value":"shounen"},{"label":"Shounen Ai","value":"shounen-ai"},{"label":"Slice of Life","value":"slice-of-life"},{"label":"Smut","value":"smut"},{"label":"Sports","value":"sports"},{"label":"Supernatural","value":"supernatural"},{"label":"Teen","value":"teen"},{"label":"Thriller","value":"thriller"},{"label":"Tragedy","value":"tragedy"},{"label":"Video Games","value":"video-games"},{"label":"Webcomics","value":"webcomics"},{"label":"Wuxia","value":"wuxia"},{"label":"Xianxia","value":"xianxia"},{"label":"Xuanhuan","value":"xuanhuan"},{"label":"Yaoi","value":"yaoi"},{"label":"Yuri","value":"yuri"}]},"op":{"type":"Switch","label":"having all selected genres","value":false},"author":{"type":"Text","label":"Author","value":""},"artist":{"type":"Text","label":"Artist","value":""},"release":{"type":"Text","label":"Year of Released","value":""},"adult":{"type":"Picker","label":"Adult content","value":"","options":[{"label":"All","value":""},{"label":"None adult content","value":"0"},{"label":"Only adult content","value":"1"}]},"status[]":{"type":"Checkbox","label":"Status","value":[],"options":[{"label":"OnGoing","value":"on-going"},{"label":"Completed","value":"end"},{"label":"Canceled","value":"canceled"},{"label":"On Hold","value":"on-hold"},{"label":"Upcoming","value":"upcoming"}]},"m_orderby":{"type":"Picker","label":"Order by","value":"","options":[{"label":"Relevance","value":""},{"label":"Latest","value":"latest"},{"label":"A-Z","value":"alphabet"},{"label":"Rating","value":"rating"},{"label":"Trending","value":"trending"},{"label":"Most Views","value":"views"},{"label":"New","value":"new-manga"}]}}});

/* __ENTranslationInjected v1 */
import { fetchApi as __translatorFetch } from '@libs/fetch';
import { load as __translatorParse } from 'cheerio';

const __ENTranslation = (function () {
  const CFG = {
    enabled: true,
    targetLang: 'es',
    sourceLang: 'auto',
    maxBatchChars: 1600,
    maxConcurrent: 4,
    translateNovelNames: true,
    translateSummaries: true,
    translateChapterNames: false,
    translateContent: true,
    translateQuery: true,
  };
  const providers = ['google', 'google_repeated', 'mymemory', 'libretranslate'];
  const providerMaxChars = { google: 2000, google_repeated: 1800, mymemory: 420, libretranslate: 1800 };
  const cache = new Map();
  let active = 0;
  const queue = [];
  const norm = s =>
    String(s || '')
      .replace(/[ 	]+/g, ' ')
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
  const buildUrl = (provider, text) => {
    const enc = encodeURIComponent(text);
    const src = provider === 'mymemory' && CFG.sourceLang === 'auto' ? 'en' : CFG.sourceLang;
    if (provider === 'google_repeated') {
      return (
        'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
        src +
        '&tl=' +
        CFG.targetLang +
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
        CFG.targetLang
      );
    }
    if (provider === 'libretranslate') {
      return (
        'https://libretranslate.de/translate?q=' +
        enc +
        '&source=' +
        CFG.sourceLang +
        '&target=' +
        CFG.targetLang +
        '&format=text'
      );
    }
    return (
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
      CFG.sourceLang +
      '&tl=' +
      CFG.targetLang +
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
      } else if (provider === 'deepl') {
        if (json && Array.isArray(json.translations) && json.translations[0]) {
          return json.translations[0].text;
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
        const res = await __translatorFetch(buildUrl(provider, t));
        if (!res || !res.ok) continue;
        const json = await res.json();
        const out = extract(json, provider);
        if (out && out !== t) {
          cache.set(ck, out);
          return out;
        }
      } catch (e) {
        // probar siguiente proveedor
      }
    }
    return text;
  }
  const translateShort = text => guard(() => translateText(text));
  async function translateList(values) {
    const out = [];
    for (const value of values) {
      const translated = await translateText(value);
      out.push(translated && translated.trim() ? translated : value);
    }
    return out;
  }
  async function translateNovelItems(items) {
    const result = [];
    for (const item of items) {
      try {
        const name = await translateText(typeof item.name === 'string' ? item.name : '');
        result.push({
          ...item,
          name: name && name.trim() ? name : item.name,
        });
      } catch (e) {
        result.push(item);
      }
    }
    return result;
  }
  async function translateChapterNames(chapters) {
    const capped = Array.isArray(chapters) ? chapters.slice(0, CFG.maxChapterNames) : [];
    const out = [];
    for (const chapter of capped) {
      try {
        const name = await translateText(typeof chapter.name === 'string' ? chapter.name : '');
        out.push({
          ...chapter,
          name: name && name.trim() ? name : chapter.name,
        });
      } catch (e) {
        out.push(chapter);
      }
    }
    return out;
  }
  async function translateSourceNovel(novel) {
    try {
      const updated = { ...novel };
      if (CFG.translateNovelNames && typeof updated.name === 'string') {
        const name = await translateText(updated.name);
        if (name && name.trim()) updated.name = name;
      }
      if (CFG.translateSummaries && typeof updated.summary === 'string' && updated.summary) {
        const summary = await translateText(updated.summary);
        if (summary && summary.trim()) updated.summary = summary;
      }
      if (CFG.translateChapterNames && Array.isArray(updated.chapters)) {
        const translatedChapters = await translateChapterNames(updated.chapters);
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
      if (['script', 'style', 'pre', 'code', 'svg', 'noscript'].includes(tag)) return;
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
      if (typeof html !== 'string' || !html.trim()) return html;
      const $ = __translatorParse(html);
      const nodes = collectTextNodes($);
      if (!nodes.length) return html;
      let batch = '';
      const batches = [];
      const last = () => batches[batches.length - 1];
      for (const node of nodes) {
        if (node.value.trim().length <= CFG.maxBatchChars) {
          if ((batch + '\n' + node.value).length > CFG.maxBatchChars && batch !== '') {
            batches.push({ lines: [], texts: [] });
            batch = '';
          }
          last().lines.push(node.el);
          last().texts.push(node.value);
          batch = (batch === '' ? '' : batch + '\n') + node.value;
        } else {
          if (batch !== '') {
            batches.push({ lines: [], texts: [] });
            batch = '';
          }
          batches.push({
            lines: [node.el],
            texts: segmentizeText(node.value, CFG.maxBatchChars),
            chunked: true,
          });
        }
      }
      let originalTotalLen = 0;
      let translatedTotalLen = 0;
      console.warn('[translate] batches:', batches.length, 'nodes:', nodes.length);
      let bIdx = 0;
      for (const chunk of batches) {
        if (!chunk.lines.length) continue;
        bIdx++;
        if (chunk.chunked) {
          const translated = [];
          for (const seg of chunk.texts) {
            const t = await translateText(seg);
            translated.push(t && t !== seg ? t : seg);
          }
          const joined = translated.join(' ');
          originalTotalLen += chunk.texts.join(' ').length;
          translatedTotalLen += joined.length;
          chunk.lines[0].data = joined;
          continue;
        }
        const joined = chunk.texts.join('\n');
        originalTotalLen += joined.length;
        const translated = await translateText(joined);
        if (!translated || !translated.trim() || translated === joined) {
          console.warn('[translate] batch', bIdx, ': skipped (no translation or same)');
          translatedTotalLen += joined.length;
          continue;
        }
        const parts = translated.split('\n');
        if (parts.length === chunk.lines.length) {
          for (let i = 0; i < chunk.lines.length; i += 1) {
            chunk.lines[i].data = parts[i];
          }
          translatedTotalLen += translated.length;
        } else {
          console.warn('[translate] batch', bIdx, ': line mismatch', parts.length, 'vs', chunk.lines.length, '- fallback per-line');
          for (let i = 0; i < chunk.lines.length; i += 1) {
            const t = await translateText(chunk.texts[i] || '');
            chunk.lines[i].data = (t && t.trim()) ? t : (chunk.texts[i] || '');
          }
          translatedTotalLen += chunk.lines.reduce((s, l) => s + (l.data || '').length, 0);
        }
      }
      console.warn('[translate] original:', originalTotalLen, 'chars, translated:', translatedTotalLen, 'chars');
      const result = $.html();
      if (originalTotalLen > 200 && translatedTotalLen < originalTotalLen * 0.4) {
        console.warn('[translate] RESULT TOO SHORT - returning original');
        return html;
      }
      return result;
    } catch (e) {
      return html;
    }
  }
  function wrapPlugin(plugin) {
    if (!plugin || !CFG.enabled) return;
    if (typeof plugin.popularNovels === 'function') {
      const orig = plugin.popularNovels.bind(plugin);
      plugin.popularNovels = async (pageNo, options) => {
        const res = await orig(pageNo, options);
        if (Array.isArray(res)) return translateNovelItems(res);
        return res;
      };
    }
    if (typeof plugin.searchNovels === 'function') {
      const orig = plugin.searchNovels.bind(plugin);
      plugin.searchNovels = async (searchTerm, pageNo) => {
        const query = typeof searchTerm === 'string' ? searchTerm : '';
        const effectiveQuery = CFG.translateQuery
          ? (await translateText(query, 'en', CFG.sourceLang).catch(() => query)) || query
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
        const rawEn = new Set();
        if (enQ && enQ.length >= 2) {
          raw.forEach((n, i) => {
            const name = fold(n.name);
            const path = fold(n.path);
            if (name.indexOf(enQ) !== -1 || path.indexOf(enQ.replace(/\s+/g, '-')) !== -1) {
              rawEn.add(i);
            }
          });
        }
        const translated = await translateNovelItems(raw);
        let out = translated;
        if (rawEn.size || (esQ && esQ.length >= 2)) {
          out = translated.filter((n, i) => {
            if (rawEn.has(i)) return true;
            return (
              esQ &&
              esQ.length >= 2 &&
              fold(n.name).indexOf(esQ) !== -1
            );
          });
        }
        if (out.length === 0 && raw.length > 0 && raw.length <= 15) {
          out = translated;
        }
        return out;
      };
    }
    if (typeof plugin.parseNovel === 'function') {
      const orig = plugin.parseNovel.bind(plugin);
      plugin.parseNovel = async novelPath => {
        const res = await orig(novelPath);
        if (res && typeof res === 'object') return translateSourceNovel(res);
        return res;
      };
    }
    if (typeof plugin.parseChapter === 'function') {
      const orig = plugin.parseChapter.bind(plugin);
      plugin.parseChapter = async (...args) => {
        const res = await orig(...args);
        if (CFG.translateContent && typeof res === 'string') {
          return translateHTMLContent(res);
        }
        return res;
      };
    }
  }
  return wrapPlugin;
})();
__ENTranslation(plugin);
/* __ENTranslationInjected END */

export default plugin;
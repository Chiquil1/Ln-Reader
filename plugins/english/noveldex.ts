import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as parseHTML } from 'cheerio';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import { Filters, FilterTypes } from '@libs/filterInputs';

class NovelDex implements Plugin.PluginBase {
  id = 'noveldex';
  name = 'NovelDex';
  icon = 'src/en/noveldex/icon.png';
  site = 'https://noveldex.io/';
  api = 'https://noveldex.io/api/ai';
  version = '1.0.1';

  async getJson(url: string): Promise<any> {
    const res = await fetchApi(url);
    return res.json();
  }

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const sort = showLatestNovels ? 'latest' : 'popular';
    const url = `${this.api}/series?sort=${sort}&page=${pageNo}&limit=50`;
    const json = await this.getJson(url);
    const list = json?.data || [];
    return list.map((s: any) => ({
      name: s.title,
      path: s.slug,
      cover: s.cover_image || defaultCover,
    }));
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const url = `${this.api}/search?q=${encodeURIComponent(
      searchTerm,
    )}&limit=20`;
    const json = await this.getJson(url);
    const list = json?.results || [];
    return list.map((s: any) => ({
      name: s.title,
      path: s.slug,
      cover: s.cover_image || defaultCover,
    }));
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const slug = novelPath.replace(/^\//, '');
    const json = await this.getJson(`${this.api}/series/${slug}?chapters=all`);
    const novel: Plugin.SourceNovel = {
      path: slug,
      name: json.title || 'Untitled',
      cover: json.cover_image || defaultCover,
      summary: json.description || '',
      author: json.author || '',
      genres: Array.isArray(json.genres) ? json.genres.join(', ') : '',
      status:
        json.status === 'COMPLETED'
          ? NovelStatus.Completed
          : NovelStatus.Ongoing,
      chapters: [],
    };

    const chapters: Plugin.ChapterItem[] = [];
    const list = Array.isArray(json.chapters) ? json.chapters : [];
    for (const ch of list) {
      chapters.push({
        name: ch.title
          ? `Chapter ${ch.number}: ${ch.title}`
          : `Chapter ${ch.number}`,
        path: `series/novel/${slug}/chapter/${ch.number}`,
        chapterNumber: ch.number,
        releaseTime: ch.published_at,
      });
    }
    // API returns ascending by default; keep as-is (first chapter first).
    novel.chapters = chapters;
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath.replace(/^\//, '');
    const res = await fetchApi(url);
    const html = await res.text();

    // Webview-rendered pages expose the content in a .prose container.
    const $ = parseHTML(html);
    let content = $('.prose').html();
    if (content && content.trim()) {
      return content;
    }

    // Fallback: extract from the RSC payload (native fetch).
    try {
      const m = html.match(/\d+:[T0-9a-f]+,\\u003cp/);
      if (m) {
        const idx = m.index + m[0].lastIndexOf(',') + 1;
        const boundary = html.slice(idx).match(/\d+:\[/);
        const end = boundary ? idx + boundary.index : html.length;
        const escaped = html.slice(idx, end);
        const unescaped = escaped.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16)),
        );
        if (unescaped.includes('<p')) return unescaped;
      }
    } catch (e) {
      // ignore
    }

    return '';
  }

  filters = undefined;
}

const plugin = new NovelDex();

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

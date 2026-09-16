#!/usr/bin/env node
// Inyecta un traductor EN->ES AUTOCONTENIDO en los plugins MultiSource cuyo
// idioma es English (plugins/english/*[template].ts).
//
// Contrato:
//  - NO usa @libs/translation: la app del usuario no lo define.
//  - Usa @libs/fetch (fetchApi) y cheerio (load), ambos en el whitelist de la app.
//  - Cada plugin compilado queda autocontenido: funciona sin tocar la app.
//  - Idempotente: no inyecta dos veces (marca comentario).
//  - Seguro: si la traducción falla o la forma no coincide, devuelve el original.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MARKER = '/* __ENTranslationInjected v1 */';
const EN_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'plugins',
  'english',
);

const ENGINE = `
${MARKER}
import { fetchApi as __translatorFetch } from '@libs/fetch';
import { load as __translatorParse } from 'cheerio';

const __ENTranslation = (function () {
  const CFG = {
    enabled: true,
    provider: 'google',
    fallbackProvider: 'libretranslate',
    targetLang: 'es',
    sourceLang: 'auto',
    maxBatchChars: 2000,
    maxConcurrent: 4,
    translateNovelNames: true,
    translateSummaries: true,
    translateChapterNames: false,
    translateContent: true,
    translateQuery: true,
  };
  const cache = new Map();
  let active = 0;
  const queue = [];
  const norm = s =>
    String(s || '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\\r/g, '')
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
    if (provider === 'deepl') {
      return (
        'https://api-free.deepl.com/v2/translate?auth_key=' +
        (CFG.apiKey || '') +
        '&text=' +
        enc +
        '&target_lang=' +
        CFG.targetLang.toUpperCase() +
        '&source_lang=' +
        (CFG.sourceLang === 'auto' ? '' : CFG.sourceLang)
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
    const providers = [CFG.provider, CFG.fallbackProvider];
    for (const provider of providers) {
      try {
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
  async function translateHTMLContent(html) {
    try {
      if (typeof html !== 'string' || !html.trim()) return html;
      const $ = __translatorParse(html);
      const nodes = collectTextNodes($);
      if (!nodes.length) return html;
      let batch = '';
      const batches = [{ lines: [], texts: [] }];
      const last = () => batches[batches.length - 1];
      for (const node of nodes) {
        if ((batch + '\\n' + node.value).length > CFG.maxBatchChars && batch !== '') {
          batches.push({ lines: [], texts: [] });
          batch = '';
        }
        last().lines.push(node.el);
        last().texts.push(node.value);
        batch = (batch === '' ? '' : batch + '\\n') + node.value;
      }
      for (const chunk of batches) {
        if (!chunk.lines.length) continue;
        const joined = chunk.texts.join('\\n');
        const translated = await translateText(joined);
        if (!translated || !translated.trim() || translated === joined) continue;
        const parts = translated.split('\\n');
        if (parts.length !== chunk.lines.length) continue;
        for (let i = 0; i < chunk.lines.length; i += 1) {
          chunk.lines[i].data = parts[i];
        }
      }
      return $.html();
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
        const res = await orig(effectiveQuery, pageNo);
        if (Array.isArray(res)) return translateNovelItems(res);
        return res;
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
      plugin.parseChapter = async chapterPath => {
        const res = await orig(chapterPath);
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
`;

function bumpVersion(source) {
  const re = /("versionIncrements"\s*:\s*)(\d+)/;
  if (re.test(source)) {
    return source.replace(
      re,
      (match, prefix, num) => prefix + (Number(num) + 1),
    );
  }
  return source.replace(/("options"\s*:\s*\{)/, '$1"versionIncrements":1,');
}

function injectFile(filePath) {
  let source = fs.readFileSync(filePath, 'utf-8');
  if (source.includes(MARKER)) return false;
  source = bumpVersion(source);
  const exportIndex = source.lastIndexOf('export default plugin;');
  if (exportIndex === -1) {
    console.warn('SALTADO (sin export default plugin):', filePath);
    return false;
  }
  const head = source.slice(0, exportIndex);
  const tail = source.slice(exportIndex);
  source = head + ENGINE + '\n' + tail;
  fs.writeFileSync(filePath, source, 'utf-8');
  return true;
}

function run() {
  let injected = 0;
  let skipped = 0;
  const files = fs
    .readdirSync(EN_DIR)
    .filter(
      name => name.endsWith('.ts') && name.includes('[') && name.includes(']'),
    );
  for (const name of files) {
    const filePath = path.join(EN_DIR, name);
    if (injectFile(filePath)) injected += 1;
    else skipped += 1;
  }
  console.log(
    `[inject-es-translation] inyectados: ${injected}, ya inyectados/saltados: ${skipped}`,
  );
}

run();

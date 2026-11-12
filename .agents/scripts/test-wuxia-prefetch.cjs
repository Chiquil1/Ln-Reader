// Test de prefetch/persistencia del traductor inyectado en
// WuxiaWorldSite[madara].js:
//  1) parseNovel indexa + lanza prefetch inicial (7 capítulos) en background
//  2) tras leer un capítulo, prefetch de los 10 siguientes en background
//  3) relectura desde caché (MMKV simulado) sin volver a pedir al sitio
//  4) caché sobrevive a una "reinicio" (nueva instancia, mismo storage)
//  5) si la traducción falla NO se cachea y se reintenta
const fs = require('fs');
const cheerio = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/cheerio');
const dayjs = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/dayjs');
const urlencode = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/urlencode');
const {
  Parser,
} = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/htmlparser2');

const NOVEL_PATH = '/novel/demo/';
const TOTAL_CHAPTERS = 30;

// ---- storage compartido (simula MMKV persistente entre reinicios) ----
class S {
  constructor() {
    this.m = new Map();
  }
  set(k, v) {
    this.m.set(k, v);
  }
  get(k) {
    return this.m.get(k);
  }
  delete(k) {
    this.m.delete(k);
  }
}
const sharedStorage = new S();

// ---- contadores de fetch por capítulo ----
const chapterFetches = new Map(); // chapter-i -> count
let providersDown = false;

// ---- traductor mock (tl-aware) ----
const parseParam = (u, k) => {
  const m = new RegExp('[?&]' + k + '=([^&]*)').exec(String(u));
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
};
const translateResp = u => {
  const q = parseParam(u, 'q');
  const tl = parseParam(u, 'tl');
  return q.split('\n').map(l => (tl === 'es' && l ? '[ES] ' + l : l));
};
const googleOk = () => !providersDown;
const siteFetch = url => {
  const u = String(url);
  if (/clients5\.google\.com/.test(u)) {
    if (!googleOk())
      return { ok: false, status: 500, url: u, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      url: u,
      json: async () => [translateResp(u).join('\n')],
    };
  }
  if (/translate\.googleapis\.com\/translate_a\/single/.test(u)) {
    if (!googleOk())
      return { ok: false, status: 500, url: u, json: async () => ({}) };
    const lines = translateResp(u);
    const segs = lines.map((l, i) => l + (i < lines.length - 1 ? '\n' : ''));
    return {
      ok: true,
      status: 200,
      url: u,
      json: async () => [segs.map(s => [s, s, null, null])],
    };
  }
  if (/mymemory|libretranslate/.test(u)) {
    return { ok: false, status: 500, url: u, json: async () => ({}) };
  }
  // ajax de capítulos (parseNovel, useNewChapterEndpoint)
  if (/\/ajax\/chapters\//.test(u)) {
    return { ok: true, status: 200, url: u, text: async () => chaptersHtml() };
  }
  // páginas de capítulo
  const ch = /\/chapter-(\d+)\//.exec(u);
  if (ch) {
    const i = Number(ch[1]);
    chapterFetches.set(i, (chapterFetches.get(i) || 0) + 1);
    return { ok: true, status: 200, url: u, text: async () => chapterPage(i) };
  }
  // búsqueda
  if (/\?s=/.test(u)) {
    return {
      ok: true,
      status: 200,
      url: u,
      text: async () => '<html><body></body></html>',
    };
  }
  // página de la novela (default)
  return { ok: true, status: 200, url: u, text: async () => novelPage() };
};

const novelPage = () => `<html><head><title>Demo</title></head><body>
<div class="summary_image"><a><img src="/cover.jpg"></a></div>
<div class="post-title"><h1>Demon Novel</h1></div>
<div class="summary__content"><p>A hero fights monsters across the new world.</p></div>
</body></html>`;

const chaptersHtml = () => {
  // Los sitios madara listan los capítulos del más reciente al más antiguo;
  // parseNovel hace reverse() al final. Empezamos por 30 para que tras el
  // reverse queden 1..30 ascendentes.
  let out = '';
  for (let i = TOTAL_CHAPTERS; i >= 1; i--) {
    out += `<div class="wp-manga-chapter"><a href="https://wuxiaworld.site/novel/demo/chapter-${i}/">Chapter ${i}: Ordeal ${i}</a></div>`;
  }
  return `<html><body>${out}</body></html>`;
};

const chapterPage = i => `<html><body>
<div class="entry-content"><div class="text-left">
<p>Chapter ${i} paragraph one about the hero.</p>
<p>Another short line ${i}.</p>
<p>Closing thoughts ${i}.</p>
</div></div></body></html>`;

const packages = {
  htmlparser2: { Parser },
  cheerio: { load: cheerio.load },
  dayjs: dayjs,
  urlencode: { encode: urlencode.encode, decode: urlencode.decode },
  '@libs/novelStatus': { NovelStatus: {} },
  '@libs/fetch': {
    fetchApi: async url => siteFetch(url),
    fetchText: async url => (await siteFetch(url)).text(),
    fetchProto: async () => ({}),
  },
  '@libs/isAbsoluteUrl': { isUrlAbsolute: () => false },
  '@libs/filterInputs': { FilterTypes: {} },
  '@libs/defaultCover': { defaultCover: '' },
  '@libs/aes': { gcm: () => ({}) },
  '@libs/utils': { utf8ToBytes: () => [], bytesToUtf8: () => '' },
};
const _require = p =>
  p === '@libs/storage'
    ? {
        storage: sharedStorage,
        localStorage: { get: () => undefined },
        sessionStorage: { get: () => undefined },
      }
    : packages[p];
const initPlugin = raw => {
  try {
    return Function(
      'require',
      'module',
      'const exports = module.exports = {};' + raw + ';return exports.default',
    )(_require, {});
  } catch (e) {
    return { __e: e };
  }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (fn, ms = 15000) => {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - t0 > ms) return false;
    await sleep(40);
  }
};
const fetched = is => is.every(i => (chapterFetches.get(i) || 0) >= 1);

(async () => {
  let pass = 0,
    fail = 0;
  const check = (n, c, x) => {
    if (c) {
      pass++;
      console.log('  PASS', n);
    } else {
      fail++;
      console.log('  FAIL', n, x || '');
    }
  };

  const code = fs.readFileSync(
    '/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/.js/plugins/english/WuxiaWorldSite[madara].js',
    'utf-8',
  );
  const p = initPlugin(code);
  check(
    'init WuxiaWorldSite[madara]',
    p && !p.__e,
    p && p.__e && p.__e.message,
  );
  if (p.__e) {
    process.exit(1);
  }

  // 1) parseNovel: nombros/summary/capítulos traducidos + índice + prefetch inicial
  const novel = await p.parseNovel(NOVEL_PATH);
  check(
    'parseNovel traduce nombre',
    novel && novel.name === '[ES] Demon Novel',
    novel && novel.name,
  );
  check(
    'parseNovel traduce summary',
    novel && /\[ES\]/.test(novel.summary || ''),
    novel && novel.summary,
  );
  check(
    'parseNovel devuelve todos los capítulos',
    Array.isArray(novel.chapters) && novel.chapters.length === TOTAL_CHAPTERS,
    novel && novel.chapters && novel.chapters.length,
  );
  check(
    'parseNovel traduce nombres de capítulo',
    novel &&
      Array.isArray(novel.chapters) &&
      /\[ES\] Chapter 1/.test(novel.chapters[0].name || ''),
    novel && novel.chapters && novel.chapters[0] && novel.chapters[0].name,
  );
  const map = sharedStorage.get('es3:map');
  check(
    'indexa el mapa de capítulos en storage',
    map &&
      map.novels &&
      Array.isArray(map.novels[NOVEL_PATH]) &&
      map.novels[NOVEL_PATH].length === TOTAL_CHAPTERS,
    JSON.stringify(map && map.novels && Object.keys(map.novels)),
  );
  const okInitial = await waitFor(() => fetched([1, 2, 3, 4, 5, 6, 7]));
  check(
    'prefetch inicial de 7 capítulos en background (tras parseNovel)',
    okInitial,
    JSON.stringify([...chapterFetches.entries()]),
  );

  // 2) leer ch1 -> prefetch de los 10 siguientes (2..11) en background
  const html1 = await p.parseChapter('novel/demo/chapter-1/');
  check(
    'parseChapter devuelve traducido',
    typeof html1 === 'string' && html1.includes('[ES]'),
    html1 && html1.slice(0, 80),
  );
  const okAhead = await waitFor(() => fetched([8, 9, 10, 11]));
  check(
    'prefetch de 10 siguientes tras leer ch1 (background)',
    okAhead,
    JSON.stringify([...chapterFetches.entries()]),
  );

  // 3) relectura: cache hit, sin nuevo fetch
  const before1 = chapterFetches.get(1) || 0;
  const html1b = await p.parseChapter('novel/demo/chapter-1/');
  check(
    'relectura desde caché sin re-fetch',
    html1b === html1 && (chapterFetches.get(1) || 0) === before1,
    'count=' + chapterFetches.get(1) + ' before=' + before1,
  );

  // 4) "reinicio" de la app: nueva instancia, mismo storage persistente
  const p2 = initPlugin(code);
  const before3 = chapterFetches.get(3) || 0;
  const html3 = await p2.parseChapter('novel/demo/chapter-3/');
  check(
    'caché sobrevive reinicio (nueva instancia, mismo storage)',
    typeof html3 === 'string' &&
      html3.includes('[ES]') &&
      (chapterFetches.get(3) || 0) === before3,
    'count=' + chapterFetches.get(3) + ' before=' + before3,
  );

  // 5) proveedores caídos: devuelve original y NO cachea; reintenta después
  providersDown = true;
  const bad = await p.parseChapter('novel/demo/chapter-20/');
  const cachedBad = sharedStorage.get('es3:ch:novel/demo/chapter-20/');
  check(
    'fallo de traducción devuelve original (sin [ES])',
    typeof bad === 'string' &&
      !bad.includes('[ES]') &&
      bad.includes('paragraph one about the hero'),
    bad && bad.slice(0, 120),
  );
  check('fallo de traducción NO se cachea', !cachedBad, typeof cachedBad);
  providersDown = false;
  const before20 = chapterFetches.get(20) || 0;
  const good = await p.parseChapter('novel/demo/chapter-20/');
  const cachedGood = sharedStorage.get('es3:ch:novel/demo/chapter-20/');
  check(
    'reintento tras fallo: traduce y cachea',
    typeof good === 'string' &&
      good.includes('[ES]') &&
      cachedGood &&
      (chapterFetches.get(20) || 0) === before20 + 1,
    'count=' + chapterFetches.get(20) + ' before=' + before20,
  );

  console.log(`\nRESULTADO: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();

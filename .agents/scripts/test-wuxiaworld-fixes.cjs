// Test de los fixes del motor sobre WuxiaWorldSite[madara] compilado:
//  1) traducción completa de capítulo con párrafo gigante + mezcla
//  2) searchNovels filtra EN y ES cuando el sitio devuelve TODAS las series
const fs = require('fs');
const cheerio = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/cheerio');
const dayjs = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/dayjs');
const urlencode = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/urlencode');
const {
  Parser,
} = require('/Users/nestoralejandrochiquilche/Downloads/Ln-Reader/node_modules/htmlparser2');

// ---- mocks ----
// tl=en  -> traduce ES->EN (query de búsqueda); tl=es -> prefija [ES] (contenido).
const ES2EN = {
  'mundo marcial': 'martial world',
  'soberano de las cenizas': 'sovereign of the ashes',
};
const parseParam = (u, k) => {
  const m = new RegExp('[?&]' + k + '=([^&]*)').exec(String(u));
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
};
const toMock = (t, tl) => {
  if (tl === 'en') {
    const k = String(t || '')
      .trim()
      .toLowerCase();
    return ES2EN[k] || t;
  }
  return t ? '[ES] ' + t : t;
};
const translateResp = u => {
  const q = parseParam(u, 'q');
  const tl = parseParam(u, 'tl');
  return q.split('\n').map(l => toMock(l, tl));
};
const siteFetch = (url, searchCards) => {
  const u = String(url);
  if (/clients5\.google\.com/.test(u)) {
    return {
      ok: true,
      status: 200,
      url: u,
      json: async () => [translateResp(u).join('\n')],
    };
  }
  if (/translate\.googleapis\.com\/translate_a\/single/.test(u)) {
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
  // sitio
  if (/\/page\/\d+\/\?s=/.test(u)) {
    return { ok: true, status: 200, url: u, text: async () => searchCards };
  }
  // capítulo / cualquier otra página
  return { ok: true, status: 200, url: u, text: async () => chapterPage };
};

// sitio "devuelve todas las series" en search (30 cards)
const TITLES = [
  'Martial World',
  'Overgeared',
  'The Beginning After The End',
  'Absolute Resonance',
  'A Will Eternal',
  'Second God King',
  'Sovereign of the Ashes',
];
function makeSearchPage(n) {
  let cards = '';
  for (let i = 0; i < n; i++) {
    const t = TITLES[i % TITLES.length] + (i >= TITLES.length ? ' ' + i : '');
    cards += `<div class="page-item-detail">
      <div class="item-thumb"><a href="/novel/${t.replace(/\s+/g, '-').toLowerCase()}"><img src="/img/${i}.jpg"></a></div>
      <div class="post-title"><h3><a href="/novel/${t.replace(/\s+/g, '-').toLowerCase()}">${t}</a></h3></div>
    </div>`;
  }
  return `<html><body>${cards}</body></html>`;
}

// capítulo con párrafo gigante (3800+ chars, sin \n) + varios párrafos cortos
const giant =
  'Giant paragraph start ' +
  'the quick brown fox jumps over the lazy dog and keeps going. '.repeat(90);
const chapterPage = `<html><body><div class="post-title"><h1>Chapter 1</h1></div>
<div class="entry-content"><div class="text-left">
<p>${giant}</p>
<p>Second novel paragraph with a known idiom.</p>
<p>Third one, short and clear.</p>
</div></div></body></html>`;

const packages = {
  htmlparser2: { Parser },
  cheerio: { load: cheerio.load },
  dayjs: dayjs,
  urlencode: { encode: urlencode.encode, decode: urlencode.decode },
  '@libs/novelStatus': { NovelStatus: {} },
  '@libs/fetch': {
    fetchApi: async url => siteFetch(url, makeSearchPage(30)),
    fetchText: async url => (await siteFetch(url, makeSearchPage(30))).text(),
    fetchProto: async () => ({}),
  },
  '@libs/isAbsoluteUrl': { isUrlAbsolute: () => false },
  '@libs/filterInputs': { FilterTypes: {} },
  '@libs/defaultCover': { defaultCover: '' },
  '@libs/aes': { gcm: () => ({}) },
  '@libs/utils': { utf8ToBytes: () => [], bytesToUtf8: () => '' },
};
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

  // ---- SEARCH ----
  const es = await p.searchNovels('mundo marcial', 1);
  check(
    'search ES devuelve solo la serie',
    Array.isArray(es) &&
      es.length === 1 &&
      /\[ES\] Martial World/.test(es[0].name),
    JSON.stringify(es && es.map(n => n.name)),
  );
  const en = await p.searchNovels('overgeared', 1);
  check(
    'search EN devuelve solo la serie',
    Array.isArray(en) &&
      en.length === 1 &&
      /\[ES\] Overgeared/.test(en[0].name),
    JSON.stringify(en && en.map(n => n.name)),
  );

  // ---- CHAPTER (giant paragraph) ----
  // parseChapter devuelve el HTML interno de .text-left (sin el wrapper).
  const html = await p.parseChapter('/novel/demo/1');
  const $H = cheerio.load(html);
  const ps = $H('p').toArray();
  const allEs = ps.length > 0 && ps.every(el => $H(el).text().includes('[ES]'));
  check(
    'todos los párrafos traducidos (sin resto EN)',
    allEs,
    ps.map(el => $H(el).text().slice(0, 40)),
  );
  const firstLen = ps.length ? $H(ps[0]).text().trim().length : 0;
  check(
    'párrafo gigante traducido completo (no truncado)',
    firstLen > 3000,
    'len=' + firstLen,
  );

  console.log(`\nRESULTADO: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();

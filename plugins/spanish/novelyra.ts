import { Plugin } from '@/types/plugin';

import { FilterTypes, Filters } from '@libs/filterInputs';

import { fetchApi } from '@libs/fetch';

import { load as loadCheerio } from 'cheerio';

const SITE = 'https://novelyra.com/';

// Configuración de traducción universal
type TranslationConfig = {
  enabled: boolean;
  provider: 'google' | 'deepl' | 'libretranslate';
  targetLang: string;
  sourceLang: string;
  apiKey?: string;
  batchSize: number;
  cacheEnabled: boolean;
  fallbackProvider?: 'google' | 'deepl' | 'libretranslate';
};

const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  enabled: true,
  provider: 'google',
  targetLang: 'es',
  sourceLang: 'auto',
  batchSize: 10,
  cacheEnabled: true,
  fallbackProvider: 'libretranslate',
};

// Cache de traducciones en memoria
const translationCache = new Map<string, string>();

// Utilidades de normalización
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getSearchTerms(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

// Palabras vacías EN/ES: si cuentan para el filtro, una búsqueda como
// "the" o "lord of" devuelve medio catálogo en vez de la novela pedida.
const SEARCH_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'of',
  'and',
  'or',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'from',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'my',
  'his',
  'her',
  'our',
  'their',
  'your',
  'me',
  'him',
  'us',
  'them',
  'no',
  'not',
  'so',
  'but',
  'if',
  'then',
  'than',
  'too',
  'up',
  'out',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'de',
  'del',
  'al',
  'en',
  'y',
  'o',
  'u',
  'que',
  'se',
  'su',
  'sus',
  'mi',
  'mis',
  'tu',
  'tus',
  'con',
  'por',
  'para',
  'como',
  'mas',
  'es',
  'son',
  'fue',
  'fueron',
  'era',
  'eran',
  'esta',
  'estan',
  'hay',
  'este',
  'estos',
  'estas',
  'ese',
  'esa',
  'esos',
  'esas',
  'lo',
  'le',
  'les',
  'te',
  'nos',
  'si',
  'ni',
  'pero',
  'porque',
  'cuando',
  'donde',
  'muy',
  'tambien',
  'solo',
  'entre',
  'hasta',
  'desde',
  'sobre',
  'tras',
  'ante',
  'bajo',
  'contra',
  'hacia',
  'segun',
  'sin',
]);

function getSignificantTerms(text: string): string[] {
  return getSearchTerms(text).filter(
    term => term.length > 1 && !SEARCH_STOPWORDS.has(term),
  );
}

function searchTermsMatch(title: string, query: string): boolean {
  const normalizedTitle = normalizeText(title);
  const normalizedQuery = normalizeText(query);

  if (!normalizedTitle || !normalizedQuery) {
    return false;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return true;
  }

  const terms = getSignificantTerms(query);

  if (!terms.length) {
    // La búsqueda eran solo palabras vacías ("the", "de"...):
    // no hay nada significativo que matchear, devolver false
    // evita entregar el catálogo entero.
    return false;
  }

  return terms.every(term => normalizedTitle.includes(term));
}

function searchScore(title: string, query: string): number {
  const normalizedTitle = normalizeText(title);
  const normalizedQuery = normalizeText(query);

  if (!normalizedTitle || !normalizedQuery) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 1000;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 800;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 600;
  }

  const terms = getSignificantTerms(query);

  const matchingTerms = terms.filter(term =>
    normalizedTitle.includes(term),
  ).length;

  return matchingTerms * 100;
}

// Traducción universal con soporte multi-proveedor y cache
async function translateText(
  text: string,
  targetLang = 'es',
  sourceLang = 'auto',
  config: TranslationConfig = DEFAULT_TRANSLATION_CONFIG,
): Promise<string> {
  const normalized = text.trim();

  if (!normalized) {
    return '';
  }

  const cacheKey = `${sourceLang}:${targetLang}:${normalized}`;

  if (config.cacheEnabled && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const providers = [
    {
      name: config.provider,
      url: getProviderUrl(
        config.provider,
        normalized,
        sourceLang,
        targetLang,
        config.apiKey,
      ),
    },
    ...(config.fallbackProvider
      ? [
          {
            name: config.fallbackProvider,
            url: getProviderUrl(
              config.fallbackProvider,
              normalized,
              sourceLang,
              targetLang,
              config.apiKey,
            ),
          },
        ]
      : []),
  ];

  for (const provider of providers) {
    try {
      const res = await fetchApi(provider.url);

      if (!res.ok) {
        continue;
      }

      const json = await res.json();
      const translated = extractTranslation(json, provider.name);

      if (translated && translated !== normalized) {
        if (config.cacheEnabled) {
          translationCache.set(cacheKey, translated);
        }
        return translated;
      }
    } catch {
      // Try next provider
    }
  }

  return text; // Fallback to original
}

function getProviderUrl(
  provider: string,
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey?: string,
): string {
  const encoded = encodeURIComponent(text);

  switch (provider) {
    case 'google':
      return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;
    case 'deepl':
      return `https://api-free.deepl.com/v2/translate?auth_key=${apiKey}&text=${encodeURIComponent(text)}&target_lang=${targetLang.toUpperCase()}&source_lang=${sourceLang === 'auto' ? '' : sourceLang}`;
    case 'libretranslate':
      return `https://libretranslate.de/translate?q=${encodeURIComponent(text)}&source=${sourceLang}&target=${targetLang}&format=text`;
    default:
      return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;
  }
}

function extractTranslation(json: unknown, provider: string): string | null {
  try {
    switch (provider) {
      case 'google':
        if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
          return json[0]
            .map((item: unknown[]) => item[0])
            .filter(Boolean)
            .join('');
        }
        break;
      case 'deepl':
        if (
          typeof json === 'object' &&
          json !== null &&
          'translations' in json
        ) {
          return (
            (json as { translations: { text: string }[] }).translations[0]
              ?.text || null
          );
        }
        break;
      case 'libretranslate':
        if (
          typeof json === 'object' &&
          json !== null &&
          'translatedText' in json
        ) {
          return (json as { translatedText: string }).translatedText;
        }
        break;
    }
  } catch {
    // Ignore extraction errors
  }
  return null;
}

async function translateParagraphs(
  paragraphs: string[],
  _config: TranslationConfig = DEFAULT_TRANSLATION_CONFIG,
): Promise<string[]> {
  const translatedParagraphs: string[] = [];

  let currentBatch = '';

  for (const paragraph of paragraphs) {
    const normalizedParagraph = paragraph.trim();

    if (!normalizedParagraph) {
      continue;
    }

    const separator = currentBatch === '' ? '' : '\n';

    if (
      `${currentBatch}${separator}${normalizedParagraph}`.length > 2000 // MAX_TRANSLATION_CHARS
    ) {
      if (currentBatch !== '') {
        const translatedBatch = await translateText(
          currentBatch,
          undefined,
          undefined,
          DEFAULT_TRANSLATION_CONFIG,
        );

        // Si la traducción falló (devolvió el mismo texto o vacío), usar el original
        const batchResult =
          translatedBatch && translatedBatch !== currentBatch
            ? translatedBatch
            : currentBatch;

        translatedParagraphs.push(
          ...batchResult
            .split(/\n+/)
            .map(text => text.trim())
            .filter(Boolean),
        );
      }

      currentBatch = normalizedParagraph;
    } else {
      currentBatch =
        currentBatch === ''
          ? normalizedParagraph
          : `${currentBatch}\n${normalizedParagraph}`;
    }
  }

  if (currentBatch !== '') {
    const translatedBatch = await translateText(
      currentBatch,
      undefined,
      undefined,
      DEFAULT_TRANSLATION_CONFIG,
    );

    // Si la traducción falló (devolvió el mismo texto o vacío), usar el original
    const batchResult =
      translatedBatch && translatedBatch !== currentBatch
        ? translatedBatch
        : currentBatch;

    translatedParagraphs.push(
      ...batchResult
        .split(/\n+/)
        .map(text => text.trim())
        .filter(Boolean),
    );
  }

  return translatedParagraphs;
}

async function translateShortText(text: string): Promise<string> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return '';
  }

  return translateText(normalizedText);
}

async function translateTitles(titles: string[]): Promise<string[]> {
  return Promise.all(titles.map(title => translateShortText(title)));
}

// Limpieza avanzada de texto para TTS
function cleanTextForTts(text: string): string {
  return (
    text
      // Eliminar caracteres invisibles
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
      // Normalizar barras múltiples
      .replace(/[\\/]{2,}/g, '')
      // Normalizar guiones
      .replace(/[—––─]/g, '-')
      // Eliminar caracteres decorativos
      .replace(/[*_~|•♦¤°]/g, '')
      // Normalizar puntos suspensivos
      .replace(/\.{4,}/g, '...')
      // Normalizar espacios múltiples
      .replace(/ {2,}/g, ' ')
      // Normalizar saltos de línea múltiples
      .replace(/\n\s*\n/g, '\n')
      .trim()
  );
}

// Parsear tiempo relativo a fecha absoluta
function parseRelativeTime(text: string): Date | null {
  const match = text.match(
    /\b(\d+)\s+(day|days|week|weeks|month|months|year|years|día|días|semana|semanas|mes|meses|año|años)\s+ago\b/i,
  );

  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const now = new Date();

  if (unit.startsWith('day') || unit.startsWith('día')) {
    return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
  }
  if (unit.startsWith('week') || unit.startsWith('semana')) {
    return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
  }
  if (unit.startsWith('month') || unit.startsWith('mes')) {
    return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
  }
  if (unit.startsWith('year') || unit.startsWith('año')) {
    return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
  }

  return null;
}

// Extraer número de capítulo de URL
function extractChapterNumberFromUrl(url: string): number | null {
  const match = url.match(/\/chapter-(\d+)(?:\/)?(?:[?#].*)?$/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Indica si alguna de las clases de un elemento corresponde a un
 * bloque de publicidad/sidebar/relacionados, comparando por TOKEN
 * completo (delimitado por guiones), no por substring suelto.
 *
 * Motivo del fix: usar un selector como `[class*="ad"]` also matches
 * clases como "prose-reading" (contiene "ad" dentro de "re-AD-ing"),
 * lo que borraba por accidente el propio contenedor del capítulo.
 * Con esta función, "ad" solo cuenta si aparece como su propio
 * segmento separado por guiones (ej. "nv-ad", "chapter-ad-top"),
 * nunca como parte de otra palabra como "reading".
 */
function hasNoiseClass(classAttr: string | undefined): boolean {
  if (!classAttr) return false;

  const keywords = /(^|-)(ad|sidebar|related|recommend)(-|$)/i;

  return classAttr.split(/\s+/).some(token => keywords.test(token));
}

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';

  name = 'Novelyra';

  icon = 'https://novelyra.com/favicon.ico';

  site = SITE;

  version = '2.6.14'; // Fix portada: prioriza alt+ruta /uploads/covers, og:image genérico al final

  filters: Filters = {
    genres: {
      type: FilterTypes.Picker,

      label: 'Géneros',

      value: '',

      options: [
        { label: 'Todos', value: '' },
        { label: 'Acción', value: 'accion' },
        { label: 'Aventura', value: 'aventura' },
        { label: 'Fantasía', value: 'fantasy' },
        {
          label: 'Artes Marciales',
          value: 'martial-arts',
        },
        { label: 'Harén', value: 'harem' },
        { label: 'Romance', value: 'romance' },
        {
          label: 'Sobrenatural',
          value: 'supernatural',
        },
        {
          label: 'Xuanhuan',
          value: 'xuanhuan',
        },
        {
          label: 'Xianxia',
          value: 'xianxia',
        },
        { label: 'Comedia', value: 'comedy' },
        {
          label: 'Ciencia Ficción',
          value: 'sci-fi',
        },
        {
          label: 'Misterio',
          value: 'mystery',
        },
        { label: 'Maduro', value: 'mature' },
        {
          label: 'Psicológico',
          value: 'psychological',
        },
        { label: 'Shounen', value: 'shounen' },
        {
          label: 'Reencarnación',
          value: 'reincarnation',
        },
        { label: 'Mecha', value: 'mecha' },
        {
          label: 'Vida Escolar',
          value: 'school-life',
        },
        { label: 'Josei', value: 'josei' },
        { label: 'Drama', value: 'drama' },
        { label: 'Urbano', value: 'urban' },
        {
          label: 'Oriental',
          value: 'eastern',
        },
        { label: 'Horror', value: 'horror' },
        {
          label: 'Tragedia',
          value: 'tragedy',
        },
        { label: 'Juegos', value: 'game' },
      ],
    },
  } satisfies Filters;

  private extractNovels(
    loadedCheerio: ReturnType<typeof loadCheerio>,
  ): (Plugin.NovelItem & {
    sourceName: string;
  })[] {
    const novels: (Plugin.NovelItem & {
      sourceName: string;
    })[] = [];

    const novelLinks = loadedCheerio('main a[href]').filter(
      function (_, element) {
        const href = loadedCheerio(element).attr('href')?.trim() || '';
        const hasImage = loadedCheerio(element).find('img').length > 0;
        const hasTitle =
          loadedCheerio(element).find('h3, h2, [class*="title"]').length > 0;
        return !!(href && hasImage && hasTitle);
      },
    );

    novelLinks.each((_, element) => {
      const link = loadedCheerio(element);

      const title = link.find('h3').first().length
        ? link.find('h3').first()
        : link.find('h2').first().length
          ? link.find('h2').first()
          : link.find('[class*="title"]').first();

      if (!title.length) {
        return;
      }

      const sourceName = title.text().trim();

      const rawPath = link.attr('href')?.trim() || '';

      if (!sourceName || !rawPath) {
        return;
      }

      if (rawPath.startsWith('http') && !rawPath.startsWith(this.site)) {
        return;
      }

      let path = rawPath;

      if (path.startsWith(this.site)) {
        path = path.slice(this.site.length);
      }

      path = path.replace(/^\/+/, '').replace(/\/$/, '');

      if (!path || novels.some(item => item.path === path)) {
        return;
      }

      const image = link.find('img').first();

      let cover =
        image.attr('src')?.trim() ||
        image.attr('data-src')?.trim() ||
        image.attr('data-lazy-src')?.trim() ||
        '';

      if (cover && cover.startsWith('/')) {
        cover = `${this.site}${cover.slice(1)}`;
      }

      novels.push({
        name: sourceName,
        sourceName,
        path,
        cover,
      });
    });

    return novels;
  }

  private async finalizeNovels(
    novels: (Plugin.NovelItem & {
      sourceName: string;
    })[],
  ): Promise<Plugin.NovelItem[]> {
    const translatedTitles = await translateTitles(
      novels.map(novel => novel.sourceName),
    );

    return novels.map((novel, index) => ({
      name: translatedTitles[index] || novel.sourceName,
      path: novel.path,
      cover: novel.cover,
    }));
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels, filters }: Plugin.PopularNovelsOptions<Filters>,
  ): Promise<Plugin.NovelItem[]> {
    const page = Math.max(1, pageNo || 1);

    const genre = filters?.genres?.value as string | undefined;

    let url: string;

    if (genre) {
      url = `${this.site}genre/${encodeURIComponent(genre)}?page=${page}`;
    } else if (showLatestNovels) {
      url = page === 1 ? this.site : `${this.site}?page=${page}`;
    } else {
      url = page === 1 ? this.site : `${this.site}?page=${page}`;
    }

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    const novels = this.extractNovels(loadedCheerio);

    return this.finalizeNovels(novels);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const query = searchTerm.trim();

    if (!query) {
      return [];
    }

    const englishQuery = (await translateTextToEnglish(query)).trim();

    const sourceQuery =
      englishQuery &&
      normalizeSearchText(englishQuery) !== normalizeSearchText(query)
        ? englishQuery
        : query;

    const page = Math.max(1, pageNo || 1);

    const pageSuffix = page > 1 ? `&page=${page}` : '';

    // El sitio expone su catálogo en /browse (ver /browse?status=... indexado);
    // /search?q= no está confirmado: se intenta primero y, si no trae nada útil,
    // se respalda con /browse?q=. El filtro estricto de abajo protege de traer
    // el catálogo entero en cualquier caso.
    const urls = [
      `${this.site}search?q=${encodeURIComponent(sourceQuery)}${pageSuffix}`,
      `${this.site}browse?q=${encodeURIComponent(sourceQuery)}${pageSuffix}`,
    ];

    const queryCandidates = [query, sourceQuery].filter(Boolean);

    const matchesQuery = (title: string): boolean =>
      queryCandidates.some(candidate => searchTermsMatch(title, candidate));

    const seenPaths = new Set<string>();
    const novels: (Plugin.NovelItem & {
      sourceName: string;
    })[] = [];
    let firstError: unknown = null;

    for (const url of urls) {
      try {
        const result = await fetchApi(url);

        if (!result.ok) {
          continue;
        }

        const body = await result.text();
        const found = this.extractNovels(loadCheerio(body));

        for (const novel of found) {
          if (novel.path && !seenPaths.has(novel.path)) {
            seenPaths.add(novel.path);
            novels.push(novel);
          }
        }

        // Si ya hay candidatos que matchean, no pedir la segunda URL.
        if (novels.some(novel => matchesQuery(novel.sourceName))) {
          break;
        }
      } catch (error) {
        if (!firstError) {
          firstError = error;
        }
      }
    }

    if (!novels.length && firstError) {
      throw firstError;
    }

    const scored = novels
      .map(novel => {
        const scores = queryCandidates.map(candidate => ({
          candidate,
          score: searchScore(novel.sourceName, candidate),
          matches: searchTermsMatch(novel.sourceName, candidate),
        }));

        const best = scores.reduce(
          (current, value) => (value.score > current.score ? value : current),
          {
            candidate: '',
            score: 0,
            matches: false,
          },
        );

        return {
          novel,
          score: best.score,
          matches: best.matches,
        };
      })
      .filter(item => item.matches && item.score > 0)
      .sort((a, b) => b.score - a.score);

    return this.finalizeNovels(scored.map(item => item.novel));
  }

  private extractSynopsis(
    loadedCheerio: ReturnType<typeof loadCheerio>,
  ): string {
    const synopsisElement = loadedCheerio('#synopsis').first().length
      ? loadedCheerio('#synopsis').first()
      : loadedCheerio('section:contains("Synopsis")').first().length
        ? loadedCheerio('section:contains("Synopsis")').first()
        : loadedCheerio(
            '[class*="synopsis"], [class*="description"], [class*="summary"]',
          ).first();

    if (!synopsisElement.length) {
      return '';
    }

    synopsisElement.find('button, script, style, nav').remove();

    synopsisElement.find('br').replaceWith('\n');

    synopsisElement.find('p, div').each((_, element) => {
      const current = loadedCheerio(element).text();

      if (current.trim() && !current.endsWith('\n')) {
        loadedCheerio(element).append('\n');
      }
    });

    const lines = synopsisElement
      .text()
      .split(/\r?\n/)
      .map(line =>
        line
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean);

    if (!lines.length) {
      return '';
    }

    const premiseIndex = lines.findIndex(line => /^Premise\s*:/i.test(line));

    let summaryLines = premiseIndex >= 0 ? lines.slice(premiseIndex) : lines;

    summaryLines = summaryLines.filter(
      line =>
        !/^Author\s*:/i.test(line) &&
        !/^Genre\s*:/i.test(line) &&
        !/^Status\s*:/i.test(line) &&
        !/^Platform\s*:/i.test(line) &&
        !/^Core Theme\s*:/i.test(line) &&
        !/^Type\s*:/i.test(line) &&
        !/^Year\s*:/i.test(line) &&
        !/^Chapters\s*:/i.test(line) &&
        !/^Views\s*:/i.test(line) &&
        !/^Rating\s*:/i.test(line),
    );

    const stopIndex = summaryLines.findIndex(
      line =>
        /^Why\s+/i.test(line) ||
        /^What\s+Makes\s+/i.test(line) ||
        /^Why\s+".+"\s+is\s+Different/i.test(line) ||
        /^You\s+May\s+Also\s+Like/i.test(line),
    );

    if (stopIndex >= 0) {
      summaryLines = summaryLines.slice(0, stopIndex);
    }

    return summaryLines.join('\n');
  }

  private extractChaptersFromHtml(
    loadedCheerio: ReturnType<typeof loadCheerio>,
  ): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];

    loadedCheerio('a[href*="/chapter-"]').each((_, element) => {
      const link = loadedCheerio(element);

      const rawChapterPath = link.attr('href')?.trim() || '';

      if (!rawChapterPath) {
        return;
      }

      const chapterNumber = extractChapterNumberFromUrl(rawChapterPath);

      if (chapterNumber === null) {
        return;
      }

      let chapterPath = rawChapterPath;

      if (chapterPath.startsWith(this.site)) {
        chapterPath = chapterPath.slice(this.site.length);
      }

      chapterPath = chapterPath.replace(/^\/+/, '').replace(/\/$/, '');

      if (!chapterPath) {
        return;
      }

      const text = link.text().trim().replace(/\s+/g, ' ');

      let chapterName = text || `Capítulo ${chapterNumber || 0}`;

      const separatorIndex = chapterName.indexOf(' - ');

      if (separatorIndex > 0) {
        chapterName =
          chapterName.slice(0, separatorIndex).trim() ||
          `Capítulo ${chapterNumber || 0}`;
      }

      const releaseMatch = text.match(
        /\b(\d+\s+(?:day|days|week|weeks|month|months|year|years|día|días|semana|semanas|mes|meses|año|años)\s+ago)\b/i,
      );

      chapters.push({
        name: chapterName,
        path: chapterPath,
        chapterNumber: chapterNumber ?? 0,
        releaseTime: releaseMatch?.[1]
          ? parseRelativeTime(releaseMatch[1])?.toISOString()
          : undefined,
      });
    });

    return chapters;
  }

  private extractTotalPages(
    loadedCheerio: ReturnType<typeof loadCheerio>,
  ): number {
    const pageLinks = loadedCheerio(
      'nav[aria-label="Pagination"] a[href*="page="]',
    );
    let maxPage = 1;

    pageLinks.each((_, el) => {
      const href = loadedCheerio(el).attr('href') || '';
      const match = href.match(/page=(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    });

    return maxPage;
  }

  private extractCover(
    loadedCheerio: ReturnType<typeof loadCheerio>,
    title: string,
  ): string {
    // OJO: "ad"/"ads" solo cuentan como segmento delimitado ("/ads/", "-ad-"):
    // un match suelto rechazaría rutas legítimas como "/uploads/" ("uplo-ADS/").
    const BAD_SRC =
      /(logo|favicon|sprite|avatar|banner|placeholder|spinner|loading|blank|pixel|emoji|doubleclick|googlesyndication)|[/\-_.]ads?[/\-_.]/i;

    // El sitio usa un og:image / imagen genérica por defecto: no debe ganarle
    // a la portada real.
    const DEFAULT_SRC =
      /(default|noimage|no-image|nocover|no-cover|coming|empty|generic|missing)/i;

    // Señales positivas de portada real: las portadas viven en rutas como
    // /uploads/covers/cover_*.jpg con alt = título de la obra.
    const COVER_SRC = /covers?\/|cover_|poster|thumbnail/i;

    const absolutize = (url: string): string => {
      const trimmed = (url || '').trim();
      if (!trimmed) {
        return '';
      }
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
      }
      return `${this.site}${trimmed.replace(/^\/+/, '')}`;
    };

    const urlFrom = (img: any): string => {
      const candidates = [
        img.attr('data-src'),
        img.attr('data-lazy-src'),
        img.attr('data-original'),
        img.attr('src'),
      ];
      const srcset = img.attr('srcset') || img.attr('data-srcset');
      if (srcset) {
        candidates.push(srcset.split(',')[0]?.trim().split(/\s+/)[0]);
      }
      for (const candidate of candidates) {
        const url = (candidate || '').trim();
        if (
          !url ||
          url.startsWith('data:') ||
          BAD_SRC.test(url) ||
          DEFAULT_SRC.test(url)
        ) {
          continue;
        }
        return absolutize(url);
      }
      return '';
    };

    const isNoiseImg = (img: any): boolean => {
      let node: any = img;
      for (let depth = 0; depth < 3 && node && node.length; depth++) {
        if (hasNoiseClass(node.attr('class'))) {
          return true;
        }
        node = node.parent();
      }
      return false;
    };

    const isGoodImg = (img: any): boolean => {
      const width = parseInt(img.attr('width') || '', 10);
      const height = parseInt(img.attr('height') || '', 10);
      if ((width && width < 60) || (height && height < 60)) {
        return false;
      }
      if (isNoiseImg(img)) {
        return false;
      }
      return !!urlFrom(img);
    };

    const firstGood = (selection: any): string => {
      const imgs = selection.filter((_: any, el: any) =>
        isGoodImg(loadedCheerio(el)),
      );
      return imgs.length ? urlFrom(loadedCheerio(imgs.first())) : '';
    };

    // 1) Combinación ganadora: alt nombra la obra Y ruta con pinta de
    // portada (/uploads/covers/cover_*.jpg). No la confundas con portadas
    // de "también te puede gustar": esas tienen otro alt.
    const normalizedTitle = normalizeText(title);
    const hasRealTitle = !!normalizedTitle && normalizedTitle !== 'desconocido';

    const altMatchesTitle = (img: any): boolean => {
      if (!hasRealTitle) {
        return false;
      }
      const alt = normalizeText(img.attr('alt') || '');
      return (
        alt.length >= 6 &&
        (alt.includes(normalizedTitle) || normalizedTitle.includes(alt))
      );
    };

    const srcLooksCover = (img: any): boolean =>
      COVER_SRC.test(
        [
          img.attr('data-src'),
          img.attr('data-lazy-src'),
          img.attr('data-original'),
          img.attr('src'),
          img.attr('srcset'),
        ]
          .filter(Boolean)
          .join(' '),
      );

    if (hasRealTitle) {
      const byAltAndSrc = firstGood(
        loadedCheerio('main img').filter((_: any, el: any) => {
          const img = loadedCheerio(el);
          return altMatchesTitle(img) && srcLooksCover(img);
        }),
      );
      if (byAltAndSrc) {
        return byAltAndSrc;
      }

      // 2) Imagen cuyo alt nombra la obra.
      const byAlt = firstGood(
        loadedCheerio('main img').filter((_: any, el: any) =>
          altMatchesTitle(loadedCheerio(el)),
        ),
      );
      if (byAlt) {
        return byAlt;
      }
    }

    // 3) Imagen junto al h1 del título (hero de la novela), subiendo niveles.
    const h1 = loadedCheerio('h1').first();
    let scope: any = h1.parent();
    for (let depth = 0; depth < 3 && scope && scope.length; depth++) {
      const found = firstGood(scope.find('img'));
      if (found) {
        return found;
      }
      if (scope.is('main, body')) {
        break;
      }
      scope = scope.parent();
    }

    // 4) Imágenes con pinta de portada dentro del contenido principal.
    const coverLike = firstGood(
      loadedCheerio(
        'main img[src*="cover"], main img[alt*="cover"], main img[src*="poster"], main img[src*="thumbnail"], #synopsis img',
      ),
    );
    if (coverLike) {
      return coverLike;
    }

    // 5) og:image, solo si no parece la imagen genérica del sitio.
    const ogImage = loadedCheerio('meta[property="og:image"]')
      .first()
      .attr('content')
      ?.trim();
    if (
      ogImage &&
      !ogImage.startsWith('data:') &&
      !BAD_SRC.test(ogImage) &&
      !DEFAULT_SRC.test(ogImage)
    ) {
      return absolutize(ogImage);
    }

    // 6) Primera imagen decente del contenido (mejor vacío que un logo).
    return (
      firstGood(loadedCheerio('main img')) ||
      firstGood(loadedCheerio('article img')) ||
      ''
    );
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.replace(/^\/+/, '').replace(/\/$/, '');

    const url = `${this.site}${cleanPath}/`;

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    const sourceName =
      loadedCheerio('h1').first().text().trim() || 'Desconocido';

    const name = await translateShortText(sourceName);

    const cover = this.extractCover(loadedCheerio, sourceName);

    const synopsisText = loadedCheerio('#synopsis')
      .first()
      .text()
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const summarySource = this.extractSynopsis(loadedCheerio);

    let summary = summarySource;

    if (summary) {
      const summaryParagraphs = summary
        .split(/\r?\n/)
        .map(text => text.trim())
        .filter(Boolean);

      const translatedSummary = await translateParagraphs(summaryParagraphs);

      summary = translatedSummary.join('\n\n').trim() || summary;
    }

    const authorMatch = synopsisText.match(
      /Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|$)/i,
    );

    const genreMatch = synopsisText.match(
      /Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|$)/i,
    );

    const statusMatch = synopsisText.match(
      /Status:\s*(.+?)(?:\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|\s+Chapters:|$)/i,
    );

    const author = authorMatch?.[1]?.trim() || '';
    const genres = genreMatch?.[1]?.trim().replace(/\s+/g, ', ') || '';
    const status = statusMatch?.[1]?.trim() || '';

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
      summary,
      author,
      genres,
      status,
    };

    const seenPaths = new Set<string>();
    const allChapters = this.extractChaptersFromHtml(loadedCheerio);

    allChapters.forEach(ch => {
      if (ch.path) {
        seenPaths.add(ch.path);
      }
    });

    const totalPages = this.extractTotalPages(loadedCheerio);

    for (let page = 2; page <= totalPages; page++) {
      try {
        const pageUrl = `${this.site}${cleanPath}?page=${page}`;
        const pageResult = await fetchApi(pageUrl);

        if (!pageResult.ok) {
          continue;
        }

        const pageBody = await pageResult.text();
        const pageHtml = loadCheerio(pageBody);
        const pageChapters = this.extractChaptersFromHtml(pageHtml);

        for (const ch of pageChapters) {
          if (ch.path && !seenPaths.has(ch.path)) {
            seenPaths.add(ch.path);
            allChapters.push(ch);
          }
        }
      } catch {
        // Continue with next page on error
      }
    }

    allChapters.sort(
      (first, second) =>
        (first.chapterNumber ?? 0) - (second.chapterNumber ?? 0),
    );

    novel.chapters = allChapters;

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.replace(/^\/+/, '').replace(/\/$/, '');

    const url = `${this.site}${cleanPath}/`;

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const $ = loadCheerio(body);

    // 1) Quitar elementos que no aportan contenido legible
    // Los tags son seguros de quitar por nombre (no dependen de nombres de clase)
    $('script, style, iframe, ins, header, footer, aside, nav').remove();

    // FIX: antes se usaba `[class*="ad"], [class*="sidebar"], [class*="related"], [class*="recommend"]`,
    // un selector por SUBSTRING que también coincidía con clases como
    // "prose-reading" (contiene "ad" dentro de "re-AD-ing"), borrando por
    // accidente el propio #chapter-content antes de poder extraerlo.
    // Ahora solo se eliminan elementos donde "ad"/"sidebar"/"related"/"recommend"
    // aparecen como su propio segmento delimitado por guiones (ej. "nv-ad",
    // "chapter-ad-top"), nunca como parte de otra palabra.
    $('[class]').each((_, el) => {
      const $el = $(el);
      if (hasNoiseClass($el.attr('class'))) {
        $el.remove();
      }
    });

    // Eliminar solo navegación específica del capítulo (fuera del contenido)
    $('#chapter-bottom-nav, #chapter-top-nav, .chapter-nav').remove();

    // 2) Buscar el contenedor del contenido del capítulo
    const chapterContent = $('#chapter-content').first().length
      ? $('#chapter-content').first()
      : $('article').first().length
        ? $('article').first()
        : $(
              '[class*="chapter-content"], [class*="entry-content"], [class*="chapter"], [class*="content"]',
            ).first().length
          ? $(
              '[class*="chapter-content"], [class*="entry-content"], [class*="chapter"], [class*="content"]',
            ).first()
          : $('main').first().length
            ? $('main').first()
            : $('body').first();

    if (chapterContent.length === 0) {
      return 'Contenido no encontrado';
    }

    // 3) Limpiar cada nodo de texto (invisibles, símbolos, espacios)
    chapterContent
      .find('*')
      .contents()
      .each((_, element) => {
        if (element.type === 'text' && element.data) {
          const cleanedText = cleanTextForTts(element.data);
          if (element.data !== cleanedText) {
            element.data = cleanedText;
          }
        }
      });

    // 4) Eliminar contenedores que quedaron vacíos tras la limpieza
    chapterContent.find('p, div').each((_, el) => {
      const $el = $(el);
      if (!$el.text().trim()) $el.remove();
    });

    // 5) Asegurar que haya párrafos <p> bien formateados
    this.ensureReadableParagraphs($, chapterContent);

    // 6) Extraer párrafos para traducir
    const paragraphs: string[] = [];
    chapterContent.find('p').each((_, element) => {
      const text = $(element).text().trim().replace(/\s+/g, ' ');
      if (text && text.length > 10) {
        paragraphs.push(text);
      }
    });

    // 7) Traducir si hay párrafos
    if (paragraphs.length > 0) {
      const translated = await translateParagraphs(paragraphs);

      // Reemplazar el texto de cada párrafo con la traducción
      const translatedParagraphs =
        translated.length > 0 ? translated : paragraphs;
      chapterContent.find('p').each((index, element) => {
        if (index < translatedParagraphs.length) {
          $(element).text(translatedParagraphs[index]);
        }
      });
    }

    // 8) Retornar solo el HTML del contenido (no el documento completo)
    return chapterContent.html() || 'Contenido no encontrado';
  }

  /**
   * Asegura que el contenedor tenga párrafos <p> bien delimitados y de tamaño
   * razonable, reconstruyéndolos desde el texto plano si hace falta.
   */
  private ensureReadableParagraphs($: any, container: any): void {
    const MAX_PARAGRAPH_LENGTH = 1800;

    const goodParagraphs = container
      .find('p')
      .filter(
        (_: any, el: any) =>
          $(el).text().trim().length > 0 &&
          $(el).text().trim().length <= MAX_PARAGRAPH_LENGTH,
      );

    const anyParagraphs = container
      .find('p')
      .filter((_: any, el: any) => $(el).text().trim().length > 0);

    // Ya hay párrafos <p> y ninguno es demasiado largo: no hace falta tocar nada
    if (
      anyParagraphs.length > 0 &&
      goodParagraphs.length === anyParagraphs.length
    ) {
      return;
    }

    // Convertimos <br> en saltos de línea para no perder la separación visual
    container.find('br').replaceWith('\n');

    const rawText = container.text();
    const rawParagraphs = rawText
      .split(/\n+/)
      .map((p: string) => p.trim())
      .filter(Boolean);

    container.empty();

    rawParagraphs.forEach((paragraph: string) => {
      if (paragraph.length <= MAX_PARAGRAPH_LENGTH) {
        container.append(`<p>${paragraph}</p>`);
      } else {
        // FIX: antes esta regex usaba literalmente el texto
        // "MAX_PARAGRAPH_LENGTH" dentro de /.../ (no se interpola una
        // variable dentro de un literal de regex), así que el match
        // siempre fallaba y caía al fallback sin dividir. Ahora se
        // construye la regex dinámicamente con RegExp() para que el
        // número sí se use de verdad.
        const sentences = paragraph.match(
          new RegExp(`.{1,${MAX_PARAGRAPH_LENGTH}}(?:[.!?]+(?:\\s|$)|$)`, 'g'),
        ) || [paragraph];
        sentences.forEach((sentence: string) => {
          const trimmed = sentence.trim();
          if (trimmed) {
            container.append(`<p>${trimmed}</p>`);
          }
        });
      }
    });
  }
}

// Funciones de traducción expuestas para reutilización
async function translateTextToEnglish(text: string): Promise<string> {
  return translateText(text, 'en', 'auto');
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export default new Novelyra();

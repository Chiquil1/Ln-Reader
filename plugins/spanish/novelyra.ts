import { Plugin } from '@/types/plugin';

import { FilterTypes, Filters } from '@libs/filterInputs';

import { fetchApi } from '@libs/fetch';

import { load as loadCheerio } from 'cheerio';

const SITE = 'https://novelyra.com/';

// Configuración de traducción universal
interface TranslationConfig {
  enabled: boolean;
  provider: 'google' | 'deepl' | 'libretranslate';
  targetLang: string;
  sourceLang: string;
  apiKey?: string;
  batchSize: number;
  cacheEnabled: boolean;
  fallbackProvider?: 'google' | 'deepl' | 'libretranslate';
}

const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  enabled: true,
  provider: 'google',
  targetLang: 'es',
  sourceLang: 'auto',
  batchSize: 10,
  cacheEnabled: true,
  fallbackProvider: 'libretranslate',
};

const MAX_TRANSLATION_CHARS = 2000;
const MAX_PARAGRAPH_LENGTH = 1800;

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

function searchTermsMatch(title: string, queryTerms: string[]): boolean {
  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle || !queryTerms.length) {
    return false;
  }

  return queryTerms.every(term => normalizedTitle.includes(term));
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

  const terms = getSearchTerms(query);

  const matchingTerms = terms.filter(term =>
    normalizedTitle.includes(term),
  ).length;

  return matchingTerms * 100;
}

// Traducción universal con soporte multi-proveedor y cache
async function translateText(
  text: string,
  targetLang: string = 'es',
  sourceLang: string = 'auto',
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
      let translated = extractTranslation(json, provider.name);

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
  config: TranslationConfig = DEFAULT_TRANSLATION_CONFIG,
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

        translatedParagraphs.push(
          ...translatedBatch
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

    translatedParagraphs.push(
      ...translatedBatch
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

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';

  name = 'Novelyra';

  icon = 'https://novelyra.com/favicon.ico';

  site = SITE;

  version = '2.1.0';

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

  private extractNovels(loadedCheerio: ReturnType<typeof loadCheerio>): Array<
    Plugin.NovelItem & {
      sourceName: string;
    }
  > {
    const novels: Array<
      Plugin.NovelItem & {
        sourceName: string;
      }
    > = [];

    loadedCheerio('main a.group.block.min-w-0').each((_, element) => {
      const link = loadedCheerio(element);

      const title = link.find('h3').first();

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

      path = path.replace(/^\/+/, '');

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
    novels: Array<
      Plugin.NovelItem & {
        sourceName: string;
      }
    >,
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
      url =
        `${this.site}genre/` + `${encodeURIComponent(genre)}` + `?page=${page}`;
    } else {
      url = page === 1 ? this.site : `${this.site}?page=${page}`;
    }

    if (showLatestNovels) {
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

    const url =
      `${this.site}search?q=${encodeURIComponent(sourceQuery)}` +
      (page > 1 ? `&page=${page}` : '');

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    const novels = this.extractNovels(loadedCheerio);

    const queryCandidates = [query, sourceQuery].filter(Boolean);

    const scored = novels
      .map(novel => {
        const scores = queryCandidates.map(candidate => ({
          candidate,
          score: searchScore(novel.sourceName, candidate),
          matches: searchTermsMatch(
            novel.sourceName,
            getSearchTerms(candidate),
          ),
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
    const synopsisElement = loadedCheerio('#synopsis').first();

    if (!synopsisElement.length) {
      return '';
    }

    synopsisElement.find('button, script, style').remove();

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
        !/^Core Theme\s*:/i.test(line),
    );

    const stopIndex = summaryLines.findIndex(
      line =>
        /^Why\s+/i.test(line) ||
        /^What\s+Makes\s+/i.test(line) ||
        /^Why\s+".+"\s+is\s+Different/i.test(line),
    );

    if (stopIndex >= 0) {
      summaryLines = summaryLines.slice(0, stopIndex);
    }

    return summaryLines.join('\n');
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.replace(/^\/+/, '');

    const url = `${this.site}${cleanPath}`;

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    const sourceName =
      loadedCheerio('h1').first().text().trim() || 'Desconocido';

    const name = await translateShortText(sourceName);

    let cover =
      loadedCheerio('#synopsis img').first().attr('src')?.trim() ||
      loadedCheerio('main img').first().attr('src')?.trim() ||
      loadedCheerio('img').first().attr('src')?.trim() ||
      '';

    if (cover && cover.startsWith('/')) {
      cover = `${this.site}${cover.slice(1)}`;
    }

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
      /Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|$)/i,
    );

    const genreMatch = synopsisText.match(
      /Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|$)/i,
    );

    const statusMatch = synopsisText.match(
      /Status:\s*(.+?)(?:\s+Platform:|\s+Theme:|$)/i,
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

    const chapters: Plugin.ChapterItem[] = [];
    const seenPaths = new Set<string>();

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

      chapterPath = chapterPath.replace(/^\/+/, '');

      if (!chapterPath || seenPaths.has(chapterPath)) {
        return;
      }

      seenPaths.add(chapterPath);

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

    chapters.sort(
      (first, second) =>
        (first.chapterNumber ?? 0) - (second.chapterNumber ?? 0),
    );

    novel.chapters = chapters;

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.replace(/^\/+/, '');

    const url = `${this.site}${cleanPath}`;

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    loadedCheerio(
      'script, style, iframe, ins, nav, header, footer, aside',
    ).remove();

    const chapterContent = loadedCheerio('article').first();

    if (chapterContent.length === 0) {
      return 'Contenido no encontrado';
    }

    const paragraphs: string[] = [];

    chapterContent.find('p').each((_, element) => {
      const text = loadedCheerio(element).text().trim().replace(/\s+/g, ' ');

      if (text) {
        paragraphs.push(cleanTextForTts(text));
      }
    });

    if (paragraphs.length === 0) {
      const rawText = chapterContent.text().trim().replace(/\s+/g, ' ');

      if (rawText) {
        paragraphs.push(cleanTextForTts(rawText));
      }
    }

    if (paragraphs.length === 0) {
      return 'Contenido no encontrado';
    }

    const translated = await translateParagraphs(paragraphs);

    return translated
      .map(
        paragraph =>
          `<p>${paragraph.replace(/</g, '<').replace(/>/g, '>')}</p>`,
      )
      .join('');
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

import { Plugin } from '@/types/plugin';

import { FilterTypes, Filters } from '@libs/filterInputs';

import { fetchApi } from '@libs/fetch';

import { load as loadCheerio } from 'cheerio';

const SITE = 'https://novelyra.com/';

const MAX_TRANSLATION_CHARS = 2000;

async function translateText(text: string): Promise<string> {
  const normalized = text.trim();

  if (!normalized) {
    return '';
  }

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      `?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(normalized)}`;

    const res = await fetchApi(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${url}`);
    }

    const json = await res.json();

    if (json && json[0]) {
      return json[0]
        .map((item: unknown[]) => item[0])
        .filter(Boolean)
        .join('');
    }

    return normalized;
  } catch {
    return normalized;
  }
}

async function translateTextToEnglish(text: string): Promise<string> {
  const normalized = text.trim();

  if (!normalized) {
    return '';
  }

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      `?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(normalized)}`;

    const res = await fetchApi(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${url}`);
    }

    const json = await res.json();

    if (json && json[0]) {
      return json[0]
        .map((item: unknown[]) => item[0])
        .filter(Boolean)
        .join('');
    }

    return normalized;
  } catch {
    return normalized;
  }
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

function getSearchTerms(text: string): string[] {
  return normalizeSearchText(text).split(/\s+/).filter(Boolean);
}

function searchTermsMatch(title: string, queryTerms: string[]): boolean {
  const normalizedTitle = normalizeSearchText(title);

  if (!normalizedTitle || !queryTerms.length) {
    return false;
  }

  return queryTerms.every(term => normalizedTitle.includes(term));
}

function searchScore(title: string, query: string): number {
  const normalizedTitle = normalizeSearchText(title);

  const normalizedQuery = normalizeSearchText(query);

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

async function translateParagraphs(paragraphs: string[]): Promise<string[]> {
  const translatedParagraphs: string[] = [];

  let currentBatch = '';

  for (const paragraph of paragraphs) {
    const normalizedParagraph = paragraph.trim();

    if (!normalizedParagraph) {
      continue;
    }

    const separator = currentBatch === '' ? '' : '\n';

    if (
      `${currentBatch}${separator}${normalizedParagraph}`.length >
      MAX_TRANSLATION_CHARS
    ) {
      if (currentBatch !== '') {
        const translatedBatch = await translateText(currentBatch);

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
    const translatedBatch = await translateText(currentBatch);

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

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';

  name = 'Novelyra';

  icon = 'https://novelyra.com/favicon.ico';

  site = SITE;

  version = '2.0.4';

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

    /*
     * NovelYra search/browse cards use:
     *
     * <a class="group block min-w-0">
     *   ...
     *   <h3>Title</h3>
     * </a>
     *
     * This avoids collecting navigation/footer links.
     */
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

    /*
     * NovelYra uses /search?q=...
     *
     * Translate Spanish queries to English first,
     * because the source titles are predominantly English.
     */
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

    /*
     * NovelYra's server-side search can return
     * semantically related but title-irrelevant novels.
     *
     * We therefore enforce title relevance locally.
     */
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

    /*
     * Remove UI controls from the synopsis.
     */
    synopsisElement.find('button, script, style').remove();

    /*
     * Preserve line structure before turning
     * the HTML into text.
     */
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

    /*
     * Drop metadata before Premise.
     *
     * We want the actual descriptive content:
     * Premise + Original Synopsis + following
     * descriptive paragraphs.
     */
    const premiseIndex = lines.findIndex(line => /^Premise\s*:/i.test(line));

    let summaryLines = premiseIndex >= 0 ? lines.slice(premiseIndex) : lines;

    /*
     * Remove leading metadata in case the page
     * uses a slightly different ordering.
     */
    summaryLines = summaryLines.filter(
      line =>
        !/^Author\s*:/i.test(line) &&
        !/^Genre\s*:/i.test(line) &&
        !/^Status\s*:/i.test(line) &&
        !/^Platform\s*:/i.test(line) &&
        !/^Core Theme\s*:/i.test(line),
    );

    /*
     * Stop before recommendation/marketing headings
     * that are outside the actual synopsis.
     */
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

      const chapterMatch = rawChapterPath.match(
        /\/chapter-(\d+)(?:\/)?(?:[?#].*)?$/i,
      );

      if (!chapterMatch) {
        return;
      }

      const chapterNumber = Number(chapterMatch[1]);

      if (!Number.isFinite(chapterNumber)) {
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

      let chapterName = text || `Capítulo ${chapterNumber}`;

      /*
       * NovelYra:
       * "Chapter 1 - Shadow Slave Chapter 1"
       *
       * Keep just:
       * "Chapter 1"
       */
      const separatorIndex = chapterName.indexOf(' - ');

      if (separatorIndex > 0) {
        chapterName =
          chapterName.slice(0, separatorIndex).trim() ||
          `Capítulo ${chapterNumber}`;
      }

      const releaseMatch = text.match(
        /\b(\d+\s+(?:day|days|week|weeks|month|months|year|years)\s+ago)\b/i,
      );

      chapters.push({
        name: chapterName,
        path: chapterPath,
        chapterNumber,
        releaseTime: releaseMatch?.[1],
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
        paragraphs.push(text);
      }
    });

    if (paragraphs.length === 0) {
      const rawText = chapterContent.text().trim().replace(/\s+/g, ' ');

      if (rawText) {
        paragraphs.push(rawText);
      }
    }

    if (paragraphs.length === 0) {
      return 'Contenido no encontrado';
    }

    const translated = await translateParagraphs(paragraphs);

    return translated
      .map(
        paragraph =>
          `<p>${paragraph.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
      )
      .join('');
  }
}

export default new Novelyra();

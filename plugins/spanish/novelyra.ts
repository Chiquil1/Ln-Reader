import { Plugin } from '@/types/plugin';

import { FilterTypes, Filters } from '@libs/filterInputs';

import { fetchApi } from '@libs/fetch';

import { load as loadCheerio } from 'cheerio';

const SITE = 'https://novelyra.com/';

const MAX_TRANSLATION_CHARS = 2000;

async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      `?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;

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

    return text;
  } catch {
    return text;
  }
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

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';

  name = 'Novelyra';

  icon = 'https://novelyra.com/favicon.ico';

  site = SITE;

  version = '2.0.2';

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
        { label: 'Artes Marciales', value: 'martial-arts' },
        { label: 'Harén', value: 'harem' },
        { label: 'Romance', value: 'romance' },
        { label: 'Sobrenatural', value: 'supernatural' },
        { label: 'Xuanhuan', value: 'xuanhuan' },
        { label: 'Xianxia', value: 'xianxia' },
        { label: 'Comedia', value: 'comedy' },
        { label: 'Ciencia Ficción', value: 'sci-fi' },
        { label: 'Misterio', value: 'mystery' },
        { label: 'Maduro', value: 'mature' },
        { label: 'Psicológico', value: 'psychological' },
        { label: 'Shounen', value: 'shounen' },
        { label: 'Reencarnación', value: 'reincarnation' },
        { label: 'Mecha', value: 'mecha' },
        { label: 'Vida Escolar', value: 'school-life' },
        { label: 'Josei', value: 'josei' },
        { label: 'Drama', value: 'drama' },
        { label: 'Urbano', value: 'urban' },
        { label: 'Oriental', value: 'eastern' },
        { label: 'Horror', value: 'horror' },
        { label: 'Tragedia', value: 'tragedy' },
        { label: 'Juegos', value: 'game' },
      ],
    },
  } satisfies Filters;

  private loadNovels(
    loadedCheerio: ReturnType<typeof loadCheerio>,
  ): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('main h3').each((_, element) => {
      const title = loadedCheerio(element);

      const link = title.closest('a');

      if (!link.length) {
        return;
      }

      const name = title.text().trim();

      const rawPath = link.attr('href')?.trim() || '';

      if (!name || !rawPath) {
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

      if (!path) {
        return;
      }

      const image = link.find('img').first();

      const cover =
        image.attr('src')?.trim() ||
        image.attr('data-src')?.trim() ||
        image.attr('data-lazy-src')?.trim() ||
        '';

      if (novels.some(item => item.path === path)) {
        return;
      }

      novels.push({
        name,
        path,
        cover,
      });
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels, filters }: Plugin.PopularNovelsOptions<Filters>,
  ): Promise<Plugin.NovelItem[]> {
    const page = Math.max(1, pageNo || 1);

    const genre = filters?.genres?.value as string | undefined;

    let url: string;

    if (genre) {
      url = `${this.site}genre/${encodeURIComponent(genre)}` + `?page=${page}`;
    } else {
      url = `${this.site}?page=${page}`;
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

    return this.loadNovels(loadedCheerio);
  }

  async searchNovels(
    searchTerm: string,
    _pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const url = `${this.site}?search=${encodeURIComponent(query)}`;

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${url}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    return this.loadNovels(loadedCheerio);
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

    const name = loadedCheerio('h1').first().text().trim() || 'Desconocido';

    const cover =
      loadedCheerio('main img').first().attr('src')?.trim() ||
      loadedCheerio('img').first().attr('src')?.trim() ||
      '';

    const synopsis = loadedCheerio('#synopsis')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ');

    let summary = synopsis;

    if (summary) {
      const titlePrefix = `${name}:`;

      if (summary.startsWith(titlePrefix)) {
        summary = summary.slice(titlePrefix.length).trim();
      }

      summary = summary.replace(/^Information\s*&\s*Overview\s*/i, '').trim();
    }

    const authorMatch = synopsis.match(
      /Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|$)/i,
    );

    const genreMatch = synopsis.match(
      /Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|$)/i,
    );

    const statusMatch = synopsis.match(
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

    // El contenido real del capítulo está dentro de <article>.
    // Eliminamos elementos que no forman parte del texto.
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

      if (!text) {
        return;
      }

      paragraphs.push(text);
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

    // Utiliza el traductor integrado del plugin.
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

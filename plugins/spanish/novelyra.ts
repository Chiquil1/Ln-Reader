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
      `https://translate.googleapis.com/translate_a/single` +
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

    loadedCheerio(
      '#novelas .novel-card, .novels-grid .novel-card, .novel-card',
    ).each((_, element) => {
      const novel = loadedCheerio(element);

      const name =
        novel.find('h3').first().text().trim() ||
        novel.find('.novel-title').first().text().trim();

      const rawPath = novel.find('a').first().attr('href')?.trim() || '';

      const path = rawPath.replace(this.site, '');

      const cover = novel.find('img').first().attr('src')?.trim() || '';

      if (!name || !path) {
        return;
      }

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

    const cover = loadedCheerio('img').first().attr('src')?.trim() || '';

    const genres = loadedCheerio('.novel-meta .novel-genres')
      .text()
      .trim()
      .replace(/\s+/g, ', ');

    const summary = loadedCheerio('.novel-description-detail').text().trim();

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
      genres,
      summary,
    };

    const chapters: Plugin.ChapterItem[] = [];

    loadedCheerio('.chapter-item-wrapper').each((_, element) => {
      const chapter = loadedCheerio(element);

      const rawChapterPath =
        chapter.find('a').first().attr('href')?.trim() || '';

      const chapterPath = rawChapterPath.replace(this.site, '');

      if (!chapterPath) {
        return;
      }

      const numberText = chapter.find('.chapter-number').text().trim();

      const numberMatch = numberText.match(/(\d+)/);

      const chapterNumber = numberMatch
        ? Number(numberMatch[1])
        : chapters.length + 1;

      const chapterName =
        chapter.find('.chapter-title').text().trim() ||
        numberText ||
        `Capítulo ${chapterNumber}`;

      const releaseTime = chapter.find('.chapter-date').text().trim();

      chapters.push({
        name: chapterName,
        path: chapterPath,
        chapterNumber,
        releaseTime: releaseTime || undefined,
      });
    });

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

    loadedCheerio('script, style, iframe, ins, .chapter-ad').remove();

    const chapterContent = loadedCheerio('.chapter-content').first();

    if (chapterContent.length === 0) {
      return 'Contenido no encontrado';
    }

    const paragraphs: string[] = [];

    chapterContent.find('p').each((_, element) => {
      const text = loadedCheerio(element).text().trim();

      if (text) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length === 0) {
      const rawText = chapterContent.text().trim();

      if (rawText) {
        paragraphs.push(
          ...rawText
            .split(/\n+/)
            .map(text => text.trim())
            .filter(Boolean),
        );
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

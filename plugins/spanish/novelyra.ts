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
      throw new Error(`HTTP ${res.status}`);
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

  version = '2.0.0';

  filters: Filters = {
    genres: {
      type: FilterTypes.Picker,
      label: 'Géneros',
      value: '',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Acción', value: 'accion' },
        { label: 'Aventura', value: 'aventura' },
        { label: 'Fantasía', value: 'fantasia' },
        { label: 'Artes Marciales', value: 'artes-marciales' },
        { label: 'Harén', value: 'haren' },
        { label: 'Romance', value: 'romance' },
        { label: 'Sobrenatural', value: 'sobrenatural' },
        { label: 'Xuanhuan', value: 'xuanhuan' },
        { label: 'Xianxia', value: 'xianxia' },
        { label: 'Comedia', value: 'comedia' },
        { label: 'Ciencia Ficción', value: 'ciencia-ficcion' },
        { label: 'Misterio', value: 'misterio' },
        { label: 'Maduro', value: 'maduro' },
        { label: 'Psicológico', value: 'psicologico' },
        { label: 'Shounen', value: 'shounen' },
        { label: 'Reencarnación', value: 'reencarnacion' },
        { label: 'Mecha', value: 'mecha' },
        { label: 'Vida Escolar', value: 'vida-escolar' },
        { label: 'Josei', value: 'josei' },
        { label: 'Drama', value: 'drama' },
        { label: 'Urbano', value: 'urbano' },
        { label: 'Oriental', value: 'oriental' },
        { label: 'Horror', value: 'horror' },
        { label: 'Tragedia', value: 'tragedia' },
        { label: 'Juegos', value: 'juegos' },
      ],
    },

    browse: {
      type: FilterTypes.Picker,
      label: 'Novelas Populares',
      value: 'browse.php',
      options: [
        {
          label: 'Todas las Novelas',
          value: 'browse.php',
        },
        {
          label: '🔥 Hoy',
          value: 'popular.php?period=today',
        },
        {
          label: '📅 Este Mes',
          value: 'popular.php?period=month',
        },
        {
          label: '👑 De Siempre',
          value: 'popular.php?period=alltime',
        },
      ],
    },
  } satisfies Filters;

  private loadNovels(
    loadedCheerio: ReturnType<typeof loadCheerio>,
    selector: string,
  ): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    loadedCheerio(selector).each((_, element) => {
      const novel = loadedCheerio(element);

      const name =
        novel.find('h3').first().text().trim() ||
        novel.find('.novel-title').first().text().trim();

      const path =
        novel.find('a').first().attr('href')?.trim().replace(this.site, '') ||
        '';

      const cover = novel.find('img').first().attr('src')?.trim() || '';

      if (!name || !path) {
        return;
      }

      const duplicate = novels.some(item => item.path === path);

      if (!duplicate) {
        novels.push({
          name,
          path,
          cover,
        });
      }
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { showLatestNovels, filters }: Plugin.PopularNovelsOptions<Filters>,
  ): Promise<Plugin.NovelItem[]> {
    let url = this.site;

    let selector = '#novelas .novel-card';

    const genre = filters?.genres?.value as string | undefined;

    const browse = filters?.browse?.value as string | undefined;

    if (!showLatestNovels) {
      if (browse?.startsWith('popular.php')) {
        url = `${this.site}${browse}`;

        selector = '.popular-item';
      } else {
        const params = new URLSearchParams();

        params.append('page', String(pageNo));

        if (genre) {
          params.append('genre', genre);
        }

        url = `${this.site}${browse || 'browse.php'}` + `?${params.toString()}`;

        selector = '.novels-grid .novel-card';
      }
    }

    const result = await fetchApi(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    return this.loadNovels(loadedCheerio, selector);
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
      throw new Error(`HTTP ${result.status}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    return this.loadNovels(loadedCheerio, '#novelas .novel-card');
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.replace(/^\/+/, '');

    const result = await fetchApi(`${this.site}${cleanPath}`);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
    }

    const body = await result.text();

    const loadedCheerio = loadCheerio(body);

    const name = loadedCheerio('h1').first().text().trim() || 'Desconocido';

    const cover =
      loadedCheerio('.novel-cover img').first().attr('src')?.trim() ||
      loadedCheerio('img').first().attr('src')?.trim() ||
      '';

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
    };

    const genres = loadedCheerio('.novel-meta .novel-genres')
      .text()
      .trim()
      .replace(/\s+/g, ', ');

    if (genres) {
      novel.genres = genres;
    }

    const summary = loadedCheerio('.novel-description-detail').text().trim();

    if (summary) {
      novel.summary = summary;
    }

    const chapters: Plugin.ChapterItem[] = [];

    loadedCheerio('.chapter-item-wrapper').each((_, element) => {
      const chapter = loadedCheerio(element);

      const chapterPath =
        chapter.find('a').first().attr('href')?.trim().replace(this.site, '') ||
        '';

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

      const chapterDate = chapter.find('.chapter-date').text().trim();

      const item: Plugin.ChapterItem = {
        name: chapterName,
        path: chapterPath,
        chapterNumber,
      };

      if (chapterDate) {
        try {
          const parsedDate = new Date(chapterDate);

          if (!Number.isNaN(parsedDate.getTime())) {
            item.releaseTime = parsedDate.toISOString();
          }
        } catch {
          // Ignore invalid dates.
        }
      }

      chapters.push(item);
    });

    novel.chapters = chapters;

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.replace(/^\/+/, '');

    const result = await fetchApi(`${this.site}${cleanPath}`);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
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

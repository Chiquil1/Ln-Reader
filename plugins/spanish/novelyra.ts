import { Plugin } from '@typings/plugin';

import { fetchApi } from '@libs/fetch';

import { load as loadCheerio } from 'cheerio';

const SITE = 'https://novelyra.com/';

const MAX_TRANSLATION_CHARS = 2000;

/**
 * Traduce texto usando la API pública de Google Translate.
 *
 * Se mantiene independiente del scraper principal para que,
 * si la traducción falla, el contenido original siga disponible.
 */
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

/**
 * Divide el texto en bloques pequeños para evitar
 * exceder los límites de la API de traducción.
 */
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

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const page = Math.max(1, pageNo || 1);

    const urls = [
      page === 1 ? this.site : `${this.site}?page=${page}`,
      `${this.site}browse.php?page=${page}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetchApi(url);

        if (!res.ok) {
          continue;
        }

        const body = await res.text();

        const $ = loadCheerio(body);

        const novels: Plugin.NovelItem[] = [];

        const selectors = [
          '#novelas .novel-card',
          '.novels-grid .novel-card',
          '.novel-card',
          '.popular-item',
          'a.group.block.min-w-0',
        ];

        for (const selector of selectors) {
          $(selector).each((_, element) => {
            const item = $(element);

            const link = item.is('a') ? item : item.find('a').first();

            const name =
              item.find('h3').first().text().trim() ||
              item.find('.novel-title').first().text().trim() ||
              link.text().trim();

            const path = link.attr('href')?.trim() || '';

            const cover = item.find('img').first().attr('src')?.trim() || '';

            if (!name || !path) {
              return;
            }

            const normalizedPath = path.replace(this.site, '');

            const duplicate = novels.some(
              novel => novel.path === normalizedPath,
            );

            if (!duplicate) {
              novels.push({
                name,
                path: normalizedPath,
                cover,
              });
            }
          });

          if (novels.length > 0) {
            break;
          }
        }

        if (novels.length > 0) {
          return novels;
        }
      } catch {
        // Try next URL.
      }
    }

    return [];
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const query = searchTerm.trim();

    if (!query) {
      return [];
    }

    const url = `${this.site}?search=${encodeURIComponent(query)}`;

    try {
      const res = await fetchApi(url);

      if (!res.ok) {
        return [];
      }

      const body = await res.text();

      const $ = loadCheerio(body);

      const novels: Plugin.NovelItem[] = [];

      const selectors = [
        '#novelas .novel-card',
        '.novels-grid .novel-card',
        '.novel-card',
        'a.group.block.min-w-0',
      ];

      for (const selector of selectors) {
        $(selector).each((_, element) => {
          const item = $(element);

          const link = item.is('a') ? item : item.find('a').first();

          const name =
            item.find('h3').first().text().trim() ||
            item.find('.novel-title').first().text().trim() ||
            link.text().trim();

          const path = link.attr('href')?.trim() || '';

          const cover = item.find('img').first().attr('src')?.trim() || '';

          if (!name || !path) {
            return;
          }

          const normalizedPath = path.replace(this.site, '');

          const duplicate = novels.some(novel => novel.path === normalizedPath);

          if (!duplicate) {
            novels.push({
              name,
              path: normalizedPath,
              cover,
            });
          }
        });

        if (novels.length > 0) {
          break;
        }
      }

      return novels;
    } catch {
      return [];
    }
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const cleanPath = novelPath.replace(/^\/+/, '');

    const url = `${this.site}${cleanPath}`;

    const res = await fetchApi(url);

    if (!res.ok) {
      throw new Error(`Failed to load novel: HTTP ${res.status}`);
    }

    const body = await res.text();

    const $ = loadCheerio(body);

    const name =
      $('h1').first().text().trim() ||
      $('h1.novel-title').first().text().trim() ||
      'Desconocido';

    const cover =
      $('.novel-cover img').first().attr('src') ||
      $('.novel-card img').first().attr('src') ||
      $('img.w-32.rounded-xl').first().attr('src') ||
      '';

    const chapters: Plugin.ChapterItem[] = [];

    $('.chapter-item-wrapper').each((_, element) => {
      const chapter = $(element);

      const chapterLink = chapter.find('a').first().attr('href')?.trim() || '';

      if (!chapterLink) {
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

      const chapterItem: Plugin.ChapterItem = {
        name: chapterName,
        path: chapterLink.replace(this.site, ''),
        chapterNumber,
      };

      if (chapterDate) {
        try {
          const date = new Date(chapterDate);

          if (!Number.isNaN(date.getTime())) {
            chapterItem.releaseTime = date.toISOString();
          }
        } catch {
          // Ignore invalid dates.
        }
      }

      chapters.push(chapterItem);
    });

    // Fallback para estructuras anteriores.
    if (chapters.length === 0) {
      $('a[href*="/chapter-"]').each((_, element) => {
        const link = $(element);

        const chapterPath = link.attr('href')?.trim() || '';

        if (!chapterPath) {
          return;
        }

        const chapterName =
          link.find('.chapter-title').text().trim() ||
          link.find('span.truncate').text().trim() ||
          link.text().trim();

        const duplicate = chapters.some(
          chapter => chapter.path === chapterPath.replace(this.site, ''),
        );

        if (!duplicate) {
          chapters.push({
            name: chapterName || `Capítulo ${chapters.length + 1}`,
            path: chapterPath.replace(this.site, ''),
            chapterNumber: chapters.length + 1,
          });
        }
      });
    }

    return {
      path: novelPath,
      name,
      cover,
      chapters: chapters.reverse(),
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.replace(/^\/+/, '');

    const url = `${this.site}${cleanPath}`;

    const res = await fetchApi(url);

    if (!res.ok) {
      throw new Error(`Failed to load chapter: HTTP ${res.status}`);
    }

    const body = await res.text();

    const $ = loadCheerio(body);

    // Estructura actual de NovelYra.
    const chapterContent = $('.chapter-content').first();

    if (chapterContent.length === 0) {
      // Fallback para estructuras anteriores.
      const article = $('article').first();

      if (article.length > 0) {
        article.find('script, style, iframe, ins').remove();

        const paragraphs: string[] = [];

        article.find('p').each((_, element) => {
          const text = $(element).text().trim();

          if (text) {
            paragraphs.push(text);
          }
        });

        if (paragraphs.length === 0) {
          const rawText = article.text().trim();

          if (rawText) {
            paragraphs.push(rawText);
          }
        }

        const translated = await translateParagraphs(paragraphs);

        return translated
          .map(
            paragraph =>
              `<p>${paragraph.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
          )
          .join('');
      }

      return 'Contenido no encontrado';
    }

    chapterContent.find('script, style, iframe, ins, .chapter-ad').remove();

    const paragraphs: string[] = [];

    // Primero intentamos párrafos normales.
    chapterContent.find('p').each((_, element) => {
      const text = $(element).text().trim();

      if (text) {
        paragraphs.push(text);
      }
    });

    // Si no existen <p>, recopilamos el contenido por bloques.
    if (paragraphs.length === 0) {
      chapterContent.find('div, br').each((_, element) => {
        const tagName = element.tagName?.toLowerCase();

        if (tagName === 'br') {
          return;
        }

        const text = $(element).text().trim();

        if (text) {
          paragraphs.push(text);
        }
      });
    }

    // Último fallback: texto completo del contenedor.
    if (paragraphs.length === 0) {
      const rawText = chapterContent.text().trim();

      if (rawText) {
        paragraphs.push(
          rawText
            .split(/\n+/)
            .map(text => text.trim())
            .filter(Boolean)
            .join('\n'),
        );
      }
    }

    if (paragraphs.length === 0) {
      return 'Contenido no encontrado';
    }

    const translatedParagraphs = await translateParagraphs(paragraphs);

    return translatedParagraphs
      .map(
        paragraph =>
          `<p>${paragraph.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
      )
      .join('');
  }
}

export default new Novelyra();

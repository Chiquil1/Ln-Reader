import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { load as loadCheerio } from 'cheerio';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
};

// Función auxiliar para traducir texto de manera gratuita usando la API interna de Google
async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetchApi(url, { headers });
    const json = await res.json();

    // Google Translate devuelve un array complejo. Extraemos y unimos las partes traducidas.
    if (json && json[0]) {
      return json[0].map((item: any) => item[0]).join('');
    }
    return text;
  } catch (error) {
    console.error('Error en la traducción:', error);
    return text; // Si falla, devolvemos el texto original para no dejar el capítulo en blanco
  }
}

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';
  name = 'Novelyra';
  icon = 'https://novelyra.com/favicon.ico';
  site = 'https://novelyra.com/';
  version = '1.3.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const res = await fetchApi(this.site, { headers });
    const $ = loadCheerio(await res.text());
    const novels: Plugin.NovelItem[] = [];

    $('a.group.block.min-w-0').each((i, el) => {
      const name = $(el).find('h3').text().trim();
      const path = $(el).attr('href');
      const cover = $(el).find('img').attr('src');
      if (name && path) {
        novels.push({ name, path, cover: cover || '' });
      }
    });
    return novels;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}search?q=${encodeURIComponent(searchTerm)}`;
    const res = await fetchApi(url, { headers });
    const $ = loadCheerio(await res.text());
    const novels: Plugin.NovelItem[] = [];

    $('a.group.block.min-w-0').each((i, el) => {
      const name = $(el).find('h3').text().trim();
      const path = $(el).attr('href');
      const cover = $(el).find('img').attr('src');
      if (name && path) {
        novels.push({ name, path, cover: cover || '' });
      }
    });
    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    let page = 1;
    let hasMore = true;
    let name = 'Desconocido';
    let cover = '';
    const chapters: Plugin.ChapterItem[] = [];

    const cleanPath = novelPath.replace(/^\//, '');

    while (hasMore) {
      const url =
        page === 1
          ? `${this.site}${cleanPath}`
          : `${this.site}${cleanPath}?page=${page}`;

      const res = await fetchApi(url, { headers });
      const $ = loadCheerio(await res.text());

      if (page === 1) {
        name = $('h1').text().trim() || name;
        cover = $('img.w-32.rounded-xl').attr('src') || '';
      }

      const pageChapters: Plugin.ChapterItem[] = [];
      $('a[href*="/chapter-"]').each((i, el) => {
        const chapterName = $(el).find('span.truncate').text().trim();
        const chapterPath = $(el).attr('href');
        if (chapterPath) {
          pageChapters.push({
            name: chapterName || `Capítulo ${chapters.length + 1}`,
            path: chapterPath,
          });
        }
      });

      if (pageChapters.length === 0) {
        hasMore = false;
        break;
      }

      chapters.push(...pageChapters);

      const nextPattern = `page=${page + 1}`;
      const nextButton = $(`a[href*="${nextPattern}"]`);

      if (nextButton.length > 0) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return {
      path: novelPath,
      name: name,
      cover: cover,
      chapters: chapters.reverse(),
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const res = await fetchApi(this.site + chapterPath.replace(/^\//, ''), {
      headers,
    });
    const $ = loadCheerio(await res.text());

    // Limpiamos elementos innecesarios
    $('script, style, iframe, ins').remove();

    // Obtenemos todos los párrafos de la novela
    const paragraphs: string[] = [];
    $('article p').each((i, el) => {
      const pText = $(el).text().trim();
      if (pText) {
        paragraphs.push(pText);
      }
    });

    // Si no hay párrafos mapeados en <p>, intentamos con el HTML crudo limpio
    if (paragraphs.length === 0) {
      const rawText = $('article').text().trim();
      if (rawText) paragraphs.push(rawText);
    }

    // Traducimos los párrafos. Para evitar bloqueos de Google y no exceder límites de caracteres,
    // agrupamos los párrafos en bloques de texto de máximo ~2000 caracteres.
    const translatedParagraphs: string[] = [];
    let currentBatch = '';

    for (const paragraph of paragraphs) {
      if ((currentBatch + '\n' + paragraph).length > 2000) {
        const translatedBatch = await translateText(currentBatch);
        translatedParagraphs.push(...translatedBatch.split('\n'));
        currentBatch = paragraph;
      } else {
        currentBatch =
          currentBatch === '' ? paragraph : currentBatch + '\n' + paragraph;
      }
    }

    if (currentBatch !== '') {
      const translatedBatch = await translateText(currentBatch);
      translatedParagraphs.push(...translatedBatch.split('\n'));
    }

    // Reconstruimos el HTML traducido usando etiquetas <p> para que LnReader lo renderice perfecto
    const finalHtml = translatedParagraphs
      .map(p => `<p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('');

    return finalHtml || 'Contenido no encontrado o error en la traducción';
  }
}

export default new Novelyra();

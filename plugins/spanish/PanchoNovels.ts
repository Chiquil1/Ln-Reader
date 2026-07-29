import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { load as loadCheerio } from 'cheerio';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
};

async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetchApi(url, { headers });
    const json = await res.json();
    return json && json[0]
      ? json[0].map((item: any) => item[0]).join('')
      : text;
  } catch {
    return text;
  }
}

class PanchoNovels implements Plugin.PluginBase {
  id = 'panchonovels';
  name = 'PanchoNovels';
  icon = 'https://panchonovels.online/favicon.ico';
  site = 'https://panchonovels.online/';
  version = '1.1.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const res = await fetchApi(this.site, { headers });
    const $ = loadCheerio(await res.text());
    const novels: Plugin.NovelItem[] = [];

    // Buscamos enlaces de novelas
    $('a[href^="/novel/"]').each((i, el) => {
      const name = $(el).find('span.text-base, h3').text().trim();
      const path = $(el).attr('href');
      const cover = $(el).find('img').attr('src');
      if (name && path) {
        novels.push({ name, path, cover: cover || '' });
      }
    });
    return novels;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}novel/search?query=${encodeURIComponent(searchTerm)}&order=popular`;
    const res = await fetchApi(url, { headers });
    const $ = loadCheerio(await res.text());
    const novels: Plugin.NovelItem[] = [];

    $('a[href^="/novel/"]').each((i, el) => {
      const name = $(el).find('span.text-base, h3').text().trim();
      const path = $(el).attr('href');
      const cover = $(el).find('img').attr('src');
      if (name && path) {
        novels.push({ name, path, cover: cover || '' });
      }
    });
    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const res = await fetchApi(this.site + novelPath.replace(/^\//, ''), {
      headers,
    });
    const $ = loadCheerio(await res.text());

    const name = $('h1').text().trim() || 'Desconocido';
    const cover = $('img[class*="aspect-[2/3]"]').attr('src') || '';
    const chapters: Plugin.ChapterItem[] = [];

    // CAMBIO CLAVE: Buscamos cualquier enlace que tenga "chapter" en la ruta
    // Usamos 'a[href*="/chapter"]' para ser más generales
    $('a[href*="/chapter"]').each((i, el) => {
      const chapterName = $(el).text().trim();
      const chapterPath = $(el).attr('href');
      // Filtramos para evitar enlaces basura
      if (chapterPath && chapterName.length > 0) {
        chapters.push({
          name: chapterName,
          path: chapterPath,
        });
      }
    });

    return {
      path: novelPath,
      name,
      cover,
      chapters: chapters.reverse(), // Si el orden sale al revés, quita el .reverse()
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const res = await fetchApi(this.site + chapterPath.replace(/^\//, ''), {
      headers,
    });
    const $ = loadCheerio(await res.text());

    // Limpiamos basura
    $('script, style, iframe, ins, header, footer').remove();

    // Extraemos párrafos basándonos en tu ejemplo: <p>...</p>
    const paragraphs: string[] = [];
    $('p').each((i, el) => {
      const pText = $(el).text().trim();
      // Filtramos párrafos muy cortos o que sean títulos/botones
      if (pText.length > 10) {
        paragraphs.push(pText);
      }
    });

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

    return translatedParagraphs
      .map(p => `<p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('');
  }
}

export default new PanchoNovels();

import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { load as loadCheerio } from 'cheerio';

// Definimos los headers para forzar la traducción y simular un navegador
const headers = {
  'Cookie': 'googtrans=/en/es',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
};

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';
  name = 'Novelyra';
  icon = 'src/es/novelyra/icon.png';
  site = 'https://novelyra.com/';
  version = '1.0.0';

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
    const res = await fetchApi(this.site + novelPath.replace(/^\//, ''), {
      headers,
    });
    const $ = loadCheerio(await res.text());

    const chapters: Plugin.ChapterItem[] = [];

    $('a[href*="/chapter-"]').each((i, el) => {
      const chapterName = $(el).find('span.truncate').text().trim();
      const chapterPath = $(el).attr('href');
      if (chapterPath) {
        chapters.push({
          name: chapterName || `Capítulo ${i + 1}`,
          path: chapterPath,
        });
      }
    });

    return {
      path: novelPath,
      name: $('h1').text().trim() || 'Desconocido',
      chapters: chapters.reverse(),
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const res = await fetchApi(this.site + chapterPath.replace(/^\//, ''), {
      headers,
    });
    const $ = loadCheerio(await res.text());
    return $('article').html() || 'Contenido no encontrado';
  }
}

export default new Novelyra();

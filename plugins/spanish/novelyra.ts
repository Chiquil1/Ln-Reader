import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { load as loadCheerio } from 'cheerio';

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';
  name = 'Novelyra';
  icon = 'src/es/novelyra/icon.png'; // URL real del icono
  site = 'https://novelyra.com/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const res = await fetchApi(this.site);
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
    const res = await fetchApi(url);
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
    const res = await fetchApi(this.site + novelPath.replace(/^\//, ''));
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
    const res = await fetchApi(this.site + chapterPath.replace(/^\//, ''));
    const $ = loadCheerio(await res.text());
    return $('article').html() || 'Contenido no encontrado';
  }
}

export default new Novelyra();

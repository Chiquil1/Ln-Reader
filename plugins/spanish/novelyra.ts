import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { load as loadCheerio } from 'cheerio';

// Headers necesarios para forzar la traducción y evitar bloqueos básicos
const headers = {
  'Cookie': 'googtrans=/en/es',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
};

class Novelyra implements Plugin.PluginBase {
  id = 'novelyra';
  name = 'Novelyra';
  icon = 'https://novelyra.com/favicon.ico';
  site = 'https://novelyra.com/';
  version = '1.2.0';

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

    // Limpiamos la ruta
    const cleanPath = novelPath.replace(/^\//, '');

    while (hasMore) {
      // Construimos la URL: página 1 es la base, las siguientes llevan ?page=X
      const url =
        page === 1
          ? `${this.site}${cleanPath}`
          : `${this.site}${cleanPath}?page=${page}`;

      const res = await fetchApi(url, { headers });
      const $ = loadCheerio(await res.text());

      // Capturar info básica solo en la primera página
      if (page === 1) {
        name = $('h1').text().trim() || name;
        // Selector preciso que me diste
        cover = $('img.w-32.rounded-xl').attr('src') || '';
      }

      // Extraer capítulos de la página actual
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

      // Si no hay capítulos en esta página, detenemos el bucle
      if (pageChapters.length === 0) {
        hasMore = false;
        break;
      }

      chapters.push(...pageChapters);

      // Verificamos si existe un enlace a la página siguiente
      // Buscamos un enlace que contenga el patrón ?page=X
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
      chapters: chapters.reverse(), // Ordenamos al final
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

import { Plugin } from '@typings/plugin';
import { fetchApi } from '@libs/fetch';
import { Filters } from '@libs/filterInputs';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import * as cheerio from 'cheerio';

class RNCalationPlugin implements Plugin.PluginBase {
  id = 'rncalation';
  name = 'RNCalation';
  icon = 'src/es/rncalation/icon.png';
  site = 'https://rncalation.online/';
  version = '1.0.4';
  filters = undefined;

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const sort = showLatestNovels ? 'latest' : 'popular';
    const url = `${this.site}library?q=&type=Novel&status=&genre=&sort=${sort}&page=${pageNo}`;

    const body = await fetchApi(url).then(res => res.text());
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    $('a.comic-card').each((_, el) => {
      const path = $(el).attr('href')?.replace(this.site, '/') || '';
      const name = $(el).find('p').first().text().trim();
      const img = $(el).find('img').first();
      const coverSrc = img.attr('src') || img.attr('data-src') || '';
      const cover = coverSrc
        ? coverSrc.startsWith('http')
          ? coverSrc
          : this.site.slice(0, -1) + coverSrc
        : defaultCover;

      if (path && name) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const body = await fetchApi(this.site + novelPath.replace(/^\//, '')).then(
      res => res.text(),
    );
    const $ = cheerio.load(body);

    const name = $('h1').first().text().trim();

    const coverImg = $('.comic-cover__img, .card-media-wrap img').first();
    const coverSrc =
      $('meta[property="og:image"]').attr('content') ||
      $('.hero-bg').attr('data-bg') ||
      coverImg.attr('src') ||
      coverImg.attr('data-src') ||
      '';
    const cover = coverSrc
      ? coverSrc.startsWith('http')
        ? coverSrc
        : this.site.slice(0, -1) + coverSrc
      : defaultCover;

    const summary = $('p')
      .filter((_, el) => $(el).text().trim().length > 80)
      .first()
      .text()
      .trim();

    const statusText = $('span:contains("En emisión")').first().text().trim();
    const status = statusText.includes('En emisión')
      ? NovelStatus.Ongoing
      : NovelStatus.Completed;

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name,
      cover,
      summary,
      status,
      chapters: [],
    };
    const chapters: Plugin.ChapterItem[] = [];
    const seenPaths = new Set<string>();

    const baseUrl = this.site + novelPath.replace(/^\//, '').replace(/\/$/, '');

    // Estrategia 1: <select id="chapter-select"> con <option> (página de capítulo)
    const selectEl = $('select#chapter-select');
    const dataBase = selectEl.attr('data-base') || '';

    if (dataBase) {
      selectEl.find('option').each((_, el) => {
        const value = $(el).attr('value') || '';
        const dataFull = $(el).attr('data-full') || '';
        const dataNum = $(el).attr('data-num') || '';

        if (!value) return;

        const base = dataBase.endsWith('/') ? dataBase : dataBase + '/';
        const chapterPath = '/' + base.replace(this.site, '') + value;

        if (seenPaths.has(chapterPath)) return;
        seenPaths.add(chapterPath);

        const chapterNum = Number(dataNum) || undefined;
        const chapterName = dataFull || `Chapter ${dataNum}`;

        chapters.push({
          name: chapterName,
          path: chapterPath,
          chapterNumber: chapterNum,
        });
      });
    }

    // Estrategia 2: enlaces <a> con href que contiene /leer/ (página de novela)
    if (chapters.length === 0) {
      $('a[href*="/leer/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const chapterPath = href.replace(this.site, '') || href;

        if (!chapterPath || seenPaths.has(chapterPath)) return;
        seenPaths.add(chapterPath);

        const text = $(el).text().trim();
        const match = text.match(/(\d+)/);
        const chapterNum = match ? Number(match[1]) : undefined;

        chapters.push({
          name: text || `Chapter ${chapterNum || chapters.length + 1}`,
          path: chapterPath.startsWith('/') ? chapterPath : '/' + chapterPath,
          chapterNumber: chapterNum,
        });
      });
    }

    // Estrategia 3: enlaces <a> con data-chapter-num (formato viejo)
    if (chapters.length === 0) {
      $('a[data-chapter-num]').each((_, el) => {
        const chapterName =
          $(el).attr('data-chapter-label') || $(el).text().trim();
        const chapterPath = $(el).attr('href')?.replace(this.site, '') || '';
        const chapterNum = Number($(el).attr('data-chapter-num')) || undefined;

        if (chapterPath && !seenPaths.has(chapterPath)) {
          seenPaths.add(chapterPath);
          chapters.push({
            name: chapterName,
            path: chapterPath.startsWith('/') ? chapterPath : '/' + chapterPath,
            chapterNumber: chapterNum,
          });
        }
      });
    }

    novel.chapters = chapters.reverse();

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchApi(
      this.site + chapterPath.replace(/^\//, ''),
    ).then(res => res.text());
    const $ = cheerio.load(body);

    const content = $('.novel-content').html() || '';
    return content;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}library?q=${encodeURIComponent(
      searchTerm,
    )}&type=Novel&status=&genre=&sort=latest&page=${pageNo}`;

    const body = await fetchApi(url).then(res => res.text());
    const $ = cheerio.load(body);

    const novels: Plugin.NovelItem[] = [];

    $('a.comic-card').each((_, el) => {
      const path = $(el).attr('href')?.replace(this.site, '/') || '';
      const name = $(el).find('p').first().text().trim();
      const img = $(el).find('img').first();
      const coverSrc = img.attr('src') || img.attr('data-src') || '';
      const cover = coverSrc
        ? coverSrc.startsWith('http')
          ? coverSrc
          : this.site.slice(0, -1) + coverSrc
        : defaultCover;

      if (path && name) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }
}

export default new RNCalationPlugin();

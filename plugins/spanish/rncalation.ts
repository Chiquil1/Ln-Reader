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
  version = '1.0.0';
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
      const coverSrc = $(el).find('img').attr('src') || '';
      const cover = coverSrc ? this.site.slice(0, -1) + coverSrc : defaultCover;

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

    const coverSrc =
      $('meta[property="og:image"]').attr('content') ||
      $('.hero-bg').attr('data-bg') ||
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

    $('a[data-chapter-num]').each((_, el) => {
      const chapterName =
        $(el).attr('data-chapter-label') || $(el).text().trim();
      const chapterPath = $(el).attr('href')?.replace(this.site, '/') || '';
      const chapterNum = Number($(el).attr('data-chapter-num')) || undefined;

      if (chapterPath) {
        chapters.push({
          name: chapterName,
          path: chapterPath,
          chapterNumber: chapterNum,
        });
      }
    });

    // el sitio suele listarlos del más nuevo al más viejo
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
      const coverSrc = $(el).find('img').attr('src') || '';
      const cover = coverSrc ? this.site.slice(0, -1) + coverSrc : defaultCover;

      if (path && name) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }
}

export default new RNCalationPlugin();

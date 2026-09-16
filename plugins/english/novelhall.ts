import { load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import {
  translateParagraphs,
  translateShortText,
  translateTitles,
  TranslationConfig,
  DEFAULT_TRANSLATION_CONFIG,
  withTranslation,
} from '@libs/translation';

class NovelHall implements Plugin.PluginBase {
  id = 'novelhall';
  name = 'Novel Hall';
  version = '1.0.6';
  icon = 'src/en/novelhall/icon.png';
  site = 'https://novelhall.com/';
  translationConfig: TranslationConfig = {
    ...DEFAULT_TRANSLATION_CONFIG,
    targetLang: 'es',
  };

  async popularNovels(page: number): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}all2022-${page}.html`;

    const body = await fetchApi(url).then(r => r.text());

    const loadedCheerio = parseHTML(body);

    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('li.btm').each((idx, ele) => {
      const novelName = loadedCheerio(ele).text().trim();
      const novelUrl = loadedCheerio(ele).find('a').attr('href');
      if (!novelUrl) return;

      const novel = {
        name: novelName,
        cover: defaultCover,
        path: novelUrl,
      };

      novels.push(novel);
    });

    return novels;
  }
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const body = await fetchApi(this.site + novelPath).then(r => r.text());

    const loadedCheerio = parseHTML(body);

    const sourceName = loadedCheerio('.book-info > h1').text() || 'Untitled';
    const sourceSummary = loadedCheerio('.intro').text().trim();

    loadedCheerio('.total').find('p').remove();
    const sourceAuthor = loadedCheerio('.total span:contains("Author")')
      .text()
      .replace('Author：', '')
      .trim();

    const sourceStatus = loadedCheerio('.total span:contains("Status")')
      .text()
      .replace('Status：', '')
      .replace('Active', 'Ongoing')
      .trim();

    const sourceGenres = loadedCheerio('.total a')
      .map((a, ex) => loadedCheerio(ex).text())
      .toArray()
      .join(',');

    const [translatedName] = await translateTitles(
      [sourceName],
      this.translationConfig.targetLang,
      'auto',
      this.translationConfig,
    );
    const translatedSummary = await translateShortText(
      sourceSummary,
      this.translationConfig.targetLang,
      'auto',
      this.translationConfig,
    );
    const translatedAuthor = sourceAuthor
      ? await translateShortText(
          sourceAuthor,
          this.translationConfig.targetLang,
          'auto',
          this.translationConfig,
        )
      : '';
    const translatedGenres = sourceGenres
      ? await translateShortText(
          sourceGenres,
          this.translationConfig.targetLang,
          'auto',
          this.translationConfig,
        )
      : '';

    const chapter: Plugin.ChapterItem[] = [];

    loadedCheerio('#morelist ul > li').each((idx, ele) => {
      const chapterName = loadedCheerio(ele).find('a').text().trim();
      const chapterUrl = loadedCheerio(ele).find('a').attr('href');
      if (!chapterUrl) return;

      chapter.push({
        name: chapterName,
        path: chapterUrl,
      });
    });

    const chapterNames = chapter.map(ch => ch.name);
    const translatedChapterNames = await translateTitles(
      chapterNames,
      this.translationConfig.targetLang,
      'auto',
      this.translationConfig,
    );

    const translatedChapters = chapter.map((ch, i) => ({
      ...ch,
      name: translatedChapterNames[i] || ch.name,
    }));

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: translatedName || sourceName,
      cover: loadedCheerio('meta[property="og:image"]').attr('content'),
      summary: translatedSummary || sourceSummary,
      author: translatedAuthor || sourceAuthor,
      status: sourceStatus,
      genres: translatedGenres || sourceGenres,
      chapters: translatedChapters,
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchApi(this.site + chapterPath).then(r => r.text());
    const loadedCheerio = parseHTML(body);
    const chapterText = loadedCheerio('#htmlContent').html() || '';

    if (!this.translationConfig.enabled || chapterText === '') {
      return chapterText;
    }

    const $ = parseHTML(chapterText);
    const paragraphs: string[] = [];

    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      const translated = await translateParagraphs(
        paragraphs,
        this.translationConfig,
      );

      const translatedParagraphs =
        translated.length > 0 ? translated : paragraphs;
      $('p').each((index, el) => {
        if (index < translatedParagraphs.length) {
          $(el).text(translatedParagraphs[index]);
        }
      });
    }

    return $.html() || chapterText;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}index.php?s=so&module=book&keyword=${encodeURIComponent(searchTerm)}`;
    const body = await fetchApi(url).then(r => r.text());
    const loadedCheerio = parseHTML(body);

    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('table tr').each((idx, ele) => {
      const novelName = loadedCheerio(ele)
        .find('td:nth-child(2)')
        .text()
        .replace(/\t+/g, '')
        .replace(/\n/g, ' ');
      const novelUrl = loadedCheerio(ele)
        .find('td:nth-child(2) a')
        .attr('href');
      if (!novelUrl) return;

      const novel = {
        name: novelName,
        cover: defaultCover,
        path: novelUrl,
      };

      novels.push(novel);
    });

    return novels;
  }
}

export default withTranslation(new NovelHall(), {
  translateNovel: false,
  translateChapter: false,
});

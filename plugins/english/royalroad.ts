import { Parser } from 'htmlparser2';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { NovelStatus } from '@libs/novelStatus';
import { isUrlAbsolute } from '@libs/isAbsoluteUrl';
import { storage } from '@libs/storage';

class RoyalRoad implements Plugin.PluginBase {
  id = 'royalroad';
  name = 'Royal Road';
  version = '2.3.2';
  icon = 'src/en/royalroad/icon.png';
  site = 'https://www.royalroad.com/';

  enableVol = storage.get('enableVol');
  pluginSettings = {
    enableVol: {
      value: '',
      label: 'Enable Pagination / Volume view (not recommended)',
      type: 'Switch',
    },
  };

  parseNovels(html: string) {
    const baseUrl = this.site;
    const novels: Plugin.NovelItem[] = [];
    let tempNovel: Partial<Plugin.NovelItem> = {};
    let state: ParsingState = ParsingState.Idle;
    const parser = new Parser({
      'options': { 'versionIncrements': 70 },
      onopentag(name, attribs) {
        if (attribs['class']?.includes('fiction-list-item')) {
          state = ParsingState.Novel;
        }
        if (state !== ParsingState.Novel) return;

        switch (name) {
          case 'a':
            if (attribs['href']) {
              tempNovel.path = attribs['href'].split('/').slice(1, 3).join('/');
            }
            break;
          case 'img':
            if (attribs['src']) {
              tempNovel.name = attribs['alt'] || '';
              tempNovel.cover = !isUrlAbsolute(attribs['src'])
                ? baseUrl + attribs['src'].slice(1)
                : attribs['src'];
            }
            break;
        }
      },
      onclosetag(name) {
        if (name === 'figure') {
          if (tempNovel.path && tempNovel.name) {
            novels.push(tempNovel as Plugin.NovelItem);
            tempNovel = {};
          }
          state = ParsingState.Idle;
        }
      },
    });

    parser.write(html);
    parser.end();

    return novels;
  }

  async popularNovels(
    page: number,
    {
      filters,
      showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const params = new URLSearchParams({
      page: page.toString(),
    });
    if (showLatestNovels) {
      params.append('orderBy', 'last_update');
    }
    if (!filters) filters = this.filters || {};
    for (const key in filters) {
      if (filters[key as keyof typeof filters].value === '') continue;
      if (key === 'genres' || key === 'tags' || key === 'content_warnings') {
        if (filters[key].value.include) {
          for (const include of filters[key].value.include) {
            params.append('tagsAdd', include);
          }
        }
        if (filters[key].value.exclude) {
          for (const exclude of filters[key].value.exclude) {
            params.append('tagsRemove', exclude);
          }
        }
      } else {
        params.append(key, String(filters[key as keyof typeof filters].value));
      }
    }

    const link = `${this.site}fictions/search?${params.toString()}`;
    const body = await fetchApi(link).then(r => r.text());

    return this.parseNovels(body);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const result = await fetchApi(this.site + novelPath);
    const html = await result.text();
    const novel: Partial<Plugin.SourceNovel> = {
      path: novelPath,
    };
    const baseUrl = this.site;
    const enableVolume = this.enableVol;

    let state: ParsingState = ParsingState.Idle;
    let statusText = '';
    let statusSpanCounter = 0;

    const nameParts: string[] = [];
    const summaryParts: string[] = [];
    const scriptContentParts: string[] = [];
    const genreArray: string[] = [];

    let chapterJson: ChapterEntry[] = [];
    let volumeJson: VolumeEntry[] = [];

    const parser = new Parser({
      onopentag(name, attribs) {
        switch (name) {
          case 'h1':
            state = ParsingState.InTitle;
            break;
          case 'a':
            if (attribs['href']?.startsWith('/profile/') && !novel.author) {
              state = ParsingState.InAuthor;
            } else if (state === ParsingState.InTags) {
              state = ParsingState.InTagLink;
            }
            break;
          case 'div':
            if (attribs['class'] === 'description') {
              state = ParsingState.InDescription;
            }
            break;
          case 'hr':
            if (state === ParsingState.InDescription) {
              summaryParts.push('\n\n---\n\n');
            }
            break;
          case 'br':
            if (state === ParsingState.InDescription) {
              summaryParts.push('\n\n');
            }
            break;
          case 'span':
            if (attribs['class']?.includes('tags')) {
              state = ParsingState.InTags;
            } else if (attribs['class']?.includes('label-sm')) {
              statusSpanCounter++;
              if (statusSpanCounter === 2) {
                state = ParsingState.InStatusSpan;
                statusText = '';
              }
            }
            break;
          case 'img':
            if (attribs['class']?.includes('thumbnail')) {
              novel.cover = attribs['src'];
              if (novel.cover && !isUrlAbsolute(novel.cover)) {
                novel.cover = baseUrl + novel.cover.slice(1);
              }
            }
            break;
          case 'script':
            state = ParsingState.InScript;
            break;
        }
      },
      ontext(text) {
        const trimmedText = text.trim();
        if (!trimmedText && state !== ParsingState.InScript) return;

        switch (state) {
          case ParsingState.InTitle:
            nameParts.push(text);
            break;
          case ParsingState.InAuthor:
            novel.author = trimmedText;
            break;
          case ParsingState.InDescription:
            summaryParts.push(text);
            break;
          case ParsingState.InStatusSpan:
            statusText = trimmedText;
            break;
          case ParsingState.InTagLink:
            genreArray.push(trimmedText);
            break;
          case ParsingState.InScript:
            scriptContentParts.push(text);
            break;
        }
      },
      onclosetag(name) {
        switch (name) {
          case 'h1':
            if (state === ParsingState.InTitle) {
              novel.name = nameParts.join('').trim();
              state = ParsingState.Idle;
            }
            break;
          case 'a':
            if (state === ParsingState.InTagLink) {
              state = ParsingState.InTags;
            } else if (state === ParsingState.InAuthor) {
              state = ParsingState.Idle;
            }
            break;
          case 'p':
            if (state === ParsingState.InDescription) {
              summaryParts.push('\n\n');
            }
            break;
          case 'div':
            if (state === ParsingState.InDescription) {
              novel.summary = summaryParts
                .join('')
                .replace(/&nbsp;/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
              summaryParts.length = 0;
              state = ParsingState.Idle;
            }
            break;
          case 'span':
            if (state === ParsingState.InTags) {
              novel.genres = genreArray.join(', ');
              state = ParsingState.Idle;
            } else if (state === ParsingState.InStatusSpan) {
              state = ParsingState.Idle;
            }
            break;
          case 'script':
            if (state === ParsingState.InScript) {
              state = ParsingState.Idle;
              const scriptContent = scriptContentParts.join('');
              const chapterMatch = scriptContent.match(
                /window\.chapters\s*=\s*(\[.*?\]);/,
              );
              const volumeMatch = scriptContent.match(
                /window\.volumes\s*=\s*(\[.*?\]);/,
              );

              if (chapterMatch?.[1]) {
                chapterJson = JSON.parse(chapterMatch[1]);
              }
              if (volumeMatch?.[1] && enableVolume) {
                volumeJson = JSON.parse(volumeMatch[1]);
              }
            }
            break;
        }
      },
      onend() {
        switch (statusText) {
          case 'ONGOING':
            novel.status = NovelStatus.Ongoing;
            break;
          case 'HIATUS':
            novel.status = NovelStatus.OnHiatus;
            break;
          case 'COMPLETED':
            novel.status = NovelStatus.Completed;
            break;
          default:
            novel.status = NovelStatus.Unknown;
        }

        novel.chapters = chapterJson.map((chapter: ChapterEntry) => {
          const matchingVolume = volumeJson.find(
            (volume: VolumeEntry) => volume.id === chapter.volumeId,
          );
          return {
            name: chapter.title,
            path: (() => {
              const parts = chapter.url.split('/');
              return `${parts[1]}/${parts[2]}/${parts[4]}/${parts[5]}`;
            })(),
            releaseTime: chapter.date,
            chapterNumber: chapter?.order,
            page: matchingVolume?.title,
          };
        });
      },
    });

    parser.write(html);
    parser.end();

    return novel as Plugin.NovelItem;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const result = await fetchApi(this.site + chapterPath);
    const html = await result.text();

    let state = ParsingState.Idle;
    let stateDepth = 0;
    let depth = 0;

    const chapterHtmlParts: string[] = [];
    const notesHtmlParts: string[] = [];
    const beforeNotesParts: string[] = [];
    const afterNotesParts: string[] = [];
    let isBeforeChapter = true;

    const match = html.match(/<style>\n\s+.(.+?){[^{]+?display: none;/);
    const hiddenClass = match?.[1]?.trim();
    let stateBeforeHidden: {
      state: ParsingState;
      depth: number;
    } | null = null;

    type EscapeChar = '&' | '<' | '>' | '"' | "'";
    const escapeRegex = /[&<>"']/g;
    const escapeMap: Record<EscapeChar, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    const escapeHtml = (text: string): string =>
      escapeRegex.test(text)
        ? ((escapeRegex.lastIndex = 0),
          text.replace(escapeRegex, char => escapeMap[char as EscapeChar]))
        : text;

    const parser = new Parser({
      onopentag(name, attribs) {
        depth++;
        const classes = attribs['class'] || '';

        if (
          state !== ParsingState.InHidden &&
          hiddenClass &&
          classes.includes(hiddenClass)
        ) {
          stateBeforeHidden = { state: state, depth: stateDepth };
          state = ParsingState.InHidden;
          stateDepth = depth;
          return;
        }

        switch (state) {
          case ParsingState.Idle:
            if (classes.includes('chapter-content')) {
              state = ParsingState.InChapter;
              stateDepth = depth;
              isBeforeChapter = false;
            } else if (classes.includes('author-note-portlet')) {
              state = ParsingState.InNote;
              stateDepth = depth;
            }
            break;
          case ParsingState.InHidden:
            return;
        }

        if (state === ParsingState.InChapter || state === ParsingState.InNote) {
          let tag = `<${name}`;
          for (const attr in attribs) {
            const value = attribs[attr].replace(/"/g, '&quot;');
            tag += ` ${attr}="${value}"`;
          }
          tag += '>';

          if (state === ParsingState.InChapter) {
            chapterHtmlParts.push(tag);
          } else {
            notesHtmlParts.push(tag);
          }
        }
      },
      ontext(text) {
        switch (state) {
          case ParsingState.InChapter:
            chapterHtmlParts.push(escapeHtml(text));
            break;
          case ParsingState.InNote:
            notesHtmlParts.push(escapeHtml(text));
            break;
        }
      },
      onclosetag(name) {
        if (depth === stateDepth) {
          switch (state) {
            case ParsingState.InHidden:
              if (!stateBeforeHidden) {
                state = ParsingState.Idle; // Attempt recovery
                stateDepth = 0;
              } else {
                state = stateBeforeHidden.state;
                stateDepth = stateBeforeHidden.depth;
                stateBeforeHidden = null;
              }
              depth--;
              return;
            case ParsingState.InChapter:
              chapterHtmlParts.push(`</div>`);
              state = ParsingState.Idle;
              stateDepth = 0;
              depth--;
              return;
            case ParsingState.InNote:
              {
                const noteClass = `author-note-${isBeforeChapter ? 'before' : 'after'}`;
                const notesHtml = notesHtmlParts.join('').trim();
                const fullNote = `<div class="${noteClass}">${notesHtml}</div>`;
                if (isBeforeChapter) {
                  beforeNotesParts.push(fullNote);
                } else {
                  afterNotesParts.push(fullNote);
                }
                notesHtmlParts.length = 0;
                state = ParsingState.Idle;
                stateDepth = 0;
                depth--;
              }
              return;
          }
        } else if (
          state === ParsingState.InChapter ||
          state === ParsingState.InNote
        ) {
          if (!parser['isVoidElement'](name)) {
            const closingTag = `</${name}>`;
            if (state === ParsingState.InChapter) {
              chapterHtmlParts.push(closingTag);
            } else {
              notesHtmlParts.push(closingTag);
            }
          }
        }
        depth--;
      },
    });

    parser.write(html);
    parser.end();

    return [
      beforeNotesParts.length > 0 ? beforeNotesParts.join('') : null,
      chapterHtmlParts.length > 0 ? chapterHtmlParts.join('').trim() : null,
      afterNotesParts.length > 0 ? afterNotesParts.join('') : null,
    ]
      .filter(Boolean)
      .join('\n<hr class="notes-separator">\n');
  }

  async searchNovels(
    searchTerm: string,
    page: number,
  ): Promise<Plugin.NovelItem[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      title: searchTerm,
      globalFilters: 'true',
    });
    const searchUrl = `${this.site}fictions/search?${params.toString()}`;
    const body = await fetchApi(searchUrl).then(r => r.text());

    return this.parseNovels(body);
  }

  filters = {
    'keyword': {
      'type': FilterTypes.TextInput,
      'label': 'Keyword (title or description)',
      'value': '',
    },
    'author': {
      'type': FilterTypes.TextInput,
      'label': 'Author',
      'value': '',
    },
    'genres': {
      'type': FilterTypes.ExcludableCheckboxGroup,
      'label': 'Genres',
      'value': {
        'include': [],
        'exclude': [],
      },
      'options': [
        {
          'label': 'Action',
          'value': 'action',
        },
        {
          'label': 'Adventure',
          'value': 'adventure',
        },
        {
          'label': 'Comedy',
          'value': 'comedy',
        },
        {
          'label': 'Contemporary',
          'value': 'contemporary',
        },
        {
          'label': 'Drama',
          'value': 'drama',
        },
        {
          'label': 'Fantasy',
          'value': 'fantasy',
        },
        {
          'label': 'Historical',
          'value': 'historical',
        },
        {
          'label': 'Horror',
          'value': 'horror',
        },
        {
          'label': 'Mystery',
          'value': 'mystery',
        },
        {
          'label': 'Psychological',
          'value': 'psychological',
        },
        {
          'label': 'Romance',
          'value': 'romance',
        },
        {
          'label': 'Satire',
          'value': 'satire',
        },
        {
          'label': 'Sci-fi',
          'value': 'sci_fi',
        },
        {
          'label': 'Short Story',
          'value': 'one_shot',
        },
        {
          'label': 'Tragedy',
          'value': 'tragedy',
        },
      ],
    },
    'tags': {
      'type': FilterTypes.ExcludableCheckboxGroup,
      'label': 'Tags',
      'value': {
        'include': [],
        'exclude': [],
      },
      'options': [
        {
          'label': 'Anti-Hero Lead',
          'value': 'anti-hero_lead',
        },
        {
          'label': 'Artificial Intelligence',
          'value': 'artificial_intelligence',
        },
        {
          'label': 'Attractive Lead',
          'value': 'attractive_lead',
        },
        {
          'label': 'Cyberpunk',
          'value': 'cyberpunk',
        },
        {
          'label': 'Dungeon',
          'value': 'dungeon',
        },
        {
          'label': 'Dystopia',
          'value': 'dystopia',
        },
        {
          'label': 'Female Lead',
          'value': 'female_lead',
        },
        {
          'label': 'First Contact',
          'value': 'first_contact',
        },
        {
          'label': 'GameLit',
          'value': 'gamelit',
        },
        {
          'label': 'Gender Bender',
          'value': 'gender_bender',
        },
        {
          'label': 'Genetically Engineered',
          'value': 'genetically_engineered ',
        },
        {
          'label': 'Grimdark',
          'value': 'grimdark',
        },
        {
          'label': 'Hard Sci-fi',
          'value': 'hard_sci-fi',
        },
        {
          'label': 'Harem',
          'value': 'harem',
        },
        {
          'label': 'High Fantasy',
          'value': 'high_fantasy',
        },
        {
          'label': 'LitRPG',
          'value': 'litrpg',
        },
        {
          'label': 'Low Fantasy',
          'value': 'low_fantasy',
        },
        {
          'label': 'Magic',
          'value': 'magic',
        },
        {
          'label': 'Male Lead',
          'value': 'male_lead',
        },
        {
          'label': 'Martial Arts',
          'value': 'martial_arts',
        },
        {
          'label': 'Multiple Lead Characters',
          'value': 'multiple_lead',
        },
        {
          'label': 'Mythos',
          'value': 'mythos',
        },
        {
          'label': 'Non-Human Lead',
          'value': 'non-human_lead',
        },
        {
          'label': 'Portal Fantasy / Isekai',
          'value': 'summoned_hero',
        },
        {
          'label': 'Post Apocalyptic',
          'value': 'post_apocalyptic',
        },
        {
          'label': 'Progression',
          'value': 'progression',
        },
        {
          'label': 'Reader Interactive',
          'value': 'reader_interactive',
        },
        {
          'label': 'Reincarnation',
          'value': 'reincarnation',
        },
        {
          'label': 'Ruling Class',
          'value': 'ruling_class',
        },
        {
          'label': 'School Life',
          'value': 'school_life',
        },
        {
          'label': 'Secret Identity',
          'value': 'secret_identity',
        },
        {
          'label': 'Slice of Life',
          'value': 'slice_of_life',
        },
        {
          'label': 'Soft Sci-fi',
          'value': 'soft_sci-fi',
        },
        {
          'label': 'Space Opera',
          'value': 'space_opera',
        },
        {
          'label': 'Sports',
          'value': 'sports',
        },
        {
          'label': 'Steampunk',
          'value': 'steampunk',
        },
        {
          'label': 'Strategy',
          'value': 'strategy',
        },
        {
          'label': 'Strong Lead',
          'value': 'strong_lead',
        },
        {
          'label': 'Super Heroes',
          'value': 'super_heroes',
        },
        {
          'label': 'Supernatural',
          'value': 'supernatural',
        },
        {
          'label': 'Technologically Engineered',
          'value': 'technologically_engineered',
        },
        {
          'label': 'Time Loop',
          'value': 'loop',
        },
        {
          'label': 'Time Travel',
          'value': 'time_travel',
        },
        {
          'label': 'Urban Fantasy',
          'value': 'urban_fantasy',
        },
        {
          'label': 'Villainous Lead',
          'value': 'villainous_lead',
        },
        {
          'label': 'Virtual Reality',
          'value': 'virtual_reality',
        },
        {
          'label': 'War and Military',
          'value': 'war_and_military',
        },
        {
          'label': 'Wuxia',
          'value': 'wuxia',
        },
        {
          'label': 'Xianxia',
          'value': 'xianxia',
        },
      ],
    },
    'content_warnings': {
      'type': FilterTypes.ExcludableCheckboxGroup,
      'label': 'Content Warnings',
      'value': {
        'include': [],
        'exclude': [],
      },
      'options': [
        {
          'label': 'Profanity',
          'value': 'profanity',
        },
        {
          'label': 'Sexual Content',
          'value': 'sexuality',
        },
        {
          'label': 'Graphic Violence',
          'value': 'graphic_violence',
        },
        {
          'label': 'Sensitive Content',
          'value': 'sensitive',
        },
        {
          'label': 'AI-Assisted Content',
          'value': 'ai_assisted',
        },
        {
          'label': 'AI-Generated Content',
          'value': 'ai_generated',
        },
      ],
    },
    'minPages': {
      'type': FilterTypes.TextInput,
      'label': 'Min Pages',
      'value': '0',
    },
    'maxPages': {
      'type': FilterTypes.TextInput,
      'label': 'Max Pages',
      'value': '20000',
    },
    'minRating': {
      'type': FilterTypes.TextInput,
      'label': 'Min Rating (0.0 - 5.0)',
      'value': '0.0',
    },
    'maxRating': {
      'type': FilterTypes.TextInput,
      'label': 'Max Rating (0.0 - 5.0)',
      'value': '5.0',
    },
    'status': {
      'type': FilterTypes.Picker,
      'label': 'Status',
      'value': 'ALL',
      'options': [
        {
          'label': 'All',
          'value': 'ALL',
        },
        {
          'label': 'Completed',
          'value': 'COMPLETED',
        },
        {
          'label': 'Dropped',
          'value': 'DROPPED',
        },
        {
          'label': 'Ongoing',
          'value': 'ONGOING',
        },
        {
          'label': 'Hiatus',
          'value': 'HIATUS',
        },
        {
          'label': 'Stub',
          'value': 'STUB',
        },
      ],
    },
    'orderBy': {
      'type': FilterTypes.Picker,
      'label': 'Order by',
      'value': 'relevance',
      'options': [
        {
          'label': 'Relevance',
          'value': 'relevance',
        },
        {
          'label': 'Popularity',
          'value': 'popularity',
        },
        {
          'label': 'Average Rating',
          'value': 'rating',
        },
        {
          'label': 'Last Update',
          'value': 'last_update',
        },
        {
          'label': 'Release Date',
          'value': 'release_date',
        },
        {
          'label': 'Followers',
          'value': 'followers',
        },
        {
          'label': 'Number of Pages',
          'value': 'length',
        },
        {
          'label': 'Views',
          'value': 'views',
        },
        {
          'label': 'Title',
          'value': 'title',
        },
        {
          'label': 'Author',
          'value': 'author',
        },
      ],
    },
    'dir': {
      'type': FilterTypes.Picker,
      'label': 'Direction',
      'value': 'desc',
      'options': [
        {
          'label': 'Ascending',
          'value': 'asc',
        },
        {
          'label': 'Descending',
          'value': 'desc',
        },
      ],
    },
    'type': {
      'type': FilterTypes.Picker,
      'label': 'Type',
      'value': 'ALL',
      'options': [
        {
          'label': 'All',
          'value': 'ALL',
        },
        {
          'label': 'Fan Fiction',
          'value': 'fanfiction',
        },
        {
          'label': 'Original',
          'value': 'original',
        },
      ],
    },
  } satisfies Filters;
}

const plugin = new RoyalRoad();

/* __ENTranslationInjected v2 */
import { fetchApi as __translatorFetch } from '@libs/fetch';
import { load as __translatorParse } from 'cheerio';
import { storage as __translatorStorage } from '@libs/storage';

const __ENTranslation = (function () {
  const CFG = {
    enabled: true,
    targetLang: 'es',
    sourceLang: 'auto',
    maxBatchChars: 1600,
    maxConcurrent: 4,
    translateNovelNames: true,
    translateSummaries: true,
    translateChapterNames: true,
    maxChapterNames: 5000,
    translateContent: true,
    translateQuery: true,
    initialPrefetch: 7,
    prefetchAhead: 10,
    cacheMaxEntries: 100,
    maxIndexedNovels: 5,
  };
  const providers = ['google', 'google_repeated', 'mymemory', 'libretranslate'];
  const providerMaxChars = {
    google: 2000,
    google_repeated: 1800,
    mymemory: 420,
    libretranslate: 1800,
  };
  const cache = new Map();
  const inflight = new Map();
  const MAP_KEY = 'es3:map';
  const ORDER_KEY = 'es3:order';
  const CH_PREFIX = 'es3:ch:';
  let map = null;
  let order = null;
  let stateReady = false;
  let chainToken = 0;
  let origParseChapter = null;
  let active = 0;
  const queue = [];
  const norm = s =>
    String(s || '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\r/g, '')
      .trim();
  const guard = fn =>
    new Promise((resolve, reject) => {
      const start = () => {
        active += 1;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            const next = queue.shift();
            if (next) next();
          });
      };
      if (active < CFG.maxConcurrent) start();
      else queue.push(start);
    });
  const buildUrl = (provider, text, sl, tl) => {
    const enc = encodeURIComponent(text);
    const src = provider === 'mymemory' && sl === 'auto' ? 'en' : sl;
    if (provider === 'google_repeated') {
      return (
        'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
        src +
        '&tl=' +
        tl +
        '&q=' +
        enc
      );
    }
    if (provider === 'mymemory') {
      return (
        'https://api.mymemory.translated.net/get?q=' +
        enc +
        '&langpair=' +
        src +
        '|' +
        tl
      );
    }
    if (provider === 'libretranslate') {
      return (
        'https://libretranslate.de/translate?q=' +
        enc +
        '&source=' +
        (sl === 'auto' ? 'en' : sl) +
        '&target=' +
        tl +
        '&format=text'
      );
    }
    return (
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
      sl +
      '&tl=' +
      tl +
      '&dt=t&q=' +
      enc
    );
  };
  const extract = (json, provider) => {
    try {
      if (provider === 'google') {
        if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
          return json[0]
            .map(item => (Array.isArray(item) ? item[0] : null))
            .filter(Boolean)
            .join('');
        }
      } else if (provider === 'google_repeated') {
        if (Array.isArray(json) && typeof json[0] === 'string') {
          return json[0];
        }
      } else if (provider === 'mymemory') {
        if (
          json &&
          json.responseStatus === 200 &&
          json.responseData &&
          typeof json.responseData.translatedText === 'string'
        ) {
          return json.responseData.translatedText;
        }
      } else if (provider === 'libretranslate') {
        if (json && typeof json.translatedText === 'string') {
          return json.translatedText;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };
  async function translateText(text, target, source) {
    const t = norm(text);
    if (!t) return '';
    const tl = target || CFG.targetLang;
    const sl = source || CFG.sourceLang;
    const ck = sl + ':' + tl + ':' + t;
    if (cache.has(ck)) return cache.get(ck);
    for (const provider of providers) {
      try {
        const cap = providerMaxChars[provider] || Infinity;
        if (t.length > cap) continue;
        const res = await __translatorFetch(buildUrl(provider, t, sl, tl));
        if (!res || !res.ok) continue;
        const json = await res.json();
        const out = extract(json, provider);
        if (typeof out === 'string' && out) {
          cache.set(ck, out);
          return out;
        }
      } catch (e) {
        // probar siguiente proveedor
      }
    }
    return text;
  }
  function ensureState() {
    if (stateReady) return;
    stateReady = true;
    try {
      const saved = __translatorStorage.get(MAP_KEY);
      if (saved && typeof saved === 'object' && saved.novels && saved.c2n) {
        map = saved;
      }
    } catch (e) {}
    if (!map) map = { novels: {}, c2n: {} };
    try {
      const savedOrder = __translatorStorage.get(ORDER_KEY);
      if (Array.isArray(savedOrder)) order = savedOrder;
    } catch (e) {}
    if (!order) order = [];
  }
  function persistMap() {
    try {
      __translatorStorage.set(MAP_KEY, map);
    } catch (e) {}
  }
  function persistOrder() {
    try {
      __translatorStorage.set(ORDER_KEY, order);
    } catch (e) {}
  }
  function getCached(path) {
    if (!path) return null;
    try {
      const v = __translatorStorage.get(CH_PREFIX + path);
      if (typeof v === 'string' && v) return v;
    } catch (e) {}
    return null;
  }
  function setCached(path, html) {
    if (!path || !html) return;
    try {
      __translatorStorage.set(CH_PREFIX + path, html);
      const at = order.indexOf(path);
      if (at >= 0) order.splice(at, 1);
      order.push(path);
      while (order.length > CFG.cacheMaxEntries) {
        const evicted = order.shift();
        if (evicted) {
          try {
            __translatorStorage.delete(CH_PREFIX + evicted);
          } catch (e) {}
        }
      }
      persistOrder();
    } catch (e) {}
  }
  function indexNovel(novelPath, chapters) {
    ensureState();
    const paths = [];
    if (Array.isArray(chapters)) {
      for (let i = 0; i < chapters.length; i++) {
        const c = chapters[i];
        if (c && typeof c.path === 'string' && c.path) paths.push(c.path);
      }
    }
    const keys = Object.keys(map.novels);
    if (keys.indexOf(novelPath) === -1) {
      while (keys.length >= CFG.maxIndexedNovels) {
        const oldKey = keys.shift();
        delete map.novels[oldKey];
        const c2nKeys = Object.keys(map.c2n);
        for (let i = 0; i < c2nKeys.length; i++) {
          const entry = map.c2n[c2nKeys[i]];
          if (entry && entry.n === oldKey) delete map.c2n[c2nKeys[i]];
        }
      }
    }
    map.novels[novelPath] = paths;
    for (let i = 0; i < paths.length; i++) {
      map.c2n[paths[i]] = { n: novelPath, i: i };
    }
    persistMap();
  }
  async function translateLines(values) {
    const clean = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      clean.push(typeof v === 'string' ? v.replace(/\n/g, ' ').trim() : '');
    }
    const batches = [];
    let current = null;
    let len = 0;
    for (let i = 0; i < clean.length; i++) {
      const line = clean[i];
      if (!line) continue;
      if (!current || len + 1 + line.length > CFG.maxBatchChars) {
        current = { idxs: [], texts: [] };
        batches.push(current);
        len = 0;
      }
      current.idxs.push(i);
      current.texts.push(line);
      len += 1 + line.length;
    }
    const results = await Promise.all(
      batches.map(batch =>
        guard(() => {
          const joined = batch.texts.join('\n');
          return translateText(joined).then(t => ({ batch: batch, text: t }));
        }),
      ),
    );
    const out = clean.slice();
    for (const result of results) {
      const batch = result.batch;
      const text = result.text;
      if (!text || !text.trim()) continue;
      const parts = text.split('\n');
      if (parts.length === batch.texts.length) {
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].trim()) out[batch.idxs[i]] = parts[i];
        }
      } else if (batch.texts.length <= 8) {
        for (let i = 0; i < batch.texts.length; i++) {
          try {
            const one = await translateText(batch.texts[i]);
            if (one && one.trim()) out[batch.idxs[i]] = one;
          } catch (e) {}
        }
      }
    }
    return out;
  }
  async function translateNovelItems(items) {
    if (!Array.isArray(items) || !items.length) return items;
    try {
      const names = items.map(item =>
        item && typeof item.name === 'string' ? item.name : '',
      );
      const translated = await translateLines(names);
      return items.map((item, i) => ({
        ...item,
        name: translated[i] && translated[i].trim() ? translated[i] : item.name,
      }));
    } catch (e) {
      return items;
    }
  }
  async function translateChapterNames(chapters) {
    const capped = Array.isArray(chapters)
      ? chapters.slice(0, CFG.maxChapterNames)
      : [];
    if (!capped.length) return [];
    try {
      const names = capped.map(ch =>
        ch && typeof ch.name === 'string' ? ch.name : '',
      );
      const translated = await translateLines(names);
      return capped.map((ch, i) => ({
        ...ch,
        name: translated[i] && translated[i].trim() ? translated[i] : ch.name,
      }));
    } catch (e) {
      return capped;
    }
  }
  async function translateSourceNovel(novel) {
    try {
      const updated = { ...novel };
      if (CFG.translateNovelNames && typeof updated.name === 'string') {
        const name = await translateText(updated.name);
        if (name && name.trim()) updated.name = name;
      }
      if (
        CFG.translateSummaries &&
        typeof updated.summary === 'string' &&
        updated.summary
      ) {
        const summary = await translateText(updated.summary);
        if (summary && summary.trim()) updated.summary = summary;
      }
      if (CFG.translateChapterNames && Array.isArray(updated.chapters)) {
        const translatedChapters = await translateChapterNames(
          updated.chapters,
        );
        if (translatedChapters.length < updated.chapters.length) {
          const rest = updated.chapters.slice(translatedChapters.length);
          updated.chapters = translatedChapters.concat(rest);
        } else {
          updated.chapters = translatedChapters;
        }
      }
      return updated;
    } catch (e) {
      return novel;
    }
  }
  function collectTextNodes($) {
    const nodes = [];
    const root = $('body');
    if (!root.length) return nodes;
    root.find('*').each((i, el) => {
      const tag = (el.tagName || '').toLowerCase();
      if (['script', 'style', 'pre', 'code', 'svg', 'noscript'].includes(tag))
        return;
      $(el)
        .contents()
        .each((j, child) => {
          if (child.type === 'text') {
            const value = child.data || '';
            if (value.trim()) {
              nodes.push({ el: child, value });
            }
          }
        });
    });
    return nodes;
  }
  function segmentizeText(s, max) {
    const out = [];
    let cur = '';
    for (const word of s.split(/(\s+)/)) {
      if (word.length > max) {
        if (cur) {
          out.push(cur);
          cur = '';
        }
        let rest = word;
        while (rest.length > max) {
          out.push(rest.slice(0, max));
          rest = rest.slice(max);
        }
        cur = rest;
        continue;
      }
      if ((cur + word).length > max && cur) {
        out.push(cur);
        cur = word;
      } else {
        cur += word;
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  async function translateHTMLContent(html) {
    try {
      if (typeof html !== 'string' || !html.trim()) {
        return { html: html, ok: false };
      }
      const $ = __translatorParse(html);
      const nodes = collectTextNodes($);
      if (!nodes.length) return { html: html, ok: false };
      const batches = [];
      let batch = null;
      for (const node of nodes) {
        const value = node.value;
        if (value.trim().length > CFG.maxBatchChars) {
          if (batch) {
            batches.push(batch);
            batch = null;
          }
          batches.push({
            lines: [node.el],
            texts: segmentizeText(value, CFG.maxBatchChars),
            chunked: true,
          });
          continue;
        }
        if (!batch) batch = { lines: [], texts: [] };
        if (
          batch.lines.length &&
          (batch.texts.join('\n') + '\n' + value).length > CFG.maxBatchChars
        ) {
          batches.push(batch);
          batch = { lines: [], texts: [] };
        }
        batch.lines.push(node.el);
        batch.texts.push(value);
      }
      if (batch) batches.push(batch);
      let originalTotalLen = 0;
      let changedLen = 0;
      for (const chunk of batches) {
        if (!chunk.lines.length) continue;
        if (chunk.chunked) {
          const translated = [];
          for (const seg of chunk.texts) {
            const t = await translateText(seg);
            if (t && t.trim() && t !== seg) {
              changedLen += t.length;
              translated.push(t);
            } else {
              translated.push(seg);
            }
          }
          originalTotalLen += chunk.texts.join(' ').length;
          chunk.lines[0].data = translated.join(' ');
          continue;
        }
        const joined = chunk.texts.join('\n');
        originalTotalLen += joined.length;
        const translated = await translateText(joined);
        if (!translated || !translated.trim() || translated === joined) {
          continue;
        }
        const parts = translated.split('\n');
        if (parts.length === chunk.lines.length) {
          for (let i = 0; i < chunk.lines.length; i += 1) {
            if (parts[i] && parts[i].trim()) {
              if (parts[i] !== chunk.texts[i]) changedLen += parts[i].length;
              chunk.lines[i].data = parts[i];
            }
          }
        } else {
          for (let i = 0; i < chunk.lines.length; i += 1) {
            const t = await translateText(chunk.texts[i] || '');
            if (t && t.trim()) {
              if (t !== chunk.texts[i]) changedLen += t.length;
              chunk.lines[i].data = t;
            }
          }
        }
      }
      const tooShort =
        originalTotalLen > 200 && changedLen < originalTotalLen * 0.4;
      if (tooShort) {
        if (changedLen === 0) {
          return { html: html, ok: false };
        }
        console.warn('[translate] RESULT TOO SHORT - returning original');
        return { html: html, ok: false };
      }
      return { html: $.html(), ok: changedLen > 0 };
    } catch (e) {
      return { html: html, ok: false };
    }
  }
  async function runDirect(path, args) {
    if (!origParseChapter) return '';
    const raw =
      args && args.length
        ? await origParseChapter.apply(null, args)
        : await origParseChapter(path);
    if (typeof raw !== 'string' || !raw) return raw;
    if (!CFG.translateContent) return raw;
    const res = await translateHTMLContent(raw);
    const out =
      res && typeof res.html === 'string' && res.html ? res.html : raw;
    if (res && res.ok && out && out !== raw) setCached(path, out);
    return out;
  }
  function startJob(path, args) {
    if (path) {
      const existing = inflight.get(path);
      if (existing) return existing;
    }
    const job = runDirect(path, args).then(
      value => {
        if (path && inflight.get(path) === job) inflight.delete(path);
        return value;
      },
      error => {
        if (path && inflight.get(path) === job) inflight.delete(path);
        throw error;
      },
    );
    if (path) inflight.set(path, job);
    return job;
  }
  async function ensureBackground(path) {
    try {
      const hit = getCached(path);
      if (hit) return hit;
      return await startJob(path, null);
    } catch (e) {
      return '';
    }
  }
  function scheduleWindow(novelPath, afterIdx, count) {
    try {
      ensureState();
      const paths = map.novels[novelPath];
      if (!paths || !paths.length) return;
      const start = afterIdx + 1;
      const end = Math.min(paths.length, afterIdx + 1 + count);
      if (start >= end) return;
      const token = ++chainToken;
      console.warn('[translate] prefetch', novelPath, start, '->', end - 1);
      (async () => {
        for (let i = start; i < end; i++) {
          if (token !== chainToken) return;
          const p = paths[i];
          if (!p) continue;
          if (getCached(p)) continue;
          const out = await ensureBackground(p);
          if (!out) return;
        }
      })();
    } catch (e) {}
  }
  function scheduleForPath(path) {
    try {
      ensureState();
      const entry = map.c2n[path];
      if (!entry) return;
      scheduleWindow(entry.n, entry.i, CFG.prefetchAhead);
    } catch (e) {}
  }
  function wrapPlugin(plugin) {
    if (!plugin || !CFG.enabled) return;
    if (typeof plugin.popularNovels === 'function') {
      const orig = plugin.popularNovels.bind(plugin);
      plugin.popularNovels = async (pageNo, options) => {
        let opts = options;
        try {
          if (CFG.translateQuery && options && options.filters) {
            const next = {};
            let changed = false;
            for (const key in options.filters) {
              const f = options.filters[key];
              next[key] = f && typeof f === 'object' ? { ...f } : f;
              const value = next[key] && next[key].value;
              if (
                typeof value === 'string' &&
                value.trim() &&
                !/^\d+$/.test(value.trim()) &&
                key !== 'm_orderby' &&
                key !== 'adult'
              ) {
                const translated = await translateText(
                  value,
                  'en',
                  CFG.sourceLang,
                ).catch(() => value);
                if (translated && translated.trim()) {
                  next[key].value = translated;
                  changed = true;
                }
              }
            }
            if (changed) opts = { ...options, filters: next };
          }
        } catch (e) {}
        const res = await orig(pageNo, opts);
        if (Array.isArray(res)) return translateNovelItems(res);
        return res;
      };
    }
    if (typeof plugin.searchNovels === 'function') {
      const orig = plugin.searchNovels.bind(plugin);
      plugin.searchNovels = async (searchTerm, pageNo) => {
        const query = typeof searchTerm === 'string' ? searchTerm : '';
        const effectiveQuery = CFG.translateQuery
          ? (await translateText(query, 'en', CFG.sourceLang).catch(
              () => query,
            )) || query
          : query;
        const raw = await orig(effectiveQuery, pageNo);
        if (!Array.isArray(raw)) return raw;
        const fold = s => {
          try {
            return String(s || '')
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
          } catch (e) {
            return String(s || '').toLowerCase();
          }
        };
        const enQ = effectiveQuery ? fold(effectiveQuery) : '';
        const esQ = query ? fold(query) : '';
        const translated = await translateNovelItems(raw);
        const containsQ = (name, path, q) =>
          q &&
          q.length >= 2 &&
          (name.indexOf(q) !== -1 ||
            path.indexOf(q.replace(/\s+/g, '-')) !== -1);
        let out = translated;
        if (enQ.length >= 2 || esQ.length >= 2) {
          const exact = [];
          const partial = [];
          translated.forEach((n, i) => {
            const name = fold(n.name);
            const path = fold(n.path);
            const rawName = fold(raw[i] ? raw[i].name : '');
            const rawPath = fold(raw[i] ? raw[i].path : '');
            if (
              (enQ.length >= 2 && (name === enQ || rawName === enQ)) ||
              (esQ.length >= 2 && name === esQ)
            ) {
              exact.push(n);
              return;
            }
            if (
              containsQ(name, path, enQ) ||
              containsQ(rawName, rawPath, enQ) ||
              containsQ(name, path, esQ)
            ) {
              partial.push(n);
            }
          });
          if (exact.length) out = exact;
          else if (partial.length) out = partial;
        }
        return out;
      };
    }
    if (typeof plugin.parseNovel === 'function') {
      const orig = plugin.parseNovel.bind(plugin);
      plugin.parseNovel = async novelPath => {
        const res = await orig(novelPath);
        if (res && typeof res === 'object') {
          try {
            ensureState();
            indexNovel(
              String(novelPath || ''),
              Array.isArray(res.chapters) ? res.chapters : [],
            );
            scheduleWindow(String(novelPath || ''), -1, CFG.initialPrefetch);
          } catch (e) {}
          return translateSourceNovel(res);
        }
        return res;
      };
    }
    if (typeof plugin.parseChapter === 'function') {
      const orig = plugin.parseChapter.bind(plugin);
      origParseChapter = orig;
      plugin.parseChapter = async (...args) => {
        const path = String((args && args[0]) || '');
        ensureState();
        let out;
        const cached = getCached(path);
        if (cached) {
          out = cached;
        } else if (!path) {
          out = await orig(...args);
          if (CFG.translateContent && typeof out === 'string') {
            const res = await translateHTMLContent(out);
            if (res && typeof res.html === 'string' && res.html) out = res.html;
          }
        } else {
          out = await startJob(path, args);
        }
        if (path) scheduleForPath(path);
        return out;
      };
    }
  }
  return wrapPlugin;
})();
__ENTranslation(plugin);
/* __ENTranslationInjected END */

export default plugin;

type ChapterEntry = {
  id: number;
  volumeId: number;
  title: string;
  date: string;
  order: number;
  url: string;
};

type VolumeEntry = {
  id: number;
  title: string;
  cover: string;
  order: number;
};

enum ParsingState {
  Idle,
  InTitle,
  InAuthor,
  InDescription,
  InTags,
  InTagLink,
  InStatusSpan,
  InScript,
  InNote,
  InChapter,
  InHidden,
  Novel,
}

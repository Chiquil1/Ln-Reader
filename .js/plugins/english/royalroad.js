"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var htmlparser2_1 = require("htmlparser2");
var fetch_1 = require("@libs/fetch");
var filterInputs_1 = require("@libs/filterInputs");
var novelStatus_1 = require("@libs/novelStatus");
var isAbsoluteUrl_1 = require("@libs/isAbsoluteUrl");
var storage_1 = require("@libs/storage");
var RoyalRoad = /** @class */ (function () {
    function RoyalRoad() {
        this.id = 'royalroad';
        this.name = 'Royal Road';
        this.version = '2.4.0';
        this.icon = 'src/en/royalroad/icon.png';
        this.site = 'https://www.royalroad.com/';
        this.enableVol = storage_1.storage.get('enableVol');
        this.pluginSettings = {
            enableVol: {
                value: '',
                label: 'Enable Pagination / Volume view (not recommended)',
                type: 'Switch',
            },
        };
        this.filters = {
            'keyword': {
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Keyword (title or description)',
                'value': '',
            },
            'author': {
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Author',
                'value': '',
            },
            'genres': {
                'type': filterInputs_1.FilterTypes.ExcludableCheckboxGroup,
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
                'type': filterInputs_1.FilterTypes.ExcludableCheckboxGroup,
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
                'type': filterInputs_1.FilterTypes.ExcludableCheckboxGroup,
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
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Min Pages',
                'value': '0',
            },
            'maxPages': {
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Max Pages',
                'value': '20000',
            },
            'minRating': {
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Min Rating (0.0 - 5.0)',
                'value': '0.0',
            },
            'maxRating': {
                'type': filterInputs_1.FilterTypes.TextInput,
                'label': 'Max Rating (0.0 - 5.0)',
                'value': '5.0',
            },
            'status': {
                'type': filterInputs_1.FilterTypes.Picker,
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
                'type': filterInputs_1.FilterTypes.Picker,
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
                'type': filterInputs_1.FilterTypes.Picker,
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
                'type': filterInputs_1.FilterTypes.Picker,
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
        };
    }
    RoyalRoad.prototype.parseNovels = function (html) {
        var baseUrl = this.site;
        var novels = [];
        var tempNovel = {};
        var state = ParsingState.Idle;
        var parser = new htmlparser2_1.Parser({
            'options': { 'versionIncrements': 70 },
            onopentag: function (name, attribs) {
                var _a;
                if ((_a = attribs['class']) === null || _a === void 0 ? void 0 : _a.includes('fiction-list-item')) {
                    state = ParsingState.Novel;
                }
                if (state !== ParsingState.Novel)
                    return;
                switch (name) {
                    case 'a':
                        if (attribs['href']) {
                            tempNovel.path = attribs['href'].split('/').slice(1, 3).join('/');
                        }
                        break;
                    case 'img':
                        if (attribs['src']) {
                            tempNovel.name = attribs['alt'] || '';
                            tempNovel.cover = !(0, isAbsoluteUrl_1.isUrlAbsolute)(attribs['src'])
                                ? baseUrl + attribs['src'].slice(1)
                                : attribs['src'];
                        }
                        break;
                }
            },
            onclosetag: function (name) {
                if (name === 'figure') {
                    if (tempNovel.path && tempNovel.name) {
                        novels.push(tempNovel);
                        tempNovel = {};
                    }
                    state = ParsingState.Idle;
                }
            },
        });
        parser.write(html);
        parser.end();
        return novels;
    };
    RoyalRoad.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var params, key, _i, _c, include, _d, _e, exclude, link, body;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        params = new URLSearchParams({
                            page: page.toString(),
                        });
                        if (showLatestNovels) {
                            params.append('orderBy', 'last_update');
                        }
                        if (!filters)
                            filters = this.filters || {};
                        for (key in filters) {
                            if (filters[key].value === '')
                                continue;
                            if (key === 'genres' || key === 'tags' || key === 'content_warnings') {
                                if (filters[key].value.include) {
                                    for (_i = 0, _c = filters[key].value.include; _i < _c.length; _i++) {
                                        include = _c[_i];
                                        params.append('tagsAdd', include);
                                    }
                                }
                                if (filters[key].value.exclude) {
                                    for (_d = 0, _e = filters[key].value.exclude; _d < _e.length; _d++) {
                                        exclude = _e[_d];
                                        params.append('tagsRemove', exclude);
                                    }
                                }
                            }
                            else {
                                params.append(key, String(filters[key].value));
                            }
                        }
                        link = "".concat(this.site, "fictions/search?").concat(params.toString());
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link).then(function (r) { return r.text(); })];
                    case 1:
                        body = _f.sent();
                        return [2 /*return*/, this.parseNovels(body)];
                }
            });
        });
    };
    RoyalRoad.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, html, novel, baseUrl, enableVolume, state, statusText, statusSpanCounter, nameParts, summaryParts, scriptContentParts, genreArray, chapterJson, volumeJson, parser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        html = _a.sent();
                        novel = {
                            path: novelPath,
                        };
                        baseUrl = this.site;
                        enableVolume = this.enableVol;
                        state = ParsingState.Idle;
                        statusText = '';
                        statusSpanCounter = 0;
                        nameParts = [];
                        summaryParts = [];
                        scriptContentParts = [];
                        genreArray = [];
                        chapterJson = [];
                        volumeJson = [];
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var _a, _b, _c, _d;
                                switch (name) {
                                    case 'h1':
                                        state = ParsingState.InTitle;
                                        break;
                                    case 'a':
                                        if (((_a = attribs['href']) === null || _a === void 0 ? void 0 : _a.startsWith('/profile/')) && !novel.author) {
                                            state = ParsingState.InAuthor;
                                        }
                                        else if (state === ParsingState.InTags) {
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
                                        if ((_b = attribs['class']) === null || _b === void 0 ? void 0 : _b.includes('tags')) {
                                            state = ParsingState.InTags;
                                        }
                                        else if ((_c = attribs['class']) === null || _c === void 0 ? void 0 : _c.includes('label-sm')) {
                                            statusSpanCounter++;
                                            if (statusSpanCounter === 2) {
                                                state = ParsingState.InStatusSpan;
                                                statusText = '';
                                            }
                                        }
                                        break;
                                    case 'img':
                                        if ((_d = attribs['class']) === null || _d === void 0 ? void 0 : _d.includes('thumbnail')) {
                                            novel.cover = attribs['src'];
                                            if (novel.cover && !(0, isAbsoluteUrl_1.isUrlAbsolute)(novel.cover)) {
                                                novel.cover = baseUrl + novel.cover.slice(1);
                                            }
                                        }
                                        break;
                                    case 'script':
                                        state = ParsingState.InScript;
                                        break;
                                }
                            },
                            ontext: function (text) {
                                var trimmedText = text.trim();
                                if (!trimmedText && state !== ParsingState.InScript)
                                    return;
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
                            onclosetag: function (name) {
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
                                        }
                                        else if (state === ParsingState.InAuthor) {
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
                                        }
                                        else if (state === ParsingState.InStatusSpan) {
                                            state = ParsingState.Idle;
                                        }
                                        break;
                                    case 'script':
                                        if (state === ParsingState.InScript) {
                                            state = ParsingState.Idle;
                                            var scriptContent = scriptContentParts.join('');
                                            var chapterMatch = scriptContent.match(/window\.chapters\s*=\s*(\[.*?\]);/);
                                            var volumeMatch = scriptContent.match(/window\.volumes\s*=\s*(\[.*?\]);/);
                                            if (chapterMatch === null || chapterMatch === void 0 ? void 0 : chapterMatch[1]) {
                                                chapterJson = JSON.parse(chapterMatch[1]);
                                            }
                                            if ((volumeMatch === null || volumeMatch === void 0 ? void 0 : volumeMatch[1]) && enableVolume) {
                                                volumeJson = JSON.parse(volumeMatch[1]);
                                            }
                                        }
                                        break;
                                }
                            },
                            onend: function () {
                                switch (statusText) {
                                    case 'ONGOING':
                                        novel.status = novelStatus_1.NovelStatus.Ongoing;
                                        break;
                                    case 'HIATUS':
                                        novel.status = novelStatus_1.NovelStatus.OnHiatus;
                                        break;
                                    case 'COMPLETED':
                                        novel.status = novelStatus_1.NovelStatus.Completed;
                                        break;
                                    default:
                                        novel.status = novelStatus_1.NovelStatus.Unknown;
                                }
                                novel.chapters = chapterJson.map(function (chapter) {
                                    var matchingVolume = volumeJson.find(function (volume) { return volume.id === chapter.volumeId; });
                                    return {
                                        name: chapter.title,
                                        path: (function () {
                                            var parts = chapter.url.split('/');
                                            return "".concat(parts[1], "/").concat(parts[2], "/").concat(parts[4], "/").concat(parts[5]);
                                        })(),
                                        releaseTime: chapter.date,
                                        chapterNumber: chapter === null || chapter === void 0 ? void 0 : chapter.order,
                                        page: matchingVolume === null || matchingVolume === void 0 ? void 0 : matchingVolume.title,
                                    };
                                });
                            },
                        });
                        parser.write(html);
                        parser.end();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    RoyalRoad.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, html, state, stateDepth, depth, chapterHtmlParts, notesHtmlParts, beforeNotesParts, afterNotesParts, isBeforeChapter, match, hiddenClass, stateBeforeHidden, escapeRegex, escapeMap, escapeHtml, parser;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath)];
                    case 1:
                        result = _b.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        html = _b.sent();
                        state = ParsingState.Idle;
                        stateDepth = 0;
                        depth = 0;
                        chapterHtmlParts = [];
                        notesHtmlParts = [];
                        beforeNotesParts = [];
                        afterNotesParts = [];
                        isBeforeChapter = true;
                        match = html.match(/<style>\n\s+.(.+?){[^{]+?display: none;/);
                        hiddenClass = (_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim();
                        stateBeforeHidden = null;
                        escapeRegex = /[&<>"']/g;
                        escapeMap = {
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#39;',
                        };
                        escapeHtml = function (text) {
                            return escapeRegex.test(text)
                                ? ((escapeRegex.lastIndex = 0),
                                    text.replace(escapeRegex, function (char) { return escapeMap[char]; }))
                                : text;
                        };
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                depth++;
                                var classes = attribs['class'] || '';
                                if (state !== ParsingState.InHidden &&
                                    hiddenClass &&
                                    classes.includes(hiddenClass)) {
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
                                        }
                                        else if (classes.includes('author-note-portlet')) {
                                            state = ParsingState.InNote;
                                            stateDepth = depth;
                                        }
                                        break;
                                    case ParsingState.InHidden:
                                        return;
                                }
                                if (state === ParsingState.InChapter || state === ParsingState.InNote) {
                                    var tag = "<".concat(name);
                                    for (var attr in attribs) {
                                        var value = attribs[attr].replace(/"/g, '&quot;');
                                        tag += " ".concat(attr, "=\"").concat(value, "\"");
                                    }
                                    tag += '>';
                                    if (state === ParsingState.InChapter) {
                                        chapterHtmlParts.push(tag);
                                    }
                                    else {
                                        notesHtmlParts.push(tag);
                                    }
                                }
                            },
                            ontext: function (text) {
                                switch (state) {
                                    case ParsingState.InChapter:
                                        chapterHtmlParts.push(escapeHtml(text));
                                        break;
                                    case ParsingState.InNote:
                                        notesHtmlParts.push(escapeHtml(text));
                                        break;
                                }
                            },
                            onclosetag: function (name) {
                                if (depth === stateDepth) {
                                    switch (state) {
                                        case ParsingState.InHidden:
                                            if (!stateBeforeHidden) {
                                                state = ParsingState.Idle; // Attempt recovery
                                                stateDepth = 0;
                                            }
                                            else {
                                                state = stateBeforeHidden.state;
                                                stateDepth = stateBeforeHidden.depth;
                                                stateBeforeHidden = null;
                                            }
                                            depth--;
                                            return;
                                        case ParsingState.InChapter:
                                            chapterHtmlParts.push("</div>");
                                            state = ParsingState.Idle;
                                            stateDepth = 0;
                                            depth--;
                                            return;
                                        case ParsingState.InNote:
                                            {
                                                var noteClass = "author-note-".concat(isBeforeChapter ? 'before' : 'after');
                                                var notesHtml = notesHtmlParts.join('').trim();
                                                var fullNote = "<div class=\"".concat(noteClass, "\">").concat(notesHtml, "</div>");
                                                if (isBeforeChapter) {
                                                    beforeNotesParts.push(fullNote);
                                                }
                                                else {
                                                    afterNotesParts.push(fullNote);
                                                }
                                                notesHtmlParts.length = 0;
                                                state = ParsingState.Idle;
                                                stateDepth = 0;
                                                depth--;
                                            }
                                            return;
                                    }
                                }
                                else if (state === ParsingState.InChapter ||
                                    state === ParsingState.InNote) {
                                    if (!parser['isVoidElement'](name)) {
                                        var closingTag = "</".concat(name, ">");
                                        if (state === ParsingState.InChapter) {
                                            chapterHtmlParts.push(closingTag);
                                        }
                                        else {
                                            notesHtmlParts.push(closingTag);
                                        }
                                    }
                                }
                                depth--;
                            },
                        });
                        parser.write(html);
                        parser.end();
                        return [2 /*return*/, [
                                beforeNotesParts.length > 0 ? beforeNotesParts.join('') : null,
                                chapterHtmlParts.length > 0 ? chapterHtmlParts.join('').trim() : null,
                                afterNotesParts.length > 0 ? afterNotesParts.join('') : null,
                            ]
                                .filter(Boolean)
                                .join('\n<hr class="notes-separator">\n')];
                }
            });
        });
    };
    RoyalRoad.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var params, searchUrl, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams({
                            page: page.toString(),
                            title: searchTerm,
                            globalFilters: 'true',
                        });
                        searchUrl = "".concat(this.site, "fictions/search?").concat(params.toString());
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(searchUrl).then(function (r) { return r.text(); })];
                    case 1:
                        body = _a.sent();
                        return [2 /*return*/, this.parseNovels(body)];
                }
            });
        });
    };
    return RoyalRoad;
}());
var plugin = new RoyalRoad();
/* __ENTranslationInjected v2 */
var fetch_2 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var storage_2 = require("@libs/storage");
var __ENTranslation = (function () {
    var CFG = {
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
    var providers = ['google', 'google_repeated', 'mymemory', 'libretranslate'];
    var providerMaxChars = {
        google: 2000,
        google_repeated: 1800,
        mymemory: 420,
        libretranslate: 1800,
    };
    var cache = new Map();
    var inflight = new Map();
    var MAP_KEY = 'es3:map';
    var ORDER_KEY = 'es3:order';
    var CH_PREFIX = 'es3:ch:';
    var map = null;
    var order = null;
    var stateReady = false;
    var chainToken = 0;
    var origParseChapter = null;
    var active = 0;
    var queue = [];
    var norm = function (s) {
        return String(s || '')
            .replace(/[ \t]+/g, ' ')
            .replace(/\r/g, '')
            .trim();
    };
    var guard = function (fn) {
        return new Promise(function (resolve, reject) {
            var start = function () {
                active += 1;
                fn()
                    .then(resolve, reject)
                    .finally(function () {
                    active -= 1;
                    var next = queue.shift();
                    if (next)
                        next();
                });
            };
            if (active < CFG.maxConcurrent)
                start();
            else
                queue.push(start);
        });
    };
    var buildUrl = function (provider, text, sl, tl) {
        var enc = encodeURIComponent(text);
        var src = provider === 'mymemory' && sl === 'auto' ? 'en' : sl;
        if (provider === 'google_repeated') {
            return ('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
                src +
                '&tl=' +
                tl +
                '&q=' +
                enc);
        }
        if (provider === 'mymemory') {
            return ('https://api.mymemory.translated.net/get?q=' +
                enc +
                '&langpair=' +
                src +
                '|' +
                tl);
        }
        if (provider === 'libretranslate') {
            return ('https://libretranslate.de/translate?q=' +
                enc +
                '&source=' +
                (sl === 'auto' ? 'en' : sl) +
                '&target=' +
                tl +
                '&format=text');
        }
        return ('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
            sl +
            '&tl=' +
            tl +
            '&dt=t&q=' +
            enc);
    };
    var extract = function (json, provider) {
        try {
            if (provider === 'google') {
                if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
                    return json[0]
                        .map(function (item) { return (Array.isArray(item) ? item[0] : null); })
                        .filter(Boolean)
                        .join('');
                }
            }
            else if (provider === 'google_repeated') {
                if (Array.isArray(json) && typeof json[0] === 'string') {
                    return json[0];
                }
            }
            else if (provider === 'mymemory') {
                if (json &&
                    json.responseStatus === 200 &&
                    json.responseData &&
                    typeof json.responseData.translatedText === 'string') {
                    return json.responseData.translatedText;
                }
            }
            else if (provider === 'libretranslate') {
                if (json && typeof json.translatedText === 'string') {
                    return json.translatedText;
                }
            }
        }
        catch (e) {
            return null;
        }
        return null;
    };
    function translateText(text, target, source) {
        return __awaiter(this, void 0, void 0, function () {
            var t, tl, sl, ck, _i, providers_1, provider, cap, res, json, out, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        t = norm(text);
                        if (!t)
                            return [2 /*return*/, ''];
                        tl = target || CFG.targetLang;
                        sl = source || CFG.sourceLang;
                        ck = sl + ':' + tl + ':' + t;
                        if (cache.has(ck))
                            return [2 /*return*/, cache.get(ck)];
                        _i = 0, providers_1 = providers;
                        _a.label = 1;
                    case 1:
                        if (!(_i < providers_1.length)) return [3 /*break*/, 7];
                        provider = providers_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        cap = providerMaxChars[provider] || Infinity;
                        if (t.length > cap)
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, fetch_2.fetchApi)(buildUrl(provider, t, sl, tl))];
                    case 3:
                        res = _a.sent();
                        if (!res || !res.ok)
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, res.json()];
                    case 4:
                        json = _a.sent();
                        out = extract(json, provider);
                        if (typeof out === 'string' && out) {
                            cache.set(ck, out);
                            return [2 /*return*/, out];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, text];
                }
            });
        });
    }
    function ensureState() {
        if (stateReady)
            return;
        stateReady = true;
        try {
            var saved = storage_2.storage.get(MAP_KEY);
            if (saved && typeof saved === 'object' && saved.novels && saved.c2n) {
                map = saved;
            }
        }
        catch (e) { }
        if (!map)
            map = { novels: {}, c2n: {} };
        try {
            var savedOrder = storage_2.storage.get(ORDER_KEY);
            if (Array.isArray(savedOrder))
                order = savedOrder;
        }
        catch (e) { }
        if (!order)
            order = [];
    }
    function persistMap() {
        try {
            storage_2.storage.set(MAP_KEY, map);
        }
        catch (e) { }
    }
    function persistOrder() {
        try {
            storage_2.storage.set(ORDER_KEY, order);
        }
        catch (e) { }
    }
    function getCached(path) {
        if (!path)
            return null;
        try {
            var v = storage_2.storage.get(CH_PREFIX + path);
            if (typeof v === 'string' && v)
                return v;
        }
        catch (e) { }
        return null;
    }
    function setCached(path, html) {
        if (!path || !html)
            return;
        try {
            storage_2.storage.set(CH_PREFIX + path, html);
            var at = order.indexOf(path);
            if (at >= 0)
                order.splice(at, 1);
            order.push(path);
            while (order.length > CFG.cacheMaxEntries) {
                var evicted = order.shift();
                if (evicted) {
                    try {
                        storage_2.storage.delete(CH_PREFIX + evicted);
                    }
                    catch (e) { }
                }
            }
            persistOrder();
        }
        catch (e) { }
    }
    function indexNovel(novelPath, chapters) {
        ensureState();
        var paths = [];
        if (Array.isArray(chapters)) {
            for (var i = 0; i < chapters.length; i++) {
                var c = chapters[i];
                if (c && typeof c.path === 'string' && c.path)
                    paths.push(c.path);
            }
        }
        var keys = Object.keys(map.novels);
        if (keys.indexOf(novelPath) === -1) {
            while (keys.length >= CFG.maxIndexedNovels) {
                var oldKey = keys.shift();
                delete map.novels[oldKey];
                var c2nKeys = Object.keys(map.c2n);
                for (var i = 0; i < c2nKeys.length; i++) {
                    var entry = map.c2n[c2nKeys[i]];
                    if (entry && entry.n === oldKey)
                        delete map.c2n[c2nKeys[i]];
                }
            }
        }
        map.novels[novelPath] = paths;
        for (var i = 0; i < paths.length; i++) {
            map.c2n[paths[i]] = { n: novelPath, i: i };
        }
        persistMap();
    }
    function translateLines(values) {
        return __awaiter(this, void 0, void 0, function () {
            var clean, i, v, batches, current, len, i, line, results, out, _i, results_1, result, batch, text, parts, i, i, one, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clean = [];
                        for (i = 0; i < values.length; i++) {
                            v = values[i];
                            clean.push(typeof v === 'string' ? v.replace(/\n/g, ' ').trim() : '');
                        }
                        batches = [];
                        current = null;
                        len = 0;
                        for (i = 0; i < clean.length; i++) {
                            line = clean[i];
                            if (!line)
                                continue;
                            if (!current || len + 1 + line.length > CFG.maxBatchChars) {
                                current = { idxs: [], texts: [] };
                                batches.push(current);
                                len = 0;
                            }
                            current.idxs.push(i);
                            current.texts.push(line);
                            len += 1 + line.length;
                        }
                        return [4 /*yield*/, Promise.all(batches.map(function (batch) {
                                return guard(function () {
                                    var joined = batch.texts.join('\n');
                                    return translateText(joined).then(function (t) { return ({ batch: batch, text: t }); });
                                });
                            }))];
                    case 1:
                        results = _a.sent();
                        out = clean.slice();
                        _i = 0, results_1 = results;
                        _a.label = 2;
                    case 2:
                        if (!(_i < results_1.length)) return [3 /*break*/, 10];
                        result = results_1[_i];
                        batch = result.batch;
                        text = result.text;
                        if (!text || !text.trim())
                            return [3 /*break*/, 9];
                        parts = text.split('\n');
                        if (!(parts.length === batch.texts.length)) return [3 /*break*/, 3];
                        for (i = 0; i < parts.length; i++) {
                            if (parts[i] && parts[i].trim())
                                out[batch.idxs[i]] = parts[i];
                        }
                        return [3 /*break*/, 9];
                    case 3:
                        if (!(batch.texts.length <= 8)) return [3 /*break*/, 9];
                        i = 0;
                        _a.label = 4;
                    case 4:
                        if (!(i < batch.texts.length)) return [3 /*break*/, 9];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, translateText(batch.texts[i])];
                    case 6:
                        one = _a.sent();
                        if (one && one.trim())
                            out[batch.idxs[i]] = one;
                        return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        i++;
                        return [3 /*break*/, 4];
                    case 9:
                        _i++;
                        return [3 /*break*/, 2];
                    case 10: return [2 /*return*/, out];
                }
            });
        });
    }
    function translateNovelItems(items) {
        return __awaiter(this, void 0, void 0, function () {
            var names, translated_1, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(items) || !items.length)
                            return [2 /*return*/, items];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        names = items.map(function (item) {
                            return item && typeof item.name === 'string' ? item.name : '';
                        });
                        return [4 /*yield*/, translateLines(names)];
                    case 2:
                        translated_1 = _a.sent();
                        return [2 /*return*/, items.map(function (item, i) { return (__assign(__assign({}, item), { name: translated_1[i] && translated_1[i].trim() ? translated_1[i] : item.name })); })];
                    case 3:
                        e_3 = _a.sent();
                        return [2 /*return*/, items];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function translateChapterNames(chapters) {
        return __awaiter(this, void 0, void 0, function () {
            var capped, names, translated_2, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        capped = Array.isArray(chapters)
                            ? chapters.slice(0, CFG.maxChapterNames)
                            : [];
                        if (!capped.length)
                            return [2 /*return*/, []];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        names = capped.map(function (ch) {
                            return ch && typeof ch.name === 'string' ? ch.name : '';
                        });
                        return [4 /*yield*/, translateLines(names)];
                    case 2:
                        translated_2 = _a.sent();
                        return [2 /*return*/, capped.map(function (ch, i) { return (__assign(__assign({}, ch), { name: translated_2[i] && translated_2[i].trim() ? translated_2[i] : ch.name })); })];
                    case 3:
                        e_4 = _a.sent();
                        return [2 /*return*/, capped];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function translateSourceNovel(novel) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, name_1, summary, translatedChapters, rest, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        updated = __assign({}, novel);
                        if (!(CFG.translateNovelNames && typeof updated.name === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, translateText(updated.name)];
                    case 1:
                        name_1 = _a.sent();
                        if (name_1 && name_1.trim())
                            updated.name = name_1;
                        _a.label = 2;
                    case 2:
                        if (!(CFG.translateSummaries &&
                            typeof updated.summary === 'string' &&
                            updated.summary)) return [3 /*break*/, 4];
                        return [4 /*yield*/, translateText(updated.summary)];
                    case 3:
                        summary = _a.sent();
                        if (summary && summary.trim())
                            updated.summary = summary;
                        _a.label = 4;
                    case 4:
                        if (!(CFG.translateChapterNames && Array.isArray(updated.chapters))) return [3 /*break*/, 6];
                        return [4 /*yield*/, translateChapterNames(updated.chapters)];
                    case 5:
                        translatedChapters = _a.sent();
                        if (translatedChapters.length < updated.chapters.length) {
                            rest = updated.chapters.slice(translatedChapters.length);
                            updated.chapters = translatedChapters.concat(rest);
                        }
                        else {
                            updated.chapters = translatedChapters;
                        }
                        _a.label = 6;
                    case 6: return [2 /*return*/, updated];
                    case 7:
                        e_5 = _a.sent();
                        return [2 /*return*/, novel];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    function collectTextNodes($) {
        var nodes = [];
        var root = $('body');
        if (!root.length)
            return nodes;
        root.find('*').each(function (i, el) {
            var tag = (el.tagName || '').toLowerCase();
            if (['script', 'style', 'pre', 'code', 'svg', 'noscript'].includes(tag))
                return;
            $(el)
                .contents()
                .each(function (j, child) {
                if (child.type === 'text') {
                    var value = child.data || '';
                    if (value.trim()) {
                        nodes.push({ el: child, value: value });
                    }
                }
            });
        });
        return nodes;
    }
    function segmentizeText(s, max) {
        var out = [];
        var cur = '';
        for (var _i = 0, _a = s.split(/(\s+)/); _i < _a.length; _i++) {
            var word = _a[_i];
            if (word.length > max) {
                if (cur) {
                    out.push(cur);
                    cur = '';
                }
                var rest = word;
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
            }
            else {
                cur += word;
            }
        }
        if (cur)
            out.push(cur);
        return out;
    }
    function translateHTMLContent(html) {
        return __awaiter(this, void 0, void 0, function () {
            var $, nodes, batches, batch, _i, nodes_1, node, value, originalTotalLen, changedLen, _a, batches_1, chunk, translated_3, _b, _c, seg, t, joined, translated, parts, i, i, t, tooShort, e_6;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 14, , 15]);
                        if (typeof html !== 'string' || !html.trim()) {
                            return [2 /*return*/, { html: html, ok: false }];
                        }
                        $ = (0, cheerio_1.load)(html);
                        nodes = collectTextNodes($);
                        if (!nodes.length)
                            return [2 /*return*/, { html: html, ok: false }];
                        batches = [];
                        batch = null;
                        for (_i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                            node = nodes_1[_i];
                            value = node.value;
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
                            if (!batch)
                                batch = { lines: [], texts: [] };
                            if (batch.lines.length &&
                                (batch.texts.join('\n') + '\n' + value).length > CFG.maxBatchChars) {
                                batches.push(batch);
                                batch = { lines: [], texts: [] };
                            }
                            batch.lines.push(node.el);
                            batch.texts.push(value);
                        }
                        if (batch)
                            batches.push(batch);
                        originalTotalLen = 0;
                        changedLen = 0;
                        _a = 0, batches_1 = batches;
                        _d.label = 1;
                    case 1:
                        if (!(_a < batches_1.length)) return [3 /*break*/, 13];
                        chunk = batches_1[_a];
                        if (!chunk.lines.length)
                            return [3 /*break*/, 12];
                        if (!chunk.chunked) return [3 /*break*/, 6];
                        translated_3 = [];
                        _b = 0, _c = chunk.texts;
                        _d.label = 2;
                    case 2:
                        if (!(_b < _c.length)) return [3 /*break*/, 5];
                        seg = _c[_b];
                        return [4 /*yield*/, translateText(seg)];
                    case 3:
                        t = _d.sent();
                        if (t && t.trim() && t !== seg) {
                            changedLen += t.length;
                            translated_3.push(t);
                        }
                        else {
                            translated_3.push(seg);
                        }
                        _d.label = 4;
                    case 4:
                        _b++;
                        return [3 /*break*/, 2];
                    case 5:
                        originalTotalLen += chunk.texts.join(' ').length;
                        chunk.lines[0].data = translated_3.join(' ');
                        return [3 /*break*/, 12];
                    case 6:
                        joined = chunk.texts.join('\n');
                        originalTotalLen += joined.length;
                        return [4 /*yield*/, translateText(joined)];
                    case 7:
                        translated = _d.sent();
                        if (!translated || !translated.trim() || translated === joined) {
                            return [3 /*break*/, 12];
                        }
                        parts = translated.split('\n');
                        if (!(parts.length === chunk.lines.length)) return [3 /*break*/, 8];
                        for (i = 0; i < chunk.lines.length; i += 1) {
                            if (parts[i] && parts[i].trim()) {
                                if (parts[i] !== chunk.texts[i])
                                    changedLen += parts[i].length;
                                chunk.lines[i].data = parts[i];
                            }
                        }
                        return [3 /*break*/, 12];
                    case 8:
                        i = 0;
                        _d.label = 9;
                    case 9:
                        if (!(i < chunk.lines.length)) return [3 /*break*/, 12];
                        return [4 /*yield*/, translateText(chunk.texts[i] || '')];
                    case 10:
                        t = _d.sent();
                        if (t && t.trim()) {
                            if (t !== chunk.texts[i])
                                changedLen += t.length;
                            chunk.lines[i].data = t;
                        }
                        _d.label = 11;
                    case 11:
                        i += 1;
                        return [3 /*break*/, 9];
                    case 12:
                        _a++;
                        return [3 /*break*/, 1];
                    case 13:
                        tooShort = originalTotalLen > 200 && changedLen < originalTotalLen * 0.4;
                        if (tooShort) {
                            if (changedLen === 0) {
                                return [2 /*return*/, { html: html, ok: false }];
                            }
                            console.warn('[translate] RESULT TOO SHORT - returning original');
                            return [2 /*return*/, { html: html, ok: false }];
                        }
                        return [2 /*return*/, { html: $.html(), ok: changedLen > 0 }];
                    case 14:
                        e_6 = _d.sent();
                        return [2 /*return*/, { html: html, ok: false }];
                    case 15: return [2 /*return*/];
                }
            });
        });
    }
    function runDirect(path, args) {
        return __awaiter(this, void 0, void 0, function () {
            var raw, _a, res, out;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!origParseChapter)
                            return [2 /*return*/, ''];
                        if (!(args && args.length)) return [3 /*break*/, 2];
                        return [4 /*yield*/, origParseChapter.apply(null, args)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, origParseChapter(path)];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        raw = _a;
                        if (typeof raw !== 'string' || !raw)
                            return [2 /*return*/, raw];
                        if (!CFG.translateContent)
                            return [2 /*return*/, raw];
                        return [4 /*yield*/, translateHTMLContent(raw)];
                    case 5:
                        res = _b.sent();
                        out = res && typeof res.html === 'string' && res.html ? res.html : raw;
                        if (res && res.ok && out && out !== raw)
                            setCached(path, out);
                        return [2 /*return*/, out];
                }
            });
        });
    }
    function startJob(path, args) {
        if (path) {
            var existing = inflight.get(path);
            if (existing)
                return existing;
        }
        var job = runDirect(path, args).then(function (value) {
            if (path && inflight.get(path) === job)
                inflight.delete(path);
            return value;
        }, function (error) {
            if (path && inflight.get(path) === job)
                inflight.delete(path);
            throw error;
        });
        if (path)
            inflight.set(path, job);
        return job;
    }
    function ensureBackground(path) {
        return __awaiter(this, void 0, void 0, function () {
            var hit, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        hit = getCached(path);
                        if (hit)
                            return [2 /*return*/, hit];
                        return [4 /*yield*/, startJob(path, null)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_7 = _a.sent();
                        return [2 /*return*/, ''];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function scheduleWindow(novelPath, afterIdx, count) {
        var _this = this;
        try {
            ensureState();
            var paths_1 = map.novels[novelPath];
            if (!paths_1 || !paths_1.length)
                return;
            var start_1 = afterIdx + 1;
            var end_1 = Math.min(paths_1.length, afterIdx + 1 + count);
            if (start_1 >= end_1)
                return;
            var token_1 = ++chainToken;
            console.warn('[translate] prefetch', novelPath, start_1, '->', end_1 - 1);
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var i, p, out;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            i = start_1;
                            _a.label = 1;
                        case 1:
                            if (!(i < end_1)) return [3 /*break*/, 4];
                            if (token_1 !== chainToken)
                                return [2 /*return*/];
                            p = paths_1[i];
                            if (!p)
                                return [3 /*break*/, 3];
                            if (getCached(p))
                                return [3 /*break*/, 3];
                            return [4 /*yield*/, ensureBackground(p)];
                        case 2:
                            out = _a.sent();
                            if (!out)
                                return [2 /*return*/];
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            }); })();
        }
        catch (e) { }
    }
    function scheduleForPath(path) {
        try {
            ensureState();
            var entry = map.c2n[path];
            if (!entry)
                return;
            scheduleWindow(entry.n, entry.i, CFG.prefetchAhead);
        }
        catch (e) { }
    }
    function wrapPlugin(plugin) {
        var _this = this;
        if (!plugin || !CFG.enabled)
            return;
        if (typeof plugin.popularNovels === 'function') {
            var orig_1 = plugin.popularNovels.bind(plugin);
            plugin.popularNovels = function (pageNo, options) { return __awaiter(_this, void 0, void 0, function () {
                var opts, next, changed, _loop_1, _a, _b, _c, _i, key, e_8, res;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            opts = options;
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, , 8]);
                            if (!(CFG.translateQuery && options && options.filters)) return [3 /*break*/, 6];
                            next = {};
                            changed = false;
                            _loop_1 = function (key) {
                                var f, value, translated;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            f = options.filters[key];
                                            next[key] = f && typeof f === 'object' ? __assign({}, f) : f;
                                            value = next[key] && next[key].value;
                                            if (!(typeof value === 'string' &&
                                                value.trim() &&
                                                !/^\d+$/.test(value.trim()) &&
                                                key !== 'm_orderby' &&
                                                key !== 'adult')) return [3 /*break*/, 2];
                                            return [4 /*yield*/, translateText(value, 'en', CFG.sourceLang).catch(function () { return value; })];
                                        case 1:
                                            translated = _e.sent();
                                            if (translated && translated.trim()) {
                                                next[key].value = translated;
                                                changed = true;
                                            }
                                            _e.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            };
                            _a = options.filters;
                            _b = [];
                            for (_c in _a)
                                _b.push(_c);
                            _i = 0;
                            _d.label = 2;
                        case 2:
                            if (!(_i < _b.length)) return [3 /*break*/, 5];
                            _c = _b[_i];
                            if (!(_c in _a)) return [3 /*break*/, 4];
                            key = _c;
                            return [5 /*yield**/, _loop_1(key)];
                        case 3:
                            _d.sent();
                            _d.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            if (changed)
                                opts = __assign(__assign({}, options), { filters: next });
                            _d.label = 6;
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            e_8 = _d.sent();
                            return [3 /*break*/, 8];
                        case 8: return [4 /*yield*/, orig_1(pageNo, opts)];
                        case 9:
                            res = _d.sent();
                            if (Array.isArray(res))
                                return [2 /*return*/, translateNovelItems(res)];
                            return [2 /*return*/, res];
                    }
                });
            }); };
        }
        if (typeof plugin.searchNovels === 'function') {
            var orig_2 = plugin.searchNovels.bind(plugin);
            plugin.searchNovels = function (searchTerm, pageNo) { return __awaiter(_this, void 0, void 0, function () {
                var query, effectiveQuery, _a, raw, fold, enQ, esQ, translated, containsQ, out, exact_1, partial_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            query = typeof searchTerm === 'string' ? searchTerm : '';
                            if (!CFG.translateQuery) return [3 /*break*/, 2];
                            return [4 /*yield*/, translateText(query, 'en', CFG.sourceLang).catch(function () { return query; })];
                        case 1:
                            _a = (_b.sent()) || query;
                            return [3 /*break*/, 3];
                        case 2:
                            _a = query;
                            _b.label = 3;
                        case 3:
                            effectiveQuery = _a;
                            return [4 /*yield*/, orig_2(effectiveQuery, pageNo)];
                        case 4:
                            raw = _b.sent();
                            if (!Array.isArray(raw))
                                return [2 /*return*/, raw];
                            fold = function (s) {
                                try {
                                    return String(s || '')
                                        .toLowerCase()
                                        .normalize('NFD')
                                        .replace(/[\u0300-\u036f]/g, '');
                                }
                                catch (e) {
                                    return String(s || '').toLowerCase();
                                }
                            };
                            enQ = effectiveQuery ? fold(effectiveQuery) : '';
                            esQ = query ? fold(query) : '';
                            return [4 /*yield*/, translateNovelItems(raw)];
                        case 5:
                            translated = _b.sent();
                            containsQ = function (name, path, q) {
                                return q &&
                                    q.length >= 2 &&
                                    (name.indexOf(q) !== -1 ||
                                        path.indexOf(q.replace(/\s+/g, '-')) !== -1);
                            };
                            out = translated;
                            if (enQ.length >= 2 || esQ.length >= 2) {
                                exact_1 = [];
                                partial_1 = [];
                                translated.forEach(function (n, i) {
                                    var name = fold(n.name);
                                    var path = fold(n.path);
                                    var rawName = fold(raw[i] ? raw[i].name : '');
                                    var rawPath = fold(raw[i] ? raw[i].path : '');
                                    if ((enQ.length >= 2 && (name === enQ || rawName === enQ)) ||
                                        (esQ.length >= 2 && name === esQ)) {
                                        exact_1.push(n);
                                        return;
                                    }
                                    if (containsQ(name, path, enQ) ||
                                        containsQ(rawName, rawPath, enQ) ||
                                        containsQ(name, path, esQ)) {
                                        partial_1.push(n);
                                    }
                                });
                                if (exact_1.length)
                                    out = exact_1;
                                else if (partial_1.length)
                                    out = partial_1;
                            }
                            return [2 /*return*/, out];
                    }
                });
            }); };
        }
        if (typeof plugin.parseNovel === 'function') {
            var orig_3 = plugin.parseNovel.bind(plugin);
            plugin.parseNovel = function (novelPath) { return __awaiter(_this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, orig_3(novelPath)];
                        case 1:
                            res = _a.sent();
                            if (res && typeof res === 'object') {
                                try {
                                    ensureState();
                                    indexNovel(String(novelPath || ''), Array.isArray(res.chapters) ? res.chapters : []);
                                    scheduleWindow(String(novelPath || ''), -1, CFG.initialPrefetch);
                                }
                                catch (e) { }
                                return [2 /*return*/, translateSourceNovel(res)];
                            }
                            return [2 /*return*/, res];
                    }
                });
            }); };
        }
        if (typeof plugin.parseChapter === 'function') {
            var orig_4 = plugin.parseChapter.bind(plugin);
            origParseChapter = orig_4;
            plugin.parseChapter = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () {
                    var path, out, cached, res;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                path = String((args && args[0]) || '');
                                ensureState();
                                cached = getCached(path);
                                if (!cached) return [3 /*break*/, 1];
                                out = cached;
                                return [3 /*break*/, 7];
                            case 1:
                                if (!!path) return [3 /*break*/, 5];
                                return [4 /*yield*/, orig_4.apply(void 0, args)];
                            case 2:
                                out = _a.sent();
                                if (!(CFG.translateContent && typeof out === 'string')) return [3 /*break*/, 4];
                                return [4 /*yield*/, translateHTMLContent(out)];
                            case 3:
                                res = _a.sent();
                                if (res && typeof res.html === 'string' && res.html)
                                    out = res.html;
                                _a.label = 4;
                            case 4: return [3 /*break*/, 7];
                            case 5: return [4 /*yield*/, startJob(path, args)];
                            case 6:
                                out = _a.sent();
                                _a.label = 7;
                            case 7:
                                if (path)
                                    scheduleForPath(path);
                                return [2 /*return*/, out];
                        }
                    });
                });
            };
        }
    }
    return wrapPlugin;
})();
__ENTranslation(plugin);
/* __ENTranslationInjected END */
exports.default = plugin;
var ParsingState;
(function (ParsingState) {
    ParsingState[ParsingState["Idle"] = 0] = "Idle";
    ParsingState[ParsingState["InTitle"] = 1] = "InTitle";
    ParsingState[ParsingState["InAuthor"] = 2] = "InAuthor";
    ParsingState[ParsingState["InDescription"] = 3] = "InDescription";
    ParsingState[ParsingState["InTags"] = 4] = "InTags";
    ParsingState[ParsingState["InTagLink"] = 5] = "InTagLink";
    ParsingState[ParsingState["InStatusSpan"] = 6] = "InStatusSpan";
    ParsingState[ParsingState["InScript"] = 7] = "InScript";
    ParsingState[ParsingState["InNote"] = 8] = "InNote";
    ParsingState[ParsingState["InChapter"] = 9] = "InChapter";
    ParsingState[ParsingState["InHidden"] = 10] = "InHidden";
    ParsingState[ParsingState["Novel"] = 11] = "Novel";
})(ParsingState || (ParsingState = {}));

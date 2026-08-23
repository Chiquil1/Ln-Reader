"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var filterInputs_1 = require("@libs/filterInputs");
var constants_1 = require("@/types/constants");
var storage_1 = require("@libs/storage");
var NovelFire = /** @class */ (function () {
    function NovelFire() {
        this.id = 'novelfire';
        this.name = 'Novel Fire';
        this.version = '1.4.3';
        this.icon = 'src/en/novelfire/icon.png';
        this.site = 'https://novelfire.net/';
        this.webStorageUtilized = true;
        this.novelList = new Set();
        this.draw = 0;
        this.pluginSettings = {
            pageLength: {
                value: '',
                label: 'Page Mode (Change if Broken)',
                type: 'Switch',
            },
            singlePage: {
                value: '',
                label: 'Force load all chapters on a single page (Slower & use more data)',
                type: 'Switch',
            },
        };
        this.singlePage = storage_1.storage.get('singlePage');
        this.pageLength = storage_1.storage.get('pageLength');
        this.filters = {
            sort: {
                label: 'Sort Results By',
                value: 'rank-top',
                options: [
                    { label: 'Rank (Top)', value: 'rank-top' },
                    { label: 'Rating Score (Top)', value: 'rating-score-top' },
                    { label: 'Review Count (Most)', value: 'review' },
                    { label: 'Comment Count (Most)', value: 'comment' },
                    { label: 'Bookmark Count (Most)', value: 'bookmark' },
                    { label: 'Today Views (Most)', value: 'today-view' },
                    { label: 'Monthly Views (Most)', value: 'monthly-view' },
                    { label: 'Total Views (Most)', value: 'total-view' },
                    { label: 'Title (A>Z)', value: 'abc' },
                    { label: 'Title (Z>A)', value: 'cba' },
                    { label: 'Last Updated (Newest)', value: 'date' },
                    { label: 'Chapter Count (Most)', value: 'chapter-count-most' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            status: {
                label: 'Translation Status',
                value: '-1',
                options: [
                    { label: 'All', value: '-1' },
                    { label: 'Completed', value: '1' },
                    { label: 'Ongoing', value: '0' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genre_operator: {
                label: 'Genres (And/Or/Exclude)',
                value: 'and',
                options: [
                    { label: 'AND', value: 'and' },
                    { label: 'OR', value: 'or' },
                    { label: 'EXCLUDE', value: 'exclude' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genres: {
                label: 'Genres',
                value: [],
                options: [
                    { label: 'Action', value: '3' },
                    { label: 'Adult', value: '28' },
                    { label: 'Adventure', value: '4' },
                    { label: 'Anime', value: '46' },
                    { label: 'Arts', value: '47' },
                    { label: 'Comedy', value: '5' },
                    { label: 'Drama', value: '24' },
                    { label: 'Eastern', value: '44' },
                    { label: 'Ecchi', value: '26' },
                    { label: 'Fan-fiction', value: '48' },
                    { label: 'Fantasy', value: '6' },
                    { label: 'Game', value: '19' },
                    { label: 'Gender Bender', value: '25' },
                    { label: 'Harem', value: '7' },
                    { label: 'Historical', value: '12' },
                    { label: 'Horror', value: '37' },
                    { label: 'Isekai', value: '49' },
                    { label: 'Josei', value: '2' },
                    { label: 'Lgbt+', value: '45' },
                    { label: 'Magic', value: '50' },
                    { label: 'Magical Realism', value: '51' },
                    { label: 'Manhua', value: '52' },
                    { label: 'Martial Arts', value: '15' },
                    { label: 'Mature', value: '8' },
                    { label: 'Mecha', value: '34' },
                    { label: 'Military', value: '53' },
                    { label: 'Modern Life', value: '54' },
                    { label: 'Movies', value: '55' },
                    { label: 'Mystery', value: '16' },
                    { label: 'Other', value: '64' },
                    { label: 'Psychological', value: '9' },
                    { label: 'Realistic Fiction', value: '56' },
                    { label: 'Reincarnation', value: '43' },
                    { label: 'Romance', value: '1' },
                    { label: 'School Life', value: '21' },
                    { label: 'Sci-fi', value: '20' },
                    { label: 'Seinen', value: '10' },
                    { label: 'Shoujo', value: '38' },
                    { label: 'Shoujo Ai', value: '57' },
                    { label: 'Shounen', value: '17' },
                    { label: 'Shounen Ai', value: '39' },
                    { label: 'Slice of Life', value: '13' },
                    { label: 'Smut', value: '29' },
                    { label: 'Sports', value: '42' },
                    { label: 'Supernatural', value: '18' },
                    { label: 'System', value: '58' },
                    { label: 'Tragedy', value: '32' },
                    { label: 'Urban', value: '63' },
                    { label: 'Urban Life', value: '59' },
                    { label: 'Video Games', value: '60' },
                    { label: 'War', value: '61' },
                    { label: 'Wuxia', value: '31' },
                    { label: 'Xianxia', value: '23' },
                    { label: 'Xuanhuan', value: '22' },
                    { label: 'Yaoi', value: '14' },
                    { label: 'Yuri', value: '62' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            language: {
                label: 'Language',
                value: [],
                options: [
                    { label: 'Chinese', value: '1' },
                    { label: 'Korean', value: '2' },
                    { label: 'Japanese', value: '3' },
                    { label: 'English', value: '4' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            rating_operator: {
                label: 'Rating (Min/Max)',
                value: 'min',
                options: [
                    { label: 'Min', value: 'min' },
                    { label: 'Max', value: 'max' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            rating: {
                label: 'Rating',
                value: '0',
                options: [
                    { label: 'All', value: '0' },
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            chapters: {
                label: 'Chapters',
                value: '0',
                options: [
                    { label: 'All', value: '0' },
                    { label: '<50', value: '1,49' },
                    { label: '50-100', value: '50,100' },
                    { label: '100-200', value: '100,200' },
                    { label: '200-500', value: '200,500' },
                    { label: '500-1000', value: '500,1000' },
                    { label: '>1000', value: '1001,1000000' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    NovelFire.prototype.getCheerio = function (url, search) {
        return __awaiter(this, void 0, void 0, function () {
            var r, $, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        r = _b.sent();
                        if (!r.ok && search != true)
                            throw new Error('Could not reach site (' + r.status + ') try to open in webview.');
                        _a = cheerio_1.load;
                        return [4 /*yield*/, r.text()];
                    case 2:
                        $ = _a.apply(void 0, [_b.sent()]);
                        if ($('title').text().includes('Cloudflare')) {
                            throw new Error('Cloudflare is blocking requests. Try again later.');
                        }
                        return [2 /*return*/, $];
                }
            });
        });
    };
    NovelFire.prototype.parseNovels = function (loadedCheerio, selector, isFirstPage) {
        var _a, _b, _c;
        if (selector === void 0) { selector = '.novel-item'; }
        if (isFirstPage === void 0) { isFirstPage = false; }
        var novels = [];
        var elements = loadedCheerio(selector).toArray();
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var el = elements_1[_i];
            var $el = loadedCheerio(el);
            var novelName = (_a = $el.find('a').attr('title')) !== null && _a !== void 0 ? _a : $el.find('h4').text().trim();
            var novelPath = (_b = $el.children('a').attr('href')) !== null && _b !== void 0 ? _b : $el.find('h4 a').attr('href');
            if (!novelPath)
                continue;
            var path = new URL(novelPath, this.site).pathname.substring(1);
            if (!isFirstPage) {
                if (this.novelList.has(path))
                    continue;
                this.novelList.add(path);
            }
            else {
                this.novelList.add(path);
            }
            var imgElement = $el.find('.novel-cover > img');
            var rawSrc = (_c = imgElement.attr('data-src')) !== null && _c !== void 0 ? _c : imgElement.attr('src');
            var novelCover = rawSrc
                ? new URL(rawSrc, this.site).href
                : constants_1.defaultCover;
            novels.push({
                name: novelName,
                cover: novelCover,
                path: path,
            });
        }
        return novels;
    };
    NovelFire.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var url, params, _i, _c, language, _d, _e, genre, loadedCheerio;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (pageNo === 1) {
                            this.novelList.clear();
                            this.draw = 0;
                        }
                        url = this.site + 'search-adv';
                        params = new URLSearchParams();
                        for (_i = 0, _c = filters.language.value; _i < _c.length; _i++) {
                            language = _c[_i];
                            params.append('country_id[]', language);
                        }
                        params.append('ctgcon', filters.genre_operator.value);
                        for (_d = 0, _e = filters.genres.value; _d < _e.length; _d++) {
                            genre = _e[_d];
                            params.append('categories[]', genre);
                        }
                        params.append('totalchapter', filters.chapters.value);
                        params.append('ratcon', filters.rating_operator.value);
                        params.append('rating', filters.rating.value);
                        params.append('status', filters.status.value);
                        params.append('sort', showLatestNovels ? 'date' : filters.sort.value);
                        params.append('tagcon', 'and');
                        params.append('page', pageNo.toString());
                        return [4 /*yield*/, this.getCheerio("".concat(url, "?").concat(params.toString()), false)];
                    case 1:
                        loadedCheerio = _f.sent();
                        return [2 /*return*/, this.parseNovels(loadedCheerio, '.novel-item', pageNo === 1)];
                }
            });
        });
    };
    NovelFire.prototype.getAllChapters = function (novelPath, post_id, page) {
        return __awaiter(this, void 0, void 0, function () {
            var length, url, start, params, result, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        length = this.pageLength ? 100 : -1;
                        url = "".concat(this.site, "ajax/listChapterDataAjax");
                        start = length === -1 ? 0 : (parseInt(page) - 1) * length;
                        this.draw++;
                        params = new URLSearchParams({
                            draw: this.draw.toString(),
                            'columns[0][data]': 'n_sort',
                            'columns[0][name]': 'cmm_posts_detail.n_sort',
                            'columns[0][searchable]': 'true',
                            'columns[0][orderable]': 'true',
                            'columns[0][search][value]': '',
                            'columns[0][search][regex]': 'false',
                            'columns[1][data]': 'bookmark_created_at',
                            'columns[1][name]': 'bookmark_chapters.created_at',
                            'columns[1][searchable]': 'false',
                            'columns[1][orderable]': 'true',
                            'columns[1][search][value]': '',
                            'columns[1][search][regex]': 'false',
                            'order[0][column]': '0',
                            'order[0][dir]': 'asc',
                            'order[0][name]': 'cmm_posts_detail.n_sort',
                            start: start.toString(),
                            length: length.toString(),
                            'search[value]': '',
                            'search[regex]': 'false',
                            post_id: post_id,
                            only_bookmark: 'false',
                            _: Date.now().toString(),
                        });
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(url, "?").concat(params.toString()))];
                    case 1:
                        result = _a.sent();
                        if (result.status === 429)
                            throw new NovelFireThrottlingError();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        if (body.includes('You are being rate limited'))
                            throw new NovelFireThrottlingError();
                        if (body.includes('Page Not Found 404'))
                            throw new NovelFireAjaxNotFound();
                        return [2 /*return*/, (JSON.parse(body).data || [])
                                .flatMap(function (idx) {
                                var name = (0, cheerio_1.load)(idx.title || idx.slug)
                                    .text()
                                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                                    .trim();
                                var num = Number(idx.n_sort);
                                return name && !isNaN(num)
                                    ? [
                                        {
                                            name: name,
                                            path: "".concat(novelPath, "/chapter-").concat(num),
                                            chapterNumber: num,
                                        },
                                    ]
                                    : [];
                            })
                                .sort(function (a, b) {
                                return (a.chapterNumber || 0) - (b.chapterNumber || 0);
                            })];
                }
            });
        });
    };
    NovelFire.prototype.getAllChaptersForce = function (novelPath, pages) {
        return __awaiter(this, void 0, void 0, function () {
            var pagesArray, allChapters, chunkSize, retryCount, sleepTime, chaptersArray, i, pagesArrayChunk, firstPage, lastPage, attempt, chaptersArrayChunk, err_1, _i, chaptersArray_1, page, _a, _b, chapter;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        pagesArray = Array.from({ length: pages }, function (_, i) { return i + 1; });
                        allChapters = [];
                        chunkSize = 5;
                        retryCount = 10;
                        sleepTime = 3.5;
                        chaptersArray = [];
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < pagesArray.length)) return [3 /*break*/, 11];
                        pagesArrayChunk = pagesArray.slice(i, i + chunkSize);
                        firstPage = pagesArrayChunk[0];
                        lastPage = pagesArrayChunk[pagesArrayChunk.length - 1];
                        attempt = 0;
                        _c.label = 2;
                    case 2:
                        if (!(attempt < retryCount)) return [3 /*break*/, 10];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 9]);
                        return [4 /*yield*/, Promise.all(pagesArrayChunk.map(function (page) {
                                return _this.parsePage(novelPath, page.toString());
                            }))];
                    case 4:
                        chaptersArrayChunk = _c.sent();
                        chaptersArray.push.apply(chaptersArray, chaptersArrayChunk);
                        return [3 /*break*/, 10];
                    case 5:
                        err_1 = _c.sent();
                        if (!(err_1 instanceof NovelFireThrottlingError)) return [3 /*break*/, 7];
                        attempt += 1;
                        console.warn("[pages=".concat(firstPage, "-").concat(lastPage, "] Novel Fire is rate limiting requests. Retry attempt ").concat(attempt + 1, " in ").concat(sleepTime, " seconds..."));
                        if (attempt === retryCount) {
                            throw err_1;
                        }
                        // Sleep for X second before retrying
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, sleepTime * 1000); })];
                    case 6:
                        // Sleep for X second before retrying
                        _c.sent();
                        return [3 /*break*/, 8];
                    case 7: throw err_1;
                    case 8: return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 2];
                    case 10:
                        i += chunkSize;
                        return [3 /*break*/, 1];
                    case 11:
                        // Merge all chapters into a single array
                        for (_i = 0, chaptersArray_1 = chaptersArray; _i < chaptersArray_1.length; _i++) {
                            page = chaptersArray_1[_i];
                            if (page.chapters) {
                                for (_a = 0, _b = page.chapters; _a < _b.length; _a++) {
                                    chapter = _b[_a];
                                    allChapters.push(chapter);
                                }
                            }
                        }
                        return [2 /*return*/, allChapters];
                }
            });
        });
    };
    NovelFire.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var $, baseUrl, post_id, novel, coverUrl, summary, rawStatus, map, totalChapters, length, _a, _b;
            var _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        this.draw = 0;
                        return [4 /*yield*/, this.getCheerio(this.site + novelPath, false)];
                    case 1:
                        $ = _h.sent();
                        baseUrl = this.site;
                        post_id = $('#novel-report').attr('report-post_id');
                        if (post_id) {
                            storage_1.storage.set("".concat(this.id, "_").concat(novelPath.split('/').pop()), post_id);
                        }
                        novel = {
                            path: novelPath,
                            totalPages: 1,
                        };
                        novel.name =
                            (_d = (_c = $('.novel-title').text().trim()) !== null && _c !== void 0 ? _c : $('.cover > img').attr('alt')) !== null && _d !== void 0 ? _d : 'No Titled Found';
                        coverUrl = (_e = $('.cover > img').attr('data-src')) !== null && _e !== void 0 ? _e : $('.cover > img').attr('src');
                        if (coverUrl) {
                            novel.cover = new URL(coverUrl, baseUrl).href;
                        }
                        else {
                            novel.cover = constants_1.defaultCover;
                        }
                        novel.genres = $('.categories .property-item')
                            .map(function (_, el) { return $(el).text(); })
                            .toArray()
                            .join(',');
                        summary = $('.summary .content');
                        summary.find('.expand').remove();
                        summary.find('br').replaceWith('\n');
                        summary.find('p').before('\n').after('\n\n');
                        novel.summary =
                            ((_f = summary
                                .text()
                                .split('\n')
                                .map(function (line) { return line.trim(); })
                                .join('\n')) === null || _f === void 0 ? void 0 : _f.replace(/\n{3,}/g, '\n\n').trim()) || 'Summary Not Found';
                        novel.author = $('.author .property-item > span').text();
                        rawStatus = $('.header-stats .ongoing').text() ||
                            $('.header-stats .completed').text() ||
                            'Unknown';
                        map = {
                            ongoing: novelStatus_1.NovelStatus.Ongoing,
                            hiatus: novelStatus_1.NovelStatus.OnHiatus,
                            dropped: novelStatus_1.NovelStatus.Cancelled,
                            cancelled: novelStatus_1.NovelStatus.Cancelled,
                            completed: novelStatus_1.NovelStatus.Completed,
                            unknown: novelStatus_1.NovelStatus.Unknown,
                        };
                        novel.status = (_g = map[rawStatus.toLowerCase()]) !== null && _g !== void 0 ? _g : novelStatus_1.NovelStatus.Unknown;
                        novel.rating = parseFloat($('.nub').text().trim());
                        totalChapters = $('.header-stats i.icon-book-open')
                            .parent()
                            .text()
                            .trim();
                        length = this.pageLength ? 100 : -1;
                        novel.totalPages =
                            length === -1 ? 1 : Math.ceil(parseInt(totalChapters) / length) || 1;
                        if (!(novel.totalPages === 1 && post_id)) return [3 /*break*/, 3];
                        _a = novel;
                        return [4 /*yield*/, this.getAllChapters(novelPath, post_id, '1')];
                    case 2:
                        _a.chapters = _h.sent();
                        _h.label = 3;
                    case 3:
                        if (!(length === 100 && this.singlePage)) return [3 /*break*/, 5];
                        _b = novel;
                        return [4 /*yield*/, this.getAllChaptersForce(novel.path, novel.totalPages)];
                    case 4:
                        _b.chapters = _h.sent();
                        novel.totalPages = 1;
                        _h.label = 5;
                    case 5: return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelFire.prototype.parsePage = function (novelPath, page) {
        return __awaiter(this, void 0, void 0, function () {
            var post_id, chapters, e_1, length, url, result, body, loadedCheerio_1, chapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post_id = storage_1.storage.get("".concat(this.id, "_").concat(novelPath.split('/').pop()));
                        if (!(post_id && !isNaN(Number(post_id)))) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getAllChapters(novelPath, String(post_id), page)];
                    case 2:
                        chapters = _a.sent();
                        return [2 /*return*/, { chapters: chapters }];
                    case 3:
                        e_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        length = this.pageLength ? 100 : -1;
                        if (!(length === 100)) return [3 /*break*/, 7];
                        url = "".concat(this.site).concat(novelPath, "/chapters?page=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 5:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 6:
                        body = _a.sent();
                        loadedCheerio_1 = (0, cheerio_1.load)(body);
                        chapters = loadedCheerio_1('.chapter-list li')
                            .map(function (_, ele) {
                            var chapterName = loadedCheerio_1(ele).find('a').attr('title') || 'No Title Found';
                            var chapterPath = loadedCheerio_1(ele).find('a').attr('href');
                            if (!chapterPath)
                                return null;
                            return {
                                name: chapterName,
                                path: new URL(chapterPath, _this.site).pathname.substring(1),
                            };
                        })
                            .get()
                            .filter(function (chapter) { return chapter !== null; });
                        return [2 /*return*/, {
                                chapters: chapters,
                            }];
                    case 7: return [2 /*return*/, {
                            chapters: [],
                        }];
                }
            });
        });
    };
    NovelFire.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, loadedCheerio, chapterText, odds, _i, _a, ele, tag;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        url = this.site + chapterPath;
                        return [4 /*yield*/, this.getCheerio(url, false)];
                    case 1:
                        loadedCheerio = _c.sent();
                        chapterText = loadedCheerio('#content');
                        odds = chapterText.find(':not(p, h1, span, i, b, u, img, a, div, strong)');
                        for (_i = 0, _a = odds.toArray(); _i < _a.length; _i++) {
                            ele = _a[_i];
                            tag = ele.name.toString();
                            if (tag.length > 5 && ele.name.toString().substring(0, 1) == 'nf') {
                                loadedCheerio(ele).remove();
                            }
                        }
                        return [2 /*return*/, ((_b = chapterText.html()) === null || _b === void 0 ? void 0 : _b.replace(/&nbsp;/g, ' ')) || ''];
                }
            });
        });
    };
    NovelFire.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, result, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (page === 1) {
                            this.novelList.clear();
                            this.draw = 0;
                        }
                        params = new URLSearchParams();
                        params.append('keyword', searchTerm);
                        params.append('page', page.toString());
                        url = "".concat(this.site, "search?").concat(params.toString());
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio, '.novel-list.chapters .novel-item', page === 1)];
                }
            });
        });
    };
    return NovelFire;
}());
exports.default = new NovelFire();
// Custom error for when Novel Fire is rate limiting requests
var NovelFireThrottlingError = /** @class */ (function (_super) {
    __extends(NovelFireThrottlingError, _super);
    function NovelFireThrottlingError(message) {
        if (message === void 0) { message = 'Novel Fire is rate limiting requests'; }
        var _this = _super.call(this, message) || this;
        _this.name = 'NovelFireError';
        return _this;
    }
    return NovelFireThrottlingError;
}(Error));
var NovelFireAjaxNotFound = /** @class */ (function (_super) {
    __extends(NovelFireAjaxNotFound, _super);
    function NovelFireAjaxNotFound(message) {
        if (message === void 0) { message = 'Novel Fire says its Ajax interface is not found'; }
        var _this = _super.call(this, message) || this;
        _this.name = 'NovelFireAjaxError';
        return _this;
    }
    return NovelFireAjaxNotFound;
}(Error));

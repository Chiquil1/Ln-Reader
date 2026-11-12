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
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var filterInputs_1 = require("@libs/filterInputs");
var defaultCover_1 = require("@libs/defaultCover");
var storage_1 = require("@libs/storage");
var NovelFire = /** @class */ (function () {
    function NovelFire() {
        this.id = 'novelfire';
        this.name = 'Novel Fire';
        this.version = '1.4.6';
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
                : defaultCover_1.defaultCover;
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
                            'options': { 'versionIncrements': 70 },
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
            var pagesArray, allChapters, chunkSize, retryCount, chaptersArray, i, pagesArrayChunk, firstPage, lastPage, attempt, chaptersArrayChunk, err_1, _i, chaptersArray_1, page, _a, _b, chapter;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        pagesArray = Array.from({ length: pages }, function (_, i) { return i + 1; });
                        allChapters = [];
                        chunkSize = 5;
                        retryCount = 10;
                        chaptersArray = [];
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < pagesArray.length)) return [3 /*break*/, 8];
                        pagesArrayChunk = pagesArray.slice(i, i + chunkSize);
                        firstPage = pagesArrayChunk[0];
                        lastPage = pagesArrayChunk[pagesArrayChunk.length - 1];
                        attempt = 0;
                        _c.label = 2;
                    case 2:
                        if (!(attempt < retryCount)) return [3 /*break*/, 7];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, Promise.all(pagesArrayChunk.map(function (page) {
                                return _this.parsePage(novelPath, page.toString());
                            }))];
                    case 4:
                        chaptersArrayChunk = _c.sent();
                        chaptersArray.push.apply(chaptersArray, chaptersArrayChunk);
                        return [3 /*break*/, 7];
                    case 5:
                        err_1 = _c.sent();
                        if (err_1 instanceof NovelFireThrottlingError) {
                            attempt += 1;
                            console.warn("[pages=".concat(firstPage, "-").concat(lastPage, "] Novel Fire is rate limiting requests. Retry attempt ").concat(attempt + 1, "..."));
                            if (attempt === retryCount) {
                                throw err_1;
                            }
                        }
                        else {
                            throw err_1;
                        }
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 2];
                    case 7:
                        i += chunkSize;
                        return [3 /*break*/, 1];
                    case 8:
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
            var $, baseUrl, post_id, novel, coverUrl, summary, rawStatus, map, totalChapters, length, _a, e_1, _b;
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
                            novel.cover = defaultCover_1.defaultCover;
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
                        if (!post_id) return [3 /*break*/, 5];
                        _h.label = 2;
                    case 2:
                        _h.trys.push([2, 4, , 5]);
                        _a = novel;
                        return [4 /*yield*/, this.getAllChapters(novelPath, post_id, '1')];
                    case 3:
                        _a.chapters = _h.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _h.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        if (!(length === 100 && this.singlePage)) return [3 /*break*/, 7];
                        _b = novel;
                        return [4 /*yield*/, this.getAllChaptersForce(novel.path, novel.totalPages)];
                    case 6:
                        _b.chapters = _h.sent();
                        novel.totalPages = 1;
                        _h.label = 7;
                    case 7: return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelFire.prototype.parsePage = function (novelPath, page) {
        return __awaiter(this, void 0, void 0, function () {
            var post_id, $, fetched, e_2, chapters, e_3, length, url, result, body, loadedCheerio_1, chapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post_id = storage_1.storage.get("".concat(this.id, "_").concat(novelPath.split('/').pop()));
                        if (!(!post_id || isNaN(Number(post_id)))) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getCheerio(this.site + novelPath, false)];
                    case 2:
                        $ = _a.sent();
                        fetched = $('#novel-report').attr('report-post_id');
                        if (fetched) {
                            post_id = fetched;
                            storage_1.storage.set("".concat(this.id, "_").concat(novelPath.split('/').pop()), post_id);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(post_id && !isNaN(Number(post_id)))) return [3 /*break*/, 8];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.getAllChapters(novelPath, String(post_id), page)];
                    case 6:
                        chapters = _a.sent();
                        return [2 /*return*/, { chapters: chapters }];
                    case 7:
                        e_3 = _a.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        length = this.pageLength ? 100 : -1;
                        if (!(length === 100)) return [3 /*break*/, 11];
                        url = "".concat(this.site).concat(novelPath, "/chapters?page=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 9:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 10:
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
                    case 11: return [2 /*return*/, {
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
            var allNovels, currentPage, hasMore, _loop_1, this_1, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Only the first page is requested by the app; fetch every page so the
                        // user sees all matches instead of just the first 20.
                        if (page !== 1) {
                            return [2 /*return*/, []];
                        }
                        this.novelList.clear();
                        this.draw = 0;
                        allNovels = [];
                        currentPage = 1;
                        hasMore = true;
                        _loop_1 = function () {
                            var params, url, result, body, loadedCheerio, pageNovels, hasNext;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        params = new URLSearchParams();
                                        params.append('keyword', searchTerm);
                                        params.append('page', currentPage.toString());
                                        url = "".concat(this_1.site, "search?").concat(params.toString());
                                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                                    case 1:
                                        result = _b.sent();
                                        return [4 /*yield*/, result.text()];
                                    case 2:
                                        body = _b.sent();
                                        loadedCheerio = (0, cheerio_1.load)(body);
                                        pageNovels = this_1.parseNovels(loadedCheerio, '.novel-list.chapters .novel-item', currentPage === 1);
                                        if (!pageNovels.length) {
                                            hasMore = false;
                                            return [2 /*return*/, "break"];
                                        }
                                        allNovels.push.apply(allNovels, pageNovels);
                                        hasNext = loadedCheerio('a[href*="page=' + (currentPage + 1) + '"]').length > 0 ||
                                            loadedCheerio('.pagination a').toArray().some(function (el) {
                                                var href = loadedCheerio(el).attr('href') || '';
                                                return href.includes('page=' + (currentPage + 1));
                                            });
                                        if (!hasNext) {
                                            hasMore = false;
                                        }
                                        else {
                                            currentPage += 1;
                                        }
                                        // Safety cap to avoid runaway loops.
                                        if (currentPage > 50)
                                            hasMore = false;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1:
                        if (!hasMore) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        state_1 = _a.sent();
                        if (state_1 === "break")
                            return [3 /*break*/, 3];
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, allNovels];
                }
            });
        });
    };
    return NovelFire;
}());
var plugin = new NovelFire();
/* __ENTranslationInjected v2 */
var fetch_2 = require("@libs/fetch");
var cheerio_2 = require("cheerio");
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
            var t, tl, sl, ck, _i, providers_1, provider, cap, res, json, out, e_4;
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
                        e_4 = _a.sent();
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
            var clean, i, v, batches, current, len, i, line, results, out, _i, results_1, result, batch, text, parts, i, i, one, e_5;
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
                        e_5 = _a.sent();
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
            var names, translated_1, e_6;
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
                        e_6 = _a.sent();
                        return [2 /*return*/, items];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function translateChapterNames(chapters) {
        return __awaiter(this, void 0, void 0, function () {
            var capped, names, translated_2, e_7;
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
                        e_7 = _a.sent();
                        return [2 /*return*/, capped];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function translateSourceNovel(novel) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, name_1, summary, translatedChapters, rest, e_8;
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
                        e_8 = _a.sent();
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
            var $, nodes, batches, batch, _i, nodes_1, node, value, originalTotalLen, changedLen, _a, batches_1, chunk, translated_3, _b, _c, seg, t, joined, translated, parts, i, i, t, tooShort, e_9;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 14, , 15]);
                        if (typeof html !== 'string' || !html.trim()) {
                            return [2 /*return*/, { html: html, ok: false }];
                        }
                        $ = (0, cheerio_2.load)(html);
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
                        e_9 = _d.sent();
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
            var hit, e_10;
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
                        e_10 = _a.sent();
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
                var opts, next, changed, _loop_2, _a, _b, _c, _i, key, e_11, res;
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
                            _loop_2 = function (key) {
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
                            return [5 /*yield**/, _loop_2(key)];
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
                            e_11 = _d.sent();
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
// Custom error for when Novel Fire is rate limiting requests
var NovelFireThrottlingError = /** @class */ (function () {
    function NovelFireThrottlingError(message) {
        if (message === void 0) { message = 'Novel Fire is rate limiting requests'; }
        this.message = message;
    }
    return NovelFireThrottlingError;
}());
var NovelFireAjaxNotFound = /** @class */ (function () {
    function NovelFireAjaxNotFound(message) {
        if (message === void 0) { message = 'Novel Fire says its Ajax interface is not found'; }
        this.message = message;
        this.name = 'NovelFireAjaxError';
    }
    return NovelFireAjaxNotFound;
}());

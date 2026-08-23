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
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var novelStatus_1 = require("@libs/novelStatus");
var defaultCover_1 = require("@libs/defaultCover");
var filterInputs_1 = require("@libs/filterInputs");
var NovelHi = /** @class */ (function () {
    function NovelHi() {
        this.id = 'novelhi';
        this.name = 'NovelHi';
        this.icon = 'src/en/novelhi/icon.png';
        this.site = 'https://novelhi.com/';
        this.version = '1.1.1';
        // Cache for storing extended metadata from the list API | ie: copypasta from readfrom.ts
        this.loadedNovelCache = [];
        this.filters = {
            genres: {
                label: 'Genres',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Action', value: 'action' },
                    { label: 'Adventure', value: 'adventure' },
                    { label: 'Comedy', value: 'comedy' },
                    { label: 'Light Novel', value: 'light-novel' },
                    { label: 'Fanfiction', value: 'fanfiction' },
                    { label: 'Fantasy', value: 'fantasy' },
                    { label: 'Game', value: 'game' },
                    { label: 'Gender Bender', value: 'gender-bender' },
                    { label: 'Harem', value: 'harem' },
                    { label: 'Historical', value: 'historical' },
                    { label: 'Horror', value: 'horror' },
                    { label: 'Martial Arts', value: 'martial-arts' },
                    { label: 'Mature', value: 'mature' },
                    { label: 'Mecha', value: 'mecha' },
                    { label: 'Military', value: 'military' },
                    { label: 'Mystery', value: 'mystery' },
                    { label: 'Romance', value: 'romance' },
                    { label: 'School Life', value: 'school-life' },
                    { label: 'Sci-fi', value: 'sci-fi' },
                    { label: 'Slice of Life', value: 'slice-of-life' },
                    { label: 'Sports', value: 'sports' },
                    { label: 'Supernatural', value: 'supernatural' },
                    { label: 'Tragedy', value: 'tragedy' },
                    { label: 'Urban Life', value: 'urban-life' },
                    { label: 'Wuxia', value: 'wuxia' },
                    { label: 'Xianxia', value: 'xianxia' },
                    { label: 'Xuanhuan', value: 'xuanhuan' },
                    { label: 'Yaoi', value: 'yaoi' },
                    { label: 'Yuri', value: 'yuri' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            order: {
                label: 'Status',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Ongoing', value: '0' },
                    { label: 'Completed', value: '1' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            time: {
                label: 'Update Period',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: '3 Days', value: '3' },
                    { label: '7 Days', value: '7' },
                    { label: '15 Days', value: '15' },
                    { label: '30 Days', value: '30' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    NovelHi.prototype.getNovels = function (pageNo, keyword, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, response, json, novels;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        params = new URLSearchParams(__assign(__assign(__assign(__assign({ curr: pageNo.toString(), limit: '10' }, (keyword && { keyword: keyword })), ((filters === null || filters === void 0 ? void 0 : filters.genres.value) && { 'bookGenres[]': filters.genres.value })), ((filters === null || filters === void 0 ? void 0 : filters.order.value) && { bookStatus: filters.order.value })), ((filters === null || filters === void 0 ? void 0 : filters.time.value) && { updatePeriod: filters.time.value })));
                        url = "".concat(this.site, "book/searchByPageInShelf?").concat(params);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        json = _b.sent();
                        novels = json.data.list.map(function (item) { return ({
                            name: item.bookName,
                            path: "s/".concat(item.simpleName),
                            cover: item.picUrl || defaultCover_1.defaultCover,
                            summary: item.bookDesc,
                            author: item.authorName,
                            status: item.bookStatus,
                            genres: item.genres.map(function (g) { return g.genreName; }).join(', '),
                        }); });
                        (_a = this.loadedNovelCache).push.apply(_a, novels);
                        if (this.loadedNovelCache.length > 100) {
                            this.loadedNovelCache = this.loadedNovelCache.slice(-100);
                        }
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    NovelHi.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var filters = _b.filters;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.getNovels(pageNo, undefined, filters)];
            });
        });
    };
    NovelHi.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data, text, loadedCheerio, translate, novel, moreNovelInfo, summary, chapters, bookId, params, url, res, resJson;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath)];
                    case 1:
                        data = _c.sent();
                        return [4 /*yield*/, data.text()];
                    case 2:
                        text = _c.sent();
                        loadedCheerio = (0, cheerio_1.load)(text);
                        translate = loadedCheerio('#translate <').html();
                        if (translate) {
                            console.error('This Novel has been removed and is no longer available');
                            throw Error('This Novel has been removed and is no longer available');
                        }
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('b.layui-icon').text().trim() ||
                                loadedCheerio('.tit h1').text().trim() ||
                                'Untitled',
                            cover: loadedCheerio('.cover,.decorate-img').attr('src') || defaultCover_1.defaultCover,
                        };
                        moreNovelInfo = this.loadedNovelCache.find(function (n) { return n.path === novelPath; });
                        if (!!moreNovelInfo) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.searchNovels(novel.name, 1)];
                    case 3:
                        moreNovelInfo = (_c.sent()).find(function (novel) { return novel.path === novelPath; });
                        _c.label = 4;
                    case 4:
                        if (moreNovelInfo) {
                            novel.genres = moreNovelInfo.genres;
                            novel.author = moreNovelInfo.author;
                            novel.status =
                                moreNovelInfo.status === '1'
                                    ? novelStatus_1.NovelStatus.Completed
                                    : novelStatus_1.NovelStatus.Ongoing;
                            summary = moreNovelInfo.summary.replace(/<br\s*\/?>/gi, '\n');
                            novel.summary = (0, cheerio_1.load)(summary).text().trim();
                        }
                        chapters = [];
                        bookId = loadedCheerio('#bookId').attr('value');
                        if (!(bookId && !translate)) return [3 /*break*/, 7];
                        params = new URLSearchParams();
                        params.append('bookId', bookId);
                        params.append('curr', '1');
                        params.append('limit', '42121');
                        url = "".concat(this.site, "book/queryIndexList?") + params.toString();
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 5:
                        res = _c.sent();
                        return [4 /*yield*/, res.json()];
                    case 6:
                        resJson = _c.sent();
                        (_b = (_a = resJson === null || resJson === void 0 ? void 0 : resJson.data) === null || _a === void 0 ? void 0 : _a.list) === null || _b === void 0 ? void 0 : _b.forEach(function (chapter) {
                            return chapters.push({
                                name: chapter.indexName,
                                path: novelPath + '/' + chapter.indexNum,
                                releaseTime: chapter.createTime,
                            });
                        });
                        _c.label = 7;
                    case 7:
                        novel.chapters = chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelHi.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, loadedCheerio, path, token, contentPath, content, rot13, chapter, chapterText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + chapterPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        result = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(result);
                        path = loadedCheerio('#chapterContentPath').attr('value');
                        token = loadedCheerio('#chapterContentToken').attr('value');
                        if (!path || !token)
                            return [2 /*return*/, ''];
                        contentPath = new URL(path, this.site).href;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(contentPath, "?token=").concat(token), {
                                headers: {
                                    'Referer': url,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            }).then(function (r) { return r.json(); })];
                    case 2:
                        content = _a.sent();
                        if (content) {
                            rot13 = content.data.content.replace(/(<[^>]+>)|([a-zA-Z])/g, function (_, tag, char) {
                                if (tag)
                                    return tag;
                                var base = char <= 'Z' ? 65 : 97;
                                var shift = ((char.charCodeAt(0) - base + 13) % 26) + base;
                                return String.fromCharCode(shift);
                            });
                            chapter = rot13
                                .replace(/<sent\b/gi, '<p')
                                .replace(/<\/sent>/gi, '</p>')
                                .replace(/<br\s*\/?>/gi, '');
                            loadedCheerio('#showReading').html(chapter);
                        }
                        loadedCheerio('#showReading script,ins').remove();
                        chapterText = loadedCheerio('#showReading').html();
                        if (!chapterText) {
                            return [2 /*return*/, loadedCheerio('#translate').parent().html() || ''];
                        }
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    NovelHi.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getNovels(pageNo, searchTerm)];
            });
        });
    };
    return NovelHi;
}());
exports.default = new NovelHi();

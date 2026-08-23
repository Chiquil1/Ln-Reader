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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");
var pluginHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
};
var ReadFromPlugin = /** @class */ (function () {
    function ReadFromPlugin() {
        this.id = 'readfrom';
        this.name = 'Read From Net';
        this.icon = 'src/en/readfrom/icon.png';
        this.site = 'https://readfrom.net/';
        this.version = '1.1.0';
        this.filters = undefined;
        this.headers = new Headers(pluginHeaders);
        this.imageRequestInit = {
            headers: pluginHeaders,
        };
        this.loadedNovelCache = [];
        // resolveUrl = (path: string, isNovel?: boolean) => this.site + '/' + path;
    }
    ReadFromPlugin.prototype.parseNovels = function (loadedCheerio, isSearch) {
        var _a;
        var _this = this;
        var ret = loadedCheerio((isSearch ? 'div.text' : '#dle-content') + ' > article.box')
            .map(function (i, el) {
            var $el = loadedCheerio(el);
            var novelPath = $el.find('h2.title a').attr('href');
            if (!novelPath)
                return;
            var summary = loadedCheerio(el).find(isSearch ? 'div.text5' : 'div.text3')[0];
            loadedCheerio(summary).find('.coll-ellipsis').remove();
            loadedCheerio(summary).find('a').remove();
            return {
                name: loadedCheerio(el).find('h2.title').text().trim(),
                path: new URL(novelPath, _this.site).pathname.substring(1),
                cover: loadedCheerio(el).find('img').attr('src') || defaultCover_1.defaultCover,
                summary: loadedCheerio(summary).text().trim() +
                    loadedCheerio(summary).find('span.coll-hidden').text(),
                genres: loadedCheerio(el)
                    .find(isSearch ? 'h5.title > a' : 'h2 > a')
                    .filter(function (i, el) { var _a, _b; return (_b = (_a = el.attribs['title']) === null || _a === void 0 ? void 0 : _a.startsWith) === null || _b === void 0 ? void 0 : _b.call(_a, 'Genre - '); })
                    .map(function (i, el) { return loadedCheerio(el).text(); })
                    .toArray()
                    .join(', '),
                author: isSearch
                    ? loadedCheerio(el)
                        .find('h5.title > a')
                        .filter(function (i, el) { var _a, _b; return (_b = (_a = el.attribs['title']) === null || _a === void 0 ? void 0 : _a.startsWith) === null || _b === void 0 ? void 0 : _b.call(_a, 'Book author - '); })
                        .text()
                    : loadedCheerio(el).find('h4 > a').text(),
            };
        })
            .toArray();
        (_a = this.loadedNovelCache).push.apply(_a, ret);
        while (this.loadedNovelCache.length > 100) {
            this.loadedNovelCache.shift();
        }
        return ret;
    };
    ReadFromPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var type, res, text;
            var showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        type = showLatestNovels ? 'last_added_books' : 'allbooks';
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + type + '/page/' + pageNo, {
                                headers: this.headers,
                            })];
                    case 1:
                        res = _c.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _c.sent();
                        return [2 /*return*/, this.parseNovels((0, cheerio_1.load)(text))];
                }
            });
        });
    };
    ReadFromPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data, text, loadedCheerio, novel, rawChapters, moreNovelInfo, seriesElm, seriesText;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath, {
                            headers: this.headers,
                        })];
                    case 1:
                        data = _a.sent();
                        return [4 /*yield*/, data.text()];
                    case 2:
                        text = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(text);
                        novel = {
                            path: novelPath,
                            name: 'Untitled',
                        };
                        novel.name = loadedCheerio('center > h2.title')
                            .text()
                            .split(', \n\n')[0]
                            .trim();
                        novel.cover =
                            loadedCheerio('article.box > div > center > div > a > img').attr('src') ||
                                defaultCover_1.defaultCover;
                        rawChapters = loadedCheerio('div.pages')
                            .first()
                            .find('> a')
                            .toArray()
                            .flatMap(function (el) {
                            var href = loadedCheerio(el).attr('href');
                            if (!href)
                                return [];
                            var path = new URL(href, _this.site).pathname.substring(1);
                            return path ? [{ name: loadedCheerio(el).text().trim(), path: path }] : [];
                        });
                        novel.chapters = __spreadArray([
                            { name: '1', path: novelPath, chapterNumber: 1 }
                        ], rawChapters.map(function (ch, i) { return (__assign(__assign({}, ch), { chapterNumber: i + 2 })); }), true);
                        moreNovelInfo = this.loadedNovelCache.find(function (novel) { return novel.path === novelPath; });
                        if (!!moreNovelInfo) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.searchNovels(novel.name, 1)];
                    case 3:
                        moreNovelInfo = (_a.sent()).find(function (novel) { return novel.path === novelPath; });
                        _a.label = 4;
                    case 4:
                        if (moreNovelInfo) {
                            novel.summary = moreNovelInfo.summary;
                            novel.genres = moreNovelInfo.genres;
                            novel.author = moreNovelInfo.author;
                        }
                        seriesElm = loadedCheerio('center > b:has(a)').filter(function (i, el) {
                            return loadedCheerio(el).find('a').attr('href').startsWith('/series.html');
                        })[0];
                        if (seriesElm) {
                            seriesText = loadedCheerio(seriesElm).text().trim();
                            novel.summary = seriesText + '\n\n' + novel.summary;
                        }
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    ReadFromPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var response, $, _a, chapterHtml, p, allowed, flush, _i, _b, el, jbText;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath, {
                            headers: this.headers,
                        })];
                    case 1:
                        response = _c.sent();
                        _a = cheerio_1.load;
                        return [4 /*yield*/, response.text()];
                    case 2:
                        $ = _a.apply(void 0, [_c.sent()]);
                        $('#textToRead > span:empty, #textToRead > center').remove();
                        chapterHtml = [];
                        p = [];
                        allowed = new Set(['b', 'i', 'u', 'strong', 'em', 'a']);
                        flush = function () {
                            return p.length && (chapterHtml.push("<p>".concat(p.join(' ').trim(), "</p>")), (p = []));
                        };
                        for (_i = 0, _b = $('#textToRead').contents().toArray(); _i < _b.length; _i++) {
                            el = _b[_i];
                            switch (el.type) {
                                case 'comment':
                                    continue;
                                case 'text':
                                    if (el.data.trim()) {
                                        jbText = el.data.trim().replace(/_([^_]+)_/g, '<i>$1</i>');
                                        p.push(jbText);
                                    }
                                    continue;
                                case 'tag':
                                    if (allowed.has(el.name)) {
                                        p.push($.html(el));
                                        continue;
                                    }
                                    if (el.name === 'br') {
                                        flush();
                                        continue;
                                    }
                            }
                            flush();
                            chapterHtml.push($.html(el));
                        }
                        flush();
                        return [2 /*return*/, chapterHtml.join('')];
                }
            });
        });
    };
    ReadFromPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var res, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (pageNo !== 1)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)('https://readfrom.net/build_in_search/?q=' +
                                encodeURIComponent(searchTerm), { headers: this.headers })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        return [2 /*return*/, this.parseNovels((0, cheerio_1.load)(text), true)];
                }
            });
        });
    };
    return ReadFromPlugin;
}());
exports.default = new ReadFromPlugin();

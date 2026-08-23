"use strict";
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
var NovelArrow = /** @class */ (function () {
    function NovelArrow() {
        this.id = 'novelarrow';
        this.name = 'Novel Arrow';
        this.icon = 'src/en/novelarrow/icon.png';
        this.site = 'https://novelarrow.com/';
        this.version = '1.0.0';
    }
    NovelArrow.prototype.popularNovels = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, $, novels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "novels/latest?page=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        result = _a.sent();
                        $ = (0, cheerio_1.load)(result);
                        novels = [];
                        $('article').each(function (i, el) {
                            var title = $(el).find('h2').text().trim();
                            var cover = $(el).find('img').attr('src');
                            var href = $(el).find('a').attr('href');
                            if (title && href) {
                                novels.push({
                                    name: title,
                                    cover: cover,
                                    path: href.substring(1), // Result: "novel/slug"
                                });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    NovelArrow.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, $, novelId, genres, genreList_1, fullSummary, summaryMatch, novel, chaptersUrl, chaptersJson, e_1, chaptersMap, combinedRegex, match, path, name_1, fullPath;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = this.site + novelPath.replace(/^\//, '');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        result = _b.sent();
                        $ = (0, cheerio_1.load)(result);
                        novelId = novelPath.replace('novel/', '').replace(/^\//, '');
                        genres = $('meta[name="og:novel:genre"]').attr('content') ||
                            $('meta[property="og:novel:genre"]').attr('content');
                        if (!genres) {
                            genreList_1 = [];
                            $('meta[property="article:tag"]').each(function (i, el) {
                                var tag = $(el).attr('content');
                                if (tag)
                                    genreList_1.push(tag);
                            });
                            genres = genreList_1.join(', ');
                        }
                        fullSummary = $('meta[name="description"]').attr('content') ||
                            $('meta[property="og:description"]').attr('content');
                        summaryMatch = result.match(/\\?"description\\?":\\?"(.*?)\\?"/);
                        if (summaryMatch && summaryMatch[1].length > ((fullSummary === null || fullSummary === void 0 ? void 0 : fullSummary.length) || 0)) {
                            fullSummary = summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                        }
                        novel = {
                            path: novelPath,
                            name: $('meta[name="og:novel:novel_name"]').attr('content') ||
                                $('meta[property="og:novel:novel_name"]').attr('content') ||
                                ((_a = $('meta[property="og:title"]').attr('content')) === null || _a === void 0 ? void 0 : _a.split(' Novel')[0]) ||
                                $('h1').first().text().trim(),
                            cover: $('meta[property="og:image"]').attr('content') ||
                                $('meta[name="og:image"]').attr('content'),
                            author: $('meta[name="og:novel:author"]').attr('content') ||
                                $('meta[property="og:novel:author"]').attr('content') ||
                                $('meta[name="author"]').attr('content') ||
                                $('meta[property="article:author"]').attr('content'),
                            status: ($('meta[name="og:novel:status"]').attr('content') ||
                                $('meta[property="og:novel:status"]').attr('content')) === 'Ongoing'
                                ? novelStatus_1.NovelStatus.Ongoing
                                : novelStatus_1.NovelStatus.Completed,
                            summary: fullSummary,
                            genres: genres,
                            chapters: [],
                        };
                        chaptersUrl = "".concat(this.site, "api-web/novels/").concat(novelId, "/chapters?sort=asc");
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chaptersUrl, {
                                headers: {
                                    'Accept': 'application/json',
                                },
                            }).then(function (res) { return res.json(); })];
                    case 3:
                        chaptersJson = _b.sent();
                        if (chaptersJson && chaptersJson.items) {
                            novel.chapters = chaptersJson.items.map(function (item) { return ({
                                name: item.chapter_name,
                                path: "chapter/".concat(novelId, "/").concat(item.chapter_id),
                                releaseTime: null,
                            }); });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        chaptersMap = new Map();
                        combinedRegex = /\\?"chapter_id\\?":\\?"([^"]+)\\?",\\?"chapter_name\\?":\\?"([^"]+)\\?"/g;
                        match = void 0;
                        while ((match = combinedRegex.exec(result)) !== null) {
                            path = match[1];
                            name_1 = match[2].replace(/\\"/g, '"');
                            fullPath = "chapter/".concat(novelId, "/").concat(path);
                            if (!chaptersMap.has(fullPath)) {
                                chaptersMap.set(fullPath, {
                                    name: name_1,
                                    path: fullPath,
                                    releaseTime: null,
                                });
                            }
                        }
                        novel.chapters = Array.from(chaptersMap.values());
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelArrow.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var pathParts, novelId, chapterId, url, json, e_2, result, contentRegex, match, chapterHtml, lastPTagIndex, $;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathParts = chapterPath.replace('chapter/', '').split('/');
                        novelId = pathParts[0];
                        chapterId = pathParts[1];
                        url = "".concat(this.site, "api-web/novels/").concat(novelId, "/chapters/").concat(chapterId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                                headers: {
                                    'Accept': 'application/json',
                                    'x-track-reading-progress': 'false',
                                },
                            }).then(function (res) { return res.json(); })];
                    case 2:
                        json = _a.sent();
                        if (json &&
                            json.item &&
                            json.item.chapterInfo &&
                            json.item.chapterInfo.chapter_content) {
                            return [2 /*return*/, json.item.chapterInfo.chapter_content];
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        e_2 = _a.sent();
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site).concat(chapterPath)).then(function (res) {
                                return res.text();
                            })];
                    case 4:
                        result = _a.sent();
                        contentRegex = /\\u003ch4\\u003e(.*)\\u003c\/p\\u003e/;
                        match = result.match(contentRegex);
                        if (match) {
                            chapterHtml = match[0];
                            chapterHtml = chapterHtml
                                .replace(/\\u003c/g, '<')
                                .replace(/\\u003e/g, '>')
                                .replace(/\\"/g, '"')
                                .replace(/\\n/g, '')
                                .replace(/\\t/g, '')
                                .replace(/\\r/g, '')
                                .replace(/\\\\/g, '\\');
                            lastPTagIndex = chapterHtml.lastIndexOf('</p>');
                            if (lastPTagIndex !== -1) {
                                chapterHtml = chapterHtml.substring(0, lastPTagIndex + 4);
                            }
                            return [2 /*return*/, chapterHtml];
                        }
                        $ = (0, cheerio_1.load)(result);
                        return [2 /*return*/, $('.site-reading-copy').html() || 'Content not found or premium.'];
                    case 5: return [2 /*return*/, 'Content not found or premium.'];
                }
            });
        });
    };
    NovelArrow.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, $, novels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "novels/search?keyword=").concat(encodeURIComponent(searchTerm), "&page=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        result = _a.sent();
                        $ = (0, cheerio_1.load)(result);
                        novels = [];
                        $('article').each(function (i, el) {
                            var title = $(el).find('h2').text().trim();
                            var cover = $(el).find('img').attr('src');
                            var href = $(el).find('a').attr('href');
                            if (title && href) {
                                novels.push({
                                    name: title,
                                    cover: cover,
                                    path: href.substring(1),
                                });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return NovelArrow;
}());
exports.default = new NovelArrow();

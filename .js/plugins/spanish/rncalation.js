"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
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
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var defaultCover_1 = require("@libs/defaultCover");
var cheerio = __importStar(require("cheerio"));
var RNCalationPlugin = /** @class */ (function () {
    function RNCalationPlugin() {
        this.id = 'rncalation';
        this.name = 'RNCalation';
        this.icon = 'src/es/rncalation/icon.png';
        this.site = 'https://rncalation.online/';
        this.version = '1.0.2';
        this.filters = undefined;
    }
    RNCalationPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var sort, url, body, $, novels;
            var _this = this;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        sort = showLatestNovels ? 'latest' : 'popular';
                        url = "".concat(this.site, "library?q=&type=Novel&status=&genre=&sort=").concat(sort, "&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _c.sent();
                        $ = cheerio.load(body);
                        novels = [];
                        $('a.comic-card').each(function (_, el) {
                            var _a;
                            var path = ((_a = $(el).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '/')) || '';
                            var name = $(el).find('p').first().text().trim();
                            var img = $(el).find('img').first();
                            var coverSrc = img.attr('src') || img.attr('data-src') || '';
                            var cover = coverSrc
                                ? coverSrc.startsWith('http')
                                    ? coverSrc
                                    : _this.site.slice(0, -1) + coverSrc
                                : defaultCover_1.defaultCover;
                            if (path && name) {
                                novels.push({ name: name, path: path, cover: cover });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    RNCalationPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, $, name, coverImg, coverSrc, cover, summary, statusText, status, novel, chapters, seenPaths, extractChapters, chaptersBase, page, keepGoing, pageBody, $page, foundThisPage;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath.replace(/^\//, '')).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        name = $('h1').first().text().trim();
                        coverImg = $('.comic-cover__img, .card-media-wrap img').first();
                        coverSrc = $('meta[property="og:image"]').attr('content') ||
                            $('.hero-bg').attr('data-bg') ||
                            coverImg.attr('src') ||
                            coverImg.attr('data-src') ||
                            '';
                        cover = coverSrc
                            ? coverSrc.startsWith('http')
                                ? coverSrc
                                : this.site.slice(0, -1) + coverSrc
                            : defaultCover_1.defaultCover;
                        summary = $('p')
                            .filter(function (_, el) { return $(el).text().trim().length > 80; })
                            .first()
                            .text()
                            .trim();
                        statusText = $('span:contains("En emisión")').first().text().trim();
                        status = statusText.includes('En emisión')
                            ? novelStatus_1.NovelStatus.Ongoing
                            : novelStatus_1.NovelStatus.Completed;
                        novel = {
                            path: novelPath,
                            name: name,
                            cover: cover,
                            summary: summary,
                            status: status,
                            chapters: [],
                        };
                        chapters = [];
                        seenPaths = new Set();
                        extractChapters = function ($doc) {
                            var found = 0;
                            $doc('a[data-chapter-num]').each(function (_, el) {
                                var _a;
                                var chapterName = $doc(el).attr('data-chapter-label') || $doc(el).text().trim();
                                var chapterPath = ((_a = $doc(el).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '/')) || '';
                                var chapterNum = Number($doc(el).attr('data-chapter-num')) || undefined;
                                if (chapterPath && !seenPaths.has(chapterPath)) {
                                    seenPaths.add(chapterPath);
                                    chapters.push({
                                        name: chapterName,
                                        path: chapterPath,
                                        chapterNumber: chapterNum,
                                    });
                                    found++;
                                }
                            });
                            return found;
                        };
                        // capítulos ya incluidos en el HTML principal de la novela
                        extractChapters($);
                        chaptersBase = this.site + novelPath.replace(/^\//, '').replace(/\/$/, '');
                        page = 1;
                        keepGoing = true;
                        _a.label = 2;
                    case 2:
                        if (!keepGoing) return [3 /*break*/, 4];
                        page++;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(chaptersBase, "/chapters?page=").concat(page)).then(function (res) { return res.text(); })];
                    case 3:
                        pageBody = _a.sent();
                        if (!pageBody || pageBody.trim().length === 0) {
                            keepGoing = false;
                            return [3 /*break*/, 4];
                        }
                        $page = cheerio.load(pageBody);
                        foundThisPage = extractChapters($page);
                        if (foundThisPage === 0) {
                            keepGoing = false;
                        }
                        // límite de seguridad para no hacer loop infinito si algo sale mal
                        if (page > 200) {
                            keepGoing = false;
                        }
                        return [3 /*break*/, 2];
                    case 4:
                        // el sitio suele listarlos del más nuevo al más viejo
                        novel.chapters = chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    RNCalationPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, $, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath.replace(/^\//, '')).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        content = $('.novel-content').html() || '';
                        return [2 /*return*/, content];
                }
            });
        });
    };
    RNCalationPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "library?q=").concat(encodeURIComponent(searchTerm), "&type=Novel&status=&genre=&sort=latest&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        novels = [];
                        $('a.comic-card').each(function (_, el) {
                            var _a;
                            var path = ((_a = $(el).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '/')) || '';
                            var name = $(el).find('p').first().text().trim();
                            var img = $(el).find('img').first();
                            var coverSrc = img.attr('src') || img.attr('data-src') || '';
                            var cover = coverSrc
                                ? coverSrc.startsWith('http')
                                    ? coverSrc
                                    : _this.site.slice(0, -1) + coverSrc
                                : defaultCover_1.defaultCover;
                            if (path && name) {
                                novels.push({ name: name, path: path, cover: cover });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return RNCalationPlugin;
}());
exports.default = new RNCalationPlugin();

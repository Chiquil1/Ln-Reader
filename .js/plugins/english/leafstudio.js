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
var defaultCover_1 = require("@libs/defaultCover");
var fetch_1 = require("@libs/fetch");
var LeafStudio = /** @class */ (function () {
    function LeafStudio() {
        this.id = 'LeafStudio';
        this.name = 'LeafStudio';
        this.icon = 'src/en/leafstudio/icon.png';
        this.site = 'https://leafstudio.site/';
        this.version = '1.0.0';
        this.filters = undefined;
    }
    LeafStudio.prototype.parseNovelsList = function (cheerio) {
        var _this = this;
        return cheerio('a.novel-item')
            .map(function (i, el) {
            var elc = (0, cheerio_1.load)(el);
            return {
                name: elc('p.novel-item-title').text().trim(),
                path: cheerio(el).attr('href').replace(_this.site, ''),
                cover: elc('img.novel-item-Cover').attr('src'),
            };
        })
            .toArray();
    };
    LeafStudio.prototype.popularNovels = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var link, result, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = this.site + 'novels';
                        if (page > 1) {
                            link += '/page/' + page;
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovelsList(loadedCheerio)];
                }
            });
        });
    };
    LeafStudio.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, body, loadedCheerio, novel, status, chapter;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('h1.title').text().trim() || '',
                            cover: loadedCheerio('img#novel_cover').attr('src') || defaultCover_1.defaultCover,
                            summary: loadedCheerio('div.desc_div > p')
                                .map(function (i, el) { return (0, cheerio_1.load)(el).text(); })
                                .toArray()
                                .join('\n\n'),
                            chapters: [],
                            author: '',
                            genres: loadedCheerio('div#tags_div > a.novel_genre')
                                .map(function (i, el) { return (0, cheerio_1.load)(el).text().trim(); })
                                .toArray()
                                .join(', '),
                        };
                        status = loadedCheerio('a#novel_status').text().trim();
                        if (status == 'Active') {
                            novel.status = 'Ongoing';
                        }
                        else {
                            novel.status = status;
                        }
                        chapter = [];
                        loadedCheerio('a.free_chap.chap').each(function (i, el) {
                            var _a, _b;
                            var path = ((_b = (_a = loadedCheerio(el).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) === null || _b === void 0 ? void 0 : _b.replace(_this.site, '')) || '';
                            var name = loadedCheerio(el).text();
                            chapter.push({
                                name: name,
                                path: path,
                            });
                        });
                        novel.chapters = chapter.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    LeafStudio.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, loadedCheerio('article > p.chapter_content')
                                .map(function (i, el) { return (0, cheerio_1.load)(el).html(); })
                                .toArray()
                                .join('<br>')];
                }
            });
        });
    };
    LeafStudio.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var link, result, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = this.site + 'novels';
                        if (page > 1) {
                            link += '/page/' + page;
                        }
                        link +=
                            '?search=' +
                                encodeURIComponent(searchTerm) +
                                '&type=&language=&status=&sort=';
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovelsList(loadedCheerio)];
                }
            });
        });
    };
    return LeafStudio;
}());
exports.default = new LeafStudio();

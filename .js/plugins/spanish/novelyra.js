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
var filterInputs_1 = require("@libs/filterInputs");
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var SITE = 'https://novelyra.com/';
var MAX_TRANSLATION_CHARS = 2000;
function translateText(text) {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, json, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!text || text.trim() === '') {
                        return [2 /*return*/, ''];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    url = 'https://translate.googleapis.com/translate_a/single' +
                        "?client=gtx&sl=en&tl=es&dt=t&q=".concat(encodeURIComponent(text));
                    return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                case 2:
                    res = _b.sent();
                    if (!res.ok) {
                        throw new Error("HTTP ".concat(res.status, ": ").concat(url));
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    json = _b.sent();
                    if (json && json[0]) {
                        return [2 /*return*/, json[0]
                                .map(function (item) { return item[0]; })
                                .filter(Boolean)
                                .join('')];
                    }
                    return [2 /*return*/, text];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, text];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function translateParagraphs(paragraphs) {
    return __awaiter(this, void 0, void 0, function () {
        var translatedParagraphs, currentBatch, _i, paragraphs_1, paragraph, normalizedParagraph, separator, translatedBatch, translatedBatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    translatedParagraphs = [];
                    currentBatch = '';
                    _i = 0, paragraphs_1 = paragraphs;
                    _a.label = 1;
                case 1:
                    if (!(_i < paragraphs_1.length)) return [3 /*break*/, 6];
                    paragraph = paragraphs_1[_i];
                    normalizedParagraph = paragraph.trim();
                    if (!normalizedParagraph) {
                        return [3 /*break*/, 5];
                    }
                    separator = currentBatch === '' ? '' : '\n';
                    if (!("".concat(currentBatch).concat(separator).concat(normalizedParagraph).length >
                        MAX_TRANSLATION_CHARS)) return [3 /*break*/, 4];
                    if (!(currentBatch !== '')) return [3 /*break*/, 3];
                    return [4 /*yield*/, translateText(currentBatch)];
                case 2:
                    translatedBatch = _a.sent();
                    translatedParagraphs.push.apply(translatedParagraphs, translatedBatch
                        .split(/\n+/)
                        .map(function (text) { return text.trim(); })
                        .filter(Boolean));
                    _a.label = 3;
                case 3:
                    currentBatch = normalizedParagraph;
                    return [3 /*break*/, 5];
                case 4:
                    currentBatch =
                        currentBatch === ''
                            ? normalizedParagraph
                            : "".concat(currentBatch, "\n").concat(normalizedParagraph);
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (!(currentBatch !== '')) return [3 /*break*/, 8];
                    return [4 /*yield*/, translateText(currentBatch)];
                case 7:
                    translatedBatch = _a.sent();
                    translatedParagraphs.push.apply(translatedParagraphs, translatedBatch
                        .split(/\n+/)
                        .map(function (text) { return text.trim(); })
                        .filter(Boolean));
                    _a.label = 8;
                case 8: return [2 /*return*/, translatedParagraphs];
            }
        });
    });
}
var Novelyra = /** @class */ (function () {
    function Novelyra() {
        this.id = 'novelyra';
        this.name = 'Novelyra';
        this.icon = 'https://novelyra.com/favicon.ico';
        this.site = SITE;
        this.version = '2.0.2';
        this.filters = {
            genres: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Géneros',
                value: '',
                options: [
                    { label: 'Todos', value: '' },
                    { label: 'Acción', value: 'accion' },
                    { label: 'Aventura', value: 'aventura' },
                    { label: 'Fantasía', value: 'fantasy' },
                    { label: 'Artes Marciales', value: 'martial-arts' },
                    { label: 'Harén', value: 'harem' },
                    { label: 'Romance', value: 'romance' },
                    { label: 'Sobrenatural', value: 'supernatural' },
                    { label: 'Xuanhuan', value: 'xuanhuan' },
                    { label: 'Xianxia', value: 'xianxia' },
                    { label: 'Comedia', value: 'comedy' },
                    { label: 'Ciencia Ficción', value: 'sci-fi' },
                    { label: 'Misterio', value: 'mystery' },
                    { label: 'Maduro', value: 'mature' },
                    { label: 'Psicológico', value: 'psychological' },
                    { label: 'Shounen', value: 'shounen' },
                    { label: 'Reencarnación', value: 'reincarnation' },
                    { label: 'Mecha', value: 'mecha' },
                    { label: 'Vida Escolar', value: 'school-life' },
                    { label: 'Josei', value: 'josei' },
                    { label: 'Drama', value: 'drama' },
                    { label: 'Urbano', value: 'urban' },
                    { label: 'Oriental', value: 'eastern' },
                    { label: 'Horror', value: 'horror' },
                    { label: 'Tragedia', value: 'tragedy' },
                    { label: 'Juegos', value: 'game' },
                ],
            },
        };
    }
    Novelyra.prototype.loadNovels = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        loadedCheerio('main h3').each(function (_, element) {
            var _a, _b, _c, _d;
            var title = loadedCheerio(element);
            var link = title.closest('a');
            if (!link.length) {
                return;
            }
            var name = title.text().trim();
            var rawPath = ((_a = link.attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (!name || !rawPath) {
                return;
            }
            if (rawPath.startsWith('http') && !rawPath.startsWith(_this.site)) {
                return;
            }
            var path = rawPath;
            if (path.startsWith(_this.site)) {
                path = path.slice(_this.site.length);
            }
            path = path.replace(/^\/+/, '');
            if (!path) {
                return;
            }
            var image = link.find('img').first();
            var cover = ((_b = image.attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                ((_c = image.attr('data-src')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                ((_d = image.attr('data-lazy-src')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                '';
            if (novels.some(function (item) { return item.path === path; })) {
                return;
            }
            novels.push({
                name: name,
                path: path,
                cover: cover,
            });
        });
        return novels;
    };
    Novelyra.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var page, genre, url, result, body, loadedCheerio;
            var _c;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        page = Math.max(1, pageNo || 1);
                        genre = (_c = filters === null || filters === void 0 ? void 0 : filters.genres) === null || _c === void 0 ? void 0 : _c.value;
                        if (genre) {
                            url = "".concat(this.site, "genre/").concat(encodeURIComponent(genre)) + "?page=".concat(page);
                        }
                        else {
                            url = "".concat(this.site, "?page=").concat(page);
                        }
                        if (showLatestNovels) {
                            url = page === 1 ? this.site : "".concat(this.site, "?page=").concat(page);
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _d.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _d.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.loadNovels(loadedCheerio)];
                }
            });
        });
    };
    Novelyra.prototype.searchNovels = function (searchTerm, _pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var query, url, result, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = searchTerm.trim().toLowerCase();
                        if (!query) {
                            return [2 /*return*/, []];
                        }
                        url = "".concat(this.site, "?search=").concat(encodeURIComponent(query));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _a.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.loadNovels(loadedCheerio)];
                }
            });
        });
    };
    Novelyra.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanPath, url, result, body, loadedCheerio, name, cover, synopsis, summary, titlePrefix, authorMatch, genreMatch, statusMatch, author, genres, status, novel, chapters, seenPaths;
            var _this = this;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        cleanPath = novelPath.replace(/^\/+/, '');
                        url = "".concat(this.site).concat(cleanPath);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _f.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _f.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        name = loadedCheerio('h1').first().text().trim() || 'Desconocido';
                        cover = ((_a = loadedCheerio('main img').first().attr('src')) === null || _a === void 0 ? void 0 : _a.trim()) ||
                            ((_b = loadedCheerio('img').first().attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                            '';
                        synopsis = loadedCheerio('#synopsis')
                            .first()
                            .text()
                            .trim()
                            .replace(/\s+/g, ' ');
                        summary = synopsis;
                        if (summary) {
                            titlePrefix = "".concat(name, ":");
                            if (summary.startsWith(titlePrefix)) {
                                summary = summary.slice(titlePrefix.length).trim();
                            }
                            summary = summary.replace(/^Information\s*&\s*Overview\s*/i, '').trim();
                        }
                        authorMatch = synopsis.match(/Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|$)/i);
                        genreMatch = synopsis.match(/Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|$)/i);
                        statusMatch = synopsis.match(/Status:\s*(.+?)(?:\s+Platform:|\s+Theme:|$)/i);
                        author = ((_c = authorMatch === null || authorMatch === void 0 ? void 0 : authorMatch[1]) === null || _c === void 0 ? void 0 : _c.trim()) || '';
                        genres = ((_d = genreMatch === null || genreMatch === void 0 ? void 0 : genreMatch[1]) === null || _d === void 0 ? void 0 : _d.trim().replace(/\s+/g, ', ')) || '';
                        status = ((_e = statusMatch === null || statusMatch === void 0 ? void 0 : statusMatch[1]) === null || _e === void 0 ? void 0 : _e.trim()) || '';
                        novel = {
                            path: novelPath,
                            name: name,
                            cover: cover,
                            summary: summary,
                            author: author,
                            genres: genres,
                            status: status,
                        };
                        chapters = [];
                        seenPaths = new Set();
                        loadedCheerio('a[href*="/chapter-"]').each(function (_, element) {
                            var _a;
                            var link = loadedCheerio(element);
                            var rawChapterPath = ((_a = link.attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                            if (!rawChapterPath) {
                                return;
                            }
                            var chapterMatch = rawChapterPath.match(/\/chapter-(\d+)(?:\/)?(?:[?#].*)?$/i);
                            if (!chapterMatch) {
                                return;
                            }
                            var chapterNumber = Number(chapterMatch[1]);
                            if (!Number.isFinite(chapterNumber)) {
                                return;
                            }
                            var chapterPath = rawChapterPath;
                            if (chapterPath.startsWith(_this.site)) {
                                chapterPath = chapterPath.slice(_this.site.length);
                            }
                            chapterPath = chapterPath.replace(/^\/+/, '');
                            if (!chapterPath || seenPaths.has(chapterPath)) {
                                return;
                            }
                            seenPaths.add(chapterPath);
                            var text = link.text().trim().replace(/\s+/g, ' ');
                            var chapterName = text || "Cap\u00EDtulo ".concat(chapterNumber);
                            var separatorIndex = chapterName.indexOf(' - ');
                            if (separatorIndex > 0) {
                                chapterName =
                                    chapterName.slice(0, separatorIndex).trim() ||
                                        "Cap\u00EDtulo ".concat(chapterNumber);
                            }
                            var releaseMatch = text.match(/\b(\d+\s+(?:day|days|week|weeks|month|months|year|years)\s+ago)\b/i);
                            chapters.push({
                                name: chapterName,
                                path: chapterPath,
                                chapterNumber: chapterNumber,
                                releaseTime: releaseMatch === null || releaseMatch === void 0 ? void 0 : releaseMatch[1],
                            });
                        });
                        chapters.sort(function (first, second) { var _a, _b; return ((_a = first.chapterNumber) !== null && _a !== void 0 ? _a : 0) - ((_b = second.chapterNumber) !== null && _b !== void 0 ? _b : 0); });
                        novel.chapters = chapters;
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    Novelyra.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanPath, url, result, body, loadedCheerio, chapterContent, paragraphs, rawText, translated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cleanPath = chapterPath.replace(/^\/+/, '');
                        url = "".concat(this.site).concat(cleanPath);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _a.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        // El contenido real del capítulo está dentro de <article>.
                        // Eliminamos elementos que no forman parte del texto.
                        loadedCheerio('script, style, iframe, ins, nav, header, footer, aside').remove();
                        chapterContent = loadedCheerio('article').first();
                        if (chapterContent.length === 0) {
                            return [2 /*return*/, 'Contenido no encontrado'];
                        }
                        paragraphs = [];
                        chapterContent.find('p').each(function (_, element) {
                            var text = loadedCheerio(element).text().trim().replace(/\s+/g, ' ');
                            if (!text) {
                                return;
                            }
                            paragraphs.push(text);
                        });
                        if (paragraphs.length === 0) {
                            rawText = chapterContent.text().trim().replace(/\s+/g, ' ');
                            if (rawText) {
                                paragraphs.push(rawText);
                            }
                        }
                        if (paragraphs.length === 0) {
                            return [2 /*return*/, 'Contenido no encontrado'];
                        }
                        return [4 /*yield*/, translateParagraphs(paragraphs)];
                    case 3:
                        translated = _a.sent();
                        return [2 /*return*/, translated
                                .map(function (paragraph) {
                                return "<p>".concat(paragraph.replace(/</g, '&lt;').replace(/>/g, '&gt;'), "</p>");
                            })
                                .join('')];
                }
            });
        });
    };
    return Novelyra;
}());
exports.default = new Novelyra();

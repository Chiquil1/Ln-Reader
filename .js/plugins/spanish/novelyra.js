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
        var normalized, url, res, json, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    normalized = text.trim();
                    if (!normalized) {
                        return [2 /*return*/, ''];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    url = 'https://translate.googleapis.com/translate_a/single' +
                        "?client=gtx&sl=en&tl=es&dt=t&q=".concat(encodeURIComponent(normalized));
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
                    return [2 /*return*/, normalized];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, normalized];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function translateTextToEnglish(text) {
    return __awaiter(this, void 0, void 0, function () {
        var normalized, url, res, json, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    normalized = text.trim();
                    if (!normalized) {
                        return [2 /*return*/, ''];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    url = 'https://translate.googleapis.com/translate_a/single' +
                        "?client=gtx&sl=es&tl=en&dt=t&q=".concat(encodeURIComponent(normalized));
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
                    return [2 /*return*/, normalized];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, normalized];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function normalizeSearchText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function getSearchTerms(text) {
    return normalizeSearchText(text)
        .split(/\s+/)
        .filter(Boolean);
}
function searchTermsMatch(title, queryTerms) {
    var normalizedTitle = normalizeSearchText(title);
    if (!normalizedTitle || !queryTerms.length) {
        return false;
    }
    return queryTerms.every(function (term) {
        return normalizedTitle.includes(term);
    });
}
function searchScore(title, query) {
    var normalizedTitle = normalizeSearchText(title);
    var normalizedQuery = normalizeSearchText(query);
    if (!normalizedTitle ||
        !normalizedQuery) {
        return 0;
    }
    if (normalizedTitle === normalizedQuery) {
        return 1000;
    }
    if (normalizedTitle.startsWith(normalizedQuery)) {
        return 800;
    }
    if (normalizedTitle.includes(normalizedQuery)) {
        return 600;
    }
    var terms = getSearchTerms(query);
    var matchingTerms = terms.filter(function (term) {
        return normalizedTitle.includes(term);
    }).length;
    return matchingTerms * 100;
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
                    if (!("".concat(currentBatch).concat(separator).concat(normalizedParagraph)
                        .length > MAX_TRANSLATION_CHARS)) return [3 /*break*/, 4];
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
                    currentBatch =
                        normalizedParagraph;
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
function translateShortText(text) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedText;
        return __generator(this, function (_a) {
            normalizedText = text.trim();
            if (!normalizedText) {
                return [2 /*return*/, ''];
            }
            return [2 /*return*/, translateText(normalizedText)];
        });
    });
}
function translateTitles(titles) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all(titles.map(function (title) {
                    return translateShortText(title);
                }))];
        });
    });
}
var Novelyra = /** @class */ (function () {
    function Novelyra() {
        this.id = 'novelyra';
        this.name = 'Novelyra';
        this.icon = 'https://novelyra.com/favicon.ico';
        this.site = SITE;
        this.version = '2.0.4';
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
                    {
                        label: 'Artes Marciales',
                        value: 'martial-arts',
                    },
                    { label: 'Harén', value: 'harem' },
                    { label: 'Romance', value: 'romance' },
                    {
                        label: 'Sobrenatural',
                        value: 'supernatural',
                    },
                    {
                        label: 'Xuanhuan',
                        value: 'xuanhuan',
                    },
                    {
                        label: 'Xianxia',
                        value: 'xianxia',
                    },
                    { label: 'Comedia', value: 'comedy' },
                    {
                        label: 'Ciencia Ficción',
                        value: 'sci-fi',
                    },
                    {
                        label: 'Misterio',
                        value: 'mystery',
                    },
                    { label: 'Maduro', value: 'mature' },
                    {
                        label: 'Psicológico',
                        value: 'psychological',
                    },
                    { label: 'Shounen', value: 'shounen' },
                    {
                        label: 'Reencarnación',
                        value: 'reincarnation',
                    },
                    { label: 'Mecha', value: 'mecha' },
                    {
                        label: 'Vida Escolar',
                        value: 'school-life',
                    },
                    { label: 'Josei', value: 'josei' },
                    { label: 'Drama', value: 'drama' },
                    { label: 'Urbano', value: 'urban' },
                    {
                        label: 'Oriental',
                        value: 'eastern',
                    },
                    { label: 'Horror', value: 'horror' },
                    {
                        label: 'Tragedia',
                        value: 'tragedy',
                    },
                    { label: 'Juegos', value: 'game' },
                ],
            },
        };
    }
    Novelyra.prototype.extractNovels = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        /*
         * NovelYra search/browse cards use:
         *
         * <a class="group block min-w-0">
         *   ...
         *   <h3>Title</h3>
         * </a>
         *
         * This avoids collecting navigation/footer links.
         */
        loadedCheerio('main a.group.block.min-w-0').each(function (_, element) {
            var _a, _b, _c, _d;
            var link = loadedCheerio(element);
            var title = link.find('h3').first();
            if (!title.length) {
                return;
            }
            var sourceName = title.text().trim();
            var rawPath = ((_a = link.attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (!sourceName || !rawPath) {
                return;
            }
            if (rawPath.startsWith('http') &&
                !rawPath.startsWith(_this.site)) {
                return;
            }
            var path = rawPath;
            if (path.startsWith(_this.site)) {
                path = path.slice(_this.site.length);
            }
            path = path.replace(/^\/+/, '');
            if (!path ||
                novels.some(function (item) { return item.path === path; })) {
                return;
            }
            var image = link.find('img').first();
            var cover = ((_b = image.attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                ((_c = image
                    .attr('data-src')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                ((_d = image
                    .attr('data-lazy-src')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                '';
            if (cover &&
                cover.startsWith('/')) {
                cover =
                    "".concat(_this.site).concat(cover.slice(1));
            }
            novels.push({
                name: sourceName,
                sourceName: sourceName,
                path: path,
                cover: cover,
            });
        });
        return novels;
    };
    Novelyra.prototype.finalizeNovels = function (novels) {
        return __awaiter(this, void 0, void 0, function () {
            var translatedTitles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, translateTitles(novels.map(function (novel) { return novel.sourceName; }))];
                    case 1:
                        translatedTitles = _a.sent();
                        return [2 /*return*/, novels.map(function (novel, index) { return ({
                                name: translatedTitles[index] ||
                                    novel.sourceName,
                                path: novel.path,
                                cover: novel.cover,
                            }); })];
                }
            });
        });
    };
    Novelyra.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var page, genre, url, result, body, loadedCheerio, novels;
            var _c;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        page = Math.max(1, pageNo || 1);
                        genre = (_c = filters === null || filters === void 0 ? void 0 : filters.genres) === null || _c === void 0 ? void 0 : _c.value;
                        if (genre) {
                            url =
                                "".concat(this.site, "genre/") +
                                    "".concat(encodeURIComponent(genre)) +
                                    "?page=".concat(page);
                        }
                        else {
                            url =
                                page === 1
                                    ? this.site
                                    : "".concat(this.site, "?page=").concat(page);
                        }
                        if (showLatestNovels) {
                            url =
                                page === 1
                                    ? this.site
                                    : "".concat(this.site, "?page=").concat(page);
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
                        novels = this.extractNovels(loadedCheerio);
                        return [2 /*return*/, this.finalizeNovels(novels)];
                }
            });
        });
    };
    Novelyra.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var query, englishQuery, sourceQuery, page, url, result, body, loadedCheerio, novels, queryCandidates, scored;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = searchTerm.trim();
                        if (!query) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, translateTextToEnglish(query)];
                    case 1:
                        englishQuery = (_a.sent()).trim();
                        sourceQuery = englishQuery &&
                            normalizeSearchText(englishQuery) !==
                                normalizeSearchText(query)
                            ? englishQuery
                            : query;
                        page = Math.max(1, pageNo || 1);
                        url = "".concat(this.site, "search?q=").concat(encodeURIComponent(sourceQuery)) +
                            (page > 1
                                ? "&page=".concat(page)
                                : '');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 2:
                        result = _a.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 3:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novels = this.extractNovels(loadedCheerio);
                        queryCandidates = [
                            query,
                            sourceQuery,
                        ].filter(Boolean);
                        scored = novels
                            .map(function (novel) {
                            var scores = queryCandidates.map(function (candidate) { return ({
                                candidate: candidate,
                                score: searchScore(novel.sourceName, candidate),
                                matches: searchTermsMatch(novel.sourceName, getSearchTerms(candidate)),
                            }); });
                            var best = scores.reduce(function (current, value) {
                                return value.score >
                                    current.score
                                    ? value
                                    : current;
                            }, {
                                candidate: '',
                                score: 0,
                                matches: false,
                            });
                            return {
                                novel: novel,
                                score: best.score,
                                matches: best.matches,
                            };
                        })
                            .filter(function (item) {
                            return item.matches &&
                                item.score > 0;
                        })
                            .sort(function (a, b) {
                            return b.score - a.score;
                        });
                        return [2 /*return*/, this.finalizeNovels(scored.map(function (item) { return item.novel; }))];
                }
            });
        });
    };
    Novelyra.prototype.extractSynopsis = function (loadedCheerio) {
        var synopsisElement = loadedCheerio('#synopsis').first();
        if (!synopsisElement.length) {
            return '';
        }
        /*
         * Remove UI controls from the synopsis.
         */
        synopsisElement
            .find('button, script, style')
            .remove();
        /*
         * Preserve line structure before turning
         * the HTML into text.
         */
        synopsisElement
            .find('br')
            .replaceWith('\n');
        synopsisElement
            .find('p, div')
            .each(function (_, element) {
            var current = loadedCheerio(element).text();
            if (current.trim() &&
                !current.endsWith('\n')) {
                loadedCheerio(element).append('\n');
            }
        });
        var lines = synopsisElement
            .text()
            .split(/\r?\n/)
            .map(function (line) {
            return line
                .replace(/\u00a0/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        })
            .filter(Boolean);
        if (!lines.length) {
            return '';
        }
        /*
         * Drop metadata before Premise.
         *
         * We want the actual descriptive content:
         * Premise + Original Synopsis + following
         * descriptive paragraphs.
         */
        var premiseIndex = lines.findIndex(function (line) {
            return /^Premise\s*:/i.test(line);
        });
        var summaryLines = premiseIndex >= 0
            ? lines.slice(premiseIndex)
            : lines;
        /*
         * Remove leading metadata in case the page
         * uses a slightly different ordering.
         */
        summaryLines =
            summaryLines.filter(function (line) {
                return !/^Author\s*:/i.test(line) &&
                    !/^Genre\s*:/i.test(line) &&
                    !/^Status\s*:/i.test(line) &&
                    !/^Platform\s*:/i.test(line) &&
                    !/^Core Theme\s*:/i.test(line);
            });
        /*
         * Stop before recommendation/marketing headings
         * that are outside the actual synopsis.
         */
        var stopIndex = summaryLines.findIndex(function (line) {
            return /^Why\s+/i.test(line) ||
                /^What\s+Makes\s+/i.test(line) ||
                /^Why\s+".+"\s+is\s+Different/i.test(line);
        });
        if (stopIndex >= 0) {
            summaryLines =
                summaryLines.slice(0, stopIndex);
        }
        return summaryLines.join('\n');
    };
    Novelyra.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanPath, url, result, body, loadedCheerio, sourceName, name, cover, synopsisText, summarySource, summary, summaryParagraphs, translatedSummary, authorMatch, genreMatch, statusMatch, author, genres, status, novel, chapters, seenPaths;
            var _this = this;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        cleanPath = novelPath.replace(/^\/+/, '');
                        url = "".concat(this.site).concat(cleanPath);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _g.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _g.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        sourceName = loadedCheerio('h1')
                            .first()
                            .text()
                            .trim() ||
                            'Desconocido';
                        return [4 /*yield*/, translateShortText(sourceName)];
                    case 3:
                        name = _g.sent();
                        cover = ((_a = loadedCheerio('#synopsis img')
                            .first()
                            .attr('src')) === null || _a === void 0 ? void 0 : _a.trim()) ||
                            ((_b = loadedCheerio('main img')
                                .first()
                                .attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                            ((_c = loadedCheerio('img')
                                .first()
                                .attr('src')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                            '';
                        if (cover &&
                            cover.startsWith('/')) {
                            cover =
                                "".concat(this.site).concat(cover.slice(1));
                        }
                        synopsisText = loadedCheerio('#synopsis')
                            .first()
                            .text()
                            .replace(/\u00a0/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        summarySource = this.extractSynopsis(loadedCheerio);
                        summary = summarySource;
                        if (!summary) return [3 /*break*/, 5];
                        summaryParagraphs = summary
                            .split(/\r?\n/)
                            .map(function (text) {
                            return text.trim();
                        })
                            .filter(Boolean);
                        return [4 /*yield*/, translateParagraphs(summaryParagraphs)];
                    case 4:
                        translatedSummary = _g.sent();
                        summary =
                            translatedSummary
                                .join('\n\n')
                                .trim() ||
                                summary;
                        _g.label = 5;
                    case 5:
                        authorMatch = synopsisText.match(/Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|$)/i);
                        genreMatch = synopsisText.match(/Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|$)/i);
                        statusMatch = synopsisText.match(/Status:\s*(.+?)(?:\s+Platform:|\s+Theme:|$)/i);
                        author = ((_d = authorMatch === null || authorMatch === void 0 ? void 0 : authorMatch[1]) === null || _d === void 0 ? void 0 : _d.trim()) ||
                            '';
                        genres = ((_e = genreMatch === null || genreMatch === void 0 ? void 0 : genreMatch[1]) === null || _e === void 0 ? void 0 : _e.trim().replace(/\s+/g, ', ')) || '';
                        status = ((_f = statusMatch === null || statusMatch === void 0 ? void 0 : statusMatch[1]) === null || _f === void 0 ? void 0 : _f.trim()) ||
                            '';
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
                            var rawChapterPath = ((_a = link
                                .attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
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
                                chapterPath =
                                    chapterPath.slice(_this.site.length);
                            }
                            chapterPath =
                                chapterPath.replace(/^\/+/, '');
                            if (!chapterPath ||
                                seenPaths.has(chapterPath)) {
                                return;
                            }
                            seenPaths.add(chapterPath);
                            var text = link
                                .text()
                                .trim()
                                .replace(/\s+/g, ' ');
                            var chapterName = text ||
                                "Cap\u00EDtulo ".concat(chapterNumber);
                            /*
                             * NovelYra:
                             * "Chapter 1 - Shadow Slave Chapter 1"
                             *
                             * Keep just:
                             * "Chapter 1"
                             */
                            var separatorIndex = chapterName.indexOf(' - ');
                            if (separatorIndex > 0) {
                                chapterName =
                                    chapterName
                                        .slice(0, separatorIndex)
                                        .trim() ||
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
                        chapters.sort(function (first, second) {
                            var _a, _b;
                            return ((_a = first.chapterNumber) !== null && _a !== void 0 ? _a : 0) -
                                ((_b = second.chapterNumber) !== null && _b !== void 0 ? _b : 0);
                        });
                        novel.chapters =
                            chapters;
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
                        loadedCheerio('script, style, iframe, ins, nav, header, footer, aside').remove();
                        chapterContent = loadedCheerio('article').first();
                        if (chapterContent.length === 0) {
                            return [2 /*return*/, 'Contenido no encontrado'];
                        }
                        paragraphs = [];
                        chapterContent
                            .find('p')
                            .each(function (_, element) {
                            var text = loadedCheerio(element)
                                .text()
                                .trim()
                                .replace(/\s+/g, ' ');
                            if (text) {
                                paragraphs.push(text);
                            }
                        });
                        if (paragraphs.length === 0) {
                            rawText = chapterContent
                                .text()
                                .trim()
                                .replace(/\s+/g, ' ');
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
                                return "<p>".concat(paragraph
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;'), "</p>");
                            })
                                .join('')];
                }
            });
        });
    };
    return Novelyra;
}());
exports.default = new Novelyra();

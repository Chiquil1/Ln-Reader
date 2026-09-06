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
var filterInputs_1 = require("@libs/filterInputs");
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var SITE = 'https://novelyra.com/';
var DEFAULT_TRANSLATION_CONFIG = {
    enabled: true,
    provider: 'google',
    targetLang: 'es',
    sourceLang: 'auto',
    batchSize: 10,
    cacheEnabled: true,
    fallbackProvider: 'libretranslate',
};
// Cache de traducciones en memoria
var translationCache = new Map();
// Utilidades de normalización
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function getSearchTerms(text) {
    return normalizeText(text).split(/\s+/).filter(Boolean);
}
function searchTermsMatch(title, queryTerms) {
    var normalizedTitle = normalizeText(title);
    if (!normalizedTitle || !queryTerms.length) {
        return false;
    }
    return queryTerms.every(function (term) { return normalizedTitle.includes(term); });
}
function searchScore(title, query) {
    var normalizedTitle = normalizeText(title);
    var normalizedQuery = normalizeText(query);
    if (!normalizedTitle || !normalizedQuery) {
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
// Traducción universal con soporte multi-proveedor y cache
function translateText(text_1) {
    return __awaiter(this, arguments, void 0, function (text, targetLang, sourceLang, config) {
        var normalized, cacheKey, providers, _i, providers_1, provider, res, json, translated, _a;
        if (targetLang === void 0) { targetLang = 'es'; }
        if (sourceLang === void 0) { sourceLang = 'auto'; }
        if (config === void 0) { config = DEFAULT_TRANSLATION_CONFIG; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    normalized = text.trim();
                    if (!normalized) {
                        return [2 /*return*/, ''];
                    }
                    cacheKey = "".concat(sourceLang, ":").concat(targetLang, ":").concat(normalized);
                    if (config.cacheEnabled && translationCache.has(cacheKey)) {
                        return [2 /*return*/, translationCache.get(cacheKey)];
                    }
                    providers = __spreadArray([
                        {
                            name: config.provider,
                            url: getProviderUrl(config.provider, normalized, sourceLang, targetLang, config.apiKey),
                        }
                    ], (config.fallbackProvider
                        ? [
                            {
                                name: config.fallbackProvider,
                                url: getProviderUrl(config.fallbackProvider, normalized, sourceLang, targetLang, config.apiKey),
                            },
                        ]
                        : []), true);
                    _i = 0, providers_1 = providers;
                    _b.label = 1;
                case 1:
                    if (!(_i < providers_1.length)) return [3 /*break*/, 7];
                    provider = providers_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, (0, fetch_1.fetchApi)(provider.url)];
                case 3:
                    res = _b.sent();
                    if (!res.ok) {
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, res.json()];
                case 4:
                    json = _b.sent();
                    translated = extractTranslation(json, provider.name);
                    if (translated && translated !== normalized) {
                        if (config.cacheEnabled) {
                            translationCache.set(cacheKey, translated);
                        }
                        return [2 /*return*/, translated];
                    }
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, text]; // Fallback to original
            }
        });
    });
}
function getProviderUrl(provider, text, sourceLang, targetLang, apiKey) {
    var encoded = encodeURIComponent(text);
    switch (provider) {
        case 'google':
            return "https://translate.googleapis.com/translate_a/single?client=gtx&sl=".concat(sourceLang, "&tl=").concat(targetLang, "&dt=t&q=").concat(encoded);
        case 'deepl':
            return "https://api-free.deepl.com/v2/translate?auth_key=".concat(apiKey, "&text=").concat(encodeURIComponent(text), "&target_lang=").concat(targetLang.toUpperCase(), "&source_lang=").concat(sourceLang === 'auto' ? '' : sourceLang);
        case 'libretranslate':
            return "https://libretranslate.de/translate?q=".concat(encodeURIComponent(text), "&source=").concat(sourceLang, "&target=").concat(targetLang, "&format=text");
        default:
            return "https://translate.googleapis.com/translate_a/single?client=gtx&sl=".concat(sourceLang, "&tl=").concat(targetLang, "&dt=t&q=").concat(encoded);
    }
}
function extractTranslation(json, provider) {
    var _a;
    try {
        switch (provider) {
            case 'google':
                if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
                    return json[0]
                        .map(function (item) { return item[0]; })
                        .filter(Boolean)
                        .join('');
                }
                break;
            case 'deepl':
                if (typeof json === 'object' &&
                    json !== null &&
                    'translations' in json) {
                    return (((_a = json.translations[0]) === null || _a === void 0 ? void 0 : _a.text) || null);
                }
                break;
            case 'libretranslate':
                if (typeof json === 'object' &&
                    json !== null &&
                    'translatedText' in json) {
                    return json.translatedText;
                }
                break;
        }
    }
    catch (_b) {
        // Ignore extraction errors
    }
    return null;
}
function translateParagraphs(paragraphs_1) {
    return __awaiter(this, arguments, void 0, function (paragraphs, _config) {
        var translatedParagraphs, currentBatch, _i, paragraphs_2, paragraph, normalizedParagraph, separator, translatedBatch, translatedBatch;
        if (_config === void 0) { _config = DEFAULT_TRANSLATION_CONFIG; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    translatedParagraphs = [];
                    currentBatch = '';
                    _i = 0, paragraphs_2 = paragraphs;
                    _a.label = 1;
                case 1:
                    if (!(_i < paragraphs_2.length)) return [3 /*break*/, 6];
                    paragraph = paragraphs_2[_i];
                    normalizedParagraph = paragraph.trim();
                    if (!normalizedParagraph) {
                        return [3 /*break*/, 5];
                    }
                    separator = currentBatch === '' ? '' : '\n';
                    if (!("".concat(currentBatch).concat(separator).concat(normalizedParagraph).length > 2000) // MAX_TRANSLATION_CHARS
                    ) return [3 /*break*/, 4]; // MAX_TRANSLATION_CHARS
                    if (!(currentBatch !== '')) return [3 /*break*/, 3];
                    return [4 /*yield*/, translateText(currentBatch, undefined, undefined, DEFAULT_TRANSLATION_CONFIG)];
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
                    return [4 /*yield*/, translateText(currentBatch, undefined, undefined, DEFAULT_TRANSLATION_CONFIG)];
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
            return [2 /*return*/, Promise.all(titles.map(function (title) { return translateShortText(title); }))];
        });
    });
}
// Limpieza avanzada de texto para TTS
function cleanTextForTts(text) {
    return (text
        // Eliminar caracteres invisibles
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
        // Normalizar barras múltiples
        .replace(/[\\/]{2,}/g, '')
        // Normalizar guiones
        .replace(/[—––─]/g, '-')
        // Eliminar caracteres decorativos
        .replace(/[*_~|•♦¤°]/g, '')
        // Normalizar puntos suspensivos
        .replace(/\.{4,}/g, '...')
        // Normalizar espacios múltiples
        .replace(/ {2,}/g, ' ')
        // Normalizar saltos de línea múltiples
        .replace(/\n\s*\n/g, '\n')
        .trim());
}
// Parsear tiempo relativo a fecha absoluta
function parseRelativeTime(text) {
    var match = text.match(/\b(\d+)\s+(day|days|week|weeks|month|months|year|years|día|días|semana|semanas|mes|meses|año|años)\s+ago\b/i);
    if (!match) {
        return null;
    }
    var value = parseInt(match[1], 10);
    var unit = match[2].toLowerCase();
    var now = new Date();
    if (unit.startsWith('day') || unit.startsWith('día')) {
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    }
    if (unit.startsWith('week') || unit.startsWith('semana')) {
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
    }
    if (unit.startsWith('month') || unit.startsWith('mes')) {
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
    }
    if (unit.startsWith('year') || unit.startsWith('año')) {
        return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
    }
    return null;
}
// Extraer número de capítulo de URL
function extractChapterNumberFromUrl(url) {
    var match = url.match(/\/chapter-(\d+)(?:\/)?(?:[?#].*)?$/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}
var Novelyra = /** @class */ (function () {
    function Novelyra() {
        this.id = 'novelyra';
        this.name = 'Novelyra';
        this.icon = 'https://novelyra.com/favicon.ico';
        this.site = SITE;
        this.version = '2.4.0';
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
        var novelLinks = loadedCheerio('main a[href]').filter(function (_, element) {
            var _a;
            var href = ((_a = loadedCheerio(element).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            var hasImage = loadedCheerio(element).find('img').length > 0;
            var hasTitle = loadedCheerio(element).find('h3, h2, [class*="title"]').length > 0;
            return !!(href && hasImage && hasTitle);
        });
        novelLinks.each(function (_, element) {
            var _a, _b, _c, _d;
            var link = loadedCheerio(element);
            var title = link.find('h3').first().length
                ? link.find('h3').first()
                : link.find('h2').first().length
                    ? link.find('h2').first()
                    : link.find('[class*="title"]').first();
            if (!title.length) {
                return;
            }
            var sourceName = title.text().trim();
            var rawPath = ((_a = link.attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (!sourceName || !rawPath) {
                return;
            }
            if (rawPath.startsWith('http') && !rawPath.startsWith(_this.site)) {
                return;
            }
            var path = rawPath;
            if (path.startsWith(_this.site)) {
                path = path.slice(_this.site.length);
            }
            path = path.replace(/^\/+/, '').replace(/\/$/, '');
            if (!path || novels.some(function (item) { return item.path === path; })) {
                return;
            }
            var image = link.find('img').first();
            var cover = ((_b = image.attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                ((_c = image.attr('data-src')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                ((_d = image.attr('data-lazy-src')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                '';
            if (cover && cover.startsWith('/')) {
                cover = "".concat(_this.site).concat(cover.slice(1));
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
                                name: translatedTitles[index] || novel.sourceName,
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
                            url = "".concat(this.site, "genre/").concat(encodeURIComponent(genre), "?page=").concat(page);
                        }
                        else if (showLatestNovels) {
                            url = page === 1 ? this.site : "".concat(this.site, "?page=").concat(page);
                        }
                        else {
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
                            normalizeSearchText(englishQuery) !== normalizeSearchText(query)
                            ? englishQuery
                            : query;
                        page = Math.max(1, pageNo || 1);
                        url = "".concat(this.site, "search?q=").concat(encodeURIComponent(sourceQuery)) +
                            (page > 1 ? "&page=".concat(page) : '');
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
                        queryCandidates = [query, sourceQuery].filter(Boolean);
                        scored = novels
                            .map(function (novel) {
                            var scores = queryCandidates.map(function (candidate) { return ({
                                candidate: candidate,
                                score: searchScore(novel.sourceName, candidate),
                                matches: searchTermsMatch(novel.sourceName, getSearchTerms(candidate)),
                            }); });
                            var best = scores.reduce(function (current, value) { return (value.score > current.score ? value : current); }, {
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
                            .filter(function (item) { return item.matches && item.score > 0; })
                            .sort(function (a, b) { return b.score - a.score; });
                        return [2 /*return*/, this.finalizeNovels(scored.map(function (item) { return item.novel; }))];
                }
            });
        });
    };
    Novelyra.prototype.extractSynopsis = function (loadedCheerio) {
        var synopsisElement = loadedCheerio('#synopsis').first().length
            ? loadedCheerio('#synopsis').first()
            : loadedCheerio('section:contains("Synopsis")').first().length
                ? loadedCheerio('section:contains("Synopsis")').first()
                : loadedCheerio('[class*="synopsis"], [class*="description"], [class*="summary"]').first();
        if (!synopsisElement.length) {
            return '';
        }
        synopsisElement.find('button, script, style, nav').remove();
        synopsisElement.find('br').replaceWith('\n');
        synopsisElement.find('p, div').each(function (_, element) {
            var current = loadedCheerio(element).text();
            if (current.trim() && !current.endsWith('\n')) {
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
        var premiseIndex = lines.findIndex(function (line) { return /^Premise\s*:/i.test(line); });
        var summaryLines = premiseIndex >= 0 ? lines.slice(premiseIndex) : lines;
        summaryLines = summaryLines.filter(function (line) {
            return !/^Author\s*:/i.test(line) &&
                !/^Genre\s*:/i.test(line) &&
                !/^Status\s*:/i.test(line) &&
                !/^Platform\s*:/i.test(line) &&
                !/^Core Theme\s*:/i.test(line) &&
                !/^Type\s*:/i.test(line) &&
                !/^Year\s*:/i.test(line) &&
                !/^Chapters\s*:/i.test(line) &&
                !/^Views\s*:/i.test(line) &&
                !/^Rating\s*:/i.test(line);
        });
        var stopIndex = summaryLines.findIndex(function (line) {
            return /^Why\s+/i.test(line) ||
                /^What\s+Makes\s+/i.test(line) ||
                /^Why\s+".+"\s+is\s+Different/i.test(line) ||
                /^You\s+May\s+Also\s+Like/i.test(line);
        });
        if (stopIndex >= 0) {
            summaryLines = summaryLines.slice(0, stopIndex);
        }
        return summaryLines.join('\n');
    };
    Novelyra.prototype.extractChaptersFromHtml = function (loadedCheerio) {
        var _this = this;
        var chapters = [];
        loadedCheerio('a[href*="/chapter-"]').each(function (_, element) {
            var _a, _b;
            var link = loadedCheerio(element);
            var rawChapterPath = ((_a = link.attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (!rawChapterPath) {
                return;
            }
            var chapterNumber = extractChapterNumberFromUrl(rawChapterPath);
            if (chapterNumber === null) {
                return;
            }
            var chapterPath = rawChapterPath;
            if (chapterPath.startsWith(_this.site)) {
                chapterPath = chapterPath.slice(_this.site.length);
            }
            chapterPath = chapterPath.replace(/^\/+/, '').replace(/\/$/, '');
            if (!chapterPath) {
                return;
            }
            var text = link.text().trim().replace(/\s+/g, ' ');
            var chapterName = text || "Cap\u00EDtulo ".concat(chapterNumber || 0);
            var separatorIndex = chapterName.indexOf(' - ');
            if (separatorIndex > 0) {
                chapterName =
                    chapterName.slice(0, separatorIndex).trim() ||
                        "Cap\u00EDtulo ".concat(chapterNumber || 0);
            }
            var releaseMatch = text.match(/\b(\d+\s+(?:day|days|week|weeks|month|months|year|years|día|días|semana|semanas|mes|meses|año|años)\s+ago)\b/i);
            chapters.push({
                name: chapterName,
                path: chapterPath,
                chapterNumber: chapterNumber !== null && chapterNumber !== void 0 ? chapterNumber : 0,
                releaseTime: (releaseMatch === null || releaseMatch === void 0 ? void 0 : releaseMatch[1])
                    ? (_b = parseRelativeTime(releaseMatch[1])) === null || _b === void 0 ? void 0 : _b.toISOString()
                    : undefined,
            });
        });
        return chapters;
    };
    Novelyra.prototype.extractTotalPages = function (loadedCheerio) {
        var pageLinks = loadedCheerio('nav[aria-label="Pagination"] a[href*="page="]');
        var maxPage = 1;
        pageLinks.each(function (_, el) {
            var href = loadedCheerio(el).attr('href') || '';
            var match = href.match(/page=(\d+)/);
            if (match) {
                var pageNum = parseInt(match[1], 10);
                if (pageNum > maxPage) {
                    maxPage = pageNum;
                }
            }
        });
        return maxPage;
    };
    Novelyra.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanPath, url, result, body, loadedCheerio, sourceName, name, cover, synopsisText, summarySource, summary, summaryParagraphs, translatedSummary, authorMatch, genreMatch, statusMatch, author, genres, status, novel, seenPaths, allChapters, totalPages, page, pageUrl, pageResult, pageBody, pageHtml, pageChapters, _i, pageChapters_1, ch, _a;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        cleanPath = novelPath.replace(/^\/+/, '').replace(/\/$/, '');
                        url = "".concat(this.site).concat(cleanPath, "/");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _k.sent();
                        if (!result.ok) {
                            throw new Error("HTTP ".concat(result.status, ": ").concat(url));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _k.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        sourceName = loadedCheerio('h1').first().text().trim() || 'Desconocido';
                        return [4 /*yield*/, translateShortText(sourceName)];
                    case 3:
                        name = _k.sent();
                        cover = ((_b = loadedCheerio('img[src*="cover"], img[alt*="cover"]')
                            .first()
                            .attr('src')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                            ((_c = loadedCheerio('#synopsis img').first().attr('src')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                            ((_d = loadedCheerio('main img').first().attr('src')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                            ((_e = loadedCheerio('article img').first().attr('src')) === null || _e === void 0 ? void 0 : _e.trim()) ||
                            ((_f = loadedCheerio('img').first().attr('src')) === null || _f === void 0 ? void 0 : _f.trim()) ||
                            '';
                        if (cover && cover.startsWith('/')) {
                            cover = "".concat(this.site).concat(cover.slice(1));
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
                            .map(function (text) { return text.trim(); })
                            .filter(Boolean);
                        return [4 /*yield*/, translateParagraphs(summaryParagraphs)];
                    case 4:
                        translatedSummary = _k.sent();
                        summary = translatedSummary.join('\n\n').trim() || summary;
                        _k.label = 5;
                    case 5:
                        authorMatch = synopsisText.match(/Author:\s*(.+?)(?:\s+Genre:|\s+Status:|\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|$)/i);
                        genreMatch = synopsisText.match(/Genre:\s*(.+?)(?:\s+Status:|\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|$)/i);
                        statusMatch = synopsisText.match(/Status:\s*(.+?)(?:\s+Platform:|\s+Theme:|\s+Type:|\s+Year:|\s+Chapters:|$)/i);
                        author = ((_g = authorMatch === null || authorMatch === void 0 ? void 0 : authorMatch[1]) === null || _g === void 0 ? void 0 : _g.trim()) || '';
                        genres = ((_h = genreMatch === null || genreMatch === void 0 ? void 0 : genreMatch[1]) === null || _h === void 0 ? void 0 : _h.trim().replace(/\s+/g, ', ')) || '';
                        status = ((_j = statusMatch === null || statusMatch === void 0 ? void 0 : statusMatch[1]) === null || _j === void 0 ? void 0 : _j.trim()) || '';
                        novel = {
                            path: novelPath,
                            name: name,
                            cover: cover,
                            summary: summary,
                            author: author,
                            genres: genres,
                            status: status,
                        };
                        seenPaths = new Set();
                        allChapters = this.extractChaptersFromHtml(loadedCheerio);
                        allChapters.forEach(function (ch) {
                            if (ch.path) {
                                seenPaths.add(ch.path);
                            }
                        });
                        totalPages = this.extractTotalPages(loadedCheerio);
                        page = 2;
                        _k.label = 6;
                    case 6:
                        if (!(page <= totalPages)) return [3 /*break*/, 12];
                        _k.label = 7;
                    case 7:
                        _k.trys.push([7, 10, , 11]);
                        pageUrl = "".concat(this.site).concat(cleanPath, "?page=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(pageUrl)];
                    case 8:
                        pageResult = _k.sent();
                        if (!pageResult.ok) {
                            return [3 /*break*/, 11];
                        }
                        return [4 /*yield*/, pageResult.text()];
                    case 9:
                        pageBody = _k.sent();
                        pageHtml = (0, cheerio_1.load)(pageBody);
                        pageChapters = this.extractChaptersFromHtml(pageHtml);
                        for (_i = 0, pageChapters_1 = pageChapters; _i < pageChapters_1.length; _i++) {
                            ch = pageChapters_1[_i];
                            if (ch.path && !seenPaths.has(ch.path)) {
                                seenPaths.add(ch.path);
                                allChapters.push(ch);
                            }
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        _a = _k.sent();
                        return [3 /*break*/, 11];
                    case 11:
                        page++;
                        return [3 /*break*/, 6];
                    case 12:
                        allChapters.sort(function (first, second) { var _a, _b; return ((_a = first.chapterNumber) !== null && _a !== void 0 ? _a : 0) - ((_b = second.chapterNumber) !== null && _b !== void 0 ? _b : 0); });
                        novel.chapters = allChapters;
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    Novelyra.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanPath, url, result, body, loadedCheerio, chapterContent, paragraphs, rawText, chunks, _i, chunks_1, chunk, cleaned, translated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cleanPath = chapterPath.replace(/^\/+/, '').replace(/\/$/, '');
                        url = "".concat(this.site).concat(cleanPath, "/");
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
                        loadedCheerio('script, style, iframe, ins, nav, header, footer, aside, [class*="ad"], [class*="nav"], [class*="sidebar"], [class*="related"], [class*="recommend"]').remove();
                        chapterContent = loadedCheerio('#chapter-content').first().length
                            ? loadedCheerio('#chapter-content').first()
                            : loadedCheerio('article').first().length
                                ? loadedCheerio('article').first()
                                : loadedCheerio('[class*="chapter-content"], [class*="entry-content"]').first().length
                                    ? loadedCheerio('[class*="chapter-content"], [class*="entry-content"]').first()
                                    : loadedCheerio('main').first().length
                                        ? loadedCheerio('main').first()
                                        : loadedCheerio('body').first();
                        if (chapterContent.length === 0) {
                            return [2 /*return*/, 'Contenido no encontrado'];
                        }
                        paragraphs = [];
                        chapterContent.find('p').each(function (_, element) {
                            var text = loadedCheerio(element).text().trim().replace(/\s+/g, ' ');
                            if (text && text.length > 10) {
                                paragraphs.push(cleanTextForTts(text));
                            }
                        });
                        if (paragraphs.length === 0) {
                            rawText = chapterContent.text().trim().replace(/\s+/g, ' ');
                            if (rawText) {
                                chunks = rawText.match(/.{1,1800}(?:\s|$)/g) || [rawText];
                                for (_i = 0, chunks_1 = chunks; _i < chunks_1.length; _i++) {
                                    chunk = chunks_1[_i];
                                    cleaned = cleanTextForTts(chunk.trim());
                                    if (cleaned) {
                                        paragraphs.push(cleaned);
                                    }
                                }
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
                                return "<p>".concat(paragraph.replace(/</g, '<').replace(/>/g, '>'), "</p>");
                            })
                                .join('')];
                }
            });
        });
    };
    return Novelyra;
}());
// Funciones de traducción expuestas para reutilización
function translateTextToEnglish(text) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, translateText(text, 'en', 'auto')];
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
exports.default = new Novelyra();

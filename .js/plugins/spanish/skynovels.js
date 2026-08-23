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
var fetch_1 = require("@libs/fetch");
var filterInputs_1 = require("@libs/filterInputs");
var cheerio_1 = require("cheerio");
var SkyNovels = /** @class */ (function () {
    function SkyNovels() {
        this.id = 'skynovels-custom';
        this.name = 'SkyNovels';
        this.site = 'https://www.skynovels.net/';
        this.apiSite = 'https://api.skynovels.net/api/';
        this.version = '1.1.5'; // Fix: reconstruir/segmentar párrafos para que el TTS no corte por bloques de texto demasiado largos
        this.icon = 'src/es/skynovels/icon.png';
        this.filters = {
            genres: {
                type: filterInputs_1.FilterTypes.CheckboxGroup,
                label: 'Generos',
                value: [],
                options: [
                    { label: 'Acción', value: '9' },
                    { label: 'Adulto', value: '38' },
                    { label: 'Artes marciales', value: '3' },
                    { label: 'Aventura', value: '2' },
                    { label: 'BL', value: '40' },
                    { label: 'Comedia', value: '7' },
                    { label: 'Cosas de la vida', value: '26' },
                    { label: 'Cultivación', value: '19' },
                    { label: 'Drama', value: '8' },
                    { label: 'Ecchi', value: '21' },
                    { label: 'Fantasia', value: '4' },
                    { label: 'Gender Bender', value: '10' },
                    { label: 'GL', value: '41' },
                    { label: 'Harem', value: '12' },
                    { label: 'Histórico', value: '32' },
                    { label: 'Horror', value: '39' },
                    { label: 'LitRPG', value: '31' },
                    { label: 'Maduro', value: '1' },
                    { label: 'Magia', value: '16' },
                    { label: 'Misterio', value: '22' },
                    { label: 'Mundo Moderno', value: '34' },
                    { label: 'Psicológico', value: '27' },
                    { label: 'Recuentos de la vida', value: '36' },
                    { label: 'Reencarnación', value: '23' },
                    { label: 'Romance', value: '5' },
                    { label: 'Sci-Fi', value: '17' },
                    { label: 'Seinen', value: '18' },
                    { label: 'Shoujo', value: '33' },
                    { label: 'Shounen', value: '13' },
                    { label: 'Sobrenatural', value: '20' },
                    { label: 'Supervivencia', value: '25' },
                    { label: 'Suspenso', value: '35' },
                    { label: 'Tragedia', value: '14' },
                    { label: 'Transmigración', value: '24' },
                    { label: 'Vida Escolar', value: '29' },
                    { label: 'Xianxia', value: '6' },
                    { label: 'Xuanhuan', value: '11' },
                    { label: 'Yaoi', value: '30' },
                    { label: 'Sin género indicado', value: '37' },
                ],
            },
        };
    }
    // ---------------------------------------------------------------------
    // Listado / búsqueda
    // ---------------------------------------------------------------------
    SkyNovels.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var genres, order, url, body;
            var _c;
            var filters = _b.filters;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        genres = ((_c = filters === null || filters === void 0 ? void 0 : filters.genres) === null || _c === void 0 ? void 0 : _c.value) || [];
                        order = genres.length > 0 ? 'updated' : 'rating';
                        url = "".concat(this.apiSite, "novels?page=").concat(pageNo, "&order=").concat(order);
                        if (genres.length > 0)
                            url += "&genres=".concat(genres.join(','));
                        return [4 /*yield*/, this.fetchJson(url)];
                    case 1:
                        body = _d.sent();
                        return [2 /*return*/, this.mapNovelList(body.novels)];
                }
            });
        });
    };
    SkyNovels.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var q, url, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = encodeURIComponent(searchTerm.toLowerCase());
                        url = "".concat(this.apiSite, "novels?page=").concat(pageNo, "&q=").concat(q);
                        return [4 /*yield*/, this.fetchJson(url)];
                    case 1:
                        body = _a.sent();
                        return [2 /*return*/, this.mapNovelList(body.novels)];
                }
            });
        });
    };
    SkyNovels.prototype.mapNovelList = function (entries) {
        var _this = this;
        var novels = [];
        entries === null || entries === void 0 ? void 0 : entries.forEach(function (res) {
            novels.push({
                name: res.nvl_title,
                cover: _this.apiSite + 'get-image/' + res.image + '/novels/false',
                path: 'novelas/' + res.id + '/' + res.nvl_name + '/',
            });
        });
        return novels;
    };
    // ---------------------------------------------------------------------
    // Detalle de novela
    // ---------------------------------------------------------------------
    SkyNovels.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var novelId, url, body, item, novel;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        novelId = novelPath.split('/')[1];
                        url = this.apiSite + 'novel/' + novelId + '/reading?&q';
                        return [4 /*yield*/, this.fetchJson(url)];
                    case 1:
                        body = _c.sent();
                        item = (_a = body === null || body === void 0 ? void 0 : body.novel) === null || _a === void 0 ? void 0 : _a[0];
                        novel = {
                            path: novelPath,
                            name: (item === null || item === void 0 ? void 0 : item.nvl_title) || 'Untitled',
                            cover: this.apiSite + 'get-image/' + (item === null || item === void 0 ? void 0 : item.image) + '/novels/false',
                            genres: ((_b = item === null || item === void 0 ? void 0 : item.genres) !== null && _b !== void 0 ? _b : []).map(function (g) { return g.genre_name; }).join(','),
                            author: item === null || item === void 0 ? void 0 : item.nvl_writer,
                            summary: item === null || item === void 0 ? void 0 : item.nvl_content,
                            status: item === null || item === void 0 ? void 0 : item.nvl_status,
                            chapters: this.mapChapters(novelPath, item === null || item === void 0 ? void 0 : item.volumes),
                        };
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    SkyNovels.prototype.mapChapters = function (novelPath, volumes) {
        var novelChapters = [];
        volumes === null || volumes === void 0 ? void 0 : volumes.forEach(function (volume) {
            var _a;
            (_a = volume === null || volume === void 0 ? void 0 : volume.chapters) === null || _a === void 0 ? void 0 : _a.forEach(function (chapter) {
                novelChapters.push({
                    name: chapter.chp_index_title,
                    releaseTime: new Date(chapter.createdAt).toDateString(),
                    path: novelPath + chapter.id + '/' + chapter.chp_name,
                });
            });
        });
        return novelChapters;
    };
    // ---------------------------------------------------------------------
    // Capítulo + limpieza de texto para TTS
    // ---------------------------------------------------------------------
    SkyNovels.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var chapterId, url, body, item, chapterText, $;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chapterId = chapterPath.split('/')[3];
                        url = "".concat(this.apiSite, "novel-chapter/").concat(chapterId);
                        return [4 /*yield*/, this.fetchJson(url)];
                    case 1:
                        body = _b.sent();
                        item = (_a = body === null || body === void 0 ? void 0 : body.chapter) === null || _a === void 0 ? void 0 : _a[0];
                        chapterText = (item === null || item === void 0 ? void 0 : item.chp_content) || '';
                        if (!chapterText)
                            return [2 /*return*/, ''];
                        $ = (0, cheerio_1.load)(chapterText);
                        // 1) Quitar elementos que no aportan contenido legible/audible
                        $('script, style, ins, .chapter-ad, .adsbygoogle, .hidden, [style*="display:none"]').remove();
                        // 2) Limpiar cada nodo de texto (invisibles, símbolos, espacios)
                        $('*')
                            .contents()
                            .each(function (_, element) {
                            if (element.type === 'text' && element.data) {
                                var cleanedText = _this.cleanTextForTts(element.data);
                                if (element.data !== cleanedText) {
                                    element.data = cleanedText;
                                }
                            }
                        });
                        // 3) Eliminar contenedores que quedaron vacíos tras la limpieza
                        $('p, div').each(function (_, el) {
                            var $el = $(el);
                            if (!$el.text().trim())
                                $el.remove();
                        });
                        // 4) Garantizar que el contenido esté dividido en párrafos <p> de
                        // tamaño razonable. El lector de LNReader (y su TTS) procesa el
                        // capítulo párrafo por párrafo; si el HTML de origen viene como un
                        // bloque gigante (sin <p>, o con <br> en vez de párrafos separados),
                        // el TTS puede terminar tratando todo el capítulo como una sola
                        // "frase" que excede el límite de síntesis de Android (~4000
                        // caracteres) y se corta sin sonido justo después de resaltar el
                        // primer fragmento. Esta función normaliza la estructura para
                        // evitarlo.
                        this.ensureReadableParagraphs($);
                        // IMPORTANTE: $.html() devuelve el documento COMPLETO que cheerio arma
                        // internamente (<html><head></head><body>...</body></html>). Eso queda
                        // anidado dentro del body del WebView de la app y rompe el árbol de
                        // accesibilidad que usa el TTS del sistema para leer el texto (aunque
                        // visualmente se vea bien). Por eso devolvemos solo el contenido de
                        // <body>, igual que hacen otros plugins (ej. RNCalation con
                        // `.novel-content`).
                        return [2 /*return*/, $('body').html() || ''];
                }
            });
        });
    };
    /**
     * Asegura que el body tenga párrafos <p> bien delimitados y de tamaño
     * acotado, reconstruyéndolos desde el texto plano si hace falta.
     */
    SkyNovels.prototype.ensureReadableParagraphs = function ($) {
        var _this = this;
        var body = $('body');
        var goodParagraphs = body
            .find('p')
            .filter(function (_, el) {
            return $(el).text().trim().length > 0 &&
                $(el).text().trim().length <= SkyNovels.MAX_PARAGRAPH_LENGTH;
        });
        var anyParagraphs = body
            .find('p')
            .filter(function (_, el) { return $(el).text().trim().length > 0; });
        // Ya hay párrafos <p> y ninguno es demasiado largo: no hace falta tocar nada
        if (anyParagraphs.length > 0 &&
            goodParagraphs.length === anyParagraphs.length) {
            return;
        }
        // Convertimos <br> en saltos de línea para no perder la separación visual
        body.find('br').replaceWith('\n');
        var rawText = body.text();
        var rawParagraphs = rawText
            .split(/\n+/)
            .map(function (p) { return p.trim(); })
            .filter(Boolean);
        body.empty();
        rawParagraphs.forEach(function (paragraph) {
            _this.appendAsParagraphs(body, paragraph);
        });
    };
    /**
     * Agrega `text` al contenedor como uno o más <p>, partiendo por oraciones
     * si excede el largo máximo seguro para una sola síntesis de TTS.
     */
    SkyNovels.prototype.appendAsParagraphs = function (container, text) {
        var escape = function (s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        if (text.length <= SkyNovels.MAX_PARAGRAPH_LENGTH) {
            container.append("<p>".concat(escape(text), "</p>"));
            return;
        }
        // Partimos por oraciones para no cortar a la mitad de una frase
        var sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
        var chunk = '';
        sentences.forEach(function (sentence) {
            if ((chunk + sentence).length > SkyNovels.MAX_PARAGRAPH_LENGTH && chunk) {
                container.append("<p>".concat(escape(chunk.trim()), "</p>"));
                chunk = sentence;
            }
            else {
                chunk += sentence;
            }
        });
        if (chunk.trim()) {
            container.append("<p>".concat(escape(chunk.trim()), "</p>"));
        }
    };
    /**
     * Limpieza de texto orientada a TTS: elimina caracteres invisibles
     * anti-copia y normaliza símbolos que suenan mal o rompen la lectura,
     * sin destruir barras/guiones que tienen significado gramatical.
     */
    SkyNovels.prototype.cleanTextForTts = function (text) {
        return (text
            // Caracteres invisibles anti-copia (zero-width, marcas de dirección)
            .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
            // Barras decorativas repetidas ("///", "\\\\") -> fuera.
            // Se preservan barras simples con significado ("1/2", "y/o", "12/05").
            .replace(/[\\/]{2,}/g, '')
            // Rayas de diálogo orientales/atípicas -> guion simple
            .replace(/[—––─]/g, '-')
            // Símbolos de adorno repetitivos comunes
            .replace(/[*_~|•♦¤°]/g, '')
            // Controlar abusos de puntos suspensivos
            .replace(/\.{4,}/g, '...')
            // Colapsar espacios múltiples
            .replace(/ {2,}/g, ' ')
            // Colapsar saltos de línea excesivos dentro del mismo párrafo
            .replace(/\n\s*\n/g, '\n')
            .trim());
    };
    // ---------------------------------------------------------------------
    // Helper de fetch
    // ---------------------------------------------------------------------
    SkyNovels.prototype.fetchJson = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                            headers: {
                                'Cache-Control': 'no-cache',
                            },
                        })];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.json()];
                    case 2: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    /**
     * Máximo de caracteres seguro por párrafo/utterance. Se deja bastante
     * margen por debajo del límite real de Android TTS (~4000) para no
     * rozarlo con distintos motores de voz.
     */
    SkyNovels.MAX_PARAGRAPH_LENGTH = 1800;
    return SkyNovels;
}());
exports.default = new SkyNovels();

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
var cheerio = __importStar(require("cheerio"));
var NovaPlugin = /** @class */ (function () {
    function NovaPlugin() {
        this.id = 'nova';
        this.name = 'NOVA';
        this.icon = 'src/es/nova/icon.png';
        this.site = 'https://novelasligeras.net';
        this.version = '1.1.1';
        // Regex para parsear títulos de capítulos
        this.CHAPTER_REGEX = /(Parte \d+) . (.+?): (.+)/;
    }
    // Helper para bypass de imágenes de Cloudflare
    NovaPlugin.prototype.bypassCloudflareImages = function ($, $content) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                $content.find('img').each(function (i, img) {
                    var $img = $(img);
                    var src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-cfsrc');
                    if (src) {
                        // Si la imagen tiene atributos de Cloudflare, usar la URL directa
                        $img.attr('src', src);
                        $img.removeAttr('data-src');
                        $img.removeAttr('data-cfsrc');
                    }
                });
                return [2 /*return*/, $content.html() || ''];
            });
        });
    };
    // Helper para convertir HTML a texto limpio (si es necesario)
    NovaPlugin.prototype.htmlToText = function (html) {
        if (!html)
            return '';
        var $ = cheerio.load(html);
        $('script, style').remove();
        return $.text().trim();
    };
    // Método para obtener novelas populares
    NovaPlugin.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Para la primera página, usar la búsqueda AJAX
                        if (pageNo === 1) {
                            return [2 /*return*/, this.searchNovels('', 1)];
                        }
                        url = "".concat(this.site, "/index.php/page/").concat(pageNo, "/?post_type=product&orderby=popularity");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        novels = [];
                        $('.dt-css-grid div.wf-cell').each(function (i, element) {
                            var _a;
                            var $el = $(element);
                            var $img = $el.find('img');
                            var $link = $el.find('h4.entry-title a');
                            var path = ((_a = $link.attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '')) || '';
                            var name = $link.text().trim();
                            var cover = $img.attr('data-src') ||
                                $img.attr('data-cfsrc') ||
                                $img.attr('src') ||
                                '';
                            if (name && path) {
                                novels.push({ name: name, path: path, cover: cover });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    // Método para buscar novelas
    NovaPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var novels, encodedTerm, url, body, $_1, url, formData, response, data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        novels = [];
                        if (!(pageNo > 1)) return [3 /*break*/, 2];
                        encodedTerm = encodeURIComponent(searchTerm);
                        url = "".concat(this.site, "/index.php/page/").concat(pageNo, "/?s=").concat(encodedTerm, "&post_type=product&title=1&excerpt=1&content=0&categories=1&attributes=1&tags=1&sku=0&orderby=popularity&ixwps=1");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $_1 = cheerio.load(body);
                        $_1('.dt-css-grid div.wf-cell').each(function (i, element) {
                            var _a;
                            var $el = $_1(element);
                            var $img = $el.find('img');
                            var $link = $el.find('h4.entry-title a');
                            var path = ((_a = $link.attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '')) || '';
                            var name = $link.text().trim();
                            var cover = $img.attr('data-src') ||
                                $img.attr('data-cfsrc') ||
                                $img.attr('src') ||
                                '';
                            if (name && path) {
                                novels.push({ name: name, path: path, cover: cover });
                            }
                        });
                        return [3 /*break*/, 5];
                    case 2:
                        url = "".concat(this.site, "/wp-admin/admin-ajax.php?tags=1&sku=&limit=30&category_results=&order=DESC&category_limit=5&order_by=title&product_thumbnails=1&title=1&excerpt=1&content=&categories=1&attributes=1");
                        formData = new FormData();
                        formData.append('action', 'product_search');
                        formData.append('product-search', '1');
                        formData.append('product-query', searchTerm);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                                method: 'POST',
                                body: formData,
                            })];
                    case 3:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        if (Array.isArray(data)) {
                            data.forEach(function (novel) {
                                var _a;
                                var path = ((_a = novel.url) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '')) || '';
                                var name = novel.title || '';
                                var cover = novel.thumbnail || '';
                                if (name && path) {
                                    novels.push({ name: name, path: path, cover: cover });
                                }
                            });
                        }
                        _a.label = 5;
                    case 5: return [2 /*return*/, novels];
                }
            });
        });
    };
    // Método para obtener detalles de una novela
    NovaPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, name, $coverImg, cover, author, artist, summaryHtml, summary, statusText, status, chapters, chapterIndex, novel;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site).concat(novelPath);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        name = $('h1').first().text().trim();
                        $coverImg = $('.woocommerce-product-gallery').find('img').first();
                        cover = $coverImg.attr('src') ||
                            $coverImg.attr('data-cfsrc') ||
                            $coverImg.attr('data-src') ||
                            '';
                        author = $('.woocommerce-product-attributes-item--attribute_pa_escritor td')
                            .text()
                            .trim() || 'Desconocido';
                        artist = $('.woocommerce-product-attributes-item--attribute_pa_ilustrador td')
                            .text()
                            .trim() || '';
                        summaryHtml = $('.woocommerce-product-details__short-description').html();
                        summary = this.htmlToText(summaryHtml);
                        statusText = $('.woocommerce-product-attributes-item--attribute_pa_estado td')
                            .text()
                            .trim()
                            .toLowerCase();
                        status = '';
                        if (statusText.includes('en curso') || statusText.includes('ongoing')) {
                            status = novelStatus_1.NovelStatus.Ongoing;
                        }
                        else if (statusText.includes('completado') ||
                            statusText.includes('completed')) {
                            status = novelStatus_1.NovelStatus.Completed;
                        }
                        else {
                            status = novelStatus_1.NovelStatus.Unknown;
                        }
                        chapters = [];
                        chapterIndex = 0;
                        $('.vc_row div.vc_column-inner > div.wpb_wrapper').each(function (i, element) {
                            var $el = $(element);
                            var volume = $el.find('.dt-fancy-title').first().text().trim();
                            if (!volume.startsWith('Volumen')) {
                                return;
                            }
                            $el.find('.wpb_tab a').each(function (j, chapterEl) {
                                var _a;
                                var $chapter = $(chapterEl);
                                var chapterPartName = $chapter.text().trim();
                                var chapterPath = ((_a = $chapter.attr('href')) === null || _a === void 0 ? void 0 : _a.replace(_this.site, '')) || '';
                                if (!chapterPath)
                                    return;
                                var match = _this.CHAPTER_REGEX.exec(chapterPartName);
                                var chapterName;
                                if (match) {
                                    var part = match[1], chapter = match[2], name_1 = match[3];
                                    chapterName = "".concat(volume, " - ").concat(chapter, " - ").concat(part, ": ").concat(name_1);
                                }
                                else {
                                    chapterName = "".concat(volume, " - ").concat(chapterPartName);
                                }
                                chapters.push({
                                    name: chapterName,
                                    path: chapterPath,
                                    releaseTime: '',
                                    chapterNumber: chapterIndex + 1,
                                });
                                chapterIndex++;
                            });
                        });
                        novel = {
                            path: novelPath,
                            name: name,
                            cover: cover,
                            summary: summary,
                            author: author,
                            artist: artist,
                            status: status,
                            chapters: chapters,
                        };
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    // Método para obtener contenido del capítulo
    NovaPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, $chapterText, chapterContent, $clean;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site).concat(chapterPath);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        $ = cheerio.load(body);
                        if (body.includes('Nadie entra sin permiso en la Gran Tumba de Nazarick')) {
                            $chapterText = $('#content');
                        }
                        else {
                            $chapterText = $('.wpb_text_column.wpb_content_element > .wpb_wrapper');
                        }
                        // Remover anuncios y elementos no deseados
                        $chapterText.find('center').remove();
                        // Convertir elementos con text-align center a tags <center>
                        $chapterText.find('*').each(function (i, el) {
                            var $el = $(el);
                            var style = $el.attr('style') || '';
                            if (/text-align:.?center/.test(style)) {
                                $el.replaceWith("<center>".concat($el.html(), "</center>"));
                            }
                        });
                        return [4 /*yield*/, this.bypassCloudflareImages($, $chapterText)];
                    case 2:
                        chapterContent = _a.sent();
                        $clean = cheerio.load(chapterContent);
                        $clean('script, style, iframe, .ads, .advertisement').remove();
                        return [2 /*return*/, $clean.html() || chapterContent];
                }
            });
        });
    };
    return NovaPlugin;
}());
exports.default = new NovaPlugin();

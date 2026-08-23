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
var filterInputs_1 = require("@libs/filterInputs");
var novelStatus_1 = require("@libs/novelStatus");
var IndraTranslations = /** @class */ (function () {
    function IndraTranslations() {
        this.id = 'indratranslations';
        this.name = 'Indra Translations';
        this.site = 'https://indratranslations.com';
        this.version = '1.2.1';
        this.icon = 'src/en/indratranslations/icon.png';
        // customCSS = 'src/en/indratranslations/customCSS.css';
        // (optional) Add these files to the repo and uncomment the lines above if you want an icon/custom CSS.
        // Browser-like headers (important for Cloudflare-y sites)
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            Referer: this.site,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
        };
        this.filters = {
            sort: {
                label: 'Sort',
                value: 'Latest',
                options: [{ label: 'Latest', value: 'Latest' }],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    IndraTranslations.prototype.fetchHtml = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, { headers: this.headers })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IndraTranslations.prototype.absolute = function (url) {
        if (!url)
            return undefined;
        var u = String(url).trim();
        if (!u)
            return undefined;
        if (u.startsWith('http'))
            return u;
        if (u.startsWith('//'))
            return 'https:' + u;
        if (u.startsWith('/'))
            return this.site + u;
        return this.site + '/' + u;
    };
    IndraTranslations.prototype.clean = function (text) {
        return String(text !== null && text !== void 0 ? text : '')
            .replace(/\s+/g, ' ')
            .trim();
    };
    IndraTranslations.prototype.chapterNum = function (name) {
        var m = String(name).match(/(\d+(\.\d+)?)/);
        return m ? Number(m[1]) : 0;
    };
    /**
     * Indra can render results in different templates.
     * This tries multiple layouts and returns a single unified list.
     */
    IndraTranslations.prototype.parseNovelCards = function ($) {
        var _this = this;
        var out = [];
        var seen = new Set();
        var push = function (name, path, cover) {
            var cleanName = _this.clean(name);
            var cleanPath = String(path || '')
                .replace(_this.site, '')
                .trim();
            if (!cleanName || !cleanPath)
                return;
            if (!cleanPath.includes('/series/'))
                return;
            // Normalize trailing slash for consistency
            var normalized = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
            if (seen.has(normalized))
                return;
            seen.add(normalized);
            out.push({
                name: cleanName,
                path: normalized,
                cover: cover ? _this.absolute(cover) : undefined,
            });
        };
        // -------- Layout A (Madara-style): .page-item-detail ----------
        $('.page-item-detail').each(function (_, el) {
            var a = $(el).find('a[href*="/series/"]').first();
            var href = a.attr('href') || '';
            var title = _this.clean(a.attr('title')) ||
                _this.clean($(el).find('h3 a').text()) ||
                _this.clean($(el).find('.post-title a').text());
            var img = $(el).find('img').attr('data-src') ||
                $(el).find('img').attr('data-lazy-src') ||
                $(el).find('img').attr('src');
            if (href)
                push(title, href, img || undefined);
        });
        // -------- Layout B (common search tabs): .c-tabs-item__content ----------
        $('.c-tabs-item__content').each(function (_, el) {
            var _a, _b, _c;
            var a = $(el).find('a[href*="/series/"]').first() ||
                $(el).find('.tab-thumb a[href*="/series/"]').first();
            var href = ((_a = a.attr) === null || _a === void 0 ? void 0 : _a.call(a, 'href')) || '';
            var title = _this.clean($(el).find('.post-title a').text()) ||
                _this.clean($(el).find('.tab-summary .post-title a').text()) ||
                _this.clean((_b = a.attr) === null || _b === void 0 ? void 0 : _b.call(a, 'title')) ||
                _this.clean((_c = a.text) === null || _c === void 0 ? void 0 : _c.call(a));
            var img = $(el).find('img').attr('data-src') ||
                $(el).find('img').attr('data-lazy-src') ||
                $(el).find('img').attr('src');
            if (href)
                push(title, href, img || undefined);
        });
        // -------- Layout C (sometimes search results are in .row or .col wrappers) ----------
        $('.row').each(function (_, el) {
            var a = $(el).find('a[href*="/series/"]').first();
            var href = a.attr('href') || '';
            if (!href)
                return;
            var title = _this.clean($(el).find('h3 a').text()) ||
                _this.clean($(el).find('.post-title a').text()) ||
                _this.clean(a.attr('title')) ||
                _this.clean(a.text());
            var img = $(el).find('img').attr('data-src') ||
                $(el).find('img').attr('data-lazy-src') ||
                $(el).find('img').attr('src');
            push(title, href, img || undefined);
        });
        // -------- Layout D (fallback: any anchor to /series/) ----------
        // If everything else fails but links exist, still return something.
        if (out.length === 0) {
            $('a[href*="/series/"]').each(function (_, el) {
                var a = $(el);
                var href = a.attr('href') || '';
                if (!href)
                    return;
                var title = _this.clean(a.attr('title')) || _this.clean(a.text()) || 'Unknown';
                // Try to find an image near the link
                var img = a.find('img').attr('data-src') ||
                    a.find('img').attr('data-lazy-src') ||
                    a.find('img').attr('src') ||
                    a.closest('*').find('img').first().attr('data-src') ||
                    a.closest('*').find('img').first().attr('data-lazy-src') ||
                    a.closest('*').find('img').first().attr('src');
                push(title, href, img || undefined);
            });
        }
        return out;
    };
    IndraTranslations.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var html, $, parsed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (pageNo !== 1)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.fetchHtml("".concat(this.site, "/series/"))];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        parsed = this.parseNovelCards($);
                        return [2 /*return*/, parsed.map(function (n) { return ({
                                name: n.name,
                                path: n.path,
                                cover: n.cover,
                            }); })];
                }
            });
        });
    };
    IndraTranslations.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (pageNo !== 1)
                            return [2 /*return*/, []];
                        url = "".concat(this.site, "/?s=").concat(encodeURIComponent(searchTerm), "&post_type=wp-manga");
                        return [4 /*yield*/, this.fetchHtml(url)];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        return [2 /*return*/, this.parseNovelCards($)];
                }
            });
        });
    };
    IndraTranslations.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, title, cover, summary, statusText, chapters, statusLower, status;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = novelPath.startsWith('http')
                            ? novelPath
                            : this.site + novelPath;
                        return [4 /*yield*/, this.fetchHtml(url)];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        title = this.clean($('h1.entry-title').text()) ||
                            this.clean($('h1').first().text()) ||
                            'Unknown';
                        cover = this.absolute($('.summary_image img').attr('data-src') ||
                            $('.summary_image img').attr('data-lazy-src') ||
                            $('.summary_image img').attr('src'));
                        summary = this.clean($('.summary__content').text()) ||
                            this.clean($('.description-summary').text()) ||
                            undefined;
                        statusText = '';
                        $('.post-content_item').each(function (_, el) {
                            var label = _this.clean($(el).find('.summary-heading').text()).toLowerCase();
                            if (label.includes('status')) {
                                statusText = _this.clean($(el).find('.summary-content').text());
                            }
                        });
                        chapters = [];
                        $('li.wp-manga-chapter a').each(function (_, el) {
                            var href = $(el).attr('href');
                            if (!href)
                                return;
                            var name = _this.clean($(el).text());
                            chapters.push({
                                name: name,
                                path: href.replace(_this.site, ''),
                                chapterNumber: _this.chapterNum(name),
                            });
                        });
                        if (chapters.length === 0) {
                            $('.wp-manga-chapter a').each(function (_, el) {
                                var href = $(el).attr('href');
                                if (!href)
                                    return;
                                var name = _this.clean($(el).text());
                                chapters.push({
                                    name: name,
                                    path: href.replace(_this.site, ''),
                                    chapterNumber: _this.chapterNum(name),
                                });
                            });
                        }
                        chapters.sort(function (a, b) { var _a, _b; return ((_a = a.chapterNumber) !== null && _a !== void 0 ? _a : 0) - ((_b = b.chapterNumber) !== null && _b !== void 0 ? _b : 0); });
                        statusLower = String(statusText).toLowerCase();
                        status = statusLower.includes('complete') || statusLower.includes('completed')
                            ? novelStatus_1.NovelStatus.Completed
                            : novelStatus_1.NovelStatus.Ongoing;
                        return [2 /*return*/, {
                                name: title,
                                path: novelPath.endsWith('/') ? novelPath : novelPath + '/',
                                cover: cover,
                                summary: summary,
                                status: status,
                                chapters: chapters,
                            }];
                }
            });
        });
    };
    IndraTranslations.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, content;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = chapterPath.startsWith('http')
                            ? chapterPath
                            : this.site + chapterPath;
                        return [4 /*yield*/, this.fetchHtml(url)];
                    case 1:
                        html = _b.sent();
                        $ = (0, cheerio_1.load)(html);
                        content = $('.reading-content').first().length
                            ? $('.reading-content').first()
                            : $('.text-left').first().length
                                ? $('.text-left').first()
                                : $('.entry-content').first();
                        if (!content.length) {
                            return [2 /*return*/, "\nUnable to load chapter content.\n\n"];
                        }
                        content.find('script, style, ins, iframe, noscript').remove();
                        return [2 /*return*/, (_a = content.html()) !== null && _a !== void 0 ? _a : ''];
                }
            });
        });
    };
    return IndraTranslations;
}());
exports.default = new IndraTranslations();

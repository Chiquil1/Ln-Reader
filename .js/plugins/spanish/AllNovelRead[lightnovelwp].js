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
exports.LightNovelWPPlugin = void 0;
var cheerio_1 = require("cheerio");
var htmlparser2_1 = require("htmlparser2");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var defaultCover_1 = require("@libs/defaultCover");
var storage_1 = require("@libs/storage");
var LightNovelWPPlugin = /** @class */ (function () {
    function LightNovelWPPlugin(metadata) {
        var _a, _b, _c;
        this.hideLocked = storage_1.storage.get('hideLocked');
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/lightnovelwp/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        var versionIncrements = ((_a = metadata.options) === null || _a === void 0 ? void 0 : _a.versionIncrements) || 0;
        this.version = "1.1.".concat(10 + versionIncrements);
        this.options = (_b = metadata.options) !== null && _b !== void 0 ? _b : {};
        this.filters = metadata.filters;
        if ((_c = this.options) === null || _c === void 0 ? void 0 : _c.hasLocked) {
            this.pluginSettings = {
                hideLocked: {
                    value: '',
                    label: 'Hide locked chapters',
                    type: 'Switch',
                },
            };
        }
    }
    LightNovelWPPlugin.prototype.getHostname = function (url) {
        url = url.split('/')[2];
        var url_parts = url.split('.');
        url_parts.pop(); // remove TLD
        return url_parts.join('.');
    };
    LightNovelWPPlugin.prototype.safeFecth = function (url, search) {
        return __awaiter(this, void 0, void 0, function () {
            var urlParts, protocol, sanitizedUri, r, data, title;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        urlParts = url.split('://');
                        protocol = urlParts.shift();
                        sanitizedUri = urlParts[0].replace(/\/\//g, '/');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(protocol + '://' + sanitizedUri)];
                    case 1:
                        r = _c.sent();
                        if (!r.ok && search != true)
                            throw new Error('Could not reach site (' + r.status + ') try to open in webview.');
                        return [4 /*yield*/, r.text()];
                    case 2:
                        data = _c.sent();
                        title = (_b = (_a = data.match(/<title>(.*?)<\/title>/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim();
                        if (this.getHostname(url) != this.getHostname(r.url) ||
                            (title &&
                                (title == 'Bot Verification' ||
                                    title == 'You are being redirected...' ||
                                    title == 'Un instant...' ||
                                    title == 'Just a moment...' ||
                                    title == 'Redirecting...')))
                            throw new Error('Captcha error, please open in webview (or the website has changed url)');
                        return [2 /*return*/, data];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseNovels = function (html) {
        var _this = this;
        html = (0, cheerio_1.load)(html).html(); // fix "'" beeing replaced by "&#8217;" (html entities)
        var novels = [];
        var articles = html.match(/<article([^]*?)<\/article>/g) || [];
        articles.forEach(function (article) {
            var _a = article.match(/<a href="([^"]*)".*? title="([^"]*)"/) || [], novelUrl = _a[1], novelName = _a[2];
            if (novelName && novelUrl) {
                var novelCover = article.match(/<img [^>]*?src="([^"]*)"[^>]*?(?: data-src="([^"]*)")?[^>]*>/) || [];
                var novelPath = void 0;
                if (novelUrl.includes(_this.site)) {
                    novelPath = novelUrl.replace(_this.site, '');
                }
                else {
                    // TODO: report website new url to server
                    var novelParts = novelUrl.split('/');
                    novelParts.shift();
                    novelParts.shift();
                    novelParts.shift();
                    novelPath = novelParts.join('/');
                }
                novels.push({
                    name: novelName,
                    cover: novelCover[2] || novelCover[1] || defaultCover_1.defaultCover,
                    path: novelPath,
                });
            }
        });
        return novels;
    };
    LightNovelWPPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var seriesPath, url, key, _i, _c, value, html;
            var _d, _e;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        seriesPath = (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.seriesPath) !== null && _e !== void 0 ? _e : '/series/';
                        url = this.site + seriesPath + '?page=' + pageNo;
                        if (!filters)
                            filters = this.filters || {};
                        if (showLatestNovels)
                            url += '&order=latest';
                        for (key in filters) {
                            if (typeof filters[key].value === 'object')
                                for (_i = 0, _c = filters[key].value; _i < _c.length; _i++) {
                                    value = _c[_i];
                                    url += "&".concat(key, "=").concat(value);
                                }
                            else if (filters[key].value)
                                url += "&".concat(key, "=").concat(filters[key].value);
                        }
                        return [4 /*yield*/, this.safeFecth(url, false)];
                    case 1:
                        html = _f.sent();
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var baseURL, html, novel, isParsingGenres, isReadingGenre, isReadingSummary, isParsingInfo, isReadingInfo, isReadingAuthor, isReadingArtist, isReadingStatus, isParsingChapterList, isReadingChapter, isReadingChapterInfo, isPaidChapter, hasLockItemOnChapterNum, chapters, tempChapter, hideLocked, parser;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        baseURL = this.site;
                        return [4 /*yield*/, this.safeFecth(baseURL + novelPath, false)];
                    case 1:
                        html = _b.sent();
                        novel = {
                            path: novelPath,
                            name: '',
                            genres: '',
                            summary: '',
                            author: '',
                            artist: '',
                            status: '',
                            chapters: [],
                        };
                        isParsingGenres = false;
                        isReadingGenre = false;
                        isReadingSummary = 0;
                        isParsingInfo = false;
                        isReadingInfo = false;
                        isReadingAuthor = false;
                        isReadingArtist = false;
                        isReadingStatus = false;
                        isParsingChapterList = false;
                        isReadingChapter = false;
                        isReadingChapterInfo = 0;
                        isPaidChapter = false;
                        hasLockItemOnChapterNum = false;
                        chapters = [];
                        tempChapter = {};
                        hideLocked = this.hideLocked;
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var _a;
                                // name and cover
                                if (!novel.cover && ((_a = attribs['class']) === null || _a === void 0 ? void 0 : _a.includes('ts-post-image'))) {
                                    novel.name = attribs['title'];
                                    novel.cover = attribs['data-src'] || attribs['src'] || defaultCover_1.defaultCover;
                                } // genres
                                else if (attribs['class'] === 'genxed' ||
                                    attribs['class'] === 'sertogenre') {
                                    isParsingGenres = true;
                                }
                                else if (isParsingGenres && name === 'a') {
                                    isReadingGenre = true;
                                } // summary
                                else if (name === 'div' &&
                                    (attribs['class'] === 'entry-content' ||
                                        attribs['itemprop'] === 'description')) {
                                    isReadingSummary++;
                                } // author and status
                                else if (attribs['class'] === 'spe' || attribs['class'] === 'serl') {
                                    isParsingInfo = true;
                                }
                                else if (isParsingInfo && name === 'span') {
                                    isReadingInfo = true;
                                }
                                else if (name === 'div' && attribs['class'] === 'sertostat') {
                                    isParsingInfo = true;
                                    isReadingInfo = true;
                                    isReadingStatus = true;
                                }
                                // chapters
                                else if (attribs['class'] && attribs['class'].includes('eplister')) {
                                    isParsingChapterList = true;
                                }
                                else if (isParsingChapterList && name === 'li') {
                                    isReadingChapter = true;
                                }
                                else if (isReadingChapter) {
                                    if (name === 'a' && tempChapter.path === undefined) {
                                        tempChapter.path = attribs['href'].replace(baseURL, '').trim();
                                    }
                                    else if (attribs['class'] === 'epl-num') {
                                        isReadingChapterInfo = 1;
                                    }
                                    else if (attribs['class'] === 'epl-title') {
                                        isReadingChapterInfo = 2;
                                    }
                                    else if (attribs['class'] === 'epl-date') {
                                        isReadingChapterInfo = 3;
                                    }
                                    else if (attribs['class'] === 'epl-price') {
                                        isReadingChapterInfo = 4;
                                    }
                                }
                                else if (isReadingSummary && (name === 'div' || name === 'script')) {
                                    isReadingSummary++;
                                }
                            },
                            ontext: function (data) {
                                var _a, _b;
                                // genres
                                if (isParsingGenres) {
                                    if (isReadingGenre) {
                                        novel.genres += data + ', ';
                                    }
                                } // summary
                                else if (isReadingSummary === 1 && data.trim()) {
                                    novel.summary += data;
                                } // author and status
                                else if (isParsingInfo) {
                                    if (isReadingInfo) {
                                        var detailName = data.toLowerCase().replace(':', '').trim();
                                        if (isReadingAuthor) {
                                            novel.author += data || 'Unknown';
                                        }
                                        else if (isReadingArtist) {
                                            novel.artist += data || 'Unknown';
                                        }
                                        else if (isReadingStatus) {
                                            switch (detailName) {
                                                case 'مكتملة':
                                                case 'completed':
                                                case 'complété':
                                                case 'completo':
                                                case 'completado':
                                                case 'tamamlandı':
                                                    novel.status = novelStatus_1.NovelStatus.Completed;
                                                    break;
                                                case 'مستمرة':
                                                case 'ongoing':
                                                case 'en cours':
                                                case 'em andamento':
                                                case 'en progreso':
                                                case 'devam ediyor':
                                                    novel.status = novelStatus_1.NovelStatus.Ongoing;
                                                    break;
                                                case 'متوقفة':
                                                case 'hiatus':
                                                case 'en pause':
                                                case 'hiato':
                                                case 'pausa':
                                                case 'pausado':
                                                case 'duraklatıldı':
                                                    novel.status = novelStatus_1.NovelStatus.OnHiatus;
                                                    break;
                                                default:
                                                    novel.status = novelStatus_1.NovelStatus.Unknown;
                                                    break;
                                            }
                                        }
                                        switch (detailName) {
                                            case 'الكاتب':
                                            case 'author':
                                            case 'auteur':
                                            case 'autor':
                                            case 'yazar':
                                                isReadingAuthor = true;
                                                break;
                                            case 'الحالة':
                                            case 'status':
                                            case 'statut':
                                            case 'estado':
                                            case 'durum':
                                                isReadingStatus = true;
                                                break;
                                            case 'الفنان':
                                            case 'artist':
                                            case 'artiste':
                                            case 'artista':
                                            case 'çizer':
                                                isReadingArtist = true;
                                                break;
                                        }
                                    }
                                } // chapters
                                else if (isParsingChapterList) {
                                    if (isReadingChapter) {
                                        if (isReadingChapterInfo === 1) {
                                            if (data.includes('🔒')) {
                                                isPaidChapter = true;
                                                hasLockItemOnChapterNum = true;
                                            }
                                            else if (hasLockItemOnChapterNum) {
                                                isPaidChapter = false;
                                            }
                                            extractChapterNumber(data, tempChapter);
                                        }
                                        else if (isReadingChapterInfo === 2) {
                                            tempChapter.name =
                                                ((_b = (_a = data
                                                    .match(RegExp("^".concat(novel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "\\s*(.+)")))) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || data.trim();
                                            if (!tempChapter.chapterNumber) {
                                                extractChapterNumber(data, tempChapter);
                                            }
                                        }
                                        else if (isReadingChapterInfo === 3) {
                                            tempChapter.releaseTime = data; //new Date(data).toISOString();
                                        }
                                        else if (isReadingChapterInfo === 4) {
                                            var detailName = data.toLowerCase().trim();
                                            switch (detailName) {
                                                case 'free':
                                                case 'gratuit':
                                                case 'مجاني':
                                                case 'livre':
                                                case '':
                                                    isPaidChapter = false;
                                                    break;
                                                default:
                                                    isPaidChapter = true;
                                                    break;
                                            }
                                        }
                                    }
                                }
                            },
                            onclosetag: function (name) {
                                var _a, _b, _c;
                                // genres
                                if (isParsingGenres) {
                                    if (isReadingGenre) {
                                        isReadingGenre = false; // stop reading genre
                                    }
                                    else {
                                        isParsingGenres = false; // stop parsing genres
                                        novel.genres = (_a = novel.genres) === null || _a === void 0 ? void 0 : _a.slice(0, -2); // remove trailing comma
                                    }
                                } // summary
                                else if (isReadingSummary) {
                                    if (name === 'p') {
                                        novel.summary += '\n\n';
                                    }
                                    else if (name === 'br') {
                                        novel.summary += '\n';
                                    }
                                    else if (name === 'div' || name === 'script') {
                                        isReadingSummary--;
                                    }
                                } // author and status
                                else if (isParsingInfo) {
                                    if (isReadingInfo) {
                                        if (name === 'span') {
                                            isReadingInfo = false;
                                            if (isReadingAuthor && novel.author) {
                                                isReadingAuthor = false;
                                            }
                                            else if (isReadingArtist && novel.artist) {
                                                isReadingArtist = false;
                                            }
                                            else if (isReadingStatus && novel.status !== '') {
                                                isReadingStatus = false;
                                            }
                                        }
                                    }
                                    else if (name === 'div') {
                                        isParsingInfo = false;
                                        novel.author = (_b = novel.author) === null || _b === void 0 ? void 0 : _b.trim();
                                        novel.artist = (_c = novel.artist) === null || _c === void 0 ? void 0 : _c.trim();
                                    }
                                } // chapters
                                else if (isParsingChapterList) {
                                    if (isReadingChapter) {
                                        if (isReadingChapterInfo === 1) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 2) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 3) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 4) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (name === 'li') {
                                            isReadingChapter = false;
                                            if (!tempChapter.chapterNumber)
                                                tempChapter.chapterNumber = 0;
                                            if (isPaidChapter)
                                                tempChapter.name = '🔒 ' + tempChapter.name;
                                            if (!hideLocked || !isPaidChapter)
                                                chapters.push(tempChapter);
                                            tempChapter = {};
                                        }
                                    }
                                    else if (name === 'ul') {
                                        isParsingChapterList = false;
                                    }
                                }
                            },
                        });
                        parser.write(html);
                        parser.end();
                        if (chapters.length) {
                            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.reverseChapters)
                                chapters.reverse();
                            novel.chapters = chapters;
                        }
                        novel.summary = novel.summary.trim();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data, $;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.safeFecth(this.site + chapterPath, false)];
                    case 1:
                        data = _d.sent();
                        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.customJs) {
                            try {
                                $ = (0, cheerio_1.load)(data);
                                data = $.html();
                            }
                            catch (error) {
                                console.error('Error executing customJs:', error);
                                throw error;
                            }
                        }
                        return [2 /*return*/, (((_c = (_b = data
                                .match(/<div.*?class="epcontent ([^]*?)<div.*?class="?bottomnav/g)) === null || _b === void 0 ? void 0 : _b[0].match(/<p[^>]*>([^]*?)<\/p>/g)) === null || _c === void 0 ? void 0 : _c.join('\n')) || '')];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + 'page/' + page + '/?s=' + encodeURIComponent(searchTerm);
                        return [4 /*yield*/, this.safeFecth(url, true)];
                    case 1:
                        html = _a.sent();
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    return LightNovelWPPlugin;
}());
exports.LightNovelWPPlugin = LightNovelWPPlugin;
function extractChapterNumber(data, tempChapter) {
    var tempChapterNumber = data.match(/(\d+)$/);
    if (tempChapterNumber && tempChapterNumber[0]) {
        tempChapter.chapterNumber = parseInt(tempChapterNumber[0]);
    }
}
var plugin = new LightNovelWPPlugin({ "id": "allnovelread", "sourceSite": "https://allnovelread.com/", "sourceName": "AllNovelRead", "options": { "lang": "Spanish", "reverseChapters": true, "down": true, "downSince": 1768289212954 }, "filters": { "genre[]": { "type": "Checkbox", "label": "Genre", "value": [], "options": [{ "label": "16+", "value": "16" }, { "label": "Abogado/Abogada", "value": "abogado-abogada" }, { "label": "Action", "value": "action" }, { "label": "Advogdo", "value": "advogdo" }, { "label": "affair of the heart", "value": "affair-of-the-heart" }, { "label": "alfa", "value": "alfa" }, { "label": "Alpha", "value": "alpha" }, { "label": "Amable", "value": "amable" }, { "label": "Amar", "value": "amar" }, { "label": "Amor", "value": "amor" }, { "label": "Amor caliente", "value": "amor-caliente" }, { "label": "amor depois do casamento", "value": "amor-depois-do-casamento" }, { "label": "Amor después del matrimonio", "value": "amor-despues-del-matrimonio" }, { "label": "Amor destinado", "value": "amor-destinado" }, { "label": "Amor doloroso", "value": "amor-doloroso" }, { "label": "Amor dulce", "value": "amor-dulce" }, { "label": "Amor e ódio", "value": "amor-e-odio" }, { "label": "Amor e ódio Gravidez", "value": "amor-e-odio-gravidez" }, { "label": "amor entre ex", "value": "amor-entre-ex" }, { "label": "Amor forzado", "value": "amor-forzado" }, { "label": "Amor Inocente", "value": "amor-inocente" }, { "label": "amor predestinado", "value": "amor-predestinado" }, { "label": "Amor y odio", "value": "amor-y-odio" }, { "label": "arrepentirse del divorcio", "value": "arrepentirse-del-divorcio" }, { "label": "Arrepentirse Después de Herir a Su Mujer", "value": "arrepentirse-despues-de-herir-a-su-mujer" }, { "label": "Arrogante", "value": "arrogante" }, { "label": "Asesinato", "value": "asesinato" }, { "label": "Babby", "value": "babby" }, { "label": "BABY", "value": "baby" }, { "label": "Beauty", "value": "beauty" }, { "label": "Bebê fofo", "value": "bebe-fofo" }, { "label": "Bebé inteligente", "value": "bebe-inteligente" }, { "label": "belleza", "value": "belleza" }, { "label": "Belleza inusual", "value": "belleza-inusual" }, { "label": "Bilionário", "value": "bilionario" }, { "label": "Billionair", "value": "billionair" }, { "label": "billionaire", "value": "billionaire" }, { "label": "Billonario/Billonaria", "value": "billonario-billonaria" }, { "label": "brilliant", "value": "brilliant" }, { "label": "bxg", "value": "bxg" }, { "label": "Bxg-novela", "value": "bxg-novela" }, { "label": "Campus", "value": "campus" }, { "label": "Casamiento", "value": "casamiento" }, { "label": "CEO", "value": "ceo" }, { "label": "city", "value": "city" }, { "label": "Colegiala", "value": "colegiala" }, { "label": "Comedia", "value": "comedia" }, { "label": "Comedia-novela", "value": "comedia-novela" }, { "label": "Comedy", "value": "comedy" }, { "label": "contemporáneo", "value": "contemporaneo" }, { "label": "Contract marriage", "value": "contract-marriage" }, { "label": "cónyuge", "value": "conyuge" }, { "label": "Corazón roto", "value": "corazon-roto" }, { "label": "courtship", "value": "courtship" }, { "label": "Crecimiento del personaje", "value": "crecimiento-del-personaje" }, { "label": "Crimen organizado", "value": "crimen-organizado" }, { "label": "Critical", "value": "critical" }, { "label": "cruel", "value": "cruel" }, { "label": "De pobre a rico", "value": "de-pobre-a-rico" }, { "label": "Divertido", "value": "divertido" }, { "label": "Divorce", "value": "divorce" }, { "label": "Divorcio", "value": "divorcio" }, { "label": "Doce", "value": "doce" }, { "label": "Doctor", "value": "doctor" }, { "label": "Dominador", "value": "dominador" }, { "label": "Dominante", "value": "dominante" }, { "label": "Dominante-novela", "value": "dominante-novela" }, { "label": "drama", "value": "drama" }, { "label": "dulce", "value": "dulce" }, { "label": "Dulce Embarazada", "value": "dulce-embarazada" }, { "label": "elegante", "value": "elegante" }, { "label": "Embarazada", "value": "embarazada" }, { "label": "En la actualidad", "value": "en-la-actualidad" }, { "label": "Enemigos a los amantes", "value": "enemigos-a-los-amantes" }, { "label": "existente", "value": "existente" }, { "label": "Family", "value": "family" }, { "label": "Fantasy", "value": "fantasy" }, { "label": "Fated", "value": "fated" }, { "label": "Fraco para forte/Pob", "value": "fraco-para-forte-pob" }, { "label": "fuerte", "value": "fuerte" }, { "label": "Goodgirl", "value": "goodgirl" }, { "label": "Gravidez", "value": "gravidez" }, { "label": "HE", "value": "he" }, { "label": "heir/heiress", "value": "heir-heiress" }, { "label": "hermoso", "value": "hermoso" }, { "label": "Héroe pateador", "value": "heroe-pateador" }, { "label": "Heroina", "value": "heroina" }, { "label": "heroína Kickass", "value": "heroina-kickass" }, { "label": "heterose*ual", "value": "heteroseual" }, { "label": "historia de amor", "value": "historia-de-amor" }, { "label": "Hot Romance", "value": "hot-romance" }, { "label": "Humor", "value": "humor" }, { "label": "Identidad secreta", "value": "identidad-secreta" }, { "label": "Independente", "value": "independente" }, { "label": "Independiente", "value": "independiente" }, { "label": "Inocente", "value": "inocente" }, { "label": "jefe", "value": "jefe" }, { "label": "Jefe / CEO", "value": "jefe-ceo" }, { "label": "kicking", "value": "kicking" }, { "label": "king", "value": "king" }, { "label": "legend", "value": "legend" }, { "label": "Literature", "value": "literature" }, { "label": "loser", "value": "loser" }, { "label": "Love", "value": "love" }, { "label": "Love & Culture", "value": "love-culture" }, { "label": "love after marriage", "value": "love-after-marriage" }, { "label": "love story", "value": "love-story" }, { "label": "LOVEAFTERMARRIAGE", "value": "loveaftermarriage" }, { "label": "lucky dog", "value": "lucky-dog" }, { "label": "Lugar para você Allnovelread", "value": "lugar-para-voce-allnovelread" }, { "label": "luna", "value": "luna" }, { "label": "Madre soltera", "value": "madre-soltera" }, { "label": "Mafia", "value": "mafia" }, { "label": "magical world", "value": "magical-world" }, { "label": "Malentendido", "value": "malentendido" }, { "label": "Maquinación", "value": "maquinacion" }, { "label": "Marriage", "value": "marriage" }, { "label": "Matrimonio", "value": "matrimonio" }, { "label": "Matrimonio por Contrato", "value": "matrimonio-por-contrato" }, { "label": "Matrimonio relámpago", "value": "matrimonio-relampago" }, { "label": "Medico", "value": "medico" }, { "label": "Médico/Médica", "value": "medico-medica" }, { "label": "millonaria", "value": "millonaria" }, { "label": "modificación", "value": "modificacion" }, { "label": "most millions", "value": "most-millions" }, { "label": "Mucama", "value": "mucama" }, { "label": "Mujer súper poderosa", "value": "mujer-super-poderosa" }, { "label": "Multi-Millionairo", "value": "multi-millionairo" }, { "label": "Multimillionairo", "value": "multimillionairo" }, { "label": "Multimillonaria", "value": "multimillonaria" }, { "label": "multimillonario", "value": "multimillonario" }, { "label": "Multimillonario-novela", "value": "multimillonario-novela" }, { "label": "MULTIPLEIDENTITIES", "value": "multipleidentities" }, { "label": "Múltiples identidades", "value": "multiples-identidades" }, { "label": "musculoso", "value": "musculoso" }, { "label": "Nacimiento múltiple", "value": "nacimiento-multiple" }, { "label": "Novia embarazada a la fuga", "value": "novia-embarazada-a-la-fuga" }, { "label": "Obsesión", "value": "obsesion" }, { "label": "Ocultar", "value": "ocultar" }, { "label": "Optimista", "value": "optimista" }, { "label": "others", "value": "others" }, { "label": "Pasión de una noche", "value": "pasion-de-una-noche" }, { "label": "Perao/Segunda chance", "value": "perao-segunda-chance" }, { "label": "Perdedor", "value": "perdedor" }, { "label": "Playboy", "value": "playboy" }, { "label": "poderoso", "value": "poderoso" }, { "label": "polygamy", "value": "polygamy" }, { "label": "Posesivo", "value": "posesivo" }, { "label": "possessive", "value": "possessive" }, { "label": "Possessivo", "value": "possessivo" }, { "label": "Powerful", "value": "powerful" }, { "label": "presente", "value": "presente" }, { "label": "Presidente", "value": "presidente" }, { "label": "princess", "value": "princess" }, { "label": "Protective", "value": "protective" }, { "label": "Protectormadre soltera", "value": "protectormadre-soltera" }, { "label": "Reconquistar a mi pareja", "value": "reconquistar-a-mi-pareja" }, { "label": "rejected", "value": "rejected" }, { "label": "relación", "value": "relacion" }, { "label": "relationship", "value": "relationship" }, { "label": "Renacido", "value": "renacido" }, { "label": "Rey/Reina", "value": "rey-reina" }, { "label": "Rich", "value": "rich" }, { "label": "Rico", "value": "rico" }, { "label": "Ricos", "value": "ricos" }, { "label": "Romance", "value": "romance" }, { "label": "romance caliente", "value": "romance-caliente" }, { "label": "Romance/Romântico", "value": "romance-romantico" }, { "label": "Romántic", "value": "romantic" }, { "label": "Romantica", "value": "romantica" }, { "label": "Romanticas", "value": "romanticas" }, { "label": "Romantico", "value": "romantico" }, { "label": "Secretos", "value": "secretos" }, { "label": "secrets", "value": "secrets" }, { "label": "seductive", "value": "seductive" }, { "label": "Segunda Chance", "value": "segunda-chance" }, { "label": "Segunda oportunidad", "value": "segunda-oportunidad" }, { "label": "STRONGFEMALELEAD", "value": "strongfemalelead" }, { "label": "Subrogación", "value": "subrogacion" }, { "label": "Suspense", "value": "suspense" }, { "label": "Sweet", "value": "sweet" }, { "label": "SWEETLOVE", "value": "sweetlove" }, { "label": "Teenager", "value": "teenager" }, { "label": "Tierno", "value": "tierno" }, { "label": "Tragedia", "value": "tragedia" }, { "label": "Traición", "value": "traicion" }, { "label": "TraiciónReconquistar a mi pareja", "value": "traicionreconquistar-a-mi-pareja" }, { "label": "Triángulo amoroso", "value": "triangulo-amoroso" }, { "label": "Trillizos", "value": "trillizos" }, { "label": "Trio", "value": "trio" }, { "label": "Una noche de pasion", "value": "una-noche-de-pasion" }, { "label": "Universidad", "value": "universidad" }, { "label": "Valente", "value": "valente" }, { "label": "Valiente", "value": "valiente" }, { "label": "Venanza", "value": "venanza" }, { "label": "Werewolf", "value": "werewolf" }, { "label": "Ya", "value": "ya" }, { "label": "Youth", "value": "youth" }] }, "type[]": { "type": "Checkbox", "label": "Type", "value": [], "options": [{ "label": "16+", "value": "16" }, { "label": "alfa", "value": "alfa" }, { "label": "Allnovelread Sin vuelta atrás", "value": "allnovelread-sin-vuelta-atras" }, { "label": "Alpha", "value": "alpha" }, { "label": "Amor dulce", "value": "amor-dulce" }, { "label": "Amor y odio", "value": "amor-y-odio" }, { "label": "Arrogante-novela", "value": "arrogante-novela" }, { "label": "Billionaire", "value": "billionaire" }, { "label": "Billonario", "value": "billonario" }, { "label": "bxg", "value": "bxg" }, { "label": "CEO", "value": "ceo" }, { "label": "Contemporâneo", "value": "contemporaneo" }, { "label": "Contract marriage", "value": "contract-marriage" }, { "label": "crecimiento-del-personaje-novela", "value": "crecimiento-del-personaje-novela" }, { "label": "Divorce", "value": "divorce" }, { "label": "drama", "value": "drama" }, { "label": "dulce", "value": "dulce" }, { "label": "El incesante acoso de mi ex marido", "value": "el-incesante-acoso-de-mi-ex-marido" }, { "label": "Enganar al mejor amigo de mi novio", "value": "enganar-al-mejor-amigo-de-mi-novio" }, { "label": "Fantasy", "value": "fantasy" }, { "label": "HE", "value": "he" }, { "label": "heterosexual", "value": "heterosexual" }, { "label": "Historia-triste-novela", "value": "historia-triste-novela" }, { "label": "Hombre lobo", "value": "hombre-lobo" }, { "label": "Hot Romance", "value": "hot-romance" }, { "label": "Independiente", "value": "independiente" }, { "label": "Inocente", "value": "inocente" }, { "label": "king", "value": "king" }, { "label": "Love", "value": "love" }, { "label": "love after marriage", "value": "love-after-marriage" }, { "label": "Luna", "value": "luna" }, { "label": "Magical world", "value": "magical-world" }, { "label": "millonaria", "value": "millonaria" }, { "label": "Multi-Millionaire", "value": "multi-millionaire" }, { "label": "Multimillionairo", "value": "multimillionairo" }, { "label": "Multimillonario", "value": "multimillonario" }, { "label": "Nunca Longe Allnovelread", "value": "nunca-longe-allnovelread" }, { "label": "Posesivo", "value": "posesivo" }, { "label": "Querida ex esposa", "value": "querida-ex-esposa" }, { "label": "Romance", "value": "romance" }, { "label": "Romane", "value": "romane" }, { "label": "Romántica", "value": "romantica" }, { "label": "Romanticas", "value": "romanticas" }, { "label": "Romantico", "value": "romantico" }, { "label": "Sweet", "value": "sweet" }, { "label": "SWEETLOVE", "value": "sweetlove" }, { "label": "Te Quero de Volta Allnovelread", "value": "te-quero-de-volta-allnovelread" }, { "label": "Traicion en altar", "value": "traicion-en-altar" }, { "label": "Uma Ferida Que Nunca Se Cura Allnovelread", "value": "uma-ferida-que-nunca-se-cura-allnovelread" }, { "label": "Urban", "value": "urban" }, { "label": "Urban/Realistic", "value": "urban-realistic" }, { "label": "vuelva a mí", "value": "vuelva-a-mi" }, { "label": "Werewolf", "value": "werewolf" }] }, "status": { "type": "Picker", "label": "Status", "value": "", "options": [{ "label": "All", "value": "" }, { "label": "Ongoing", "value": "ongoing" }, { "label": "Hiatus", "value": "hiatus" }, { "label": "Completed", "value": "completed" }] }, "order": { "type": "Picker", "label": "Order by", "value": "", "options": [{ "label": "Default", "value": "" }, { "label": "A-Z", "value": "title" }, { "label": "Z-A", "value": "titlereverse" }, { "label": "Latest Update", "value": "update" }, { "label": "Latest Added", "value": "latest" }, { "label": "Popular", "value": "popular" }] } } });
exports.default = plugin;

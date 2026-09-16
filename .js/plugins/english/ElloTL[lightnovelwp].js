"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var plugin = new LightNovelWPPlugin({ "id": "ellotl", "sourceSite": "https://ellotl.com/", "sourceName": "ElloTL", "options": { "versionIncrements": 50, "lang": "English", "reverseChapters": true, "down": true, "downSince": 1768289212947 }, "filters": { "genre[]": { "type": "Checkbox", "label": "Genre", "value": [], "options": [{ "label": "Action", "value": "action" }, { "label": "Adult", "value": "adult" }, { "label": "Adventure", "value": "adventure" }, { "label": "Comedy", "value": "comedy" }, { "label": "Drama", "value": "drama" }, { "label": "Ecchi", "value": "ecchi" }, { "label": "Fantasy", "value": "fantasy" }, { "label": "Gender Bender", "value": "gender-bender" }, { "label": "Harem", "value": "harem" }, { "label": "Hunter", "value": "hunter" }, { "label": "Martial Arts", "value": "martial-arts" }, { "label": "Mature", "value": "mature" }, { "label": "Modern Fantasy", "value": "modern-fantasy" }, { "label": "Mystery", "value": "mystery" }, { "label": "Psychological", "value": "psychological" }, { "label": "Romance", "value": "romance" }, { "label": "School Life", "value": "school-life" }, { "label": "Seinen", "value": "seinen" }, { "label": "Shounen", "value": "shounen" }, { "label": "Slice of Life", "value": "slice-of-life" }, { "label": "Supernatural", "value": "supernatural" }, { "label": "Tragedy", "value": "tragedy" }] }, "type[]": { "type": "Checkbox", "label": "Type", "value": [], "options": [{ "label": "Fantasy", "value": "fantasy" }, { "label": "Genius", "value": "genius" }, { "label": "Hunter", "value": "hunter" }, { "label": "Japanese Web Novel", "value": "japanese-web-novel" }, { "label": "Korean Web Novel", "value": "korean-web-novel" }, { "label": "Light Novel (JP)", "value": "light-novel-jp" }, { "label": "Mage", "value": "mage" }, { "label": "Modern Fantasy", "value": "modern-fantasy" }, { "label": "Reincarnation", "value": "reincarnation" }, { "label": "Web Novel", "value": "web-novel" }] }, "status": { "type": "Picker", "label": "Status", "value": "", "options": [{ "label": "All", "value": "" }, { "label": "Ongoing", "value": "ongoing" }, { "label": "Hiatus", "value": "hiatus" }, { "label": "Completed", "value": "completed" }] }, "order": { "type": "Picker", "label": "Order by", "value": "", "options": [{ "label": "Default", "value": "" }, { "label": "A-Z", "value": "title" }, { "label": "Z-A", "value": "titlereverse" }, { "label": "Latest Update", "value": "update" }, { "label": "Latest Added", "value": "latest" }, { "label": "Popular", "value": "popular" }, { "label": "Rating", "value": "rating" }] } } });
/* __ENTranslationInjected v1 */
var fetch_2 = require("@libs/fetch");
var cheerio_2 = require("cheerio");
var __ENTranslation = (function () {
    var CFG = {
        enabled: true,
        targetLang: 'es',
        sourceLang: 'auto',
        maxBatchChars: 2000,
        maxConcurrent: 4,
        translateNovelNames: true,
        translateSummaries: true,
        translateChapterNames: false,
        translateContent: true,
        translateQuery: true,
    };
    var providers = ['google', 'google_repeated', 'mymemory', 'libretranslate'];
    var providerMaxChars = { google: 2000, google_repeated: 1800, mymemory: 420, libretranslate: 1800 };
    var cache = new Map();
    var active = 0;
    var queue = [];
    var norm = function (s) {
        return String(s || '')
            .replace(/[ 	]+/g, ' ')
            .replace(/\r/g, '')
            .trim();
    };
    var guard = function (fn) {
        return new Promise(function (resolve, reject) {
            var start = function () {
                active += 1;
                fn()
                    .then(resolve, reject)
                    .finally(function () {
                    active -= 1;
                    var next = queue.shift();
                    if (next)
                        next();
                });
            };
            if (active < CFG.maxConcurrent)
                start();
            else
                queue.push(start);
        });
    };
    var buildUrl = function (provider, text) {
        var enc = encodeURIComponent(text);
        var src = provider === 'mymemory' && CFG.sourceLang === 'auto' ? 'en' : CFG.sourceLang;
        if (provider === 'google_repeated') {
            return ('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
                src +
                '&tl=' +
                CFG.targetLang +
                '&q=' +
                enc);
        }
        if (provider === 'mymemory') {
            return ('https://api.mymemory.translated.net/get?q=' +
                enc +
                '&langpair=' +
                src +
                '|' +
                CFG.targetLang);
        }
        if (provider === 'libretranslate') {
            return ('https://libretranslate.de/translate?q=' +
                enc +
                '&source=' +
                CFG.sourceLang +
                '&target=' +
                CFG.targetLang +
                '&format=text');
        }
        return ('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
            CFG.sourceLang +
            '&tl=' +
            CFG.targetLang +
            '&dt=t&q=' +
            enc);
    };
    var extract = function (json, provider) {
        try {
            if (provider === 'google') {
                if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
                    return json[0]
                        .map(function (item) { return (Array.isArray(item) ? item[0] : null); })
                        .filter(Boolean)
                        .join('');
                }
            }
            else if (provider === 'google_repeated') {
                if (Array.isArray(json) && typeof json[0] === 'string') {
                    return json[0];
                }
            }
            else if (provider === 'mymemory') {
                if (json &&
                    json.responseStatus === 200 &&
                    json.responseData &&
                    typeof json.responseData.translatedText === 'string') {
                    return json.responseData.translatedText;
                }
            }
            else if (provider === 'deepl') {
                if (json && Array.isArray(json.translations) && json.translations[0]) {
                    return json.translations[0].text;
                }
            }
            else if (provider === 'libretranslate') {
                if (json && typeof json.translatedText === 'string') {
                    return json.translatedText;
                }
            }
        }
        catch (e) {
            return null;
        }
        return null;
    };
    function translateText(text, target, source) {
        return __awaiter(this, void 0, void 0, function () {
            var t, tl, sl, ck, _i, providers_1, provider, cap, res, json, out, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        t = norm(text);
                        if (!t)
                            return [2 /*return*/, ''];
                        tl = target || CFG.targetLang;
                        sl = source || CFG.sourceLang;
                        ck = sl + ':' + tl + ':' + t;
                        if (cache.has(ck))
                            return [2 /*return*/, cache.get(ck)];
                        _i = 0, providers_1 = providers;
                        _a.label = 1;
                    case 1:
                        if (!(_i < providers_1.length)) return [3 /*break*/, 7];
                        provider = providers_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        cap = providerMaxChars[provider] || Infinity;
                        if (t.length > cap)
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, fetch_2.fetchApi)(buildUrl(provider, t))];
                    case 3:
                        res = _a.sent();
                        if (!res || !res.ok)
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, res.json()];
                    case 4:
                        json = _a.sent();
                        out = extract(json, provider);
                        if (out && out !== t) {
                            cache.set(ck, out);
                            return [2 /*return*/, out];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, text];
                }
            });
        });
    }
    var translateShort = function (text) { return guard(function () { return translateText(text); }); };
    function translateList(values) {
        return __awaiter(this, void 0, void 0, function () {
            var out, _i, values_1, value, translated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        out = [];
                        _i = 0, values_1 = values;
                        _a.label = 1;
                    case 1:
                        if (!(_i < values_1.length)) return [3 /*break*/, 4];
                        value = values_1[_i];
                        return [4 /*yield*/, translateText(value)];
                    case 2:
                        translated = _a.sent();
                        out.push(translated && translated.trim() ? translated : value);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, out];
                }
            });
        });
    }
    function translateNovelItems(items) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _i, items_1, item, name_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = [];
                        _i = 0, items_1 = items;
                        _a.label = 1;
                    case 1:
                        if (!(_i < items_1.length)) return [3 /*break*/, 6];
                        item = items_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, translateText(typeof item.name === 'string' ? item.name : '')];
                    case 3:
                        name_1 = _a.sent();
                        result.push(__assign(__assign({}, item), { name: name_1 && name_1.trim() ? name_1 : item.name }));
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        result.push(item);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, result];
                }
            });
        });
    }
    function translateChapterNames(chapters) {
        return __awaiter(this, void 0, void 0, function () {
            var capped, out, _i, capped_1, chapter, name_2, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        capped = Array.isArray(chapters) ? chapters.slice(0, CFG.maxChapterNames) : [];
                        out = [];
                        _i = 0, capped_1 = capped;
                        _a.label = 1;
                    case 1:
                        if (!(_i < capped_1.length)) return [3 /*break*/, 6];
                        chapter = capped_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, translateText(typeof chapter.name === 'string' ? chapter.name : '')];
                    case 3:
                        name_2 = _a.sent();
                        out.push(__assign(__assign({}, chapter), { name: name_2 && name_2.trim() ? name_2 : chapter.name }));
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        out.push(chapter);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, out];
                }
            });
        });
    }
    function translateSourceNovel(novel) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, name_3, summary, translatedChapters, rest, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        updated = __assign({}, novel);
                        if (!(CFG.translateNovelNames && typeof updated.name === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, translateText(updated.name)];
                    case 1:
                        name_3 = _a.sent();
                        if (name_3 && name_3.trim())
                            updated.name = name_3;
                        _a.label = 2;
                    case 2:
                        if (!(CFG.translateSummaries && typeof updated.summary === 'string' && updated.summary)) return [3 /*break*/, 4];
                        return [4 /*yield*/, translateText(updated.summary)];
                    case 3:
                        summary = _a.sent();
                        if (summary && summary.trim())
                            updated.summary = summary;
                        _a.label = 4;
                    case 4:
                        if (!(CFG.translateChapterNames && Array.isArray(updated.chapters))) return [3 /*break*/, 6];
                        return [4 /*yield*/, translateChapterNames(updated.chapters)];
                    case 5:
                        translatedChapters = _a.sent();
                        if (translatedChapters.length < updated.chapters.length) {
                            rest = updated.chapters.slice(translatedChapters.length);
                            updated.chapters = translatedChapters.concat(rest);
                        }
                        else {
                            updated.chapters = translatedChapters;
                        }
                        _a.label = 6;
                    case 6: return [2 /*return*/, updated];
                    case 7:
                        e_4 = _a.sent();
                        return [2 /*return*/, novel];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    function collectTextNodes($) {
        var nodes = [];
        var root = $('body');
        if (!root.length)
            return nodes;
        root.find('*').each(function (i, el) {
            var tag = (el.tagName || '').toLowerCase();
            if (['script', 'style', 'pre', 'code', 'svg', 'noscript'].includes(tag))
                return;
            $(el)
                .contents()
                .each(function (j, child) {
                if (child.type === 'text') {
                    var value = child.data || '';
                    if (value.trim()) {
                        nodes.push({ el: child, value: value });
                    }
                }
            });
        });
        return nodes;
    }
    function translateHTMLContent(html) {
        return __awaiter(this, void 0, void 0, function () {
            var $, nodes, batch, batches_2, last, _i, nodes_1, node, _a, batches_1, chunk, joined, translated, parts, i, e_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        if (typeof html !== 'string' || !html.trim())
                            return [2 /*return*/, html];
                        $ = (0, cheerio_2.load)(html);
                        nodes = collectTextNodes($);
                        if (!nodes.length)
                            return [2 /*return*/, html];
                        batch = '';
                        batches_2 = [{ lines: [], texts: [] }];
                        last = function () { return batches_2[batches_2.length - 1]; };
                        for (_i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                            node = nodes_1[_i];
                            if ((batch + '\n' + node.value).length > CFG.maxBatchChars && batch !== '') {
                                batches_2.push({ lines: [], texts: [] });
                                batch = '';
                            }
                            last().lines.push(node.el);
                            last().texts.push(node.value);
                            batch = (batch === '' ? '' : batch + '\n') + node.value;
                        }
                        _a = 0, batches_1 = batches_2;
                        _b.label = 1;
                    case 1:
                        if (!(_a < batches_1.length)) return [3 /*break*/, 4];
                        chunk = batches_1[_a];
                        if (!chunk.lines.length)
                            return [3 /*break*/, 3];
                        joined = chunk.texts.join('\n');
                        return [4 /*yield*/, translateText(joined)];
                    case 2:
                        translated = _b.sent();
                        if (!translated || !translated.trim() || translated === joined)
                            return [3 /*break*/, 3];
                        parts = translated.split('\n');
                        if (parts.length !== chunk.lines.length)
                            return [3 /*break*/, 3];
                        for (i = 0; i < chunk.lines.length; i += 1) {
                            chunk.lines[i].data = parts[i];
                        }
                        _b.label = 3;
                    case 3:
                        _a++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, $.html()];
                    case 5:
                        e_5 = _b.sent();
                        return [2 /*return*/, html];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function wrapPlugin(plugin) {
        var _this = this;
        if (!plugin || !CFG.enabled)
            return;
        if (typeof plugin.popularNovels === 'function') {
            var orig_1 = plugin.popularNovels.bind(plugin);
            plugin.popularNovels = function (pageNo, options) { return __awaiter(_this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, orig_1(pageNo, options)];
                        case 1:
                            res = _a.sent();
                            if (Array.isArray(res))
                                return [2 /*return*/, translateNovelItems(res)];
                            return [2 /*return*/, res];
                    }
                });
            }); };
        }
        if (typeof plugin.searchNovels === 'function') {
            var orig_2 = plugin.searchNovels.bind(plugin);
            plugin.searchNovels = function (searchTerm, pageNo) { return __awaiter(_this, void 0, void 0, function () {
                var query, effectiveQuery, _a, res;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            query = typeof searchTerm === 'string' ? searchTerm : '';
                            if (!CFG.translateQuery) return [3 /*break*/, 2];
                            return [4 /*yield*/, translateText(query, 'en', CFG.sourceLang).catch(function () { return query; })];
                        case 1:
                            _a = (_b.sent()) || query;
                            return [3 /*break*/, 3];
                        case 2:
                            _a = query;
                            _b.label = 3;
                        case 3:
                            effectiveQuery = _a;
                            return [4 /*yield*/, orig_2(effectiveQuery, pageNo)];
                        case 4:
                            res = _b.sent();
                            if (Array.isArray(res))
                                return [2 /*return*/, translateNovelItems(res)];
                            return [2 /*return*/, res];
                    }
                });
            }); };
        }
        if (typeof plugin.parseNovel === 'function') {
            var orig_3 = plugin.parseNovel.bind(plugin);
            plugin.parseNovel = function (novelPath) { return __awaiter(_this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, orig_3(novelPath)];
                        case 1:
                            res = _a.sent();
                            if (res && typeof res === 'object')
                                return [2 /*return*/, translateSourceNovel(res)];
                            return [2 /*return*/, res];
                    }
                });
            }); };
        }
        if (typeof plugin.parseChapter === 'function') {
            var orig_4 = plugin.parseChapter.bind(plugin);
            plugin.parseChapter = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () {
                    var res;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, orig_4.apply(void 0, args)];
                            case 1:
                                res = _a.sent();
                                if (CFG.translateContent && typeof res === 'string') {
                                    return [2 /*return*/, translateHTMLContent(res)];
                                }
                                return [2 /*return*/, res];
                        }
                    });
                });
            };
        }
    }
    return wrapPlugin;
})();
__ENTranslation(plugin);
/* __ENTranslationInjected END */
exports.default = plugin;

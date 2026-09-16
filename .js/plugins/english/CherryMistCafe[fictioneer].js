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
exports.FictioneerPlugin = void 0;
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var FictioneerPlugin = /** @class */ (function () {
    function FictioneerPlugin(metadata) {
        var _a;
        this.filters = undefined;
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/fictioneer/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        var versionIncrements = ((_a = metadata.options) === null || _a === void 0 ? void 0 : _a.versionIncrements) || 0;
        this.version = "1.1.".concat(0 + versionIncrements);
        this.options = metadata.options;
    }
    FictioneerPlugin.prototype.parseNovels = function (loadedCheerio, selector) {
        var _this = this;
        return loadedCheerio(selector)
            .map(function (i, el) {
            var element = loadedCheerio(el);
            var novelName = element.find('h3 > a').text();
            var novelCover = element.find('a.cell-img:has(img)').attr('href');
            var novelUrl = element.find('h3 > a').attr('href');
            if (!novelUrl)
                return;
            return {
                name: novelName,
                cover: novelCover,
                path: new URL(novelUrl, _this.site).pathname.substring(1),
            };
        })
            .toArray();
    };
    FictioneerPlugin.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var req, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site +
                            '/' +
                            this.options.browsePage +
                            '/' +
                            (pageNo === 1 ? '' : 'page/' + pageNo + '/'))];
                    case 1:
                        req = _a.sent();
                        return [4 /*yield*/, req.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio, '#featured-list > li > div > div, #list-of-stories > li > div > div')];
                }
            });
        });
    };
    FictioneerPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var req, body, loadedCheerio, novel, status;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + '/' + novelPath + '/')];
                    case 1:
                        req = _a.sent();
                        return [4 /*yield*/, req.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('h1.story__identity-title').text(),
                        };
                        // novel.artist = '';
                        novel.author = loadedCheerio('div.story__identity-meta')
                            .text()
                            .split('|')[0]
                            .replace('Author: ', '')
                            .replace('by ', '')
                            .trim();
                        novel.cover = loadedCheerio('figure.story__thumbnail > a').attr('href');
                        novel.genres = loadedCheerio('div.tag-group > a, section.tag-group > a')
                            .map(function (i, el) { return loadedCheerio(el).text(); })
                            .toArray()
                            .join(',');
                        loadedCheerio('section.story__summary .related-stories-block').remove();
                        novel.summary = loadedCheerio('section.story__summary').text();
                        novel.chapters = loadedCheerio('li.chapter-group__list-item._publish')
                            .filter(function (i, el) { return !el.attribs['class'].includes('_password'); })
                            .filter(function (i, el) {
                            return !loadedCheerio(el)
                                .find('i')
                                .first()
                                .attr('class')
                                .includes('fa-lock');
                        })
                            .map(function (i, el) {
                            var chapterName = loadedCheerio(el).find('a').text();
                            var chapterUrl = loadedCheerio(el).find('a').attr('href');
                            if (!chapterUrl)
                                return;
                            return {
                                name: chapterName,
                                path: new URL(chapterUrl, _this.site).pathname.substring(1),
                            };
                        })
                            .toArray();
                        status = loadedCheerio('span.story__status').text().trim();
                        if (status === 'Ongoing')
                            novel.status = novelStatus_1.NovelStatus.Ongoing;
                        if (status === 'Completed')
                            novel.status = novelStatus_1.NovelStatus.Completed;
                        if (status === 'Cancelled')
                            novel.status = novelStatus_1.NovelStatus.Cancelled;
                        if (status === 'Hiatus')
                            novel.status = novelStatus_1.NovelStatus.OnHiatus;
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    FictioneerPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var req, body, loadedCheerio, ghostScript, contentHost, poly_1, encoded, rot13;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + '/' + chapterPath + '/')];
                    case 1:
                        req = _c.sent();
                        return [4 /*yield*/, req.text()];
                    case 2:
                        body = _c.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        ghostScript = loadedCheerio('script[id*=ghost]');
                        contentHost = loadedCheerio('#cherry-content-host');
                        if (ghostScript.length && contentHost.length) {
                            poly_1 = ghostScript.attr('data-poly');
                            encoded = Array.from({ length: +ghostScript.attr('data-total') || 0 }, function (_, i) { return ghostScript.attr("data-".concat(poly_1, "-").concat(i)) || ''; }).join('');
                            // technically copypasta from source
                            // var c = s.charCodeAt(i);
                            // if(c>=65 && c<=90)
                            //    o+=String.fromCharCode((c-65+13)%26+65);
                            // else if(c>=97&&c<=122)
                            //    o+=String.fromCharCode((c-97+13)%26+97);
                            // else
                            //    o+=s.charAt(i);
                            if (encoded) {
                                rot13 = function (str) {
                                    return str.replace(/[a-zA-Z]/g, function (char) {
                                        var base = char <= 'Z' ? 65 : 97;
                                        var shift = ((char.charCodeAt(0) - base + 13) % 26) + base;
                                        return String.fromCharCode(shift);
                                    });
                                };
                                contentHost.replaceWith(decodeURIComponent(atob(rot13(encoded))));
                            }
                        }
                        loadedCheerio('script, ruby').remove();
                        loadedCheerio('section#chapter-content p [data-fcnc-rev="1"]').each(function (_, el) {
                            var text = loadedCheerio(el).text().trim();
                            if (text)
                                loadedCheerio(el).replaceWith(__spreadArray([], text, true).reverse().join(''));
                        });
                        return [2 /*return*/, (((_b = (_a = loadedCheerio('section#chapter-content > div')
                                .html()) === null || _a === void 0 ? void 0 : _a.replace(/\u00A0/g, ' ')) === null || _b === void 0 ? void 0 : _b.replace(/[\u2060\u00AD\u202F\u2007\u200B]/g, '')) || '')];
                }
            });
        });
    };
    FictioneerPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var req, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site +
                            "/".concat(pageNo === 1 ? '' : 'page/' + pageNo + '/', "?s=").concat(encodeURIComponent(searchTerm), "&post_type=fcn_story"))];
                    case 1:
                        req = _a.sent();
                        return [4 /*yield*/, req.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio, '#search-result-list > li > div > div')];
                }
            });
        });
    };
    return FictioneerPlugin;
}());
exports.FictioneerPlugin = FictioneerPlugin;
var plugin = new FictioneerPlugin({ "id": "cherrymistcafe", "sourceSite": "https://cherrymist.cafe/", "sourceName": "Cherry Mist Cafe", "options": { "customJs": { "chapterTransform": "custom/cherrymistcafe/chapterTransform.js" }, "versionIncrements": 60, "browsePage": "stories" } });
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

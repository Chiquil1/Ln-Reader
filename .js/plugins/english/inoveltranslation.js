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
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");
var novelStatus_1 = require("@libs/novelStatus");
var storage_1 = require("@libs/storage");
var INovelTranslation = /** @class */ (function () {
    function INovelTranslation() {
        this.id = 'inoveltranslation';
        this.name = 'iNovelTranslation';
        this.icon = 'src/en/inoveltranslation/icon.png';
        this.site = 'https://inoveltranslation.com';
        this.version = '1.0.2';
        this.filters = undefined;
        this.pluginSettings = {
            hideLocked: {
                value: false,
                label: 'Hide locked chapters',
                type: 'Switch',
            },
        };
        this.HEADERS = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://inoveltranslation.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        };
    }
    INovelTranslation.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/api/novels?limit=50&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                                headers: this.HEADERS,
                            }).then(function (r) { return r.json(); })];
                    case 1:
                        result = _a.sent();
                        novels = [];
                        if (result.docs) {
                            result.docs.forEach(function (doc) {
                                var _a;
                                novels.push({
                                    name: doc.title,
                                    path: "/novels/".concat(doc.id),
                                    cover: ((_a = doc.cover) === null || _a === void 0 ? void 0 : _a.url) ? _this.site + doc.cover.url : defaultCover_1.defaultCover,
                                });
                            });
                        }
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    INovelTranslation.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var id, novelUrl, novelData, chaptersUrl, chaptersData, status, genres, summary, novel, chapters, hideLocked;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = novelPath.split('/').pop();
                        novelUrl = "".concat(this.site, "/api/novels/").concat(id, "?depth=1");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(novelUrl, {
                                headers: this.HEADERS,
                            }).then(function (r) { return r.json(); })];
                    case 1:
                        novelData = _c.sent();
                        chaptersUrl = "".concat(this.site, "/api/chapters?where[novel][equals]=").concat(id, "&limit=999&depth=0");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chaptersUrl, {
                                headers: this.HEADERS,
                            }).then(function (r) { return r.json(); })];
                    case 2:
                        chaptersData = _c.sent();
                        status = novelData.publication === 'completed'
                            ? novelStatus_1.NovelStatus.Completed
                            : novelStatus_1.NovelStatus.Ongoing;
                        genres = novelData.tags
                            ? novelData.tags.map(function (tag) { return tag.name; }).join(', ')
                            : '';
                        summary = '';
                        if (novelData.sypnosis && novelData.sypnosis.root) {
                            summary = this.lexicalToText(novelData.sypnosis.root);
                        }
                        novel = {
                            path: novelPath,
                            name: novelData.title || 'Untitled',
                            cover: ((_a = novelData.cover) === null || _a === void 0 ? void 0 : _a.url)
                                ? this.site + novelData.cover.url
                                : defaultCover_1.defaultCover,
                            summary: summary,
                            author: ((_b = novelData.author) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                            genres: genres,
                            status: status,
                        };
                        chapters = [];
                        hideLocked = storage_1.storage.get('hideLocked');
                        if (chaptersData.docs) {
                            chaptersData.docs.forEach(function (doc) {
                                var isLocked = doc.tier !== null;
                                if (isLocked && hideLocked) {
                                    return;
                                }
                                var title = doc.title ? " - ".concat(doc.title) : '';
                                var lockIcon = isLocked ? ' 🔒' : '';
                                chapters.push({
                                    name: "Ch. ".concat(doc.chapter).concat(lockIcon).concat(title),
                                    path: "/chapters/".concat(doc.id),
                                    releaseTime: doc.updatedAt,
                                    chapterNumber: doc.chapter,
                                });
                            });
                        }
                        novel.chapters = chapters.sort(function (a, b) { return (a.chapterNumber || 0) - (b.chapterNumber || 0); });
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    INovelTranslation.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var rscHeader, response, e_1, rscText, signatures, sigIndex, _i, signatures_1, sig, startIndex, contextKeys, _a, contextKeys_1, key, keyIndex, braces, inString, escape_1, jsonStr, i, char, safeJson, parsedData, cleanJson, lexicalRoot, fallbackHtml_1, textMatches, htmlResponse, htmlText, $, htmlContent, e_2;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, 1500); })];
                    case 1:
                        _c.sent();
                        rscHeader = __assign(__assign({}, this.HEADERS), { rsc: '1' });
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath, {
                                headers: rscHeader,
                            })];
                    case 3:
                        response = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _c.sent();
                        throw new Error("Network error: ".concat(e_1.message));
                    case 5:
                        if (response.status !== 200) {
                            throw new Error("Cloudflare challenge or server error (Status: ".concat(response.status, "). Please open in WebView to verify."));
                        }
                        return [4 /*yield*/, response.text()];
                    case 6:
                        rscText = _c.sent();
                        if (!rscText || rscText.trim() === '') {
                            throw new Error('Server returned empty data.');
                        }
                        if (rscText.includes('cf-browser-verification') ||
                            rscText.includes('cf-challenge') ||
                            rscText.includes('cloudflare-static') ||
                            rscText.includes('Just a moment...')) {
                            if (!rscText.includes('root') && !rscText.includes('paragraph')) {
                                throw new Error('Cloudflare Challenge detected. Please open this novel in WebView to solve the challenge.');
                            }
                        }
                        signatures = [
                            '"root":{"type":"root"',
                            '\\"root\\":{\\"type\\":\\"root\\"',
                            '"children":[{"type":"paragraph"',
                            '\\"children\\":[{\\"type\\":\\"paragraph\\"',
                        ];
                        sigIndex = -1;
                        for (_i = 0, signatures_1 = signatures; _i < signatures_1.length; _i++) {
                            sig = signatures_1[_i];
                            sigIndex = rscText.indexOf(sig);
                            if (sigIndex !== -1)
                                break;
                        }
                        if (sigIndex !== -1) {
                            startIndex = rscText.lastIndexOf('{', sigIndex);
                            contextKeys = [
                                '"content"',
                                '\\"content\\"',
                                '"root"',
                                '\\"root\\"',
                            ];
                            for (_a = 0, contextKeys_1 = contextKeys; _a < contextKeys_1.length; _a++) {
                                key = contextKeys_1[_a];
                                keyIndex = rscText.lastIndexOf(key, sigIndex);
                                if (keyIndex !== -1 && keyIndex > startIndex - 50) {
                                    startIndex = rscText.lastIndexOf('{', keyIndex);
                                    break;
                                }
                            }
                            if (startIndex !== -1) {
                                braces = 0;
                                inString = false;
                                escape_1 = false;
                                jsonStr = '';
                                // Perform brace balancing on the raw stream to preserve escaping
                                for (i = startIndex; i < rscText.length; i++) {
                                    char = rscText[i];
                                    if (escape_1) {
                                        escape_1 = false;
                                        continue;
                                    }
                                    if (char === '\\') {
                                        escape_1 = true;
                                        continue;
                                    }
                                    if (char === '"') {
                                        inString = !inString;
                                        continue;
                                    }
                                    if (!inString) {
                                        if (char === '{')
                                            braces++;
                                        else if (char === '}')
                                            braces--;
                                    }
                                    if (braces === 0 && i > startIndex) {
                                        jsonStr = rscText.substring(startIndex, i + 1);
                                        break;
                                    }
                                }
                                if (jsonStr) {
                                    try {
                                        safeJson = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                                        parsedData = void 0;
                                        try {
                                            parsedData = JSON.parse(safeJson);
                                        }
                                        catch (_d) {
                                            cleanJson = jsonStr
                                                .replace(/\\"/g, '"')
                                                .replace(/\\\\/g, '\\')
                                                // eslint-disable-next-line no-control-regex
                                                .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                                            parsedData = JSON.parse(cleanJson);
                                        }
                                        lexicalRoot = parsedData.root || ((_b = parsedData.content) === null || _b === void 0 ? void 0 : _b.root) || parsedData;
                                        if (lexicalRoot && lexicalRoot.children) {
                                            return [2 /*return*/, this.lexicalToHtml(lexicalRoot)];
                                        }
                                    }
                                    catch (e) {
                                        fallbackHtml_1 = '';
                                        textMatches = jsonStr.match(/\\?"text\\?"\s*:\s*\\?"(.*?)\\?"/g);
                                        if (textMatches && textMatches.length > 0) {
                                            textMatches.forEach(function (m) {
                                                var _a;
                                                var text = ((_a = m.match(/: ?"?(.*?)"?$/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
                                                text = text.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                                                if (text.trim() && text !== ' ' && !text.startsWith('Ch. ')) {
                                                    fallbackHtml_1 += "<p>".concat(text, "</p>");
                                                }
                                            });
                                            if (fallbackHtml_1)
                                                return [2 /*return*/, fallbackHtml_1];
                                        }
                                    }
                                }
                            }
                        }
                        _c.label = 7;
                    case 7:
                        _c.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath, {
                                headers: this.HEADERS,
                            })];
                    case 8:
                        htmlResponse = _c.sent();
                        return [4 /*yield*/, htmlResponse.text()];
                    case 9:
                        htmlText = _c.sent();
                        $ = (0, cheerio_1.load)(htmlText);
                        htmlContent = $('main > section[data-sentry-component="RichText"]').html();
                        if (htmlContent)
                            return [2 /*return*/, htmlContent];
                        return [3 /*break*/, 11];
                    case 10:
                        e_2 = _c.sent();
                        return [3 /*break*/, 11];
                    case 11: throw new Error('Story content not found. The page structure might have changed. Please try opening in WebView to verify.');
                }
            });
        });
    };
    INovelTranslation.prototype.lexicalToHtml = function (node) {
        var html = '';
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.type === 'paragraph') {
                    html += "<p>".concat(this.lexicalToHtml(child), "</p>");
                }
                else if (child.type === 'text') {
                    var text = child.text || '';
                    if (child.format && child.format & 1)
                        text = "<b>".concat(text, "</b>");
                    if (child.format && child.format & 2)
                        text = "<i>".concat(text, "</i>");
                    html += text;
                }
                else if (child.type === 'list') {
                    var tag = child.listType === 'number' ? 'ol' : 'ul';
                    html += "<".concat(tag, ">").concat(this.lexicalToHtml(child), "</").concat(tag, ">");
                }
                else if (child.type === 'listitem') {
                    html += "<li>".concat(this.lexicalToHtml(child), "</li>");
                }
                else if (child.type === 'heading') {
                    var tag = child.tag || 'h3';
                    html += "<".concat(tag, ">").concat(this.lexicalToHtml(child), "</").concat(tag, ">");
                }
                else {
                    html += this.lexicalToHtml(child);
                }
            }
        }
        return html;
    };
    INovelTranslation.prototype.lexicalToText = function (node) {
        var textOut = '';
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.type === 'paragraph') {
                    textOut += this.lexicalToText(child) + '\n\n';
                }
                else if (child.type === 'text') {
                    textOut += child.text || '';
                }
                else if (child.type === 'listitem') {
                    textOut += '• ' + this.lexicalToText(child) + '\n';
                }
                else {
                    textOut += this.lexicalToText(child);
                }
            }
        }
        return textOut;
    };
    INovelTranslation.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/api/novels?where[title][contains]=").concat(encodeURIComponent(searchTerm), "&limit=50&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                                headers: this.HEADERS,
                            }).then(function (r) { return r.json(); })];
                    case 1:
                        result = _a.sent();
                        novels = [];
                        if (result.docs) {
                            result.docs.forEach(function (doc) {
                                var _a;
                                novels.push({
                                    name: doc.title,
                                    path: "/novels/".concat(doc.id),
                                    cover: ((_a = doc.cover) === null || _a === void 0 ? void 0 : _a.url) ? _this.site + doc.cover.url : defaultCover_1.defaultCover,
                                });
                            });
                        }
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return INovelTranslation;
}());
exports.default = new INovelTranslation();

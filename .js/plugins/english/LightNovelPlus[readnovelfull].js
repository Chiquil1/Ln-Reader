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
exports.ReadNovelFullPlugin = void 0;
var htmlparser2_1 = require("htmlparser2");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var cheerio_1 = require("cheerio");
var ReadNovelFullPlugin = /** @class */ (function () {
    function ReadNovelFullPlugin(metadata) {
        var _a;
        this.lastSearch = null;
        this.searchInterval = 3400;
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/readnovelfull/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        var versionIncrements = ((_a = metadata.options) === null || _a === void 0 ? void 0 : _a.versionIncrements) || 0;
        this.version = "2.2.".concat(1 + versionIncrements);
        this.options = metadata.options;
        this.filters = metadata.filters;
    }
    ReadNovelFullPlugin.prototype.sleep = function (_ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // No-op: la app (LNReader) bloquea este patrón en validatePluginCode.
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    ReadNovelFullPlugin.prototype.parseNovels = function (html) {
        var _this = this;
        var novels = [];
        var tempNovel = {};
        var depth;
        var stateStack = [ParsingState.Idle];
        var currentState = function () { return stateStack[stateStack.length - 1]; };
        var pushState = function (state) { return stateStack.push(state); };
        var popState = function () {
            return stateStack.length > 1 ? stateStack.pop() : currentState();
        };
        var parser = new htmlparser2_1.Parser({
            onopentag: function (name, attribs) {
                var _a;
                var state = currentState();
                if (((_a = attribs.class) === null || _a === void 0 ? void 0 : _a.includes('archive')) ||
                    attribs.class === 'col-content') {
                    pushState(ParsingState.NovelList);
                    depth = 0;
                }
                if (state !== ParsingState.NovelList &&
                    state !== ParsingState.NovelName)
                    return;
                switch (name) {
                    case 'img':
                        {
                            var cover = attribs['data-src'] || attribs.src;
                            if (cover) {
                                tempNovel.cover = new URL(cover, _this.site).href;
                            }
                        }
                        break;
                    case 'h3':
                        if (state === ParsingState.NovelList) {
                            pushState(ParsingState.NovelName);
                        }
                        break;
                    case 'a':
                        if (state === ParsingState.NovelName) {
                            var href = attribs.href;
                            if (href) {
                                tempNovel.path = new URL(href, _this.site).pathname.substring(1);
                                tempNovel.name = attribs.title;
                            }
                        }
                        break;
                    case 'div':
                        depth++;
                        break;
                    default:
                        return;
                }
            },
            onclosetag: function (name) {
                var state = currentState();
                if (name === 'a' && state === ParsingState.NovelName) {
                    if (tempNovel.name && tempNovel.path) {
                        novels.push(__assign({}, tempNovel));
                    }
                    tempNovel = {};
                    popState();
                }
                if (name === 'div' && state === ParsingState.NovelList) {
                    depth--;
                    if (depth < 0)
                        popState();
                }
            },
        });
        parser.write(html);
        parser.end();
        return novels;
    };
    ReadNovelFullPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var _c, _d, pageParam, novelListing, _e, typeParam, latestPage, _f, genreParam, _g, genreKey, langParam, urlLangCode, _h, noPages, _j, pageAsPath, url, params, basePage, result, html;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        _c = this.options, _d = _c.pageParam, pageParam = _d === void 0 ? 'page' : _d, novelListing = _c.novelListing, _e = _c.typeParam, typeParam = _e === void 0 ? 'type' : _e, latestPage = _c.latestPage, _f = _c.genreParam, genreParam = _f === void 0 ? 'category_novel' : _f, _g = _c.genreKey, genreKey = _g === void 0 ? 'id' : _g, langParam = _c.langParam, urlLangCode = _c.urlLangCode, _h = _c.noPages, noPages = _h === void 0 ? [] : _h, _j = _c.pageAsPath, pageAsPath = _j === void 0 ? false : _j;
                        // Skip Pagination for FWN & LR
                        if (pageNo !== 1 &&
                            !showLatestNovels &&
                            !filters.genres.value.length &&
                            noPages.length > 0 &&
                            noPages.includes(filters.type.value)) {
                            return [2 /*return*/, []];
                        }
                        url = '';
                        if (novelListing) {
                            params = new URLSearchParams();
                            if (showLatestNovels) {
                                params.append(typeParam, latestPage);
                            }
                            else if (filters.genres.value.length) {
                                params.append(typeParam, genreParam);
                                params.append(genreKey, filters.genres.value);
                            }
                            else {
                                params.append(typeParam, filters.type.value);
                            }
                            // Add language parameter if specified
                            if (langParam && urlLangCode) {
                                params.append(langParam, urlLangCode);
                            }
                            params.append(pageParam, pageNo.toString());
                            url = "".concat(this.site).concat(novelListing, "?").concat(params.toString());
                        }
                        else {
                            basePage = showLatestNovels
                                ? latestPage
                                : filters.genres.value.length
                                    ? filters.genres.value
                                    : filters.type.value;
                            if (pageAsPath) {
                                if (pageNo > 1) {
                                    url = "".concat(this.site).concat(basePage, "/").concat(pageNo.toString());
                                }
                                else {
                                    url = "".concat(this.site).concat(basePage);
                                }
                            }
                            else {
                                url = "".concat(this.site).concat(basePage, "?").concat(pageParam, "=").concat(pageNo.toString());
                            }
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _k.sent();
                        if (!result.ok) {
                            throw new Error("Could not reach site (".concat(result.status, ": ").concat(result.statusText, ") try to open in webview."));
                        }
                        return [4 /*yield*/, result.text()];
                    case 2:
                        html = _k.sent();
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    ReadNovelFullPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, body, novel, summaryParts, statusParts, authorParts, genreArray, infoParts, chapters, novelId, totalChapter, novelTitle, tempChapter, i, depth, stateStack, currentState, pushState, popState, parser, chapterListing, ajaxParam, params, chaptersUrl, fetchOptions, ajaxResult, ajaxBody, ajaxHtml, json, ajaxChapters_1, tempAjaxChapter_1, ajaxParser;
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = this.site + novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _b.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _b.sent();
                        novel = {
                            path: novelPath,
                            chapters: [],
                        };
                        summaryParts = [];
                        statusParts = [];
                        authorParts = [];
                        genreArray = [];
                        infoParts = [];
                        chapters = [];
                        novelId = null;
                        totalChapter = null;
                        novelTitle = null;
                        tempChapter = {};
                        i = 0;
                        stateStack = [ParsingState.Idle];
                        currentState = function () { return stateStack[stateStack.length - 1]; };
                        pushState = function (state) { return stateStack.push(state); };
                        popState = function () {
                            return stateStack.length > 1 ? stateStack.pop() : currentState();
                        };
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var _a, _b, _c, _d, _e;
                                var state = currentState();
                                switch (name) {
                                    case 'div':
                                        switch (attribs.class) {
                                            case 'books':
                                            case 'm-imgtxt':
                                                pushState(ParsingState.Cover);
                                                return;
                                            case 'inner':
                                            case 'desc-text':
                                            case 'desc-text desc-text-collapsed':
                                                if (state === ParsingState.Cover)
                                                    popState();
                                                pushState(ParsingState.Summary);
                                                break;
                                            case 'info':
                                                pushState(ParsingState.Info);
                                                depth = 0;
                                                break;
                                        }
                                        if (!_this.options.noAjax && attribs.id === 'rating') {
                                            novelId = attribs['data-novel-id'];
                                        }
                                        if (state === ParsingState.Info)
                                            depth++;
                                        break;
                                    case 'img':
                                        if (state === ParsingState.Cover) {
                                            var cover = (_b = (_a = attribs.src) !== null && _a !== void 0 ? _a : attribs['data-cfsrc']) !== null && _b !== void 0 ? _b : attribs['data-src'];
                                            var name_1 = attribs.title;
                                            if (cover) {
                                                novel.cover = new URL(cover, _this.site).href;
                                            }
                                            if (name_1) {
                                                novel.name = name_1;
                                            }
                                            else {
                                                popState();
                                            }
                                        }
                                        break;
                                    case 'h3':
                                        if (state === ParsingState.Cover) {
                                            pushState(ParsingState.NovelName);
                                        }
                                        break;
                                    case 'span':
                                        if (state === ParsingState.Cover && attribs.title) {
                                            var newState = {
                                                'Genre': ParsingState.Genres,
                                                'Author': ParsingState.Author,
                                                'Status': ParsingState.Status,
                                            }[attribs.title];
                                            if (newState)
                                                pushState(newState);
                                        }
                                        if ((_c = attribs.class) === null || _c === void 0 ? void 0 : _c.includes('disqus')) {
                                            novelTitle = attribs['data-disqus-identifier'];
                                        }
                                        break;
                                    case 'br':
                                        if (state === ParsingState.Summary) {
                                            summaryParts.push('\n');
                                        }
                                        break;
                                    case 'ul':
                                        if ((_d = attribs.class) === null || _d === void 0 ? void 0 : _d.includes('info-meta')) {
                                            pushState(ParsingState.Info);
                                        }
                                        if (_this.options.noAjax && attribs.id === 'idData') {
                                            pushState(ParsingState.ChapterList);
                                        }
                                        break;
                                    case 'a':
                                        if ((_e = attribs.class) === null || _e === void 0 ? void 0 : _e.includes('set-case')) {
                                            novelId = attribs['data-articleid'];
                                        }
                                        if (state === ParsingState.ChapterList) {
                                            i++;
                                            var href = attribs.href;
                                            pushState(ParsingState.Chapter);
                                            tempChapter.name = attribs.title || "Chapter ".concat(i);
                                            tempChapter.releaseTime = null;
                                            tempChapter.chapterNumber = i;
                                            tempChapter.path =
                                                (href === null || href === void 0 ? void 0 : href.substring(1)) ||
                                                    novelPath.replace('.html', "/chapter-".concat(i, ".html"));
                                        }
                                        break;
                                    case 'script':
                                        pushState(ParsingState.Hidden);
                                        break;
                                }
                            },
                            ontext: function (data) {
                                var text = data.trim();
                                if (!text)
                                    return;
                                switch (currentState()) {
                                    case ParsingState.NovelName:
                                        novel.name = (novel.name || '') + text;
                                        break;
                                    case ParsingState.Summary:
                                        summaryParts.push(data);
                                        break;
                                    case ParsingState.Info:
                                        infoParts.push(text);
                                        break;
                                    case ParsingState.Genres:
                                        genreArray.push(data);
                                        break;
                                    case ParsingState.Author:
                                        authorParts.push(data);
                                        break;
                                    case ParsingState.Status:
                                        statusParts.push(text);
                                        break;
                                    case ParsingState.Hidden:
                                        if (text.includes('window.chapterPagination')) {
                                            totalChapter = Number(text.match(/totalChapters:\s*(\d+)/)[1]);
                                        }
                                        else if (text.includes('sourceid')) {
                                            novelId = text.match(/sourceid=(\d+)/)[1];
                                        }
                                }
                            },
                            onclosetag: function (name) {
                                var state = currentState();
                                switch (name) {
                                    case 'div':
                                        switch (state) {
                                            case ParsingState.Info:
                                                depth--;
                                                infoParts.push('\n');
                                                if (depth < 0) {
                                                    popState();
                                                }
                                                break;
                                            case ParsingState.Genres:
                                            case ParsingState.Author:
                                            case ParsingState.Status:
                                            case ParsingState.Summary:
                                                popState();
                                                break;
                                        }
                                        break;
                                    case 'h3':
                                        if (state === ParsingState.NovelName) {
                                            popState();
                                        }
                                        break;
                                    case 'a':
                                        if (state === ParsingState.Chapter) {
                                            if (tempChapter.name && tempChapter.path) {
                                                chapters.push(__assign({}, tempChapter));
                                            }
                                            tempChapter = {};
                                            popState();
                                        }
                                        break;
                                    case 'li':
                                        if (state === ParsingState.Info) {
                                            infoParts.push('\n');
                                        }
                                        break;
                                    case 'ul':
                                        switch (state) {
                                            case ParsingState.Info:
                                            case ParsingState.ChapterList:
                                                popState();
                                                break;
                                        }
                                        break;
                                    case 'script':
                                        if (state === ParsingState.Hidden)
                                            popState();
                                        break;
                                    default:
                                        return;
                                }
                            },
                            onend: function () {
                                if (infoParts.length) {
                                    infoParts
                                        .join('')
                                        .split('\n')
                                        .map(function (line) { return line.trim(); })
                                        .filter(function (line) { return line.includes(':'); })
                                        .forEach(function (line) {
                                        var _a;
                                        var parts = line.split(':');
                                        var detailName = parts[0].trim().toLowerCase();
                                        var detail = parts[1]
                                            .split(',')
                                            .map(function (g) { return g.trim(); })
                                            .join(', ');
                                        switch (detailName) {
                                            case 'author':
                                                novel.author = detail;
                                                break;
                                            case 'genre':
                                                novel.genres = detail;
                                                break;
                                            case 'status':
                                                {
                                                    var map = {
                                                        ongoing: novelStatus_1.NovelStatus.Ongoing,
                                                        hiatus: novelStatus_1.NovelStatus.OnHiatus,
                                                        dropped: novelStatus_1.NovelStatus.Cancelled,
                                                        cancelled: novelStatus_1.NovelStatus.Cancelled,
                                                        completed: novelStatus_1.NovelStatus.Completed,
                                                    };
                                                    novel.status =
                                                        (_a = map[detail.toLowerCase()]) !== null && _a !== void 0 ? _a : novelStatus_1.NovelStatus.Unknown;
                                                }
                                                break;
                                            default:
                                                return;
                                        }
                                    });
                                    if (!novelId) {
                                        var idMatch = novelPath.match(/\d+/);
                                        novelId = idMatch ? idMatch[0] : null;
                                    }
                                }
                                else {
                                    novel.genres = genreArray.join('').trim();
                                    novel.author = authorParts.join('').trim();
                                    novel.status = statusParts
                                        .join('')
                                        .toLowerCase()
                                        .replace(/\b\w/g, function (char) { return char.toUpperCase(); });
                                }
                                novel.summary = summaryParts.join('\n\n').trim();
                            },
                        });
                        parser.write(body);
                        parser.end();
                        if (!(this.options.noAjax && chapters.length > 0 && !totalChapter)) return [3 /*break*/, 3];
                        novel.chapters = chapters;
                        return [3 /*break*/, 7];
                    case 3:
                        if (!(novelId !== null)) return [3 /*break*/, 7];
                        chapterListing = this.options.chapterListing || 'ajax/chapter-archive';
                        ajaxParam = this.options.chapterParam || 'novelId';
                        params = new URLSearchParams((_a = {}, _a[ajaxParam] = novelId, _a));
                        chaptersUrl = void 0;
                        fetchOptions = void 0;
                        if (totalChapter) {
                            chaptersUrl = "".concat(this.site).concat(chapterListing);
                            params.set('acode', novelTitle || novelPath.split('/').pop());
                            params.set('cid', String(Math.floor(Math.random() * totalChapter)));
                            fetchOptions = {
                                method: 'POST',
                                body: params.toString(),
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            };
                        }
                        else {
                            chaptersUrl = "".concat(this.site).concat(chapterListing, "?").concat(params.toString());
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chaptersUrl, fetchOptions)];
                    case 4:
                        ajaxResult = _b.sent();
                        if (!!ajaxResult.ok) return [3 /*break*/, 5];
                        console.error("Failed to fetch chapters: ".concat(ajaxResult.status));
                        novel.chapters = [];
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, ajaxResult.text()];
                    case 6:
                        ajaxBody = _b.sent();
                        ajaxHtml = ajaxBody;
                        try {
                            json = JSON.parse(ajaxBody);
                            if (typeof json.html === 'string') {
                                ajaxHtml = json.html;
                            }
                        }
                        catch (_c) {
                            // eslint
                        }
                        ajaxChapters_1 = [];
                        tempAjaxChapter_1 = {};
                        ajaxParser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var chapterHref;
                                var initialName;
                                if (name === 'a' && attribs.href) {
                                    chapterHref = attribs.href;
                                    initialName = attribs.title || '';
                                    pushState(ParsingState.Chapter);
                                }
                                else if (name === 'option' && attribs.value) {
                                    chapterHref = attribs.value;
                                    initialName = '';
                                    pushState(ParsingState.Chapter);
                                }
                                if (chapterHref !== undefined) {
                                    var href = new URL(chapterHref, _this.site);
                                    tempAjaxChapter_1.path = href.pathname.substring(1);
                                    tempAjaxChapter_1.name = initialName;
                                }
                            },
                            ontext: function (data) {
                                var text = data.trim();
                                if (currentState() === ParsingState.Chapter &&
                                    !tempAjaxChapter_1.name &&
                                    text) {
                                    tempAjaxChapter_1.name += text;
                                }
                            },
                            onclosetag: function (name) {
                                if ((name === 'a' || name === 'option') &&
                                    currentState() === ParsingState.Chapter) {
                                    if (tempAjaxChapter_1.name && tempAjaxChapter_1.path) {
                                        tempAjaxChapter_1.name = tempAjaxChapter_1.name.trim();
                                        tempAjaxChapter_1.releaseTime = null;
                                        ajaxChapters_1.push(__assign({}, tempAjaxChapter_1));
                                    }
                                    tempAjaxChapter_1 = {};
                                    popState();
                                }
                            },
                        });
                        ajaxParser.write(ajaxHtml);
                        ajaxParser.end();
                        novel.chapters = ajaxChapters_1;
                        _b.label = 7;
                    case 7: return [2 /*return*/, novel];
                }
            });
        });
    };
    ReadNovelFullPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var response, html, $, depth, depthHide, chapterHtml, skipClosingTag, currentTagToSkip, stateStack, currentState, pushState, popState, escapeMap, escapeHtml, parser;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath)];
                    case 1:
                        response = _b.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        html = _b.sent();
                        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.customJs) {
                            try {
                                $ = (0, cheerio_1.load)(html);
                                html = $.html();
                            }
                            catch (error) {
                                console.error('Error executing customJs:', error);
                                throw error;
                            }
                        }
                        chapterHtml = [];
                        skipClosingTag = false;
                        currentTagToSkip = '';
                        stateStack = [ParsingState.Idle];
                        currentState = function () { return stateStack[stateStack.length - 1]; };
                        pushState = function (state) { return stateStack.push(state); };
                        popState = function () {
                            return stateStack.length > 1 ? stateStack.pop() : currentState();
                        };
                        escapeMap = {
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#39;',
                            ' ': '&nbsp;',
                            '\u200C': '', // this is probably a breaking change, report if paragraphs look weird
                        };
                        escapeHtml = function (text) {
                            return text.replace(/[&<>"'\xA0\u200C]/g, function (char) { return escapeMap[char]; });
                        };
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var _a;
                                var state = currentState();
                                var attrib = (_a = attribs.class) === null || _a === void 0 ? void 0 : _a.trim();
                                switch (state) {
                                    case ParsingState.Idle:
                                        if (attrib === 'txt' ||
                                            attribs.id === 'chr-content' ||
                                            attribs.id === 'chapter-content') {
                                            pushState(ParsingState.Chapter);
                                            depth = 0;
                                        }
                                        break;
                                    case ParsingState.Chapter:
                                        if (name === 'sub' || name === 'iframe') {
                                            pushState(ParsingState.Hidden);
                                        }
                                        else if (name === 'div') {
                                            depth++;
                                            if ((attrib === null || attrib === void 0 ? void 0 : attrib.includes('unlock-buttons')) ||
                                                (attrib === null || attrib === void 0 ? void 0 : attrib.includes('ads'))) {
                                                pushState(ParsingState.Hidden);
                                                depthHide = 0;
                                            }
                                        }
                                        break;
                                    case ParsingState.Hidden:
                                        if (name === 'sub') {
                                            // Allow nesting of hidden states if a sub is inside a div
                                            pushState(ParsingState.Hidden);
                                        }
                                        else if (name === 'div') {
                                            depthHide++;
                                        }
                                        break;
                                    default:
                                        return;
                                }
                                if (currentState() === ParsingState.Chapter) {
                                    var attrKeys = Object.keys(attribs);
                                    if (attrKeys.length === 0) {
                                        chapterHtml.push("<".concat(name, ">"));
                                    }
                                    else if (attrKeys.every(function (key) { return attribs[key].trim() === ''; })) {
                                        // Handle tags with empty attributes as text content
                                        // eg: novel/rising-up-from-a-nobleman-to-intergalactic-warlord/chapter-184
                                        skipClosingTag = true;
                                        currentTagToSkip = name;
                                        var uppercaseName = name.replace(/\b\w/g, function (char) {
                                            return char.toUpperCase();
                                        });
                                        chapterHtml.push(escapeHtml("<".concat(uppercaseName, " ").concat(attrKeys.join(' '), ">")));
                                    }
                                    else {
                                        // Normal tag with attributes
                                        var attrString = attrKeys
                                            .map(function (key) { return " ".concat(key, "=\"").concat(attribs[key].replace(/"/g, '&quot;'), "\""); })
                                            .join('');
                                        chapterHtml.push("<".concat(name).concat(attrString, ">"));
                                    }
                                }
                            },
                            ontext: function (text) {
                                if (currentState() === ParsingState.Chapter) {
                                    var data = escapeHtml(text);
                                    chapterHtml.push(data.trim().replace(/\s\s+/, ' '));
                                }
                            },
                            onclosetag: function (name) {
                                var state = currentState();
                                if (state === ParsingState.Hidden) {
                                    if (name === 'sub' || name === 'iframe') {
                                        popState();
                                    }
                                    else if (name === 'div') {
                                        depthHide--;
                                        if (depthHide < 0) {
                                            popState();
                                            depth--;
                                        }
                                    }
                                }
                                if (state !== ParsingState.Chapter) {
                                    return;
                                }
                                if (!parser['isVoidElement'](name)) {
                                    if (skipClosingTag && name === currentTagToSkip) {
                                        skipClosingTag = false;
                                        currentTagToSkip = '';
                                    }
                                    else {
                                        chapterHtml.push("</".concat(name, ">"));
                                    }
                                }
                                if (name === 'div') {
                                    depth--;
                                    if (depth < 0) {
                                        pushState(ParsingState.Stopped);
                                    }
                                }
                            },
                        });
                        parser.write(html);
                        parser.end();
                        return [2 /*return*/, chapterHtml.join('')];
                }
            });
        });
    };
    ReadNovelFullPlugin.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var now, _a, _b, pageParam, _c, searchKey, postSearch, langParam, urlLangCode, searchPage, params, url, fetchOptions, result, html, alertText;
            var _d, _e, _f;
            var _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        now = Date.now();
                        if (!(this.lastSearch && now - this.lastSearch <= this.searchInterval)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sleep(this.searchInterval)];
                    case 1:
                        _h.sent();
                        _h.label = 2;
                    case 2:
                        _a = this.options, _b = _a.pageParam, pageParam = _b === void 0 ? 'page' : _b, _c = _a.searchKey, searchKey = _c === void 0 ? 'keyword' : _c, postSearch = _a.postSearch, langParam = _a.langParam, urlLangCode = _a.urlLangCode, searchPage = _a.searchPage;
                        params = new URLSearchParams(__assign(__assign((_d = {}, _d[searchKey] = searchTerm, _d), (langParam && urlLangCode && (_e = {}, _e[langParam] = urlLangCode, _e))), (!postSearch && (_f = {}, _f[pageParam] = page.toString(), _f))));
                        url = "".concat(this.site).concat(searchPage).concat(!postSearch ? "?".concat(params.toString()) : '');
                        fetchOptions = postSearch
                            ? {
                                method: 'POST',
                                body: params.toString(),
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            }
                            : undefined;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, fetchOptions)];
                    case 3:
                        result = _h.sent();
                        this.lastSearch = Date.now();
                        if (!result.ok) {
                            throw new Error("Could not reach site ('".concat(result.status, "') try to open in webview."));
                        }
                        return [4 /*yield*/, result.text()];
                    case 4:
                        html = _h.sent();
                        alertText = ((_g = html.match(/alert\((.*?)\)/)) === null || _g === void 0 ? void 0 : _g[1]) || '';
                        if (alertText)
                            throw new Error(alertText);
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    return ReadNovelFullPlugin;
}());
exports.ReadNovelFullPlugin = ReadNovelFullPlugin;
var ParsingState;
(function (ParsingState) {
    ParsingState[ParsingState["Idle"] = 0] = "Idle";
    ParsingState[ParsingState["Info"] = 1] = "Info";
    ParsingState[ParsingState["Cover"] = 2] = "Cover";
    ParsingState[ParsingState["Author"] = 3] = "Author";
    ParsingState[ParsingState["Genres"] = 4] = "Genres";
    ParsingState[ParsingState["Status"] = 5] = "Status";
    ParsingState[ParsingState["Hidden"] = 6] = "Hidden";
    ParsingState[ParsingState["Summary"] = 7] = "Summary";
    ParsingState[ParsingState["Stopped"] = 8] = "Stopped";
    ParsingState[ParsingState["Chapter"] = 9] = "Chapter";
    ParsingState[ParsingState["ChapterList"] = 10] = "ChapterList";
    ParsingState[ParsingState["NovelName"] = 11] = "NovelName";
    ParsingState[ParsingState["NovelList"] = 12] = "NovelList";
})(ParsingState || (ParsingState = {}));
var plugin = new ReadNovelFullPlugin({ "id": "lightnovelplus", "sourceSite": "https://lightnovelplus.com/", "sourceName": "LightNovelPlus", "options": { "versionIncrements": 60, "novelListing": "book/bookclass.html", "searchPage": "book/search.html", "chapterListing": "get_chapter_list", "chapterParam": "bookId", "latestPage": "last_release", "pageParam": "page_num", "langParam": "language", "urlLangCode": "en" }, "filters": { "type": { "type": "Picker", "label": "Novel Listing", "value": "hot_novel", "options": [{ "label": "Hot Novel", "value": "hot_novel" }, { "label": "Novel Completed", "value": "completed_novel" }] }, "genres": { "type": "Picker", "label": "Genre", "value": "", "options": [{ "label": "Fantasy", "value": "60" }, { "label": "Action", "value": "132" }, { "label": "Sci-fi", "value": "61" }, { "label": "Romance", "value": "59" }, { "label": "Adventure", "value": "62" }, { "label": "Xuanhuan", "value": "64" }, { "label": "Modern", "value": "66" }, { "label": "Mystery", "value": "63" }, { "label": "Romance", "value": "68" }, { "label": "Fantasy", "value": "70" }, { "label": "Historical", "value": "74" }, { "label": "Sci-fi", "value": "75" }, { "label": "Xuanhuan", "value": "76" }, { "label": "Mystery", "value": "77" }, { "label": "Adventure", "value": "116" }, { "label": "LGBT+", "value": "182" }, { "label": "Fantasy Romance", "value": "134" }, { "label": "Video Games", "value": "243" }, { "label": "Sci-fi Romance", "value": "252" }, { "label": "Historical Romance", "value": "256" }, { "label": "Magical Realism", "value": "331" }, { "label": "Eastern Fantasy", "value": "334" }, { "label": "Contemporary Romance", "value": "344" }, { "label": "Games", "value": "503" }, { "label": "Urban", "value": "504" }, { "label": "Harem", "value": "517" }] } } });
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
            var result, _i, items_1, item, name_2, e_2;
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
                        name_2 = _a.sent();
                        result.push(__assign(__assign({}, item), { name: name_2 && name_2.trim() ? name_2 : item.name }));
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
            var capped, out, _i, capped_1, chapter, name_3, e_3;
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
                        name_3 = _a.sent();
                        out.push(__assign(__assign({}, chapter), { name: name_3 && name_3.trim() ? name_3 : chapter.name }));
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
            var updated, name_4, summary, translatedChapters, rest, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        updated = __assign({}, novel);
                        if (!(CFG.translateNovelNames && typeof updated.name === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, translateText(updated.name)];
                    case 1:
                        name_4 = _a.sent();
                        if (name_4 && name_4.trim())
                            updated.name = name_4;
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

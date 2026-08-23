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
var cheerio_1 = require("cheerio");
var filterInputs_1 = require("@libs/filterInputs");
var storage_1 = require("@libs/storage");
var defaultCover_1 = require("@libs/defaultCover");
var FenrirRealmPlugin = /** @class */ (function () {
    function FenrirRealmPlugin() {
        this.id = 'fenrir';
        this.name = 'Fenrir Realm';
        this.icon = 'src/en/fenrirrealm/icon.png';
        this.site = 'https://fenrirealm.com';
        this.version = '1.1.0';
        this.imageRequestInit = undefined;
        this.hideLocked = storage_1.storage.get('hideLocked');
        this.pluginSettings = {
            hideLocked: {
                value: '',
                label: 'Hide locked chapters',
                type: 'Switch',
            },
        };
        // resolveUrl = (path: string, isNovel?: boolean) =>
        //   this.site + '/series/' + path.split('~~')[0];
        this.filters = {
            status: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Status',
                value: 'any',
                options: [
                    { label: 'All', value: 'any' },
                    { label: 'Ongoing', value: 'ongoing' },
                    {
                        label: 'Completed',
                        value: 'completed',
                    },
                ],
            },
            sort: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Sort',
                value: 'popular',
                options: [
                    { label: 'Popular', value: 'popular' },
                    { label: 'Latest', value: 'latest' },
                    { label: 'Updated', value: 'updated' },
                ],
            },
            genres: {
                type: filterInputs_1.FilterTypes.CheckboxGroup,
                label: 'Genres',
                value: [],
                options: [
                    { 'label': 'Action', 'value': '1' },
                    { 'label': 'Adult', 'value': '2' },
                    {
                        'label': 'Adventure',
                        'value': '3',
                    },
                    { 'label': 'Comedy', 'value': '4' },
                    { 'label': 'Drama', 'value': '5' },
                    {
                        'label': 'Ecchi',
                        'value': '6',
                    },
                    { 'label': 'Fantasy', 'value': '7' },
                    { 'label': 'Gender Bender', 'value': '8' },
                    {
                        'label': 'Harem',
                        'value': '9',
                    },
                    { 'label': 'Historical', 'value': '10' },
                    { 'label': 'Horror', 'value': '11' },
                    {
                        'label': 'Josei',
                        'value': '12',
                    },
                    { 'label': 'Martial Arts', 'value': '13' },
                    { 'label': 'Mature', 'value': '14' },
                    {
                        'label': 'Mecha',
                        'value': '15',
                    },
                    { 'label': 'Mystery', 'value': '16' },
                    { 'label': 'Psychological', 'value': '17' },
                    {
                        'label': 'Romance',
                        'value': '18',
                    },
                    { 'label': 'School Life', 'value': '19' },
                    { 'label': 'Sci-fi', 'value': '20' },
                    {
                        'label': 'Seinen',
                        'value': '21',
                    },
                    { 'label': 'Shoujo', 'value': '22' },
                    { 'label': 'Shoujo Ai', 'value': '23' },
                    {
                        'label': 'Shounen',
                        'value': '24',
                    },
                    { 'label': 'Shounen Ai', 'value': '25' },
                    { 'label': 'Slice of Life', 'value': '26' },
                    {
                        'label': 'Smut',
                        'value': '27',
                    },
                    { 'label': 'Sports', 'value': '28' },
                    { 'label': 'Supernatural', 'value': '29' },
                    {
                        'label': 'Tragedy',
                        'value': '30',
                    },
                    { 'label': 'Wuxia', 'value': '31' },
                    { 'label': 'Xianxia', 'value': '32' },
                    {
                        'label': 'Xuanhuan',
                        'value': '33',
                    },
                    { 'label': 'Yaoi', 'value': '34' },
                    { 'label': 'Yuri', 'value': '35' },
                ],
            },
        };
    }
    FenrirRealmPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var params, res;
            var _this = this;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        params = new URLSearchParams({
                            page: pageNo.toString(),
                            per_page: '20',
                            status: filters.status.value,
                            order: showLatestNovels ? 'latest' : filters.sort.value,
                        });
                        filters.genres.value.forEach(function (g) { return params.append('genres[]', g); });
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/series/filter?").concat(params.toString())).then(function (r) {
                                return r.json().catch(function () {
                                    throw new Error('There was an error fetching the data from the server. Please try to open it in WebView');
                                });
                            })];
                    case 1:
                        res = _c.sent();
                        return [2 /*return*/, (res.data || []).map(function (r) { return _this.parseNovelFromApi(r); })];
                }
            });
        });
    };
    FenrirRealmPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanNovelPath, apiRes, slugMatch, searchSlug, words, SearchStr, searchRes, seriesData, summaryCheerio, novel, chapters;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        cleanNovelPath = novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/new/v2/series/").concat(novelPath, "/chapters"), {})];
                    case 1:
                        apiRes = _c.sent();
                        if (!!apiRes.ok) return [3 /*break*/, 6];
                        slugMatch = novelPath.match(/^\d+-(.+)$/);
                        searchSlug = slugMatch ? slugMatch[1] : novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/new/v2/series/").concat(searchSlug, "/chapters"), {})];
                    case 2:
                        apiRes = _c.sent();
                        cleanNovelPath = searchSlug;
                        if (!!apiRes.ok) return [3 /*break*/, 5];
                        words = searchSlug.replace(/-/g, ' ').split(' ');
                        SearchStr = words.find(function (w) { return w.length > 3; }) || words[0];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/series/filter?page=1&per_page=20&search=").concat(encodeURIComponent(SearchStr))).then(function (r) { return r.json(); })];
                    case 3:
                        searchRes = _c.sent();
                        if (!(searchRes.data && searchRes.data.length > 0)) return [3 /*break*/, 5];
                        cleanNovelPath = searchRes.data[0].slug;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/new/v2/series/").concat(cleanNovelPath, "/chapters"), {})];
                    case 4:
                        apiRes = _c.sent();
                        _c.label = 5;
                    case 5:
                        if (!apiRes.ok) {
                            throw new Error('Novel not found. It may have been removed or its URL changed significantly.');
                        }
                        _c.label = 6;
                    case 6: return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/api/new/v2/series/").concat(cleanNovelPath)).then(function (r) { return r.json(); })];
                    case 7:
                        seriesData = _c.sent();
                        summaryCheerio = (0, cheerio_1.load)(seriesData.description || '');
                        novel = {
                            path: cleanNovelPath,
                            name: seriesData.title || '',
                            summary: summaryCheerio('p').length > 0
                                ? summaryCheerio('p')
                                    .map(function (_, el) { return (0, cheerio_1.load)(el).text(); })
                                    .get()
                                    .join('\n\n')
                                : summaryCheerio.text() || '',
                            author: ((_a = seriesData.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = seriesData.user) === null || _b === void 0 ? void 0 : _b.username) || '',
                            cover: seriesData.cover
                                ? this.site + '/' + seriesData.cover
                                : defaultCover_1.defaultCover,
                            genres: (seriesData.genres || []).map(function (g) { return g.name; }).join(','),
                            status: seriesData.status || 'Unknown',
                        };
                        return [4 /*yield*/, apiRes.json()];
                    case 8:
                        chapters = _c.sent();
                        if (this.hideLocked) {
                            chapters = chapters.filter(function (c) { var _a; return !((_a = c.locked) === null || _a === void 0 ? void 0 : _a.price); });
                        }
                        novel.chapters = chapters
                            .map(function (c) {
                            var _a, _b, _c, _d, _e, _f;
                            return ({
                                name: (((_a = c.locked) === null || _a === void 0 ? void 0 : _a.price) ? '🔒 ' : '') +
                                    (((_b = c.group) === null || _b === void 0 ? void 0 : _b.index) == null ? '' : 'Vol ' + ((_c = c.group) === null || _c === void 0 ? void 0 : _c.index) + ' ') +
                                    'Chapter ' +
                                    c.number +
                                    (c.title && c.title.trim() != 'Chapter ' + c.number
                                        ? ' - ' + c.title.replace(/^chapter [0-9]+ . /i, '')
                                        : ''),
                                path: novelPath +
                                    (((_d = c.group) === null || _d === void 0 ? void 0 : _d.index) == null ? '' : '/' + ((_e = c.group) === null || _e === void 0 ? void 0 : _e.slug)) +
                                    '/' +
                                    (c.slug || 'chapter-' + c.number) +
                                    '~~' +
                                    c.id,
                                releaseTime: c.created_at,
                                chapterNumber: c.number + (((_f = c.group) === null || _f === void 0 ? void 0 : _f.index) || 0) * 10000,
                            });
                        })
                            .sort(function (a, b) { return a.chapterNumber - b.chapterNumber; });
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    FenrirRealmPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var chapterId, url_1, res, json, content, parsedContent, url, result, body, loadedCheerio, chapterText, jsonUrl, jsonRes, json, nodes, data, contentStr, contentJson, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chapterId = chapterPath.split('~~')[1];
                        if (!chapterId) return [3 /*break*/, 3];
                        url_1 = "".concat(this.site, "/api/new/v2/chapters/").concat(chapterId);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url_1)];
                    case 1:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _b.sent();
                        content = json.content;
                        if (content) {
                            parsedContent = JSON.parse(content);
                            if (parsedContent.type === 'doc') {
                                return [2 /*return*/, parsedContent.content
                                        .map(function (node) {
                                        var _a, _b, _c;
                                        if (node.type === 'paragraph') {
                                            var innerHtml = ((_a = node.content) === null || _a === void 0 ? void 0 : _a.map(function (c) {
                                                var _a;
                                                if (c.type === 'text') {
                                                    var text = c.text;
                                                    if (c.marks) {
                                                        for (var _i = 0, _b = c.marks; _i < _b.length; _i++) {
                                                            var mark = _b[_i];
                                                            if (mark.type === 'bold')
                                                                text = "<b>".concat(text, "</b>");
                                                            if (mark.type === 'italic')
                                                                text = "<i>".concat(text, "</i>");
                                                            if (mark.type === 'underline')
                                                                text = "<u>".concat(text, "</u>");
                                                            if (mark.type === 'strike')
                                                                text = "<strike>".concat(text, "</strike>");
                                                            if (mark.type === 'link')
                                                                text = "<a href=\"".concat((_a = mark.attrs) === null || _a === void 0 ? void 0 : _a.href, "\">").concat(text, "</a>");
                                                        }
                                                    }
                                                    return text;
                                                }
                                                if (c.type === 'hardBreak')
                                                    return '<br>';
                                                return '';
                                            }).join('')) || '';
                                            return "<p>".concat(innerHtml, "</p>");
                                        }
                                        if (node.type === 'heading') {
                                            var level = ((_b = node.attrs) === null || _b === void 0 ? void 0 : _b.level) || 1;
                                            var innerHtml = ((_c = node.content) === null || _c === void 0 ? void 0 : _c.map(function (c) { return c.text; }).join('')) || '';
                                            return "<h".concat(level, ">").concat(innerHtml, "</h").concat(level, ">");
                                        }
                                        return '';
                                    })
                                        .join('\n')];
                            }
                        }
                        _b.label = 3;
                    case 3:
                        url = "".concat(this.site, "/series/").concat(chapterPath.split('~~')[0]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 4:
                        result = _b.sent();
                        return [4 /*yield*/, result.text()];
                    case 5:
                        body = _b.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        chapterText = loadedCheerio('div.content-area p')
                            .map(function (_, el) { return "<p>".concat((0, cheerio_1.load)(el).html(), "</p>"); })
                            .get()
                            .join('\n');
                        if (chapterText) {
                            return [2 /*return*/, chapterText];
                        }
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 9, , 10]);
                        jsonUrl = "".concat(this.site, "/series/").concat(chapterPath.split('~~')[0], "/__data.json?x-sveltekit-invalidated=001");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(jsonUrl)];
                    case 7:
                        jsonRes = _b.sent();
                        return [4 /*yield*/, jsonRes.json()];
                    case 8:
                        json = _b.sent();
                        nodes = json.nodes;
                        data = (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(function (n) { return n.type === 'data'; })) === null || _a === void 0 ? void 0 : _a.data;
                        if (data) {
                            contentStr = data.find(function (d) { return typeof d === 'string' && d.includes('{"type":"doc"'); });
                            if (contentStr) {
                                contentJson = JSON.parse(contentStr);
                                if (contentJson.type === 'doc') {
                                    chapterText = contentJson.content
                                        .map(function (node) {
                                        var _a;
                                        if (node.type === 'paragraph') {
                                            var innerHtml = ((_a = node.content) === null || _a === void 0 ? void 0 : _a.map(function (c) {
                                                if (c.type === 'text') {
                                                    var text = c.text;
                                                    if (c.marks) {
                                                        for (var _i = 0, _a = c.marks; _i < _a.length; _i++) {
                                                            var mark = _a[_i];
                                                            if (mark.type === 'bold')
                                                                text = "<b>".concat(text, "</b>");
                                                            if (mark.type === 'italic')
                                                                text = "<i>".concat(text, "</i>");
                                                        }
                                                    }
                                                    return text;
                                                }
                                                return '';
                                            }).join('')) || '';
                                            return "<p>".concat(innerHtml, "</p>");
                                        }
                                        return '';
                                    })
                                        .join('\n');
                                }
                            }
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        e_1 = _b.sent();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/, chapterText];
                }
            });
        });
    };
    FenrirRealmPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, words, fallbackTerm;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/api/series/filter?page=").concat(pageNo, "&per_page=20&search=").concat(encodeURIComponent(searchTerm));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 1:
                        res = _a.sent();
                        if (!(pageNo === 1 && (!res.data || res.data.length === 0))) return [3 /*break*/, 3];
                        words = searchTerm.split(' ');
                        fallbackTerm = words.find(function (w) { return w.length > 3; }) || words[0];
                        if (!(fallbackTerm && fallbackTerm !== searchTerm)) return [3 /*break*/, 3];
                        url = "".concat(this.site, "/api/series/filter?page=").concat(pageNo, "&per_page=20&search=").concat(encodeURIComponent(fallbackTerm));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 2:
                        res = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, (res.data || []).map(function (novel) {
                            return _this.parseNovelFromApi(novel);
                        })];
                }
            });
        });
    };
    FenrirRealmPlugin.prototype.parseNovelFromApi = function (apiData) {
        return {
            name: apiData.title,
            path: apiData.slug,
            cover: this.site + '/' + apiData.cover,
            summary: apiData.description,
            status: apiData.status,
            genres: apiData.genres.map(function (g) { return g.name; }).join(','),
        };
    };
    return FenrirRealmPlugin;
}());
exports.default = new FenrirRealmPlugin();

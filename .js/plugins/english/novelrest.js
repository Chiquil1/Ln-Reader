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
var defaultCover_1 = require("@libs/defaultCover");
var novelStatus_1 = require("@libs/novelStatus");
/**
 * NovelRest LNReader Plugin
 *
 * This plugin allows LNReader to fetch novels from NovelRest (novelrest.vercel.app)
 *
 * Features:
 * - Browse popular novels with pagination
 * - Search novels
 * - Read chapters
 * - Filter by status
 * - Sort by latest/popular/rating/updated
 */
var NovelRestPlugin = /** @class */ (function () {
    function NovelRestPlugin() {
        var _this = this;
        this.id = 'novelrest';
        this.name = 'NovelRest';
        this.icon = 'src/en/novelrest/icon.png';
        this.site = 'https://novelrest.vercel.app';
        this.apiBase = 'https://novelrest.vercel.app/api/lnreader';
        this.version = '1.0.0';
        this.filters = {
            status: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Status',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Ongoing', value: 'ONGOING' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Hiatus', value: 'HIATUS' },
                ],
            },
            sort: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Sort By',
                value: 'latest',
                options: [
                    { label: 'Latest', value: 'latest' },
                    { label: 'Popular', value: 'popular' },
                    { label: 'Rating', value: 'rating' },
                    { label: 'Updated', value: 'updated' },
                ],
            },
        };
        /**
         * Resolve full URL for novel or chapter
         */
        this.resolveUrl = function (path, isNovel) {
            if (isNovel) {
                return "".concat(_this.site, "/novels/").concat(path);
            }
            // For chapters, path is "slug/chapterNumber"
            return "".concat(_this.site, "/novels/").concat(path);
        };
    }
    /**
     * Fetch popular/latest novels with pagination
     */
    NovelRestPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var novels, params, sortBy, url, response, data, _i, _c, novel, error_1;
            var _d, _e;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        novels = [];
                        params = new URLSearchParams();
                        params.set('page', pageNo.toString());
                        params.set('limit', '20');
                        if ((_d = filters === null || filters === void 0 ? void 0 : filters.status) === null || _d === void 0 ? void 0 : _d.value) {
                            params.set('status', filters.status.value);
                        }
                        sortBy = showLatestNovels
                            ? 'latest'
                            : ((_e = filters === null || filters === void 0 ? void 0 : filters.sort) === null || _e === void 0 ? void 0 : _e.value) || 'popular';
                        params.set('sort', sortBy);
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 4, , 5]);
                        url = "".concat(this.apiBase, "/novels?").concat(params.toString());
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 2:
                        response = _f.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _f.sent();
                        if (data.novels && Array.isArray(data.novels)) {
                            for (_i = 0, _c = data.novels; _i < _c.length; _i++) {
                                novel = _c[_i];
                                novels.push({
                                    name: novel.title,
                                    path: novel.slug, // Just the slug, we'll build full path in parseNovel
                                    cover: novel.coverImage || defaultCover_1.defaultCover,
                                });
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _f.sent();
                        console.error('NovelRest: Error fetching popular novels:', error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, novels];
                }
            });
        });
    };
    /**
     * Parse novel details and chapter list
     */
    NovelRestPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var novel, slug, response, data, chapters, _i, _a, chapter, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        novel = {
                            path: novelPath,
                            name: 'Untitled',
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        slug = novelPath.replace(/^\/novels\//, '');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.apiBase, "/novels/").concat(slug))];
                    case 2:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _b.sent();
                        if (data) {
                            novel.name = data.title || 'Untitled';
                            novel.author = data.author || '';
                            novel.cover = data.coverImage || defaultCover_1.defaultCover;
                            novel.genres = Array.isArray(data.genres)
                                ? data.genres
                                    .map(function (g) {
                                    return typeof g === 'string' ? g : g.name;
                                })
                                    .join(', ')
                                : '';
                            novel.summary = data.description || '';
                            // Map status
                            switch (data.status) {
                                case 'COMPLETED':
                                    novel.status = novelStatus_1.NovelStatus.Completed;
                                    break;
                                case 'ONGOING':
                                    novel.status = novelStatus_1.NovelStatus.Ongoing;
                                    break;
                                case 'HIATUS':
                                    novel.status = novelStatus_1.NovelStatus.OnHiatus;
                                    break;
                                default:
                                    novel.status = novelStatus_1.NovelStatus.Unknown;
                            }
                            chapters = [];
                            if (data.chapters && Array.isArray(data.chapters)) {
                                for (_i = 0, _a = data.chapters; _i < _a.length; _i++) {
                                    chapter = _a[_i];
                                    chapters.push({
                                        name: chapter.title || "Chapter ".concat(chapter.number),
                                        path: "".concat(slug, "/").concat(chapter.number), // slug/chapterNumber format
                                        releaseTime: chapter.createdAt || undefined,
                                        chapterNumber: chapter.number,
                                    });
                                }
                            }
                            novel.chapters = chapters;
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _b.sent();
                        console.error('NovelRest: Error parsing novel:', error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, novel];
                }
            });
        });
    };
    /**
     * Parse chapter content
     */
    NovelRestPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var parts, chapterNumber, slug, response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        parts = chapterPath.split('/');
                        chapterNumber = parts.pop();
                        slug = parts.join('/');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.apiBase, "/novels/").concat(slug, "/chapters/").concat(chapterNumber))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (data && data.contentHtml) {
                            return [2 /*return*/, data.contentHtml];
                        }
                        return [2 /*return*/, '<p>Chapter content could not be loaded.</p>'];
                    case 3:
                        error_3 = _a.sent();
                        console.error('NovelRest: Error parsing chapter:', error_3);
                        return [2 /*return*/, '<p>Error loading chapter content.</p>'];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Search novels by term
     */
    NovelRestPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var novels, params, response, data, _i, _a, novel, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        novels = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        params = new URLSearchParams();
                        params.set('q', searchTerm);
                        params.set('page', pageNo.toString());
                        params.set('limit', '20');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.apiBase, "/novels?").concat(params.toString()))];
                    case 2:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _b.sent();
                        if (data.novels && Array.isArray(data.novels)) {
                            for (_i = 0, _a = data.novels; _i < _a.length; _i++) {
                                novel = _a[_i];
                                novels.push({
                                    name: novel.title,
                                    path: novel.slug,
                                    cover: novel.coverImage || defaultCover_1.defaultCover,
                                });
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _b.sent();
                        console.error('NovelRest: Error searching novels:', error_4);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, novels];
                }
            });
        });
    };
    return NovelRestPlugin;
}());
exports.default = new NovelRestPlugin();
// trigger build

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
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var FictionZonePlugin = /** @class */ (function () {
    function FictionZonePlugin() {
        this.id = 'fictionzone';
        this.name = 'Fiction Zone';
        this.icon = 'src/en/fictionzone/icon.png';
        this.site = 'https://fictionzone.net';
        this.version = '1.0.2';
        this.filters = undefined;
        // resolveUrl = (path: string, isNovel?: boolean) =>
        //   this.site + '/' + path.split('|')[0];
    }
    FictionZonePlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getPage("/platform/browse?page=".concat(pageNo, "&page_size=20&sort_by=").concat(showLatestNovels ? 'created_at' : 'bookmark_count', "&sort_order=desc&include_genres=true"))];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    // TODO: Fix URLs, current URL leads to 404
    FictionZonePlugin.prototype.getData = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + '/api/__api_party/fictionzone', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify({
                                'path': url,
                                'headers': [
                                    ['content-type', 'application/json'],
                                    ['x-request-time', new Date().toISOString()],
                                ],
                                'method': 'GET',
                            }),
                        }).then(function (r) { return r.json(); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    FictionZonePlugin.prototype.getPage = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getData(url)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.data.novels.map(function (n) { return ({
                                name: n.title,
                                cover: "https://cdn.fictionzone.net/insecure/rs:fill:165:250/".concat(n.image, ".webp"),
                                path: "novel/".concat(n.slug),
                            }); })];
                }
            });
        });
    };
    FictionZonePlugin.prototype.getChapterPage = function (id, novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getData('/platform/chapter-lists?novel_id=' + id)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.data.chapters.map(function (n) { return ({
                                name: n.title,
                                number: n.chapter_number,
                                date: n.published_date
                                    ? new Date(n.published_date).toISOString()
                                    : undefined,
                                path: "".concat(novelPath, "/").concat(n.chapter_id, "|/platform/chapter-content?novel_id=").concat(id, "&chapter_id=").concat(n.chapter_id),
                            }); })];
                }
            });
        });
    };
    FictionZonePlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var novelSlug, data;
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        novelSlug = novelPath.replace('novel/', '');
                        return [4 /*yield*/, this.getData("/platform/novel-details?slug=".concat(novelSlug))];
                    case 1:
                        data = _c.sent();
                        _a = {
                            path: novelPath,
                            name: data.data.title,
                            cover: "https://cdn.fictionzone.net/insecure/rs:fill:165:250/".concat(data.data.image, ".webp"),
                            genres: __spreadArray(__spreadArray([], data.data.genres.map(function (g) { return g.name; }), true), data.data.tags.map(function (g) { return g.name; }), true).join(','),
                            status: data.data.status == 1
                                ? novelStatus_1.NovelStatus.Ongoing
                                : data.data.status == 0
                                    ? novelStatus_1.NovelStatus.Completed
                                    : novelStatus_1.NovelStatus.Unknown,
                            author: ((_b = data.data.contributors.filter(function (c) { return c.role == 'author'; })[0]) === null || _b === void 0 ? void 0 : _b.display_name) || '',
                            summary: data.data.synopsis
                        };
                        return [4 /*yield*/, this.getChapterPage(data.data.id, novelPath)];
                    case 2: return [2 /*return*/, (_a.chapters = _c.sent(),
                            _a)];
                }
            });
        });
    };
    FictionZonePlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getData(chapterPath.split('|')[1])];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, '<p>' + data.data.content.split('\n').join('</p><p>') + '</p>'];
                }
            });
        });
    };
    FictionZonePlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPage("/platform/browse?search=".concat(encodeURIComponent(searchTerm), "&page=").concat(pageNo, "&page_size=20&search_in_synopsis=true&sort_by=bookmark_count&sort_order=desc&include_genres=true"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return FictionZonePlugin;
}());
exports.default = new FictionZonePlugin();

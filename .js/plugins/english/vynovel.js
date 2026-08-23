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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var filterInputs_1 = require("@libs/filterInputs");
var defaultCover_1 = require("@libs/defaultCover");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var cheerio_1 = require("cheerio");
var dayjs_1 = __importDefault(require("dayjs"));
var VyNovel = /** @class */ (function () {
    function VyNovel() {
        var _this = this;
        this.id = 'vynovel';
        this.name = 'VyNovel';
        this.site = 'https://vynovel.com';
        this.version = '1.0.1';
        this.icon = 'src/en/vynovel/icon.png';
        this.resolveUrl = function (path, isNovel) {
            return _this.site + (isNovel ? '/novel/' : '/read/') + path;
        };
        this.filters = {
            sort: {
                label: 'Sort By:',
                value: 'viewed',
                options: [
                    { label: 'Viewed', value: 'viewed' },
                    { label: 'Scored', value: 'scored' },
                    { label: 'Newest', value: 'created_at' },
                    { label: 'Latest Update', value: 'updated_at' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    VyNovel.prototype.fetchNovels = function (page, showLatestNovels, filters, searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var data, url, body, loadedCheerio, novels;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        data = new URLSearchParams({
                            sort: showLatestNovels ? 'updated_at' : ((_a = filters === null || filters === void 0 ? void 0 : filters.sort) === null || _a === void 0 ? void 0 : _a.value) || 'viewed',
                            page: page.toString(),
                        });
                        if (searchTerm)
                            data.append('q', searchTerm);
                        url = this.site + '/search?' + data.toString();
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _b.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novels = [];
                        loadedCheerio('div[class="comic-item"] > a').each(function (_, element) {
                            var _a;
                            var name = (_a = loadedCheerio(element)
                                .find('div[class="comic-title"]')
                                .text()) === null || _a === void 0 ? void 0 : _a.trim();
                            var cover = loadedCheerio(element)
                                .find('div[class="comic-image lozad "]')
                                .attr('data-background-image') || defaultCover_1.defaultCover;
                            var url = loadedCheerio(element).attr('href');
                            if (!name || !url)
                                return;
                            novels.push({ name: name, cover: cover, path: url.replace('/novel/', '') });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    VyNovel.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.fetchNovels(page, showLatestNovels, filters)];
            });
        });
    };
    VyNovel.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.fetchNovels(page, false, undefined, searchTerm)];
            });
        });
    };
    VyNovel.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, novel, chapters, totalChapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.resolveUrl(novelPath, true)).then(function (res) {
                            return res.text();
                        })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('h1[class="title"]').text().trim(),
                            cover: loadedCheerio('div[class="img-manga"] > img').attr('src') ||
                                defaultCover_1.defaultCover,
                            summary: loadedCheerio('div[class="summary"] > p[class="content"]')
                                .text()
                                .trim(),
                            author: loadedCheerio('div[class="col-md-7"] > p:nth-child(5) > a')
                                .text()
                                .trim(),
                            status: loadedCheerio('span[class="text-ongoing"]').text() === 'Ongoing'
                                ? novelStatus_1.NovelStatus.Ongoing
                                : novelStatus_1.NovelStatus.Completed,
                        };
                        chapters = [];
                        totalChapters = loadedCheerio('div[class="list-group"] > a').length;
                        loadedCheerio('div[class="list-group"] > a').each(function (chapterIndex, element) {
                            var _a;
                            var name = loadedCheerio(element).find('span').text().trim();
                            var id = (_a = loadedCheerio(element).attr('id')) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, '');
                            if (!name || !id)
                                return;
                            var releaseDate = loadedCheerio(element).find('p').text();
                            chapters.push({
                                name: name,
                                path: novelPath + '/' + id,
                                releaseTime: _this.parseAgoDate(releaseDate),
                                chapterNumber: totalChapters - chapterIndex,
                            });
                        });
                        novel.chapters = chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    VyNovel.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, chapterText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.resolveUrl(chapterPath)).then(function (res) {
                            return res.text();
                        })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        chapterText = loadedCheerio('.content').html();
                        return [2 /*return*/, chapterText || ''];
                }
            });
        });
    };
    VyNovel.prototype.parseAgoDate = function (date) {
        //parseMadaraDate
        var parsed = (0, dayjs_1.default)(date);
        if (date && parsed.isValid()) {
            return parsed.toISOString();
        }
        var _a = (date === null || date === void 0 ? void 0 : date.toLowerCase().trim().split(/\s+/)) || [], amt = _a[0], time = _a[1], ago = _a[2];
        var decade = time === null || time === void 0 ? void 0 : time.includes('decade'); // dayjs no support, but just in case
        var amount = (amt === 'a' || amt === 'an' ? 1 : +amt) * (decade ? 10 : 1);
        var unit = (decade ? 'year' : time);
        var validUnits = [
            'millisecond', // waow
            'second',
            'minute',
            'hour',
            'day',
            'week',
            'month',
            'year',
        ];
        if (ago !== 'ago' || isNaN(amount) || !validUnits.includes(unit)) {
            return null;
        }
        return (0, dayjs_1.default)().subtract(amount, unit).toISOString();
    };
    return VyNovel;
}());
exports.default = new VyNovel();

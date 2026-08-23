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
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var WitchCultTranslations = /** @class */ (function () {
    function WitchCultTranslations() {
        this.id = 'witchculttranslations';
        this.name = 'Witch Cult Translations';
        this.site = 'https://witchculttranslation.com';
        this.icon = 'src/en/wct/icon.png';
        this.version = '1.0.0';
        this.cachedNovel = null;
    }
    WitchCultTranslations.prototype.novel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, body, loadedCheerio, latestArcCover;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.cachedNovel !== null) {
                            return [2 /*return*/, this.cachedNovel];
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        latestArcCover = loadedCheerio('.entry-content h1 img')
                            .last()
                            .attr('src');
                        this.cachedNovel = {
                            name: 'Re:Zero kara Hajimeru Isekai Seikatsu',
                            path: '/table-of-content',
                            cover: latestArcCover,
                        };
                        return [2 /*return*/, this.cachedNovel];
                }
            });
        });
    };
    WitchCultTranslations.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var novels, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        novels = [];
                        if (!(pageNo === 1)) return [3 /*break*/, 2];
                        _b = (_a = novels).push;
                        return [4 /*yield*/, this.novel()];
                    case 1:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 2;
                    case 2: return [2 /*return*/, novels];
                }
            });
        });
    };
    WitchCultTranslations.prototype.searchNovels = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var novels, q;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.novel()];
                    case 1:
                        novels = [_a.sent()];
                        q = this.normalize(searchTerm);
                        return [2 /*return*/, novels.filter(function (_a) {
                                var name = _a.name;
                                return _this.normalize(name).includes(q);
                            })];
                }
            });
        });
    };
    WitchCultTranslations.prototype.normalize = function (str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    };
    WitchCultTranslations.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, body, loadedCheerio, title, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        title = loadedCheerio('h1.entry-title').text().trim();
                        content = loadedCheerio('.entry-content').first();
                        content
                            .find('#patreon-snippet, .sharedaddy, .jp-relatedposts, #jp-post-flair')
                            .remove();
                        return [2 /*return*/, "<h1>".concat(title, "</h1>").concat(content.html() || '')];
                }
            });
        });
    };
    WitchCultTranslations.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, body, novel, loadedCheerio;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (0, fetch_1.fetchApi)(this.site + novelPath).then(function (result) { return result.text(); }),
                            this.novel(),
                        ])];
                    case 1:
                        _a = _b.sent(), body = _a[0], novel = _a[1];
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, __assign(__assign({}, novel), { author: 'Tappei Nagatsuki', chapters: this.parseChaptersFromTOC(loadedCheerio), status: novelStatus_1.NovelStatus.Ongoing, summary: 'Fan translation of the Re:Zero web novel (Arc 5 onwards).\n\nSuddenly, Natsuki Subaru, a shut-in student, is summoned to another world on his way home from the convenience store. A completely ordinary person with no knowledge, skills, combat abilities, or communication skills, he\'s thrown into this other world without any cheat bonuses and must desperately try to survive. The only blessing he receives is the painful ability to "return by death," which allows him to rewind time after dying! In this other world where he has no one to rely on, how many times will he die, and what will he ultimately gain?' })];
                }
            });
        });
    };
    WitchCultTranslations.prototype.parseChaptersFromTOC = function (loadedCheerio) {
        var chapters = [];
        var currentArc = 0;
        var chapterNumber = 0;
        var children = loadedCheerio('.entry-content')
            .first()
            .children()
            .toArray();
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var el = children_1[_i];
            if (el.type !== 'tag')
                continue;
            var tag = el.tagName.toLowerCase();
            if (tag === 'h1' || tag === 'h2') {
                var text = loadedCheerio(el).text().trim();
                var arcMatch = text.match(/^Arc\s+(\d+)/i);
                if (arcMatch) {
                    currentArc = parseInt(arcMatch[1], 10);
                    continue;
                }
                if (/^Side Content/i.test(text)) {
                    break;
                }
                continue;
            }
            if (tag !== 'ul' || currentArc < 5)
                continue;
            loadedCheerio(el)
                .find('li > a')
                .each(function (_, a) {
                var href = loadedCheerio(a).attr('href');
                if (!href)
                    return;
                var onSite = /^https?:\/\/(?:www\.)?witchculttranslation\.com\//i.test(href);
                if (!onSite)
                    return;
                var name = loadedCheerio(a).text().trim();
                if (!name)
                    return;
                var path = "/".concat(href
                    .replace(/^https?:\/\/(?:www\.)?witchculttranslation\.com\//i, '')
                    .replace(/^\/+/, ''));
                var dateMatch = path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\//);
                var releaseTime = dateMatch
                    ? "".concat(dateMatch[1], "-").concat(dateMatch[2], "-").concat(dateMatch[3])
                    : null;
                chapterNumber += 1;
                chapters.push({
                    name: "Arc ".concat(currentArc, ", ").concat(name),
                    path: path,
                    releaseTime: releaseTime,
                    chapterNumber: chapterNumber,
                });
            });
        }
        return chapters;
    };
    return WitchCultTranslations;
}());
exports.default = new WitchCultTranslations();

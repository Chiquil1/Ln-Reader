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
var filterInputs_1 = require("@libs/filterInputs");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");
var LnorisPlugin = /** @class */ (function () {
    function LnorisPlugin() {
        var _this = this;
        this.id = 'lnori';
        this.name = 'LNORI';
        this.icon = 'src/en/lnori/icon.png';
        this.site = 'https://lnori.com/';
        this.version = '1.0.0';
        this.resolveUrl = function (path, _isNovel) {
            return new URL(path, _this.site).href;
        };
        this.filters = {
            sort: {
                label: 'Sort By',
                value: 'popular',
                options: [
                    { label: 'Popular (Default)', value: 'popular' },
                    { label: 'Title A-Z', value: 'title-az' },
                    { label: 'Title Z-A', value: 'title-za' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genre: {
                label: 'Genre',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Academy', value: 'academy' },
                    { label: 'Action', value: 'action' },
                    { label: 'Adventure', value: 'adventure' },
                    { label: 'Comedy', value: 'comedy' },
                    { label: 'Drama', value: 'drama' },
                    { label: 'Fantasy', value: 'fantasy' },
                    { label: 'Harem', value: 'harem' },
                    { label: 'Historical', value: 'historical' },
                    { label: 'Isekai', value: 'isekai' },
                    { label: 'Magic', value: 'magic' },
                    { label: 'Mystery', value: 'mystery' },
                    { label: 'Psychological', value: 'psychological' },
                    { label: 'Reincarnation', value: 'reincarnation' },
                    { label: 'Romance', value: 'romance' },
                    { label: 'Sci-Fi', value: 'sci-fi' },
                    { label: 'Slice of Life', value: 'slice-of-life' },
                    { label: 'Tragedy', value: 'tragedy' },
                    { label: 'Female Protagonist', value: 'female protagonist' },
                    { label: 'Male Protagonist', value: 'male protagonist' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    LnorisPlugin.prototype.getLibraryNovels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, parsedList;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + 'library';
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        parsedList = [];
                        $('article.card').each(function (i, el) {
                            var name = $(el).attr('data-t') || '';
                            var author = $(el).attr('data-a') || '';
                            var tagsAttr = $(el).attr('data-tags') || '';
                            var tags = tagsAttr.split(',').map(function (t) { return t.trim().toLowerCase(); });
                            var coverImg = $(el).find('.card-cover img').first();
                            var cover = coverImg.attr('src') || '';
                            if (cover && cover.startsWith('/')) {
                                cover = _this.site + cover.substring(1);
                            }
                            var link = $(el).find('a.stretched-link').first();
                            var path = link.attr('href') || '';
                            if (path.startsWith('/')) {
                                path = path.substring(1);
                            }
                            if (path && name) {
                                parsedList.push({
                                    novel: {
                                        name: name,
                                        path: path,
                                        cover: cover || defaultCover_1.defaultCover,
                                    },
                                    author: author,
                                    tags: tags,
                                });
                            }
                        });
                        return [2 /*return*/, parsedList];
                }
            });
        });
    };
    LnorisPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var parsedList, filteredList, selectedGenre, selectedSort, pageSize, offset;
            var _c, _d;
            var filters = _b.filters;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.getLibraryNovels()];
                    case 1:
                        parsedList = _e.sent();
                        filteredList = parsedList;
                        selectedGenre = (_c = filters === null || filters === void 0 ? void 0 : filters.genre) === null || _c === void 0 ? void 0 : _c.value;
                        if (selectedGenre) {
                            filteredList = filteredList.filter(function (item) {
                                return item.tags.includes(selectedGenre.toLowerCase());
                            });
                        }
                        selectedSort = (_d = filters === null || filters === void 0 ? void 0 : filters.sort) === null || _d === void 0 ? void 0 : _d.value;
                        if (selectedSort === 'title-az') {
                            filteredList.sort(function (a, b) { return a.novel.name.localeCompare(b.novel.name); });
                        }
                        else if (selectedSort === 'title-za') {
                            filteredList.sort(function (a, b) { return b.novel.name.localeCompare(a.novel.name); });
                        }
                        pageSize = 36;
                        offset = (pageNo - 1) * pageSize;
                        return [2 /*return*/, filteredList
                                .slice(offset, offset + pageSize)
                                .map(function (item) { return item.novel; })];
                }
            });
        });
    };
    LnorisPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, novel, coverUrl, dataTagsAttr, parsedTags, genres_1, summaryParagraphs, volumeMap, getVolumeName, volumeUrls, volumePromises, chapters2D, chapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: $('.hero-card h1.s-title').text().trim() || 'Untitled',
                        };
                        coverUrl = $('.hero-card .cover-wrap img').attr('src');
                        if (coverUrl) {
                            novel.cover = coverUrl.startsWith('/')
                                ? this.site + coverUrl.substring(1)
                                : coverUrl;
                        }
                        else {
                            novel.cover = defaultCover_1.defaultCover;
                        }
                        dataTagsAttr = $('nav.tags-box.desktop').attr('data-tags');
                        if (dataTagsAttr) {
                            try {
                                parsedTags = JSON.parse(dataTagsAttr);
                                novel.genres = parsedTags
                                    .map(function (t) { return t.name; })
                                    .join(', ');
                            }
                            catch (e) {
                                // Fallback
                            }
                        }
                        if (!novel.genres) {
                            genres_1 = [];
                            $('nav.tags-box.desktop a, nav.tags-box a').each(function (i, el) {
                                var text = $(el).text().trim();
                                if (text)
                                    genres_1.push(text);
                            });
                            novel.genres = genres_1.join(', ');
                        }
                        summaryParagraphs = [];
                        $('section.desc-box p.description').each(function (i, el) {
                            var text = $(el).text().trim();
                            if (text)
                                summaryParagraphs.push(text);
                        });
                        novel.summary = summaryParagraphs.join('\n\n');
                        novel.author = $('.hero-card p.author').text().trim();
                        volumeMap = {};
                        $('a[href^="/book/"]').each(function (i, el) {
                            var href = $(el).attr('href');
                            var text = $(el).text().trim().replace(/\s+/g, ' ');
                            if (href) {
                                if (!volumeMap[href] ||
                                    (text && text.length > volumeMap[href].length)) {
                                    volumeMap[href] = text;
                                }
                            }
                        });
                        getVolumeName = function (href, text) {
                            var cleanText = text.replace(/Start Reading/gi, '').trim();
                            if (!cleanText) {
                                var parts = href.split('/');
                                var slug = parts[parts.length - 1] || parts[parts.length - 2] || '';
                                cleanText = slug
                                    .split('-')
                                    .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
                                    .join(' ');
                            }
                            return cleanText;
                        };
                        volumeUrls = Object.keys(volumeMap);
                        volumePromises = volumeUrls.map(function (volUrl) { return __awaiter(_this, void 0, void 0, function () {
                            var fullVolUrl, volHtml, $vol, volChapters, tocLinks;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        fullVolUrl = this.site.replace(/\/$/, '') + volUrl;
                                        return [4 /*yield*/, (0, fetch_1.fetchText)(fullVolUrl)];
                                    case 1:
                                        volHtml = _a.sent();
                                        $vol = (0, cheerio_1.load)(volHtml);
                                        volChapters = [];
                                        tocLinks = $vol('nav.toc-view a[href^="#"], nav#toc-list a[href^="#"]');
                                        if (tocLinks.length > 0) {
                                            tocLinks.each(function (i, el) {
                                                var href = $vol(el).attr('href');
                                                if (!href)
                                                    return;
                                                var id = href.substring(1);
                                                var tocTitle = $vol(el).text().trim().replace(/\s+/g, ' ');
                                                var section = $vol("section#".concat(id));
                                                var h2Title = section
                                                    .find('h2.chapter-title, h2, h3')
                                                    .first()
                                                    .text()
                                                    .trim();
                                                var chapterName = tocTitle || h2Title || "Page ".concat(id.replace(/\D/g, ''));
                                                var volTitle = getVolumeName(volUrl, volumeMap[volUrl]);
                                                var path = volUrl;
                                                if (path.startsWith('/')) {
                                                    path = path.substring(1);
                                                }
                                                path = path + '#' + id;
                                                volChapters.push({
                                                    name: "".concat(volTitle, " - ").concat(chapterName),
                                                    path: path,
                                                });
                                            });
                                        }
                                        else {
                                            $vol('section.chapter').each(function (i, el) {
                                                var id = $vol(el).attr('id');
                                                if (id) {
                                                    var h2Title = $vol(el)
                                                        .find('h2.chapter-title, h2, h3')
                                                        .first()
                                                        .text()
                                                        .trim();
                                                    if (!h2Title)
                                                        return;
                                                    var volTitle = getVolumeName(volUrl, volumeMap[volUrl]);
                                                    var path = volUrl;
                                                    if (path.startsWith('/')) {
                                                        path = path.substring(1);
                                                    }
                                                    path = path + '#' + id;
                                                    volChapters.push({
                                                        name: "".concat(volTitle, " - ").concat(h2Title),
                                                        path: path,
                                                    });
                                                }
                                            });
                                        }
                                        return [2 /*return*/, volChapters];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(volumePromises)];
                    case 2:
                        chapters2D = _a.sent();
                        chapters = chapters2D.flat();
                        novel.chapters = chapters.map(function (chap, idx) { return (__assign(__assign({}, chap), { chapterNumber: idx + 1 })); });
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    LnorisPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pathWithoutAnchor, anchor, url, body, $, tocAnchors, chapterSelector, section, currentIndex, nextAnchor, pagesContent, stepSection, mainContent, html, nextSibling, mainContent;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = chapterPath.split('#'), pathWithoutAnchor = _a[0], anchor = _a[1];
                        url = this.site.replace(/\/$/, '') + '/' + pathWithoutAnchor;
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        body = _b.sent();
                        $ = (0, cheerio_1.load)(body);
                        tocAnchors = [];
                        $('nav.toc-view a[href^="#"], nav#toc-list a[href^="#"]').each(function (i, el) {
                            var href = $(el).attr('href');
                            if (href) {
                                tocAnchors.push(href.substring(1));
                            }
                        });
                        chapterSelector = anchor ? "section#".concat(anchor) : 'section.chapter';
                        section = $(chapterSelector);
                        if (!section.length) {
                            throw new Error("Chapter section not found: ".concat(chapterPath));
                        }
                        if (tocAnchors.length > 0 && anchor) {
                            currentIndex = tocAnchors.indexOf(anchor);
                            nextAnchor = currentIndex !== -1 && currentIndex + 1 < tocAnchors.length
                                ? tocAnchors[currentIndex + 1]
                                : null;
                            pagesContent = [];
                            stepSection = section;
                            while (stepSection.length) {
                                mainContent = stepSection.find('.main').length
                                    ? stepSection.find('.main').clone()
                                    : stepSection.clone();
                                mainContent.find('h2, h3, .chapter-title').remove();
                                mainContent.find('img').each(function (i, el) {
                                    var src = $(el).attr('src');
                                    if (src && src.startsWith('/')) {
                                        $(el).attr('src', _this.site.replace(/\/$/, '') + src);
                                    }
                                });
                                mainContent.find('source').each(function (i, el) {
                                    var srcset = $(el).attr('srcset');
                                    if (srcset && srcset.startsWith('/')) {
                                        $(el).attr('srcset', _this.site.replace(/\/$/, '') + srcset);
                                    }
                                });
                                html = mainContent.html();
                                if (html) {
                                    pagesContent.push(html);
                                }
                                nextSibling = stepSection.next();
                                while (nextSibling.length && !nextSibling.is('section.chapter')) {
                                    nextSibling = nextSibling.next();
                                }
                                stepSection = nextSibling;
                                if (nextAnchor && stepSection.attr('id') === nextAnchor) {
                                    break;
                                }
                            }
                            return [2 /*return*/, pagesContent.join('\n')];
                        }
                        else {
                            mainContent = section.find('.main').length
                                ? section.find('.main').clone()
                                : section.clone();
                            mainContent.find('h2, h3, .chapter-title').remove();
                            mainContent.find('img').each(function (i, el) {
                                var src = $(el).attr('src');
                                if (src && src.startsWith('/')) {
                                    $(el).attr('src', _this.site.replace(/\/$/, '') + src);
                                }
                            });
                            mainContent.find('source').each(function (i, el) {
                                var srcset = $(el).attr('srcset');
                                if (srcset && srcset.startsWith('/')) {
                                    $(el).attr('srcset', _this.site.replace(/\/$/, '') + srcset);
                                }
                            });
                            return [2 /*return*/, mainContent.html() || ''];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    LnorisPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedList, term, filteredList, pageSize, offset;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLibraryNovels()];
                    case 1:
                        parsedList = _a.sent();
                        term = searchTerm.toLowerCase();
                        filteredList = parsedList.filter(function (item) {
                            return (item.novel.name.toLowerCase().includes(term) ||
                                item.author.toLowerCase().includes(term) ||
                                item.tags.some(function (t) { return t.includes(term); }));
                        });
                        pageSize = 36;
                        offset = (pageNo - 1) * pageSize;
                        return [2 /*return*/, filteredList
                                .slice(offset, offset + pageSize)
                                .map(function (item) { return item.novel; })];
                }
            });
        });
    };
    return LnorisPlugin;
}());
exports.default = new LnorisPlugin();

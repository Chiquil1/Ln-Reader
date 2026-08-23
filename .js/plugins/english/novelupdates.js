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
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var filterInputs_1 = require("@libs/filterInputs");
var NovelUpdates = /** @class */ (function () {
    function NovelUpdates() {
        this.id = 'novelupdates';
        this.name = 'Novel Updates';
        this.version = '0.9.9';
        this.icon = 'src/en/novelupdates/icon.png';
        this.customCSS = 'src/en/novelupdates/customCSS.css';
        this.site = 'https://www.novelupdates.com/';
        this.filters = {
            sort: {
                label: 'Sort Results By',
                value: 'popmonth',
                options: [
                    { label: 'Popular (Month)', value: 'popmonth' },
                    { label: 'Popular (All)', value: 'popular' },
                    { label: 'Last Updated', value: 'sdate' },
                    { label: 'Rating', value: 'srate' },
                    { label: 'Rank', value: 'srank' },
                    { label: 'Reviews', value: 'sreview' },
                    { label: 'Chapters', value: 'srel' },
                    { label: 'Title', value: 'abc' },
                    { label: 'Readers', value: 'sread' },
                    { label: 'Frequency', value: 'sfrel' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            order: {
                label: 'Order (Not for Popular)',
                value: 'desc',
                options: [
                    { label: 'Descending', value: 'desc' },
                    { label: 'Ascending', value: 'asc' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            storyStatus: {
                label: 'Story Status (Translation)',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Completed', value: '2' },
                    { label: 'Ongoing', value: '3' },
                    { label: 'Hiatus', value: '4' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genre_operator: {
                label: 'Genre (And/Or) (Not for Popular)',
                value: 'and',
                options: [
                    { label: 'And', value: 'and' },
                    { label: 'Or', value: 'or' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genres: {
                label: 'Genres',
                type: filterInputs_1.FilterTypes.ExcludableCheckboxGroup,
                value: {
                    include: [],
                    exclude: [],
                },
                options: [
                    { label: 'Action', value: '8' },
                    { label: 'Adult', value: '280' },
                    { label: 'Adventure', value: '13' },
                    { label: 'Comedy', value: '17' },
                    { label: 'Drama', value: '9' },
                    { label: 'Ecchi', value: '292' },
                    { label: 'Fantasy', value: '5' },
                    { label: 'Gender Bender', value: '168' },
                    { label: 'Harem', value: '3' },
                    { label: 'Historical', value: '330' },
                    { label: 'Horror', value: '343' },
                    { label: 'Josei', value: '324' },
                    { label: 'Martial Arts', value: '14' },
                    { label: 'Mature', value: '4' },
                    { label: 'Mecha', value: '10' },
                    { label: 'Mystery', value: '245' },
                    { label: 'Psychoical', value: '486' },
                    { label: 'Romance', value: '15' },
                    { label: 'School Life', value: '6' },
                    { label: 'Sci-fi', value: '11' },
                    { label: 'Seinen', value: '18' },
                    { label: 'Shoujo', value: '157' },
                    { label: 'Shoujo Ai', value: '851' },
                    { label: 'Shounen', value: '12' },
                    { label: 'Shounen Ai', value: '1692' },
                    { label: 'Slice of Life', value: '7' },
                    { label: 'Smut', value: '281' },
                    { label: 'Sports', value: '1357' },
                    { label: 'Supernatural', value: '16' },
                    { label: 'Tragedy', value: '132' },
                    { label: 'Wuxia', value: '479' },
                    { label: 'Xianxia', value: '480' },
                    { label: 'Xuanhuan', value: '3954' },
                    { label: 'Yaoi', value: '560' },
                    { label: 'Yuri', value: '922' },
                ],
            },
            language: {
                label: 'Language',
                value: [],
                options: [
                    { label: 'Chinese', value: '495' },
                    { label: 'Filipino', value: '9181' },
                    { label: 'Indonesian', value: '9179' },
                    { label: 'Japanese', value: '496' },
                    { label: 'Khmer', value: '18657' },
                    { label: 'Korean', value: '497' },
                    { label: 'Malaysian', value: '9183' },
                    { label: 'Thai', value: '9954' },
                    { label: 'Vietnamese', value: '9177' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            novelType: {
                label: 'Novel Type (Not for Popular)',
                value: [],
                options: [
                    { label: 'Light Novel', value: '2443' },
                    { label: 'Published Novel', value: '26874' },
                    { label: 'Web Novel', value: '2444' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            reading_list_operator: {
                label: 'Reading List (Include/Exclude) (Not for Popular)',
                value: 'include',
                options: [
                    { label: 'Include', value: 'include' },
                    { label: 'Exclude', value: 'exclude' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            reading_lists: {
                label: 'Reading Lists (Not for Popular)',
                value: [],
                options: [{ label: 'All Reading Lists', value: '-1' }],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
        };
    }
    NovelUpdates.prototype.parseNovels = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        loadedCheerio('div.search_main_box_nu').each(function (_, el) {
            var novelUrl = loadedCheerio(el).find('.search_title > a').attr('href');
            if (!novelUrl)
                return;
            novels.push({
                name: loadedCheerio(el).find('.search_title > a').text(),
                cover: loadedCheerio(el).find('img').attr('src'),
                path: novelUrl.replace(_this.site, ''),
            });
        });
        return novels;
    };
    NovelUpdates.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var url, response, body, loadedCheerio;
            var _c, _d, _e, _f;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        url = this.site;
                        // Build the URL based on filters
                        if (showLatestNovels) {
                            url += 'series-finder/?sf=1&sort=sdate&order=desc';
                        }
                        else if ((filters === null || filters === void 0 ? void 0 : filters.sort.value) === 'popmonth' ||
                            (filters === null || filters === void 0 ? void 0 : filters.sort.value) === 'popular') {
                            url += 'series-ranking/?rank=' + filters.sort.value;
                        }
                        else {
                            url += 'series-finder/?sf=1';
                            if (((_c = filters === null || filters === void 0 ? void 0 : filters.genres.value.include) === null || _c === void 0 ? void 0 : _c.length) ||
                                ((_d = filters === null || filters === void 0 ? void 0 : filters.genres.value.exclude) === null || _d === void 0 ? void 0 : _d.length)) {
                                url += '&mgi=' + filters.genre_operator.value;
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.novelType.value.length) {
                                url += '&nt=' + filters.novelType.value.join(',');
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.reading_lists.value.length) {
                                url += '&hd=' + (filters === null || filters === void 0 ? void 0 : filters.reading_lists.value.join(','));
                                url += '&mRLi=' + (filters === null || filters === void 0 ? void 0 : filters.reading_list_operator.value);
                            }
                            url += '&sort=' + (filters === null || filters === void 0 ? void 0 : filters.sort.value);
                            url += '&order=' + (filters === null || filters === void 0 ? void 0 : filters.order.value);
                        }
                        // Add common filters
                        if (filters === null || filters === void 0 ? void 0 : filters.language.value.length)
                            url += '&org=' + filters.language.value.join(',');
                        if ((_e = filters === null || filters === void 0 ? void 0 : filters.genres.value.include) === null || _e === void 0 ? void 0 : _e.length)
                            url += '&gi=' + filters.genres.value.include.join(',');
                        if ((_f = filters === null || filters === void 0 ? void 0 : filters.genres.value.exclude) === null || _f === void 0 ? void 0 : _f.length)
                            url += '&ge=' + filters.genres.value.exclude.join(',');
                        if (filters === null || filters === void 0 ? void 0 : filters.storyStatus.value)
                            url += '&ss=' + filters.storyStatus.value;
                        url += '&pg=' + page;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        response = _g.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        body = _g.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    NovelUpdates.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, body, loadedCheerio, novel, type, summary, rating, novelId, formData, chaptersHtml, chaptersCheerio, chapters;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = this.site + novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        response = _b.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        body = _b.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('.seriestitlenu').text() || 'Untitled',
                            cover: loadedCheerio('.wpb_wrapper img').attr('src'),
                            chapters: [],
                        };
                        novel.author = loadedCheerio('#authtag')
                            .map(function (_, el) { return loadedCheerio(el).text().trim(); })
                            .toArray()
                            .join(', ');
                        novel.genres = loadedCheerio('#seriesgenre')
                            .children('a')
                            .map(function (_, el) { return loadedCheerio(el).text(); })
                            .toArray()
                            .join(',');
                        novel.status = loadedCheerio('#editstatus').text().includes('Ongoing')
                            ? 'Ongoing'
                            : 'Completed';
                        type = loadedCheerio('#showtype').text().trim();
                        summary = loadedCheerio('#editdescription').text().trim();
                        novel.summary = summary + "\n\nType: ".concat(type);
                        rating = (_a = loadedCheerio('.seriesother .uvotes')
                            .text()
                            .match(/(\d+\.\d+) \/ \d+\.\d+/)) === null || _a === void 0 ? void 0 : _a[1];
                        if (rating) {
                            novel.rating = parseFloat(rating);
                        }
                        novelId = loadedCheerio('input#mypostid').attr('value');
                        formData = new FormData();
                        formData.append('action', 'nd_getchapters');
                        formData.append('mygrr', '0');
                        formData.append('mypostid', novelId);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "wp-admin/admin-ajax.php"), {
                                method: 'POST',
                                body: formData,
                            }).then(function (data) { return data.text(); })];
                    case 3:
                        chaptersHtml = _b.sent();
                        chaptersCheerio = (0, cheerio_1.load)(chaptersHtml);
                        chapters = [];
                        chaptersCheerio('li.sp_li_chp').each(function (_, el) {
                            var chapterName = chaptersCheerio(el)
                                .text()
                                .replace('v', 'volume ')
                                .replace('c', ' chapter ')
                                .replace('part', 'part ')
                                .replace('ss', 'SS')
                                .replace(/\b\w/g, function (l) { return l.toUpperCase(); })
                                .trim();
                            var chapterPath = 'https:' + chaptersCheerio(el).find('a').first().next().attr('href');
                            if (chapterPath)
                                chapters.push({
                                    name: chapterName,
                                    path: chapterPath.replace(_this.site, ''),
                                });
                        });
                        novel.chapters = chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelUpdates.prototype.getLocation = function (href) {
        var match = href.match(/^(https?:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && "".concat(match[1], "//").concat(match[3]);
    };
    NovelUpdates.prototype.getChapterBody = function (loadedCheerio, domain, chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var bloatElements, chapterTitle, chapterContent, chapterText, unwanted, targetDomain, _a, apiUrl, response, json, error_1, titleElement, extractBrightNovelsContent, fallbackContent, fallbackCheerio, parts, novelSlug, chapterSlug, url, response, json, data, chapterNumber, title, content, titleElement, error_2, content, url, json, nodes, data, contentKey, notesKey, footnotesKey, key, mapping, content, notes, footnotes, error_3, chapterSlug, apiUrl, response, json, chapterName, chapterNumber, chapterCheerio, error_4, url, response, body, matchResult, urlPath, pathSegments, pathDepth, loadedCheerioSlicedBread, chapterPath_1, response, body, titleElement, html, matches, scriptPath, scriptUrl, scriptText, ACTION_HASH, urlParts, _b, slug, chapterNum, response, rscText, segments, contentSegment, lines, metaSegment, meta, title, num, segments, novelSlug, chapterSlug, apiUrl, response, json, chapterNumber, chapterCheerio_1, error_5, chapterCheerio_2, parts, resolveRes, location_1, base, meta, id, token, total, i, part, formattedPart, parts, url, json, titleElement, displayedDiv, loadedCheerioSnow_1, titleElement, chapterId, url, ageVerification, url, response, body, titleElement, url, response, body, scriptContent, jsonString_wetried, chapterId, url, json;
            var _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        bloatElements = [];
                        chapterTitle = '';
                        chapterContent = '';
                        chapterText = '';
                        unwanted = ['app', 'blogspot', 'casper', 'wordpress', 'www'];
                        targetDomain = domain.find(function (d) { return !unwanted.includes(d); });
                        _a = targetDomain;
                        switch (_a) {
                            case 'akutranslations': return [3 /*break*/, 1];
                            case 'asuratls': return [3 /*break*/, 5];
                            case 'brightnovels': return [3 /*break*/, 6];
                            case 'canonstory': return [3 /*break*/, 7];
                            case 'daoist': return [3 /*break*/, 11];
                            case 'dreamy-translations': return [3 /*break*/, 12];
                            case 'fictionread': return [3 /*break*/, 13];
                            case 'genesistudio': return [3 /*break*/, 14];
                            case 'greenz': return [3 /*break*/, 19];
                            case 'hiraethtranslation': return [3 /*break*/, 25];
                            case 'hostednovel': return [3 /*break*/, 26];
                            case 'infinitenoveltranslations': return [3 /*break*/, 27];
                            case 'inoveltranslation': return [3 /*break*/, 31];
                            case 'isotls': return [3 /*break*/, 32];
                            case 'ko-fi': return [3 /*break*/, 33];
                            case 'leafstudio': return [3 /*break*/, 34];
                            case 'machineslicedbread': return [3 /*break*/, 35];
                            case 'mirilu': return [3 /*break*/, 39];
                            case 'mythoriatales': return [3 /*break*/, 40];
                            case 'novelplex': return [3 /*break*/, 45];
                            case 'novelshub': return [3 /*break*/, 46];
                            case 'novelworldtranslations': return [3 /*break*/, 52];
                            case 'patreon': return [3 /*break*/, 53];
                            case 'r-p-d': return [3 /*break*/, 54];
                            case 'raeitranslations': return [3 /*break*/, 63];
                            case 'rainofsnow': return [3 /*break*/, 65];
                            case 'readingpia': return [3 /*break*/, 66];
                            case 'redoxtranslation': return [3 /*break*/, 67];
                            case 'sacredtexttranslations': return [3 /*break*/, 69];
                            case 'scribblehub': return [3 /*break*/, 70];
                            case 'skydemonorder': return [3 /*break*/, 71];
                            case 'stabbingwithasyringe': return [3 /*break*/, 72];
                            case 'tinytranslation': return [3 /*break*/, 76];
                            case 'tumblr': return [3 /*break*/, 77];
                            case 'vampiramtl': return [3 /*break*/, 78];
                            case 'wattpad': return [3 /*break*/, 82];
                            case 'webnovel': return [3 /*break*/, 83];
                            case 'wetriedtls': return [3 /*break*/, 84];
                            case 'wuxiaworld': return [3 /*break*/, 85];
                            case 'yoru': return [3 /*break*/, 86];
                        }
                        return [3 /*break*/, 89];
                    case 1:
                        _m.trys.push([1, 4, , 5]);
                        apiUrl = chapterPath.replace('/novel', '/api/novel');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(apiUrl)];
                    case 2:
                        response = _m.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        json = _m.sent();
                        if (!(json === null || json === void 0 ? void 0 : json.content)) {
                            throw new Error('Invalid API response structure.');
                        }
                        chapterContent = json.content
                            .trim()
                            .split(/\n+/)
                            .map(function (p) { return p.trim(); })
                            .filter(function (p) { return p.length > 0; })
                            .map(function (p) { return "<p>".concat(p, "</p>"); })
                            .join('\n');
                        return [3 /*break*/, 89];
                    case 4:
                        error_1 = _m.sent();
                        throw new Error("Failed to parse AkuTranslations chapter: ".concat(error_1));
                    case 5:
                        {
                            titleElement = loadedCheerio('.post-body div b').first();
                            chapterTitle = titleElement.text();
                            titleElement.remove();
                            chapterContent = loadedCheerio('.post-body').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 6;
                    case 6:
                        {
                            extractBrightNovelsContent = function (cheerioInstance) {
                                // Remove ad-related bloat elements
                                var bloatElements = ['.ad-container', 'script', 'style'];
                                bloatElements.forEach(function (tag) { return cheerioInstance(tag).remove(); });
                                // Extract the data-page attribute from <div id="app">
                                var dataPage = cheerioInstance('#app').attr('data-page');
                                if (!dataPage) {
                                    throw new Error('data-page attribute not found on Bright Novels.');
                                }
                                // Parse the JSON from data-page
                                var pageData;
                                try {
                                    pageData = JSON.parse(dataPage);
                                }
                                catch (e) {
                                    throw new Error('Failed to parse data-page JSON for Bright Novels.');
                                }
                                var chapterTitle = pageData.props.chapter.title;
                                var chapterContent = pageData.props.chapter.content;
                                // Clean up content (remove inline styles/scripts if needed)
                                var chapterCheerio = (0, cheerio_1.load)(chapterContent);
                                chapterCheerio('script, style').remove();
                                chapterContent = chapterCheerio.html();
                                // Return formatted HTML
                                return "<h2>".concat(chapterTitle, "</h2><hr><br>").concat(chapterContent);
                            };
                            try {
                                chapterText = extractBrightNovelsContent(loadedCheerio);
                            }
                            catch (err) {
                                fallbackContent = loadedCheerio('#app').html() || loadedCheerio('body').html() || '';
                                fallbackCheerio = (0, cheerio_1.load)(fallbackContent);
                                fallbackCheerio('script, style').remove();
                                fallbackContent = fallbackCheerio.html();
                                chapterText = fallbackContent;
                            }
                            return [3 /*break*/, 89];
                        }
                        _m.label = 7;
                    case 7:
                        _m.trys.push([7, 10, , 11]);
                        parts = chapterPath.split('/');
                        if (parts.length < 7) {
                            throw new Error('Invalid chapter URL structure');
                        }
                        novelSlug = parts[4];
                        chapterSlug = parts[6];
                        url = "".concat(parts[0], "//").concat(parts[2], "/api/public/chapter-by-slug/").concat(novelSlug, "/").concat(chapterSlug);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 8:
                        response = _m.sent();
                        return [4 /*yield*/, response.json()];
                    case 9:
                        json = _m.sent();
                        if (!((_c = json === null || json === void 0 ? void 0 : json.data) === null || _c === void 0 ? void 0 : _c.currentChapter)) {
                            throw new Error('Invalid API response structure.');
                        }
                        data = json.data.currentChapter;
                        chapterNumber = data.chapterNumber, title = data.title, content = data.content;
                        titleElement = "Chapter ".concat(chapterNumber);
                        chapterTitle = title ? "".concat(titleElement, " - ").concat(title) : titleElement;
                        chapterContent = content.replace(/\n/g, '<br>');
                        return [3 /*break*/, 89];
                    case 10:
                        error_2 = _m.sent();
                        throw new Error("Failed to parse Canon Story chapter: ".concat(error_2));
                    case 11:
                        {
                            chapterTitle = loadedCheerio('.chapter__title').first().text();
                            // Remove locked content indicators
                            loadedCheerio('span.patreon-lock-icon').remove();
                            // Handle lazy-loaded images
                            loadedCheerio('img[data-src]').each(function (_, el) {
                                var $el = loadedCheerio(el);
                                var dataSrc = $el.attr('data-src');
                                if (dataSrc) {
                                    $el.attr('src', dataSrc);
                                    $el.removeAttr('data-src');
                                }
                            });
                            chapterContent = loadedCheerio('.chapter__content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 12;
                    case 12:
                        {
                            chapterTitle = loadedCheerio('h1 > span').first().text();
                            content = loadedCheerio('.chapter-content > div').first();
                            content.children('em').wrap('<p></p>');
                            chapterContent = content.html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 13;
                    case 13:
                        {
                            bloatElements = [
                                '.content > style',
                                '.highlight-ad-container',
                                '.meaning',
                                '.word',
                            ];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('.title-image span').first().text();
                            loadedCheerio('.content')
                                .children()
                                .each(function (_, el) {
                                var _a;
                                if ((_a = loadedCheerio(el).attr('id')) === null || _a === void 0 ? void 0 : _a.includes('Chaptertitle-info')) {
                                    loadedCheerio(el).remove();
                                    return false;
                                }
                            });
                            chapterContent = loadedCheerio('.content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 14;
                    case 14:
                        url = "".concat(chapterPath, "/__data.json?x-sveltekit-invalidated=001");
                        _m.label = 15;
                    case 15:
                        _m.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 16:
                        json = (_m.sent());
                        nodes = json.nodes;
                        data = nodes
                            .filter(function (node) { return node.type === 'data'; })
                            .map(function (node) { return node.data; })[0];
                        contentKey = 'content';
                        notesKey = 'notes';
                        footnotesKey = 'footnotes';
                        // Iterate over each property in data to find chapter containers
                        for (key in data) {
                            mapping = data[key];
                            // Check container for keys that match the required fields
                            if (mapping &&
                                typeof mapping === 'object' &&
                                contentKey in mapping &&
                                notesKey in mapping &&
                                footnotesKey in mapping) {
                                content = data[String(mapping[contentKey])];
                                notes = data[String(mapping[notesKey])];
                                footnotes = data[String(mapping[footnotesKey])];
                                // Combine the parts with appropriate formatting
                                chapterText =
                                    content +
                                        (notes ? "<h2>Notes</h2><br>".concat(notes) : '') +
                                        (footnotes !== null && footnotes !== void 0 ? footnotes : '');
                                break;
                            }
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        error_3 = _m.sent();
                        throw new Error("Failed to fetch chapter data: ".concat(error_3));
                    case 18: return [3 /*break*/, 89];
                    case 19:
                        chapterSlug = chapterPath.split('/').pop();
                        apiUrl = "https://greenz.com/api/chapters/slug/".concat(chapterSlug);
                        _m.label = 20;
                    case 20:
                        _m.trys.push([20, 23, , 24]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(apiUrl)];
                    case 21:
                        response = _m.sent();
                        return [4 /*yield*/, response.json()];
                    case 22:
                        json = _m.sent();
                        chapterName = json.data.name;
                        chapterNumber = json.data.chapterNumber;
                        chapterCheerio = (0, cheerio_1.load)(json.data.content);
                        chapterTitle = "Chapter ".concat(chapterNumber, " - ").concat(chapterName);
                        chapterContent = chapterCheerio.html();
                        return [3 /*break*/, 24];
                    case 23:
                        error_4 = _m.sent();
                        throw new Error("Failed to parse GreenzTL chapter: ".concat(error_4));
                    case 24: return [3 /*break*/, 89];
                    case 25:
                        {
                            chapterTitle = loadedCheerio('li.active').first().text();
                            chapterContent = loadedCheerio('.text-left').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 26;
                    case 26:
                        {
                            chapterTitle = loadedCheerio('#chapter-title').first().text();
                            chapterContent = loadedCheerio('#chapter-content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 27;
                    case 27:
                        url = loadedCheerio('article > p > a').first().attr('href');
                        if (!url) return [3 /*break*/, 30];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 28:
                        response = _m.sent();
                        return [4 /*yield*/, response.text()];
                    case 29:
                        body = _m.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        _m.label = 30;
                    case 30:
                        chapterContent = loadedCheerio('.entry-content').html();
                        chapterTitle = loadedCheerio('.entry-title').text();
                        return [3 /*break*/, 89];
                    case 31:
                        {
                            bloatElements = ['header', 'section'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterText = loadedCheerio('.styles_content__JHK8G').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 32;
                    case 32:
                        {
                            bloatElements = [
                                'footer',
                                'header',
                                'nav',
                                '.ezoic-ad',
                                '.ezoic-adpicker-ad',
                                '.ezoic-videopicker-video',
                            ];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('head title').first().text();
                            chapterContent = loadedCheerio('main article').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 33;
                    case 33:
                        {
                            matchResult = (_d = loadedCheerio('script:contains("shadowDom.innerHTML")')
                                .html()) === null || _d === void 0 ? void 0 : _d.match(/shadowDom\.innerHTML \+= '(<div.*?)';/);
                            if (matchResult && matchResult[1]) {
                                chapterText = matchResult[1];
                            }
                            return [3 /*break*/, 89];
                        }
                        _m.label = 34;
                    case 34:
                        {
                            chapterTitle = loadedCheerio('.title').first().text();
                            chapterContent = loadedCheerio('.chapter_content')
                                .map(function (_, el) { return loadedCheerio(el).prop('outerHTML'); })
                                .get()
                                .join('');
                            return [3 /*break*/, 89];
                        }
                        _m.label = 35;
                    case 35:
                        urlPath = chapterPath.split('/').filter(Boolean);
                        pathSegments = urlPath.slice(2);
                        pathDepth = pathSegments.length;
                        loadedCheerioSlicedBread = loadedCheerio;
                        if (!(pathDepth === 1)) return [3 /*break*/, 38];
                        chapterPath_1 = loadedCheerio('.entry-content a')
                            .first()
                            .attr('href');
                        if (!chapterPath_1) {
                            throw new Error('Chapter path not found.');
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chapterPath_1)];
                    case 36:
                        response = _m.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch chapter: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.text()];
                    case 37:
                        body = _m.sent();
                        loadedCheerioSlicedBread = (0, cheerio_1.load)(body);
                        _m.label = 38;
                    case 38:
                        // Extract chapter content
                        chapterText = loadedCheerioSlicedBread('.entry-content').html();
                        return [3 /*break*/, 89];
                    case 39:
                        {
                            bloatElements = ['#jp-post-flair'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            titleElement = loadedCheerio('.entry-content p strong').first();
                            chapterTitle = titleElement.text();
                            titleElement.remove();
                            chapterContent = loadedCheerio('.entry-content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 40;
                    case 40:
                        html = loadedCheerio('script:contains("script-2")').html();
                        if (!html)
                            throw new Error('Failed to find script-2');
                        matches = Array.from(html.matchAll(/"script-2.*?[^_]+([^\\]+)/g));
                        scriptPath = (_e = matches[1]) === null || _e === void 0 ? void 0 : _e[1];
                        if (!scriptPath)
                            throw new Error('Failed to extract script-2 URL');
                        scriptUrl = new URL("/".concat(scriptPath), chapterPath).href;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(scriptUrl)];
                    case 41: return [4 /*yield*/, (_m.sent()).text()];
                    case 42:
                        scriptText = _m.sent();
                        ACTION_HASH = (_f = scriptText.match(/[a-f0-9]{42}/)) === null || _f === void 0 ? void 0 : _f[0];
                        if (!ACTION_HASH)
                            throw new Error('Failed to extract ACTION_HASH');
                        urlParts = chapterPath.split('/');
                        _b = [urlParts[4], parseInt(urlParts[6], 10)], slug = _b[0], chapterNum = _b[1];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chapterPath, {
                                method: 'POST',
                                headers: {
                                    'Accept': 'text/x-component',
                                    'Content-Type': 'text/plain;charset=UTF-8',
                                    'next-action': ACTION_HASH,
                                },
                                body: JSON.stringify([slug, chapterNum]),
                            })];
                    case 43:
                        response = _m.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch chapter: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.text()];
                    case 44:
                        rscText = (_m.sent()).replace(/(\d+:[{TE])/g, '\n$1');
                        segments = rscText.split(/\n(?=\d+:[{TE])/);
                        contentSegment = segments
                            .filter(function (s) { return /^\d+:T/.test(s) && !s.startsWith('0:'); })
                            .map(function (s) { return s.replace(/^\d+:T[0-9a-f]+,/, ''); })
                            .join('');
                        if (!contentSegment) {
                            throw new Error('Could not find the chapter content segment (2:T) in the stream.');
                        }
                        lines = contentSegment
                            .trim()
                            .split(/(?:\r?\n|\\n)+/)
                            .map(function (line) { return line.trim(); })
                            .filter(function (line) { return line.length > 0; });
                        if (lines.length === 0) {
                            throw new Error('Parsed content is empty.');
                        }
                        metaSegment = segments.find(function (s) { return s.startsWith('1:'); });
                        if (metaSegment) {
                            try {
                                meta = JSON.parse(metaSegment.slice(2));
                                title = (_h = (_g = meta === null || meta === void 0 ? void 0 : meta.data) === null || _g === void 0 ? void 0 : _g.chapter) === null || _h === void 0 ? void 0 : _h.title;
                                num = (_l = (_k = (_j = meta === null || meta === void 0 ? void 0 : meta.data) === null || _j === void 0 ? void 0 : _j.chapter) === null || _k === void 0 ? void 0 : _k.chapterNumber) !== null && _l !== void 0 ? _l : chapterNum;
                                if (title)
                                    chapterTitle = "Chapter ".concat(num, ": ").concat(title);
                            }
                            catch (_o) {
                                // fall back to chapterNum if metadata parsing fails
                            }
                        }
                        if (!chapterTitle)
                            chapterTitle = "Chapter ".concat(chapterNum);
                        // 5. All lines from the content segment are paragraphs.
                        chapterContent = lines.map(function (p) { return "<p>".concat(p, "</p>"); }).join('\n');
                        // Clean up custom markup tags:
                        // Format [dialogue speaker="Name"]text[/dialogue] as "Name: text", drop [sfx] blocks entirely
                        chapterContent = chapterContent
                            .replace(/\[dialogue\s+speaker="([^"]*)"\](.*?)\[\/dialogue\]/gi, '$1: $2')
                            .replace(/\[sfx\].*?\[\/sfx\]/gi, '')
                            .replace(/\[\/?(dialogue|sfx)[^\]]*\]/gi, '');
                        return [3 /*break*/, 89];
                    case 45:
                        {
                            bloatElements = ['.passingthrough_adreminder'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('.halChap--jud').first().text();
                            chapterContent = loadedCheerio('.halChap--kontenInner ').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 46;
                    case 46:
                        segments = chapterPath.split('/');
                        novelSlug = segments[segments.length - 2];
                        chapterSlug = segments[segments.length - 1];
                        apiUrl = "https://api.novelshub.org/api/chapter?mangaslug=".concat(novelSlug, "&chapterslug=").concat(chapterSlug);
                        _m.label = 47;
                    case 47:
                        _m.trys.push([47, 50, , 51]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(apiUrl)];
                    case 48:
                        response = _m.sent();
                        return [4 /*yield*/, response.json()];
                    case 49:
                        json = _m.sent();
                        chapterNumber = json.chapter.number;
                        chapterCheerio_1 = (0, cheerio_1.load)(json.chapter.content);
                        chapterTitle = "Chapter ".concat(chapterNumber);
                        chapterCheerio_1('div').each(function (_, element) {
                            var el = chapterCheerio_1(element);
                            var style = el.attr('style');
                            if (!style)
                                return; // Skip elements without inline styles
                            // Orange box
                            if (/border:.*#ff6b00/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box_orange');
                                // Orange box title
                            }
                            else if (/color:.*#ff6b00.*text-transform:.*uppercase/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box-title_orange');
                                // Orange box text
                            }
                            else if (/color:.*white.*border-top:.*#ff6b00/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box-text_orange');
                                // Green box
                            }
                            else if (/border:.*#00ff88/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box_green');
                                // Green box title
                            }
                            else if (/color:.*#00ff88.*text-transform:.*uppercase/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box-title_green');
                                // Green comment
                            }
                            else if (/border-left:.*#00ff88/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_comment_green');
                                // Blue box
                            }
                            else if (/border:.*#0066ff/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box_blue');
                                // Blue box title
                            }
                            else if (/color:.*#0099ff.*text-transform:.*uppercase/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box-title_blue');
                                // Blue box text
                            }
                            else if (/color:.*#d0d0d0/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_box-text_blue');
                            }
                        });
                        chapterCheerio_1('span').each(function (_, element) {
                            var el = chapterCheerio_1(element);
                            var style = el.attr('style');
                            if (!style)
                                return; // Skip elements without inline styles
                            // Red text
                            if (/color:.*#ff6b6b/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_text_red');
                                // Blue text
                            }
                            else if (/color:.*#4d9fff/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_text_blue');
                                // Purple text
                            }
                            else if (/color:.*#a78bfa/.test(style)) {
                                el.removeAttr('style').addClass('novels-hub_text_purple');
                            }
                        });
                        chapterContent = chapterCheerio_1.html();
                        return [3 /*break*/, 51];
                    case 50:
                        error_5 = _m.sent();
                        throw new Error("Failed to parse GreenzTL chapter: ".concat(error_5));
                    case 51: return [3 /*break*/, 89];
                    case 52:
                        {
                            bloatElements = ['.separator img'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            loadedCheerio('.entry-content a')
                                .filter(function (_, el) {
                                var _a;
                                return (((_a = loadedCheerio(el)
                                    .attr('href')) === null || _a === void 0 ? void 0 : _a.includes('https://novelworldtranslations.blogspot.com')) ||
                                    false);
                            })
                                .each(function (_, el) {
                                loadedCheerio(el).parent().remove();
                            });
                            chapterTitle = loadedCheerio('.entry-title').first().text();
                            chapterContent = loadedCheerio('.entry-content')
                                .html()
                                .replace(/&nbsp;/g, '')
                                .replace(/\n/g, '<br>');
                            chapterCheerio_2 = (0, cheerio_1.load)(chapterContent);
                            chapterCheerio_2('span, p, div').each(function (_, el) {
                                if (chapterCheerio_2(el).text().trim() === '') {
                                    chapterCheerio_2(el).remove();
                                }
                            });
                            chapterContent = chapterCheerio_2.html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 53;
                    case 53:
                        {
                            loadedCheerio('#track-click,[class*="hidden "]').remove();
                            chapterTitle = loadedCheerio('h1[data-tag="post-title"]').text();
                            chapterContent = loadedCheerio('[data-tag="post-card"] [class*="PaddingTop"]').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 54;
                    case 54:
                        parts = chapterPath.split('/');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(parts[0], "//").concat(parts[2], "/resolve?p=/").concat(parts.slice(3).join('/')))];
                    case 55:
                        resolveRes = _m.sent();
                        return [4 /*yield*/, resolveRes.json()];
                    case 56:
                        location_1 = (_m.sent()).location;
                        parts = location_1.split('/');
                        base = "".concat(parts[0], "//").concat(parts[2]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(base, "/api/chapter-meta?seriesSlug=").concat(parts[4], "&chapterSlug=").concat(parts[5])).then(function (r) { return r.json(); })];
                    case 57:
                        meta = _m.sent();
                        id = meta.chapter.id;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(base, "/api/chapters/").concat(id, "/parts-token")).then(function (r) { return r.json(); })];
                    case 58:
                        token = (_m.sent()).token;
                        total = 1;
                        i = 1;
                        _m.label = 59;
                    case 59:
                        if (!(i <= total)) return [3 /*break*/, 62];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(base, "/api/chapters/").concat(id, "/parts?index=").concat(i, "&token=").concat(token)).then(function (r) { return r.json(); })];
                    case 60:
                        part = _m.sent();
                        formattedPart = '<p>' + part.markdown.replace(/\n\n/g, '</p><p>') + '</p>';
                        chapterText += formattedPart;
                        total = part.total;
                        _m.label = 61;
                    case 61:
                        i++;
                        return [3 /*break*/, 59];
                    case 62: return [3 /*break*/, 89];
                    case 63:
                        parts = chapterPath.split('/');
                        url = "".concat(parts[0], "//api.").concat(parts[2], "/api/chapters/single?id=").concat(parts[3], "&num=").concat(parts[4]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 64:
                        json = _m.sent();
                        titleElement = "Chapter ".concat(json.currentChapter.chapTag);
                        chapterTitle = json.currentChapter.chapTitle
                            ? "".concat(titleElement, " - ").concat(json.currentChapter.chapTitle)
                            : titleElement;
                        chapterContent = [
                            json.novelHead,
                            "<br><hr><br>",
                            json.currentChapter.body,
                            "<br><hr><br>Translator's Note:<br>",
                            json.currentChapter.note,
                        ].join('');
                        chapterContent = chapterContent.replace(/\n/g, '<br>');
                        return [3 /*break*/, 89];
                    case 65:
                        {
                            displayedDiv = loadedCheerio('.bb-item').filter(function () {
                                return loadedCheerio(this).css('display') === 'block';
                            });
                            loadedCheerioSnow_1 = (0, cheerio_1.load)(displayedDiv.html());
                            bloatElements = [
                                '.responsivevoice-button',
                                '.zoomdesc-cont p img',
                                '.zoomdesc-cont p noscript',
                            ];
                            bloatElements.forEach(function (tag) { return loadedCheerioSnow_1(tag).remove(); });
                            chapterContent = loadedCheerioSnow_1('.zoomdesc-cont').html();
                            titleElement = loadedCheerioSnow_1('.scroller h2').first();
                            if (titleElement.length) {
                                chapterTitle = titleElement.text();
                                titleElement.remove();
                                chapterContent = loadedCheerioSnow_1('.zoomdesc-cont').html();
                            }
                            return [3 /*break*/, 89];
                        }
                        _m.label = 66;
                    case 66:
                        {
                            bloatElements = ['.ezoic-ad', '.ezoic-adpicker-ad', '.ez-video-wrap'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterText = loadedCheerio('.chapter-body').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 67;
                    case 67:
                        chapterId = chapterPath.split('/').pop();
                        chapterTitle = "Chapter ".concat(chapterId);
                        url = "".concat(chapterPath.split('chapter')[0], "txt/").concat(chapterId, ".txt");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)
                                .then(function (r) { return r.text(); })
                                .then(function (text) {
                                // Split text into sentences based on newline characters
                                var sentences = text.split('\n');
                                // Process each sentence individually
                                var formattedSentences = sentences.map(function (sentence) {
                                    // Check if the sentence contains "<hr>"
                                    if (sentence.includes('{break}')) {
                                        // Create a centered sentence with three stars
                                        return '<br> <p>****</p>';
                                    }
                                    else {
                                        // Replace text enclosed within ** with <strong> tags
                                        sentence = sentence.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        // Replace text enclosed within ++ with <em> tags
                                        sentence = sentence.replace(/\+\+(.*?)\+\+/g, '<em>$1</em>');
                                        return sentence;
                                    }
                                });
                                // Join the formatted sentences back together with newline characters
                                return formattedSentences.join('<br>');
                            })];
                    case 68:
                        chapterContent = _m.sent();
                        return [3 /*break*/, 89];
                    case 69:
                        {
                            bloatElements = [
                                '.entry-content blockquote',
                                '.entry-content div',
                                '.reaction-buttons',
                            ];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('.entry-title').first().text();
                            chapterContent = loadedCheerio('.entry-content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 70;
                    case 70:
                        {
                            bloatElements = ['.wi_authornotes'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('.chapter-title').first().text();
                            chapterContent = loadedCheerio('.chp_raw').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 71;
                    case 71:
                        {
                            ageVerification = loadedCheerio('main').text().toLowerCase();
                            if (ageVerification.includes('age verification required')) {
                                throw new Error('Age verification required, please open in webview.');
                            }
                            chapterTitle = "".concat(loadedCheerio('header .font-medium.text-sm').first().text().trim());
                            chapterContent = loadedCheerio('#chapter-body').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 72;
                    case 72:
                        url = loadedCheerio('.entry-content a').attr('href');
                        if (!url) return [3 /*break*/, 75];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 73:
                        response = _m.sent();
                        return [4 /*yield*/, response.text()];
                    case 74:
                        body = _m.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        _m.label = 75;
                    case 75:
                        bloatElements = [
                            '.has-inline-color',
                            '.wp-block-buttons',
                            '.wpcnt',
                            '#jp-post-flair',
                        ];
                        bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                        chapterContent = loadedCheerio('.entry-content').html();
                        titleElement = loadedCheerio('.entry-content h3').first();
                        if (titleElement.length) {
                            chapterTitle = titleElement.text();
                            titleElement.remove();
                            chapterContent = loadedCheerio('.entry-content').html();
                        }
                        return [3 /*break*/, 89];
                    case 76:
                        {
                            bloatElements = [
                                '.content noscript',
                                '.google_translate_element',
                                '.navigate',
                                '.post-views',
                                'br',
                            ];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('.title-content').first().text();
                            loadedCheerio('.title-content').first().remove();
                            chapterContent = loadedCheerio('.content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 77;
                    case 77:
                        {
                            chapterText = loadedCheerio('.post').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 78;
                    case 78:
                        url = loadedCheerio('.entry-content a').attr('href');
                        if (!url) return [3 /*break*/, 81];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(chapterPath + url)];
                    case 79:
                        response = _m.sent();
                        return [4 /*yield*/, response.text()];
                    case 80:
                        body = _m.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        _m.label = 81;
                    case 81:
                        chapterTitle = loadedCheerio('.entry-title').first().text();
                        chapterContent = loadedCheerio('.entry-content').html();
                        return [3 /*break*/, 89];
                    case 82:
                        {
                            chapterTitle = loadedCheerio('.h2').first().text();
                            chapterContent = loadedCheerio('.part-content pre').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 83;
                    case 83:
                        {
                            chapterTitle = loadedCheerio('.cha-tit .pr .dib').first().text();
                            chapterContent = loadedCheerio('.cha-words').html();
                            if (!chapterContent) {
                                chapterContent = loadedCheerio('._content').html();
                            }
                            return [3 /*break*/, 89];
                        }
                        _m.label = 84;
                    case 84:
                        {
                            scriptContent = loadedCheerio('script:contains("p dir=")').html() ||
                                loadedCheerio('script:contains("u003c")').html();
                            if (scriptContent) {
                                jsonString_wetried = scriptContent.slice(scriptContent.indexOf('.push(') + '.push('.length, scriptContent.lastIndexOf(')'));
                                chapterText = JSON.parse(jsonString_wetried)[1];
                            }
                            return [3 /*break*/, 89];
                        }
                        _m.label = 85;
                    case 85:
                        {
                            bloatElements = ['.MuiLink-root'];
                            bloatElements.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                            chapterTitle = loadedCheerio('h4 span').first().text();
                            chapterContent = loadedCheerio('.chapter-content').html();
                            return [3 /*break*/, 89];
                        }
                        _m.label = 86;
                    case 86:
                        chapterId = chapterPath.split('/').pop();
                        url = "https://pxp-main-531j.onrender.com/api/v1/book_chapters/".concat(chapterId, "/content");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 87:
                        json = _m.sent();
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(json).then(function (r) { return r.text(); })];
                    case 88:
                        chapterText = _m.sent();
                        return [3 /*break*/, 89];
                    case 89:
                        if (!chapterText) {
                            if (chapterTitle) {
                                chapterText = "<h2>".concat(chapterTitle, "</h2><hr><br>").concat(chapterContent);
                            }
                            else {
                                chapterText = chapterContent;
                            }
                        }
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    NovelUpdates.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var chapterText, response, body, url, domainParts, loadedCheerio, blockedTitles, title, matches, isWordPress, isBlogspot, outliers, PLATFORM_CONFIG, config, chapterTitle, chapterSubtitle, chapterContent, chapterCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        body = _a.sent();
                        url = response.url;
                        domainParts = url.toLowerCase().split('/')[2].split('.');
                        loadedCheerio = (0, cheerio_1.load)(body);
                        blockedTitles = [
                            'bot verification',
                            'just a moment...',
                            'redirecting...',
                            'un instant...',
                            'you are being redirected...',
                        ];
                        title = loadedCheerio('title').text().trim().toLowerCase();
                        if (blockedTitles.includes(title)) {
                            throw new Error('Captcha detected, please open in webview.');
                        }
                        // Check if chapter url is wrong or site is down
                        if (!response.ok) {
                            throw new Error("Failed to fetch ".concat(response.url, ": ").concat(response.status, " ").concat(response.statusText));
                        }
                        matches = function (selector, attr, regex) {
                            var found = false;
                            loadedCheerio(selector).each(function (_, el) {
                                var val = attr
                                    ? loadedCheerio(el).attr(attr)
                                    : loadedCheerio(el).html() || loadedCheerio(el).text();
                                if (val && regex.test(val.toLowerCase())) {
                                    found = true;
                                    return false;
                                }
                            });
                            return found;
                        };
                        isWordPress = [
                            // 1. Meta Generator
                            matches('meta[name="generator"]', 'content', /wordpress|site kit/i),
                            // 2. Resource Paths (The most reliable way)
                            matches('link, script, img', 'src', /\/wp-content\/|\/wp-includes\//i),
                            matches('link', 'href', /\/wp-content\/|\/wp-includes\//i),
                            // 3. Header Links (REST API, RSD, etc.)
                            matches('link[rel="https://api.w.org/"]', 'href', /.*/),
                            matches('link[rel="EditURI"]', 'href', /xmlrpc\.php/i),
                            // 4. Common Body Classes
                            matches('body', 'class', /wp-admin|wp-custom-logo|logged-in/i),
                            // 5. Scripts containing WP globals
                            matches('script', null, /wp-embed|wp-emoji|wp-block/i),
                        ].some(Boolean);
                        isBlogspot = [
                            // 1. Meta Tags
                            matches('meta[name="generator"]', 'content', /blogger/i),
                            matches('meta[name="google-adsense-platform-domain"]', 'content', /blogspot/i),
                            // 2. Feed links
                            matches('link[rel="alternate"]', 'href', /blogger\.com\/feeds|blogspot\.com\/feeds/i),
                            // 3. Specific Blogger CSS/Template markers
                            matches('link', 'href', /www\.blogger\.com\/static|www\.blogger\.com\/dyn-css/i),
                            // 4. Blogger Script Widget Manager
                            matches('script', null, /_WidgetManager\._Init|_WidgetManager\._RegisterWidget/i),
                        ].some(Boolean);
                        outliers = [
                            'asuratls',
                            'fictionread',
                            'hiraethtranslation',
                            'infinitenoveltranslations',
                            'leafstudio',
                            'machineslicedbread',
                            'mirilu',
                            'novelworldtranslations',
                            'sacredtexttranslations',
                            'stabbingwithasyringe',
                            'tinytranslation',
                            'vampiramtl',
                        ];
                        if (domainParts.some(function (d) { return outliers.includes(d); })) {
                            isWordPress = false;
                            isBlogspot = false;
                        }
                        PLATFORM_CONFIG = {
                            wordpress: {
                                bloat: [
                                    '.ad',
                                    '.author-avatar',
                                    '.chapter-warning',
                                    '.entry-meta',
                                    '.ezoic-ad',
                                    '.mb-center',
                                    '.modern-footnotes-footnote__note',
                                    '.patreon-widget',
                                    '.post-cats',
                                    '.pre-bar',
                                    '.sharedaddy',
                                    '.sidebar',
                                    '.swg-button-v2-light',
                                    '.wp-block-buttons',
                                    '.wp-dark-mode-switcher',
                                    '.wp-next-post-navi',
                                    '#hpk',
                                    '#jp-post-flair',
                                    '#textbox',
                                ],
                                title: [
                                    '.entry-title',
                                    '.chapter__title',
                                    '.title-content',
                                    '.wp-block-post-title',
                                    '.title_story',
                                    '#chapter-heading',
                                    '.chapter-title',
                                    'head title',
                                    'h1:first-of-type',
                                    'h2:first-of-type',
                                    '.active',
                                ],
                                content: [
                                    '.chapter__content',
                                    '.entry-content',
                                    '.text_story',
                                    '.post-content',
                                    '.contenta',
                                    '.single_post',
                                    '.main-content',
                                    '.reader-content',
                                    '#content',
                                    '#the-content',
                                    'article.post',
                                    '.chp_raw',
                                ],
                            },
                            blogspot: {
                                bloat: ['.button-container', '.ChapterNav', '.ch-bottom', '.separator'],
                                title: ['.entry-title', '.post-title', 'head title'],
                                content: ['.content-post', '.entry-content', '.post-body'],
                            },
                        };
                        if (!(!isWordPress && !isBlogspot)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getChapterBody(loadedCheerio, domainParts, url)];
                    case 3:
                        chapterText = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        config = isWordPress
                            ? PLATFORM_CONFIG.wordpress
                            : PLATFORM_CONFIG.blogspot;
                        // Remove platform-specific bloat
                        config.bloat.forEach(function (tag) { return loadedCheerio(tag).remove(); });
                        chapterTitle = config.title
                            .map(function (sel) { return loadedCheerio(sel).first().text().trim(); })
                            .find(function (text) { return text.length > 0; });
                        chapterSubtitle = loadedCheerio('.cat-series').first().text() ||
                            loadedCheerio('h1.leading-none ~ span').first().text() ||
                            loadedCheerio('.breadcrumb .active').first().text();
                        if (chapterSubtitle)
                            chapterTitle = chapterSubtitle;
                        chapterContent = config.content
                            .map(function (sel) {
                            var el = loadedCheerio(sel).first();
                            // Ensure we don't pick up empty containers
                            return el.text().trim().length > 50 ? el.html() : null;
                        })
                            .find(function (html) { return html; });
                        // Construct Final Text
                        if (chapterTitle && chapterContent) {
                            chapterText = "<h2>".concat(chapterTitle, "</h2><hr><br>").concat(chapterContent);
                        }
                        else {
                            chapterText = chapterContent || '';
                        }
                        _a.label = 5;
                    case 5:
                        // Fallback content extraction
                        if (!chapterText) {
                            ['nav', 'header', 'footer', '.hidden'].forEach(function (tag) {
                                return loadedCheerio(tag).remove();
                            });
                            chapterText = loadedCheerio('body').html();
                        }
                        // Convert relative URLs to absolute
                        chapterText = chapterText.replace(/href="\//g, "href=\"".concat(this.getLocation(response.url), "/"));
                        chapterCheerio = (0, cheerio_1.load)(chapterText);
                        chapterCheerio('noscript').remove();
                        chapterCheerio('img').each(function (_, el) {
                            var $el = chapterCheerio(el);
                            // Only update if the lazy-loaded attribute exists
                            if ($el.attr('data-lazy-src')) {
                                $el.attr('src', $el.attr('data-lazy-src'));
                            }
                            if ($el.attr('data-lazy-srcset')) {
                                $el.attr('srcset', $el.attr('data-lazy-srcset'));
                            }
                            // Remove lazy-loading class if it exists
                            if ($el.hasClass('lazyloaded')) {
                                $el.removeClass('lazyloaded');
                            }
                        });
                        return [2 /*return*/, chapterCheerio.html()];
                }
            });
        });
    };
    NovelUpdates.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var splits, longestSearchTerm, url, response, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        splits = searchTerm.split('*');
                        longestSearchTerm = splits.reduce(function (a, b) { return (a.length > b.length ? a : b); }, '');
                        searchTerm = longestSearchTerm.replace(/[‘’]/g, "'").replace(/\s+/g, '+');
                        url = "".concat(this.site, "series-finder/?sf=1&sh=").concat(searchTerm, "&sort=srank&order=asc&pg=").concat(page);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    return NovelUpdates;
}());
exports.default = new NovelUpdates();

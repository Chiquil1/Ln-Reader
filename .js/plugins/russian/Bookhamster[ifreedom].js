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
exports.IfreedomPlugin = void 0;
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var htmlparser2_1 = require("htmlparser2");
var dayjs_1 = __importDefault(require("dayjs"));
var IfreedomPlugin = /** @class */ (function () {
    function IfreedomPlugin(metadata) {
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/ifreedom/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        this.version = '1.1.1';
        this.filters = metadata.filters;
    }
    IfreedomPlugin.prototype.parseNovels = function (url) {
        var _this = this;
        return (0, fetch_1.fetchApi)(url)
            .then(function (res) { return res.text(); })
            .then(function (html) {
            var novels = [];
            var tempNovel = {};
            var isInsideNovelCard = false;
            var site = _this.site;
            var parser = new htmlparser2_1.Parser({
                onopentag: function (name, attribs) {
                    var className = attribs['class'] || '';
                    if (name === 'div' &&
                        (className.includes('one-book-home') ||
                            className.includes('item-book-slide'))) {
                        isInsideNovelCard = true;
                    }
                    if (isInsideNovelCard) {
                        if (name === 'img') {
                            tempNovel.cover = attribs['src'];
                            if (attribs['alt'])
                                tempNovel.name = attribs['alt'];
                        }
                        if (name === 'a' && attribs['href']) {
                            tempNovel.path = attribs['href'].replace(site, '');
                            if (attribs['title'])
                                tempNovel.name = attribs['title'];
                        }
                    }
                },
                onclosetag: function (name) {
                    if (name === 'div' && isInsideNovelCard) {
                        isInsideNovelCard = false;
                        if (tempNovel.path)
                            novels.push(tempNovel);
                        tempNovel = {};
                    }
                },
            });
            parser.write(html);
            parser.end();
            return novels;
        });
    };
    IfreedomPlugin.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var url;
            var _c;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_d) {
                url = "".concat(this.site, "/vse-knigi/?sort=").concat(showLatestNovels ? 'По дате обновления' : ((_c = filters === null || filters === void 0 ? void 0 : filters.sort) === null || _c === void 0 ? void 0 : _c.value) || 'По рейтингу');
                Object.entries(filters || {}).forEach(function (_a) {
                    var type = _a[0], filter = _a[1];
                    var value = filter.value;
                    if (Array.isArray(value) && value.length) {
                        url += "&".concat(type, "[]=").concat(value.join("&".concat(type, "[]=")));
                    }
                });
                url += "&bpage=".concat(page);
                return [2 /*return*/, this.parseNovels(url)];
            });
        });
    };
    IfreedomPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var html, novel, chapters, genres, site, isReadingName, isReadingSummary, isCoverContainer, metaContext, isMetaRow, isMetaValue, isInsideChapterRow, isReadingChapterName, isReadingChapterDate, tempChapter, parser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath).then(function (res) {
                            return res.text();
                        })];
                    case 1:
                        html = _a.sent();
                        novel = {
                            path: novelPath,
                            name: '',
                            author: '',
                            summary: '',
                            status: novelStatus_1.NovelStatus.Unknown,
                        };
                        chapters = [];
                        genres = [];
                        site = this.site;
                        isReadingName = false;
                        isReadingSummary = false;
                        isCoverContainer = false;
                        metaContext = null;
                        isMetaRow = false;
                        isMetaValue = false;
                        isInsideChapterRow = false;
                        isReadingChapterName = false;
                        isReadingChapterDate = false;
                        tempChapter = {};
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var className = attribs['class'] || '';
                                if (name === 'h1')
                                    isReadingName = true;
                                if (name === 'div') {
                                    if (className.includes('block-book-slide-img') ||
                                        className.includes('img-ranobe')) {
                                        isCoverContainer = true;
                                    }
                                    if (className === 'descr-ranobe' ||
                                        (className === 'active' && attribs['data-name'] === 'Описание')) {
                                        isReadingSummary = true;
                                    }
                                }
                                if (isReadingSummary &&
                                    name === 'span' &&
                                    className.includes('open-desc')) {
                                    var onclick_1 = attribs['onclick'];
                                    if (onclick_1) {
                                        var match = onclick_1.match(/innerHTML\s*=\s*'([\s\S]+?)'/);
                                        if (match && match[1]) {
                                            var fullText = match[1];
                                            fullText = fullText
                                                .replace(/&lt;br&gt;/gi, '\n')
                                                .replace(/<br\s*\/?>/gi, '\n')
                                                .replace(/&quot;/g, '"')
                                                .replace(/&#039;/g, "'")
                                                .replace(/&amp;/g, '&');
                                            novel.summary = fullText;
                                            isReadingSummary = false;
                                        }
                                    }
                                }
                                if (name === 'img' && isCoverContainer && !novel.cover) {
                                    novel.cover = attribs['src'];
                                }
                                if (name === 'div') {
                                    if (className.includes('data-ranobe')) {
                                        isMetaRow = true;
                                        metaContext = null;
                                    }
                                    if (className.includes('data-value')) {
                                        isMetaValue = true;
                                    }
                                    if (className.includes('book-info-list')) {
                                        isMetaRow = true;
                                        metaContext = null;
                                    }
                                    if (className.includes('genreslist')) {
                                        metaContext = 'genre';
                                    }
                                }
                                if (isMetaRow) {
                                    if (name === 'span') {
                                        if (className.includes('dashicons-book') &&
                                            !className.includes('book-alt'))
                                            metaContext = 'genre';
                                        else if (className.includes('admin-users'))
                                            metaContext = 'author';
                                        else if (className.includes('megaphone'))
                                            metaContext = 'status';
                                    }
                                    if (name === 'svg') {
                                        if (className.includes('icon-tabler-tag'))
                                            metaContext = 'genre';
                                        else if (className.includes('mood-edit') ||
                                            className.includes('icon-tabler-user'))
                                            metaContext = 'author';
                                        else if (className.includes('chart-infographic') ||
                                            className.includes('megaphone'))
                                            metaContext = 'status';
                                    }
                                }
                                if (name === 'div' &&
                                    (className === 'li-ranobe' || className === 'chapterinfo')) {
                                    isInsideChapterRow = true;
                                }
                                if (name === 'a' && isInsideChapterRow) {
                                    tempChapter.path = attribs['href'].replace(site, '');
                                    isReadingChapterName = true;
                                }
                                if ((name === 'div' || name === 'span') &&
                                    (className === 'li-col2-ranobe' || className === 'timechapter')) {
                                    isReadingChapterDate = true;
                                }
                            },
                            ontext: function (data) {
                                var text = data.trim();
                                if (!text)
                                    return;
                                if (isReadingName)
                                    novel.name = text.replace(/®/g, '').trim();
                                if (isReadingSummary && text !== 'Прочесть полностью') {
                                    novel.summary += text + '\n';
                                }
                                if (metaContext) {
                                    var shouldRead = isMetaValue || (isMetaRow && !isMetaValue);
                                    if (shouldRead) {
                                        if (metaContext === 'author') {
                                            if (text !== 'Автор' &&
                                                text !== 'Переводчик' &&
                                                text !== 'Не указан' &&
                                                !text.includes('Просмотров')) {
                                                novel.author = text;
                                            }
                                        }
                                        else if (metaContext === 'status') {
                                            if (!text.includes('Статус'))
                                                novel.status = parseStatus(text);
                                        }
                                        else if (metaContext === 'genre') {
                                            if (text !== ',' && text !== 'Жанры')
                                                genres.push(text);
                                        }
                                    }
                                }
                                if (isReadingChapterName)
                                    tempChapter.name = text;
                                if (isReadingChapterDate)
                                    tempChapter.releaseTime = parseDate(text);
                            },
                            onclosetag: function (name) {
                                if (name === 'h1')
                                    isReadingName = false;
                                if (name === 'div') {
                                    if (isReadingSummary)
                                        isReadingSummary = false;
                                    if (isCoverContainer)
                                        isCoverContainer = false;
                                    if (isMetaValue)
                                        isMetaValue = false;
                                }
                                if (name === 'a')
                                    isReadingChapterName = false;
                                if ((name === 'div' || name === 'span') && isReadingChapterDate) {
                                    isReadingChapterDate = false;
                                    if (tempChapter.path) {
                                        chapters.push(tempChapter);
                                    }
                                    tempChapter = {};
                                    isInsideChapterRow = false;
                                }
                            },
                        });
                        parser.write(html);
                        parser.end();
                        novel.genres = genres.join(',');
                        novel.chapters = chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    IfreedomPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, startTag, endTag, chapterStart, chapterEnd, chapterText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath).then(function (res) {
                            return res.text();
                        })];
                    case 1:
                        body = _a.sent();
                        startTag = this.id === 'bookhamster'
                            ? '<div class="entry-content">'
                            : '<div class="chapter-content">';
                        endTag = this.id === 'bookhamster'
                            ? '<!-- .entry-content -->'
                            : '<div class="chapter-setting">';
                        chapterStart = body.indexOf(startTag);
                        if (chapterStart === -1)
                            return [2 /*return*/, ''];
                        chapterEnd = body.indexOf(endTag, chapterStart);
                        chapterText = body.slice(chapterStart, chapterEnd !== -1 ? chapterEnd : undefined);
                        chapterText = chapterText.replace(/<script[^>]*>[\s\S]*?<\/script>/gim, '');
                        if (chapterText.includes('<img')) {
                            chapterText = chapterText.replace(/srcset="([^"]+)"/g, function (match, src) {
                                if (!src)
                                    return match;
                                var bestLink = src
                                    .split(' ')
                                    .filter(function (s) { return s.startsWith('http'); })
                                    .pop();
                                return bestLink ? "src=\"".concat(bestLink, "\"") : match;
                            });
                        }
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    IfreedomPlugin.prototype.searchNovels = function (searchTerm_1) {
        return __awaiter(this, arguments, void 0, function (searchTerm, page) {
            var url;
            if (page === void 0) { page = 1; }
            return __generator(this, function (_a) {
                url = "".concat(this.site, "/vse-knigi/?searchname=").concat(encodeURIComponent(searchTerm), "&bpage=").concat(page);
                return [2 /*return*/, this.parseNovels(url)];
            });
        });
    };
    return IfreedomPlugin;
}());
exports.IfreedomPlugin = IfreedomPlugin;
function parseStatus(statusString) {
    var s = statusString.toLowerCase().trim();
    if (s.includes('активен') ||
        s.includes('продолжается') ||
        s.includes('онгоинг')) {
        return novelStatus_1.NovelStatus.Ongoing;
    }
    if (s.includes('завершен') || s.includes('конец') || s.includes('закончен')) {
        return novelStatus_1.NovelStatus.Completed;
    }
    if (s.includes('приостановлен') || s.includes('заморожен')) {
        return novelStatus_1.NovelStatus.OnHiatus;
    }
    return novelStatus_1.NovelStatus.Unknown;
}
function parseDate(dateString) {
    if (dateString === void 0) { dateString = ''; }
    var months = {
        января: 1,
        февраля: 2,
        марта: 3,
        апреля: 4,
        мая: 5,
        июня: 6,
        июля: 7,
        августа: 8,
        сентября: 9,
        октября: 10,
        ноября: 11,
        декабря: 12,
    };
    // Checking the format "X ч. назад"
    var relativeTimeRegex = /(d+)s*ч.?s*назад/;
    var match = dateString.match(relativeTimeRegex);
    if (match) {
        var hoursAgo = parseInt(match[1], 10);
        return (0, dayjs_1.default)().subtract(hoursAgo, 'hour').format('LL');
    }
    if (dateString.includes('.')) {
        var _a = dateString.split('.'), day = _a[0], month = _a[1], year = _a[2];
        var fullYear = (year === null || year === void 0 ? void 0 : year.length) === 2 ? '20' + year : year;
        return (0, dayjs_1.default)(fullYear + '-' + month + '-' + day).format('LL');
    }
    else if (dateString.includes(' ')) {
        var _b = dateString.split(' '), day = _b[0], month = _b[1];
        if (day && months[month]) {
            var year = new Date().getFullYear();
            return (0, dayjs_1.default)(year + '-' + months[month] + '-' + day).format('LL');
        }
    }
    return dateString || null;
}
var plugin = new IfreedomPlugin({ "id": "bookhamster", "sourceSite": "https://bookhamster.ru", "sourceName": "Bookhamster", "filters": { "sort": { "type": "Picker", "label": "Сортировка:", "options": [{ "label": "По дате добавления", "value": "По дате добавления" }, { "label": "По дате обновления", "value": "По дате обновления" }, { "label": "По количеству глав", "value": "По количеству глав" }, { "label": "По названию", "value": "По названию" }, { "label": "По просмотрам", "value": "По просмотрам" }, { "label": "По рейтингу", "value": "По рейтингу" }], "value": "По рейтингу" }, "status": { "type": "CheckboxGroup", "label": "Статус:", "options": [{ "label": "Перевод активен", "value": "Перевод активен" }, { "label": "Перевод приостановлен", "value": "Перевод приостановлен" }, { "label": "Произведение завершено", "value": "Произведение завершено" }], "value": [] }, "lang": { "type": "CheckboxGroup", "label": "Язык:", "options": [{ "label": "Английский", "value": "Английский" }, { "label": "Китайский", "value": "Китайский" }, { "label": "Корейский", "value": "Корейский" }, { "label": "Японский", "value": "Японский" }], "value": [] }, "genre": { "type": "CheckboxGroup", "label": "Жанры:", "options": [{ "label": "Боевик", "value": "Боевик" }, { "label": "Боевые Искусства", "value": "Боевые Искусства" }, { "label": "Вампиры", "value": "Вампиры" }, { "label": "Виртуальный Мир", "value": "Виртуальный Мир" }, { "label": "Гарем", "value": "Гарем" }, { "label": "Героическое фэнтези", "value": "Героическое фэнтези" }, { "label": "Детектив", "value": "Детектив" }, { "label": "Дзёсэй", "value": "Дзёсэй" }, { "label": "Драма", "value": "Драма" }, { "label": "Игра", "value": "Игра" }, { "label": "История", "value": "История" }, { "label": "Киберпанк", "value": "Киберпанк" }, { "label": "Комедия", "value": "Комедия" }, { "label": "ЛитРПГ", "value": "ЛитРПГ" }, { "label": "Меха", "value": "Меха" }, { "label": "Милитари", "value": "Милитари" }, { "label": "Мистика", "value": "Мистика" }, { "label": "Научная Фантастика", "value": "Научная Фантастика" }, { "label": "Повседневность", "value": "Повседневность" }, { "label": "Постапокалипсис", "value": "Постапокалипсис" }, { "label": "Приключения", "value": "Приключения" }, { "label": "Психология", "value": "Психология" }, { "label": "Романтика", "value": "Романтика" }, { "label": "Сверхъестественное", "value": "Сверхъестественное" }, { "label": "Сёдзё", "value": "Сёдзё" }, { "label": "Сёнэн", "value": "Сёнэн" }, { "label": "Сёнэн-ай", "value": "Сёнэн-ай" }, { "label": "Спорт", "value": "Спорт" }, { "label": "Сэйнэн", "value": "Сэйнэн" }, { "label": "Сюаньхуа", "value": "Сюаньхуа" }, { "label": "Трагедия", "value": "Трагедия" }, { "label": "Триллер", "value": "Триллер" }, { "label": "Ужасы", "value": "Ужасы" }, { "label": "Фантастика", "value": "Фантастика" }, { "label": "Фэнтези", "value": "Фэнтези" }, { "label": "Школьная жизнь", "value": "Школьная жизнь" }, { "label": "Экшн", "value": "Экшн" }, { "label": "Эротика", "value": "Эротика" }, { "label": "Этти", "value": "Этти" }, { "label": "Яой", "value": "Яой" }, { "label": "Adult", "value": "Adult" }, { "label": "Mature", "value": "Mature" }, { "label": "Xianxia", "value": "Xianxia" }, { "label": "Xuanhuan", "value": "Xuanhuan" }], "value": [] } } });
exports.default = plugin;

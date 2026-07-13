"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const fetch_1 = require("@libs/fetch");
const defaultCover_1 = require("@libs/defaultCover");
const cheerio_1 = require("cheerio");
class RncalationPlugin {
    constructor() {
        this.id = 'rncalation';
        this.name = 'RNCALATION';
        this.site = 'https://rncalation.online/';
        this.version = '1.0.0';
        this.icon = 'src/spanish/rncalation/icon.png';
        this.filters = undefined;
        this.resolveUrl = (path, isNovel) => this.site + path;
    }
    async popularNovels(pageNo, options) {
        const url = `${this.site}?page=${pageNo}&sort=popular`;
        const body = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(body);
        const novels = [];
        $('div.card, div.novel-item, .flex.flex-col').each((index, element) => {
            const type = $(element).find('.text-sm, .badge, span').text().trim();
            if (type.toLowerCase().includes('novel') || $(element).text().toLowerCase().includes('novela')) {
                const name = $(element).find('h1, h2, .title').text().trim();
                const href = $(element).find('a').attr('href') || '';
                const cover = $(element).find('img').attr('src') || defaultCover_1.defaultCover;
                if (name && href) {
                    novels.push({
                        name,
                        path: href.replace(this.site, ''),
                        cover,
                    });
                }
            }
        });
        return novels;
    }
    async parseNovel(novelPath) {
        const body = await (0, fetch_1.fetchText)(this.site + novelPath);
        const $ = (0, cheerio_1.load)(body);
        const novel = {
            path: novelPath,
            name: $('h1').first().text().trim() || 'Novela sin título',
        };
        novel.cover = $('.comic-cover img, .cover-container img, img.comic-cover__img').first().attr('src') || defaultCover_1.defaultCover;
        novel.summary = $('.comic-description, .synopsis, .description, #sinopsis, p').first().text().trim();
        const novelChapters = [];
        $('a[href*="/cap/"]').each((index, element) => {
            let chapterName = $(element).text().trim();
            const chapterHref = $(element).attr('href') || '';
            if (chapterHref && !chapterName.toLowerCase().includes('comenzar')) {
                if (chapterName.includes(', ')) {
                    chapterName = chapterName.split(', ')[0].trim();
                }
                novelChapters.push({
                    name: chapterName,
                    path: chapterHref.replace(this.site, ''),
                    releaseTime: '',
                    chapterNumber: novelChapters.length + 1,
                });
            }
        });
        novel.chapters = novelChapters.reverse();
        return novel;
    }
    async parseChapter(chapterPath) {
        const body = await (0, fetch_1.fetchText)(this.site + chapterPath);
        const $ = (0, cheerio_1.load)(body);
        // Extraer contenido HTML
        let chapterHtml = $('.chapter-content, #contenido-novela, .text-content').html() || '';
        if (!chapterHtml)
            return '';
        const $chapter = (0, cheerio_1.load)(chapterHtml);
        // Limpieza de scripts, anuncios y basura igual al ejemplo de SkyNovels
        $chapter('script, style, ins, .chapter-ad, .adsbygoogle, .hidden, [style*="display:none"]').remove();
        // Limpieza específica para optimizar el lector TTS de Moon+ Reader / LNReader
        $chapter('*').contents().each((_, element) => {
            if (element.type === 'text' && element.data) {
                let text = element.data;
                text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, ''); // Caracteres invisibles
                text = text.replace(/[\\\/]+/g, '') // Barras duplicadas
                    .replace(/[—––─]/g, '-') // Rayas de diálogo orientales
                    .replace(/[\*_~|•♦¤°]/g, '') // Adornos
                    .trim();
                element.data = text;
            }
        });
        return $chapter.html();
    }
    async searchNovels(searchTerm, pageNo) {
        const url = `${this.site}?search=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
        const body = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(body);
        const novels = [];
        $('div.card, div.novel-item, .flex.flex-col').each((index, element) => {
            const name = $(element).find('h1, h2, .title').text().trim();
            const href = $(element).find('a').attr('href') || '';
            const cover = $(element).find('img').attr('src') || defaultCover_1.defaultCover;
            if (name && href) {
                novels.push({ name, path: href.replace(this.site, ''), cover });
            }
        });
        return novels;
    }
}
module.exports = new RncalationPlugin();

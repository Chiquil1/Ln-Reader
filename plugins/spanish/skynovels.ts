import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { FilterTypes, Filters } from '@libs/filterInputs';
import { load } from 'cheerio';

class SkyNovels implements Plugin.PluginBase {
  id = 'skynovels-custom';
  name = 'SkyNovels';
  site = 'https://www.skynovels.net/';
  apiSite = 'https://api.skynovels.net/api/';
  version = '1.1.5'; // Fix: reconstruir/segmentar párrafos para que el TTS no corte por bloques de texto demasiado largos
  icon = 'src/es/skynovels/icon.png';

  filters = {
    genres: {
      type: FilterTypes.CheckboxGroup,
      label: 'Generos',
      value: [],
      options: [
        { label: 'Acción', value: '9' },
        { label: 'Adulto', value: '38' },
        { label: 'Artes marciales', value: '3' },
        { label: 'Aventura', value: '2' },
        { label: 'BL', value: '40' },
        { label: 'Comedia', value: '7' },
        { label: 'Cosas de la vida', value: '26' },
        { label: 'Cultivación', value: '19' },
        { label: 'Drama', value: '8' },
        { label: 'Ecchi', value: '21' },
        { label: 'Fantasia', value: '4' },
        { label: 'Gender Bender', value: '10' },
        { label: 'GL', value: '41' },
        { label: 'Harem', value: '12' },
        { label: 'Histórico', value: '32' },
        { label: 'Horror', value: '39' },
        { label: 'LitRPG', value: '31' },
        { label: 'Maduro', value: '1' },
        { label: 'Magia', value: '16' },
        { label: 'Misterio', value: '22' },
        { label: 'Mundo Moderno', value: '34' },
        { label: 'Psicológico', value: '27' },
        { label: 'Recuentos de la vida', value: '36' },
        { label: 'Reencarnación', value: '23' },
        { label: 'Romance', value: '5' },
        { label: 'Sci-Fi', value: '17' },
        { label: 'Seinen', value: '18' },
        { label: 'Shoujo', value: '33' },
        { label: 'Shounen', value: '13' },
        { label: 'Sobrenatural', value: '20' },
        { label: 'Supervivencia', value: '25' },
        { label: 'Suspenso', value: '35' },
        { label: 'Tragedia', value: '14' },
        { label: 'Transmigración', value: '24' },
        { label: 'Vida Escolar', value: '29' },
        { label: 'Xianxia', value: '6' },
        { label: 'Xuanhuan', value: '11' },
        { label: 'Yaoi', value: '30' },
        { label: 'Sin género indicado', value: '37' },
      ],
    },
  } satisfies Filters;

  // ---------------------------------------------------------------------
  // Listado / búsqueda
  // ---------------------------------------------------------------------

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const genres = (filters?.genres?.value as string[]) || [];
    const order = genres.length > 0 ? 'updated' : 'rating';

    let url = `${this.apiSite}novels?page=${pageNo}&order=${order}`;
    if (genres.length > 0) url += `&genres=${genres.join(',')}`;

    const body = await this.fetchJson<response>(url);

    return this.mapNovelList(body.novels);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const q = encodeURIComponent(searchTerm.toLowerCase());
    const url = `${this.apiSite}novels?page=${pageNo}&q=${q}`;

    const body = await this.fetchJson<response>(url);

    return this.mapNovelList(body.novels);
  }

  private mapNovelList(entries?: NovelsEntity[] | null): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];

    entries?.forEach(res => {
      novels.push({
        name: res.nvl_title,
        cover: this.apiSite + 'get-image/' + res.image + '/novels/false',
        path: 'novelas/' + res.id + '/' + res.nvl_name + '/',
      });
    });

    return novels;
  }

  // ---------------------------------------------------------------------
  // Detalle de novela
  // ---------------------------------------------------------------------

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const novelId = novelPath.split('/')[1];
    const url = this.apiSite + 'novel/' + novelId + '/reading?&q';

    const body = await this.fetchJson<responseBook>(url);
    const item = body?.novel?.[0];

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: item?.nvl_title || 'Untitled',
      cover: this.apiSite + 'get-image/' + item?.image + '/novels/false',
      genres: (item?.genres ?? []).map(g => g.genre_name).join(','),
      author: item?.nvl_writer,
      summary: item?.nvl_content,
      status: item?.nvl_status,
      chapters: this.mapChapters(novelPath, item?.volumes),
    };

    return novel;
  }

  private mapChapters(
    novelPath: string,
    volumes?: VolumesEntity[] | null,
  ): Plugin.ChapterItem[] {
    const novelChapters: Plugin.ChapterItem[] = [];

    volumes?.forEach(volume => {
      volume?.chapters?.forEach(chapter => {
        novelChapters.push({
          name: chapter.chp_index_title,
          releaseTime: new Date(chapter.createdAt).toDateString(),
          path: novelPath + chapter.id + '/' + chapter.chp_name,
        });
      });
    });

    return novelChapters;
  }

  // ---------------------------------------------------------------------
  // Capítulo + limpieza de texto para TTS
  // ---------------------------------------------------------------------

  async parseChapter(chapterPath: string): Promise<string> {
    // path: novelas/{nvl_id}/{nvl_name}/{chp_id}/{chp_name}
    const chapterId = chapterPath.split('/')[3];
    const url = `${this.apiSite}novel-chapter/${chapterId}`;

    const body = await this.fetchJson<responseChapter>(url);
    const item = body?.chapter?.[0];
    const chapterText = item?.chp_content || '';

    if (!chapterText) return '';

    const $ = load(chapterText);

    // 1) Quitar elementos que no aportan contenido legible/audible
    $(
      'script, style, ins, .chapter-ad, .adsbygoogle, .hidden, [style*="display:none"]',
    ).remove();

    // 2) Limpiar cada nodo de texto (invisibles, símbolos, espacios)
    $('*')
      .contents()
      .each((_, element) => {
        if (element.type === 'text' && element.data) {
          const cleanedText = this.cleanTextForTts(element.data);
          if (element.data !== cleanedText) {
            element.data = cleanedText;
          }
        }
      });

    // 3) Eliminar contenedores que quedaron vacíos tras la limpieza
    $('p, div').each((_, el) => {
      const $el = $(el);
      if (!$el.text().trim()) $el.remove();
    });

    // 4) Garantizar que el contenido esté dividido en párrafos <p> de
    // tamaño razonable. El lector de LNReader (y su TTS) procesa el
    // capítulo párrafo por párrafo; si el HTML de origen viene como un
    // bloque gigante (sin <p>, o con <br> en vez de párrafos separados),
    // el TTS puede terminar tratando todo el capítulo como una sola
    // "frase" que excede el límite de síntesis de Android (~4000
    // caracteres) y se corta sin sonido justo después de resaltar el
    // primer fragmento. Esta función normaliza la estructura para
    // evitarlo.
    this.ensureReadableParagraphs($);

    // IMPORTANTE: $.html() devuelve el documento COMPLETO que cheerio arma
    // internamente (<html><head></head><body>...</body></html>). Eso queda
    // anidado dentro del body del WebView de la app y rompe el árbol de
    // accesibilidad que usa el TTS del sistema para leer el texto (aunque
    // visualmente se vea bien). Por eso devolvemos solo el contenido de
    // <body>, igual que hacen otros plugins (ej. RNCalation con
    // `.novel-content`).
    return $('body').html() || '';
  }

  /**
   * Máximo de caracteres seguro por párrafo/utterance. Se deja bastante
   * margen por debajo del límite real de Android TTS (~4000) para no
   * rozarlo con distintos motores de voz.
   */
  private static readonly MAX_PARAGRAPH_LENGTH = 1800;

  /**
   * Asegura que el body tenga párrafos <p> bien delimitados y de tamaño
   * acotado, reconstruyéndolos desde el texto plano si hace falta.
   */
  private ensureReadableParagraphs($: any): void {
    const body = $('body');

    const goodParagraphs = body
      .find('p')
      .filter(
        (_, el) =>
          $(el).text().trim().length > 0 &&
          $(el).text().trim().length <= SkyNovels.MAX_PARAGRAPH_LENGTH,
      );

    const anyParagraphs = body
      .find('p')
      .filter((_, el) => $(el).text().trim().length > 0);

    // Ya hay párrafos <p> y ninguno es demasiado largo: no hace falta tocar nada
    if (
      anyParagraphs.length > 0 &&
      goodParagraphs.length === anyParagraphs.length
    ) {
      return;
    }

    // Convertimos <br> en saltos de línea para no perder la separación visual
    body.find('br').replaceWith('\n');

    const rawText = body.text();
    const rawParagraphs = rawText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    body.empty();

    rawParagraphs.forEach(paragraph => {
      this.appendAsParagraphs(body, paragraph);
    });
  }

  /**
   * Agrega `text` al contenedor como uno o más <p>, partiendo por oraciones
   * si excede el largo máximo seguro para una sola síntesis de TTS.
   */
  private appendAsParagraphs(container: any, text: string): void {
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (text.length <= SkyNovels.MAX_PARAGRAPH_LENGTH) {
      container.append(`<p>${escape(text)}</p>`);
      return;
    }

    // Partimos por oraciones para no cortar a la mitad de una frase
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    let chunk = '';

    sentences.forEach(sentence => {
      if ((chunk + sentence).length > SkyNovels.MAX_PARAGRAPH_LENGTH && chunk) {
        container.append(`<p>${escape(chunk.trim())}</p>`);
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    });

    if (chunk.trim()) {
      container.append(`<p>${escape(chunk.trim())}</p>`);
    }
  }

  /**
   * Limpieza de texto orientada a TTS: elimina caracteres invisibles
   * anti-copia y normaliza símbolos que suenan mal o rompen la lectura,
   * sin destruir barras/guiones que tienen significado gramatical.
   */
  private cleanTextForTts(text: string): string {
    return (
      text
        // Caracteres invisibles anti-copia (zero-width, marcas de dirección)
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
        // Barras decorativas repetidas ("///", "\\\\") -> fuera.
        // Se preservan barras simples con significado ("1/2", "y/o", "12/05").
        .replace(/[\\/]{2,}/g, '')
        // Rayas de diálogo orientales/atípicas -> guion simple
        .replace(/[—––─]/g, '-')
        // Símbolos de adorno repetitivos comunes
        .replace(/[*_~|•♦¤°]/g, '')
        // Controlar abusos de puntos suspensivos
        .replace(/\.{4,}/g, '...')
        // Colapsar espacios múltiples
        .replace(/ {2,}/g, ' ')
        // Colapsar saltos de línea excesivos dentro del mismo párrafo
        .replace(/\n\s*\n/g, '\n')
        .trim()
    );
  }

  // ---------------------------------------------------------------------
  // Helper de fetch
  // ---------------------------------------------------------------------

  private async fetchJson<T>(url: string): Promise<T> {
    const result = await fetchApi(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return (await result.json()) as T;
  }
}

export default new SkyNovels();

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------

type response = {
  novels?: NovelsEntity[] | null;
};
type NovelsEntity = {
  id: number;
  nvl_author?: number | null;
  nvl_content: string;
  nvl_title: string;
  nvl_acronym?: string | null;
  nvl_status: string;
  nvl_publication_date?: string | null;
  nvl_name: string;
  nvl_recommended: number;
  nvl_writer: string;
  nvl_translator?: string | null;
  nvl_translator_eng?: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
  nvl_chapters: number;
  nvl_last_update: string;
  nvl_rating?: number | null;
  nvl_ratings_count: number;
  genres?: GenresEntity[] | null;
};
type GenresEntity = {
  id: number;
  genre_name: string;
};

type responseBook = {
  novel?: NovelEntity[] | null;
};
type NovelEntity = {
  id: number;
  nvl_author: number;
  nvl_content: string;
  nvl_title: string;
  nvl_acronym: string;
  nvl_status: string;
  nvl_publication_date: string;
  nvl_name: string;
  nvl_recommended: number;
  nvl_writer: string;
  nvl_translator: string;
  nvl_translator_eng: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  nvl_chapters: number;
  nvl_last_update: string;
  nvl_rating: number;
  bookmarks?: BookmarksEntity[] | null;
  volumes?: VolumesEntity[] | null;
  novel_ratings?: NovelRatingsEntity[] | null;
  collaborators?: CollaboratorsEntity[] | null;
  genres?: GenresEntity[] | null;
};
type BookmarksEntity = {
  id: number;
  user_id: number;
  chp_id: number;
  chp_name: string;
};
type VolumesEntity = {
  vlm_title: string;
  id: number;
  nvl_id: number;
  user_id?: number | null;
  chapters?: ChaptersEntity[] | null;
};
type ChaptersEntity = {
  id: number;
  chp_index_title: string;
  chp_name: string;
  chp_number: number;
  chp_status: string;
  createdAt: string;
};
type NovelRatingsEntity = {
  user_id: number;
  rate_value: number;
  rate_comment: string;
  replys_count: string;
  createdAt: string;
  updatedAt: string;
  id: number;
  user_login: string;
  image?: string | null;
  likes?: (LikesEntity | null)[] | null;
};
type LikesEntity = {
  id: number;
  user_id: number;
  user_login: string;
};
type CollaboratorsEntity = {
  user_id: number;
  user_login: string;
};

type responseChapter = {
  chapter?: ChapterEntity[] | null;
};
type ChapterEntity = {
  id: number;
  chp_author: number;
  chp_translator?: null;
  nvl_id: number;
  vlm_id: number;
  chp_number: number;
  chp_content: string;
  chp_review?: null;
  chp_title?: null;
  chp_index_title: string;
  chp_status: string;
  chp_name: string;
  createdAt: string;
  updatedAt: string;
  nvl_title: string;
  nvl_name: string;
  user_login: string;
  reactions_count: number;
  comments?: null[] | null;
  reactions?: null[] | null;
  total_reactions?: TotalReactionsEntity[] | null;
};
type TotalReactionsEntity = {
  reaction_id: number;
  reaction_name: string;
  reaction_count: number;
};

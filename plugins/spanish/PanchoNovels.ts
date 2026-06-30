import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { Filters } from '@libs/filterInputs';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import dayjs from 'dayjs';

const BASE_API = 'https://api.panchonovels.online';
const BASE_SITE = 'https://panchonovels.online';
const IMAGE_URL = 'https://api.panchonovels.online/uploads/';

class PanchoNovels implements Plugin.PluginBase {
  id = 'panchonovels-api';
  name = 'Pancho Novels (API)';
  site = BASE_SITE;
  version = '1.0.0';
  icon = 'multisrc/madara/panchotranslations/icon.png'; // Reutiliza icono si existe o deja vacío

  // No necesitamos filtros complejos si la API es limitada, pero podemos añadir básicos
  filters = {
    order: {
      value: 'popular',
      label: 'Ordenar por',
      options: [
        { label: 'Popular', value: 'popular' },
        { label: 'Más Recientes', value: 'new' },
        { label: 'Actualizados', value: 'updated' },
      ],
      type: 'Picker' as const,
    },
  } satisfies Filters;

  async popularNovels(
    pageNo: number,
    {
      filters,
      showLatestNovels,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    // Determinar parámetro de orden
    let order = filters?.order?.value || 'popular';
    if (showLatestNovels) order = 'new';

    // Construir URL de la API
    // Nota: Ajusta los endpoints según lo que soporte realmente la API de Pancho
    // Si la API no soporta paginación directa en este endpoint, podríamos necesitar adaptar la lógica.
    // Asumimos que la API acepta ?page=X o similar. Si no, habría que manejarlo diferente.
    // Para este ejemplo, asumimos un endpoint genérico de lista.

    // Si la API requiere buscar para listar, usamos el endpoint de search con query vacío o genérico
    // O si tiene un endpoint /novels, úsalo. Aquí usaremos el de search como base si no hay otro.
    // Endpoint hipotético basado en tu descripción: /novel/search?order=...

    const url = `${BASE_API}/novel/search?order=${order}&page=${pageNo}`;

    try {
      const res = await fetchApi(url);
      if (!res.ok) throw new Error(`Error API: ${res.status}`);

      const data = await res.json();

      // La API podría devolver un array directo o un objeto { data: [...] }
      // Ajusta esto según la respuesta real de la API
      const novelsList = Array.isArray(data)
        ? data
        : data.data || data.novels || [];

      return novelsList.map((novel: any) => ({
        name: novel.novelName || 'Sin Título',
        cover: novel.novellmg
          ? novel.novellmg.startsWith('http')
            ? novel.novellmg
            : IMAGE_URL + novel.novellmg
          : defaultCover,
        path: `novel/${novel.novelSlug}`,
      }));
    } catch (error) {
      console.error('[PanchoNovels] Error fetching popular novels:', error);
      return [];
    }
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    // Extraer el slug de la ruta: novel/{slug} -> {slug}
    const slug = novelPath.replace('novel/', '');

    // Necesitamos obtener el ID primero o buscar por slug si la API lo permite
    // Si la API no tiene endpoint por slug, tendríamos que buscar en la lista hasta encontrarlo (ineficiente)
    // Asumiremos que hay un endpoint para detalles por slug o ID.
    // Si no, la estrategia de "scraping del x-data" que mencionaste sería el plan B aquí.

    // Intento 1: Buscar por slug en la API (si existe endpoint)
    // Si no, usaremos la estrategia de scraping del frontend que describiste como fallback robusto.

    try {
      // ESTRATEGIA HÍBRIDA: Usar la API si es posible, si no, scraping del x-data
      // Dado que dijiste que los datos están en x-data en el frontend, hagamos eso para asegurar compatibilidad
      // ya que a veces las APIs no son públicas para todos los endpoints.

      const url = `${BASE_SITE}/${novelPath}`;
      const res = await fetchApi(url);
      if (!res.ok) throw new Error('No se pudo cargar la novela');
      const html = await res.text();

      // 1. Localizar el atributo x-data
      const xDataMatch = html.match(/x-data=["']searchApp\((.*?)\)/);
      if (!xDataMatch) {
        throw new Error(
          'No se encontraron datos en x-data. La estructura del sitio cambió.',
        );
      }

      // 2. Limpiar y parsear JSON
      // El contenido dentro de los paréntesis suele ser un string JSON
      let jsonString = xDataMatch[1].trim();

      // A veces viene con comillas escapadas o formato raro, intentamos parsear directo
      // Si falla, puede que necesite limpieza extra (eliminar espacios raros, etc)
      const data = JSON.parse(jsonString);

      // La estructura de 'data' depende de qué devuelve searchApp.
      // Asumimos que devuelve un objeto con la info de la novela actual o una lista donde filtramos.
      // Si searchApp devuelve la lista de capítulos y info, perfecto.

      // NOTA: Si searchApp devuelve TODAS las novelas y hay que filtrar por slug, es ineficiente.
      // Pero si en la página de detalle searchApp se inicializa con SOLO esa novela, es perfecto.

      // Asumiendo que 'data' es el objeto de la novela (o el primer elemento si es array)
      const novelData = Array.isArray(data)
        ? data.find((n: any) => n.novelSlug === slug)
        : data;

      if (!novelData)
        throw new Error('Novela no encontrada en los datos parsedos');

      const novel: Plugin.SourceNovel = {
        path: novelPath,
        name: novelData.novelName || 'Sin Título',
        cover: novelData.novellmg
          ? novelData.novellmg.startsWith('http')
            ? novelData.novellmg
            : IMAGE_URL + novelData.novellmg
          : defaultCover,
        author: novelData.novelAuhtor || 'Desconocido', // Corrigiendo typo del backend
        artist: novelData.novelTranslator || '',
        summary: this.stripHtml(novelData.novelDescription || ''),
        status: this.parseStatus(novelData.novelStatus),
        genres: novelData.mainGenre || '', // Si hay más géneros en un array, habría que unirlos
        chapters: [],
      };

      // Procesar Capítulos
      // Asumiendo que novelData tiene una propiedad de capítulos o hay que hacer otra petición
      // Si la API o el x-data incluye los capítulos:
      if (novelData.chapters && Array.isArray(novelData.chapters)) {
        novel.chapters = novelData.chapters.map((ch: any, index: number) => ({
          name: ch.title || `Capítulo ${index + 1}`,
          path: `chapter/${ch.id || ch.slug}`, // Ajustar según cómo se construya la URL del capítulo
          releaseTime: ch.createdAt ? dayjs(ch.createdAt).format('LL') : null,
          chapterNumber: index + 1,
        }));
      } else {
        // Si los capítulos no vienen en el x-data inicial, quizás haya que hacer fetch a la API de capítulos
        // Ejemplo: GET /novel/{id}/chapters
        // Esto dependerá de si tienes el ID de la novela (novelData.id)
        if (novelData.id) {
          const chaptersRes = await fetchApi(
            `${BASE_API}/novel/${novelData.id}/chapters`,
          );
          if (chaptersRes.ok) {
            const chData = await chaptersRes.json();
            novel.chapters = (
              Array.isArray(chData) ? chData : chData.data || []
            ).map((ch: any, index: number) => ({
              name: ch.title || ch.name || `Capítulo ${index + 1}`,
              path: `chapter/${ch.slug || ch.id}`,
              releaseTime: ch.createdAt
                ? dayjs(ch.createdAt).format('LL')
                : null,
              chapterNumber: index + 1,
            }));
          }
        }
      }

      return novel;
    } catch (e) {
      console.error('[PanchoNovels] Error parseando novela:', e);
      throw e;
    }
  }

  async parseChapter(chapterPath: string): Promise<string> {
    // Construir URL completa del capítulo
    // Asumiendo que chapterPath es algo como "chapter/slug-del-capitulo" o solo el ID
    // Necesitamos saber la estructura exacta de la URL del capítulo en el front-end
    // Ejemplo: https://panchonovels.online/novel/{novelSlug}/{chapterSlug}

    // Como no tenemos el novelSlug en chapterPath directamente, esta parte es truculenta sin contexto.
    // Lo ideal es que chapterPath venga como "novel/slug/capitulo/slug" desde el inicio.

    // Si chapterPath es relativo, necesitamos reconstruir la URL.
    // Supongamos que la ruta es /leer/{capituloId} o similar.

    // ESTRATEGIA: Si la API tiene endpoint de contenido de capítulo, úsalo.
    // Ej: GET /chapter/{id}/content

    // Si no, hacemos fetch a la URL del capítulo y extraemos el contenido.
    // Asumiendo que la URL es construible. Si no, el plugin necesita que guardemos el novelSlug en el chapterItem.

    // Para este ejemplo, asumiremos que podemos construir la URL o que chapterPath es la URL relativa completa.
    let url = '';
    if (chapterPath.startsWith('http')) {
      url = chapterPath;
    } else {
      // Reconstrucción tentativa: https://panchonovels.online/{chapterPath}
      // O quizás: https://panchonovels.online/leer?id=...
      // DEBES AJUSTAR ESTO SEGÚN LA URL REAL DE UN CAPÍTULO EN EL NAVEGADOR
      url = `${BASE_SITE}/${chapterPath}`;
    }

    try {
      const res = await fetchApi(url);
      if (!res.ok) throw new Error('Error cargando capítulo');
      const html = await res.text();

      // Extraer contenido. Puede estar en un div específico o también en x-data/script
      const $ = require('cheerio').load(html);

      // Buscamos contenedores comunes de contenido
      let content =
        $('.chapter-content').html() ||
        $('#content').html() ||
        $('.entry-content').html();

      if (!content) {
        // Fallback: buscar en scripts o x-data si el contenido está inyectado por JS
        const scriptMatch = html.match(/chapterContent\s*=\s*["'](.*?)["']/);
        if (scriptMatch) {
          content = scriptMatch[1].replace(/\\n/g, '<br>');
        }
      }

      if (!content) throw new Error('No se encontró contenido del capítulo');

      // Limpieza básica
      return content.trim();
    } catch (e) {
      console.error('[PanchoNovels] Error parseando capítulo:', e);
      throw e;
    }
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${BASE_API}/novel/search?query=${encodeURIComponent(searchTerm)}&page=${pageNo}`;

    try {
      const res = await fetchApi(url);
      if (!res.ok) return [];
      const data = await res.json();
      const novelsList = Array.isArray(data)
        ? data
        : data.data || data.novels || [];

      return novelsList.map((novel: any) => ({
        name: novel.novelName || 'Sin Título',
        cover: novel.novellmg
          ? novel.novellmg.startsWith('http')
            ? novel.novellmg
            : IMAGE_URL + novel.novellmg
          : defaultCover,
        path: `novel/${novel.novelSlug}`,
      }));
    } catch (error) {
      return [];
    }
  }

  // Utilidades
  parseStatus(status: string): string {
    if (!status) return NovelStatus.Unknown;
    const s = status.toLowerCase();
    if (s.includes('finalizada') || s.includes('completed'))
      return NovelStatus.Completed;
    if (s.includes('pausa') || s.includes('hiatus'))
      return NovelStatus.OnHiatus;
    if (s.includes('abandonada') || s.includes('dropped'))
      return NovelStatus.Cancelled;
    return NovelStatus.Ongoing;
  }

  stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default new PanchoNovels();

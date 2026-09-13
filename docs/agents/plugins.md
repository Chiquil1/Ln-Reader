# Reglas de Desarrollo de Plugins

## Estructura
- Los plugins de idioma viven en `plugins/{language}/`; los multi-idioma en `plugins/multi/`.
- Alias de rutas: `@/*` → `src/*`, `@plugins/*` → `plugins/*`, `@libs/*` → `src/libs/*`.
- Multisrc: la plantilla en `plugins/multisrc/{name}/` genera `plugins/{language}/{name}[site].ts`.
- Punto de entrada del registro: `plugins/index.ts`. Plantilla: `docs/plugin-template.ts`.

## Extracción de Capítulos (lección: Novelyra v2.6.11)
- NUNCA limpies ruido con selectores de subcadena como `[class*="ad"]`: también coinciden
  con clases reales como `prose-reading` ("re-AD-ing") y pueden borrar el propio `#chapter-content`.
- Compara por token: divide `class` por espacios y trata `ad`/`sidebar`/`related`/`recommend`
  como ruido solo si forman un segmento delimitado por guiones (`nv-ad`, `chapter-ad-top`),
  nunca dentro de otra palabra — ej. `/(^|-)(ad|sidebar|related|recommend)(-|$)/i` por token.
- Prefiere `fetchApi` directo en `parseChapter`; no agregues proxy/Worker salvo que el fetch
  directo falle de forma probada — los saltos externos se rompen cuando el proxy cae.
- Los límites dinámicos van con `new RegExp(...)`: las variables nunca se interpolan en literales `/.../`.
- Devuelve siempre el HTML del capítulo COMPLETO en una sola respuesta; la app no pagina capítulos.

## Convenciones
- Sube el `version` en cada cambio; commitea fuente `.ts` + compilado `.js` + manifest `.dist`.
- `BLACKLIST.json`: sitios retirados a petición del dueño — nunca re-agregar sin aprobación.
- `npm run build:icons` descarga iconos; `build:manifest` regenera `.dist/plugins.min.json`.

## Patrón de Filtro de Ruido
```ts
const NOISE = /(^|-)(ad|sidebar|related|recommend)(-|$)/i;
const isNoise = (c = '') => c.split(/\s+/).some(t => NOISE.test(t));
// $('[class]').each((_, el) => { if (isNoise($(el).attr('class'))) $(el).remove(); });
```

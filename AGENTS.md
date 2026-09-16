# LNReader Plugins - Guía de Agentes

## Descripción
Repositorio comunitario de plugins para [LNReader](https://github.com/LNReader/lnreader). Aloja plugins de fuentes organizados por idioma, además de plugins multifuente que sirven para varios sitios.

## Inicio Rápido
```bash
npm install
npm run dev               # Genera plugins multisrc + inicia el servidor dev de Vite en localhost:3000
```

## Índice (lee solo lo que la tarea necesite)

| Archivo | Leer cuando... |
|---------|----------------|
| `docs/agents/build.md` | Compilar, errores de build, lint/formato, dudas de TS |
| `docs/agents/plugins.md` | Crear, editar o depurar un plugin |
| `docs/agents/workflow.md` | Probar en web/móvil, publicar, fallos de CI |
| `docs/agents/translation-en-es.md` | Tocar la inyección de traducción EN→ES o su pipeline |

## Reglas de Oro (aplican siempre)
- `npm run build:full` tiene un orden: clean:multisrc → build:multisrc → build:translate:inject → build:compile → guard:translation-lib → build:manifest. NO lo alteres.
- Los plugins deben devolver TODOS los capítulos y el contenido completo, nunca paginado.
- Sube el `version` del plugin en cada cambio; commitea fuente `.ts` + compilado `.js` + `.dist`.
- Nunca re-agregues sitios listados en `BLACKLIST.json` sin aprobación.
- Se requiere Node.js >= 22.

## Reglas del traductor EN→ES (NO romper)
- **La app NO tiene `@libs/translation`.** Ningún `.ts` compilado ni `.js` puede requerirlo. Si un plugin lo requiere, la app muestra "actualización fallida" (`usePlugins.ts:181`). Verifica con `npm run guard:translation-lib`.
- **La inyección debe ser autocontenida**: solo puede usar los paquetes del whitelist real de la app (`src/plugins/pluginManager.ts`): `cheerio`, `dayjs`, `urlencode`, `htmlparser2`, `@libs/{fetch,storage,novelStatus,isAbsoluteUrl,filterInputs,defaultCover,aes,utils}`. Cualquier otro `require` rompe el carga del plugin (devuelve `undefined` → "actualización fallida").
- **La rama que consume la app es la publicada** (`plugins/v3.0.0`), NO `main` ni las ramas de feature. Un cambio no llega a la app hasta publicarlo con `npm run publish:plugins` (force-push a `plugins/v3.0.0`). Nunca reverter el traductor publicado sin re-publicarlo.
- **NO commitees `.dist` en ramas de feature**: `build-plugin-manifest.js` embebe el nombre de la rama en las URLs (`raw.githubusercontent.com/.../<branchname>/...`), dejando URLs rotas. El `.dist` solo vive en la rama publicada (lo regenera `publish-plugins.sh`). Regenerar `.dist` local es solo para inspección.
- **`.gitignore` ignora `.js`, `.dist` y `plugins/*/*[template].ts`**: los `.js` compilados se agregan con `git add -f`; la fuente commiteada es el template multisrc (`.ts` por sitio generado = no se commitea).
- **No recompiles todo el repo con tsc local**: el emit del TS local (5.9.x) difiere de los `.js` commiteados y ensucia todos los idiomas. Para regenerar un subconjunto (p. ej. solo `english/*[].ts`) usa un tsconfig temporal con `extends: ./tsconfig.production.json` + `files: [...]` + `rootDir: "plugins"` (sin `rootDir`, tsc asume `plugins/english` y emite a `.js/plugins/` — ruta incorrecta). `tsc -p` no acepta archivos extra en la CLI.
- **`removeComments: true`** en tsconfig de producción: el marcador `__ENTranslationInjected` vive solo en `.ts`; verificarlo en `.js` = buscar `translate.googleapis`.
- **Errores conocidos del injector** (`scripts/inject-es-translation.js`, ya corregidos, no reintroducir):
  - `norm` debe colapsar solo `[ \t]` y quitar `\r`, CONSERVANDO `\n` (si colapsas `\s+` rompes el batch multi-línea de `parseChapter` → traducción silenciosamente no aplicada).
  - `bumpVersion` corre ANTES de `lastIndexOf('export default plugin;')` (si va después, el `slice` corta metadata con `"versionIncrements":1,` ya insertado → TS1002 "Unterminated string literal").
  - Esquema de versión: `2.2.${versionIncrements}` (madara) / `2.2.${1 + versionIncrements}` (readnovelfull). Bump = incrementar `"versionIncrements":N`; si falta, insertar `"versionIncrements":1,`. El injector aplica un **piso `MIN_VERSION=50`** para que cualquier publish quede por encima de lo ya publicado en `plugins/v3.0.0` (sube el piso si se publica ≥ 2.2.50).
- **Para verificar un plugin contra la app real**: evaluarlo con el `initPlugin` exacto (whitelist `packages` + `Function('require','module', ...exports.default)`). No basta con abrirlo en Node plano.

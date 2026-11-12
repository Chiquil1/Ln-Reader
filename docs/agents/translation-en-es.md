# Traductor EN→ES autocontenido (sin `@libs/translation`)

> Documento de checkpoint: guarda qué se hizo, qué se rompió, cómo verificarlo y cómo volver atrás.

## Por qué existe

La app del usuario reportaba **"Actualización fallida"**. La causa raíz: toda publicación que dependía de
`@libs/translation` (definido solo en la app) reventaba en `installPlugin` → `initPlugin` (`usePlugins.ts:225`)
cuando la app no tenía esa lib. Se verificó con el loader exacto de la app (07da2be) que **ninguna** publicación
puede depender de esa lib.

**Decisión (confirmada por el usuario):** reintroducir el traductor EN→ES en los plugins de inglés, pero
**autocontenido** (cada plugin compilado lleva su motor) y **profesional**: rama separada, docs, verificación y
rollback definidos. Sin tocar la app.

## Checkpoint (punto de rollback)

| Repo | Rama | Commit sano | Árbol igual a |
|------|------|-------------|---------------|
| Ln-Reader (plugins) | `main` | `186b005` | `81d9c74` |
| LN-Master (app) | `main` | `32a2b8a` | `07da2be` |

Rama de trabajo actual: `feat/es-translation-selfcontained` (creada desde `186b005`).

## Alcance definido

- **Sí:** plugins MultiSource de idioma `English` — `plugins/english/*[template].ts` (95 plugins).
- **No:** plugins EN escritos a mano (sin corchetes) — **no** se traducen (p. ej. wuxiaworld, novelupdates,
  royalroad, ao3). Alcance acordado; no ampliar sin pedir aprobación.
- **No:** novelyra (es) — mantiene su motor propio v2.6.14.
- **No:** la app. La app no expone `translationConfig` ni `pluginSettings` → el motor va **por defecto activado**
  dentro del plugin (no configurable desde la UI).

## Contrato técnico (reglas de oro)

1. **NUNCA** usar `@libs/translation` en fuente, ni en `.js` compilado, ni en la app. `scripts/guard-no-libs-translation.js`
   aborta el publish si algún `.js` lo requiere.
2. El motor inyectado usa solo `@libs/fetch` (`fetchApi`) y `cheerio` (`load`) — ambos en el whitelist de la app.
   Si el template no importa fetchApi/cheerio (p. ej. readnovelfull), la inyección añade sus propios imports
   (`__translatorFetch` / `__translatorParse`) para no chocar con los del plugin.
3. **TODOS los capítulos y contenido completo** se devuelven sin paginar (regla LNReader); el traductor no agrega
   paginación ni corta nada.
4. Fallback seguro: si el translate falla (HTTP ≠ ok, JSON inválido, conteo de líneas distinto, excepción),
   devuelve el **original** sin romper `popularNovels`/`parseNovel`/`parseChapter`/`searchNovels`.
5. Deben devolverse los **títulos, sumarios, (nombres de capítulos configurablemente) y contenido** traducidos;
   `searchNovels` traduce la query ES→EN para buscar en el sitio en inglés.
6. **Versión:** cada build debe ser `newer()` que lo publicado (la app solo re-descarga si hay versión mayor).
   El inyector incrementa `"versionIncrements":N` en el metadata de cada archivo EN inyectado (+1); si el site no
   tenía, inserta `"versionIncrements":1`. No se versiona plugins de otros idiomas.

## Pipeline

```
build:full = clean:multisrc → build:multisrc → build:translate:inject → build:compile → guard:translation-lib → build:manifest
```

- `npm run build:translate:inject` → `node scripts/inject-es-translation.js` inyecta el motor en
  `plugins/english/*[template].ts` justo antes de `export default plugin;` (idempotente, marca
  `/* __ENTranslationInjected v1 */`/`END`).
- `npm run guard:translation-lib` → aborta si hay `@libs/translation` en `.js`.
- `scripts/publish-plugins.sh` ejecuta injector + guard en los dos caminos (single branch y `--all-branches`).

## Cómo se verifica

1. `npm run build:full` en limpio.
2. `grep -rl '@libs/translation' .js/plugins/` debe dar 0.
3. Emulador del loader exacto de la app (sin `@libs/translation` en whitelist) —
   `/var/folders/1z/jt19tkdn5458cgvmzfcqx0wc0000gn/T/opencode/lnapp/test-translation.cjs`:
   init OK, `popularNovels` títulos ES, `searchNovels` query→EN + títulos ES, `parseNovel` nombre+sumario ES,
   `parseChapter` contenido ES, y fallback: proveedor 500 → original sin crash. Estado: **13/13 PASS** en esta rama
   (BoxNovel[madara] y AllNovel[readnovelfull]).
4. Barrido de la rama publicada (`plugins/v<version>`) con el loader real — igual que `sweep-live.cjs`.

## Qué se arregló sobre el intento previo (postmortem)

- **Antes:** se publicó dependiendo de `@libs/translation` → "Actualización fallida". Ahora autocontenido + guard.
- **Bug de esta implementación (lo rompí y lo arreglé):** `exportIndex` se calculaba ANTES de `bumpVersion`;
  al insertar `"versionIncrements":1,` (+22 bytes) el `slice(0, exportIndex)` con índice desactualizado cortaba
  los últimos ~21 bytes del metadata del constructor → TS1002 "unterminated string literal" en el build.
  Fix: el bump va ANTES de `lastIndexOf('export default plugin;')`.
- **Bug de diseño del motor (detectado en emulador):** `norm` colapsaba `\n` con `\s+`, así que el lote
  multi-línea de un capítulo llegaba como una sola línea y `parts.split('\n')` nunca coincidía → el contenido
  nunca se traducía (fallo silencioso). Fix: `norm` conserva saltos de línea (espacios/tabs colapsados, `\r`
  eliminados) — mismo comportamiento que el motor probado de novelyra.

## Errores de la temporada (para no repetir)

- Validar SIEMPRE el artefacto publicado (`plugins/v3.0.0` actual), no solo `main`.
- No versionar sin probar el flujo de la app.
- No commitear archivos sueltos (opencode.jsonc lleva secretos, `.ts` generados tipo plantilla).
- Cuidar exports: esbuild inyecta `__toCommonJS`; tsc usa `exports.default`. El loader evalúa `exports.default`.
- Nada de "a lo loco": cada cambio se valida con el emulador antes de publicar.

## Rollback

- Volver a una copia anterior del traductor: `git checkout 186b005 -- <archivos>` o reset de la rama.
- Abandonar el intento completo: `git branch -D feat/es-translation-selfcontained && git checkout main`
  (main está en `186b005`). App: `LN-Master` a `32a2b8a` (árbol `07da2be`).
- Los artefactos publicados viven en la rama `plugins/v<version>`; volver a `plugins/v3.0.0` (o la de ese build)
  restaura la última versión sin traductor EN, que ya se verificó 214/214 OK con el loader sin lib.

## Estado actual (fecha de escritura)

- Rama `feat/es-translation-selfcontained`: 95 plugins EN inyectados, versión bumpeada, `build:full` limpio,
  emulador 13/13 PASS, 0 referencias a `@libs/translation` en `.js`.
- Sin publicar todavía (falta push + confirmación del usuario para merge a main / publish).
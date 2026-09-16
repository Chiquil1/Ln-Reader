# Postmortem: traductor EN→ES no funcionaba en la app

Fecha: 2026-09-15. Alcance: plugins con traducción (novelyra + English) en la
app `Chiquil1/LN-Master`.

## Síntomas
- `Cannot read property 'translateTitles' of undefined` al abrir novelyra.
- "Actualización fallida" al actualizar algunos plugins.
- novelyra que "no aparecía" en la lista de plugins.

## Causa raíz (dos capas)

### 1) Pipeline del repo de plugins (Ln-Reader)
La app NO consume `main`: añade el repo con la URL
`https://raw.githubusercontent.com/<user>/<repo>/plugins/<tag>/.dist/plugins.min.json`.
Esa rama (`plugins/v3.0.0`) la generaba el CI (`publish-plugins.sh`) con `tsc`
puro, **sin el paso `build:inline`**, así que distribuía plugins rotos que
hacían `require("@libs/translation")`.

Cualesquiera arreglos en `main` eran irrelevantes: la app jamás los veía.

### 2) Loader de la app (LN-Master)
`src/plugins/pluginManager.ts` resuelve los `require("@libs/*")` de los plugins
contra un whitelist fijo (`packages`). `@libs/translation` **no estaba
registrado** → `require("@libs/translation")` devolvía `undefined` →
`(0, translation_1.translateTitles)` lanzaba
`Cannot read properties of undefined (reading 'translateTitles')`.
Es la fuente exacta del error (reproducido y confirmado con un loader emulado).

## Errores cometidos en el camino (y aprendizajes)
1. **Validar solo `main`**: comprobaba el `.js` servido desde `main` y daba por
   arreglado. La app usa la rama `plugins/` → verificación inválida.
   Aprendizaje: validar SIEMPRE el artefacto que consume la app (rama publicada).
2. **Asumir plugin distribuido "con inline"**: el inline resuelve el repo pero
   NO la app. Estudiar el loader de la app resuelto antes de tocar nada.
3. **Versionar sin revisar el flujo de la app**: subir versión es necesario
   (la app solo re-descarga si `newer()`), pero insuficiente si el artefacto
   sigue roto.
4. **Commitear archivos sueltos por accidente** (`PanchoNovels.js`, `ritiscan.js`,
   `ritto.js`) en un primer commit; corregido con `reset --soft` + recommit.
5. **esbuild vs tsc al emular**: los bundles de esbuild terminan con
   `module.exports = __toCommonJS(...)`, pero el loader de la app hace
   `return exports.default` → el emulador debe usar el artefacto real de tsc
   (`tsc` emite `exports.default`).

## Solución aplicada
- **Repo Ln-Reader**: `scripts/publish-plugins.sh` ejecuta `npm run build:inline`
  antes de generar el manifest; la rama `plugins/v3.0.0` queda autocontenida y
  las versiones subidas (novelyra v2.6.17, English v2.x+1) fuerzan re-descarga.
  Verificado en la rama publicada: `novelyra.js` 30 KB, 0 `require` rotos,
  manifest v2.6.17.
- **App LN-Master**: `src/plugins/helpers/translation.ts` define la librería
  dentro de la app (port de `src/libs/translation.ts` adaptado a
  `./helpers/fetch`, `Storage('@libs/translation')` y tipos de `src/plugins/types`)
  y se registra en el whitelist `packages` de `pluginManager.ts`. Así queda
  "definido lo indefinido" por diseño, para plugins compilados (require) y para
  los autocontenidos.

## Verificación
Loader de la app emulado en Node:
- plugin compilado con tsc sin inline → `popularNovels()` devuelve títulos
  traducidos. Sin el registro en `packages` se reproduce el error original.
- plugin de la distribución actual (inline) → también traduce.
- `@libs/translation` expone los 14 exports usados por los plugins.

## Invariantes de mantenimiento
- La rama `plugins/` la construye el CI CON `build:inline`; nunca validar
  contra `main`.
- Todo export que los plugins usen de `@libs/translation` debe existir también
  en `LN-Master/src/plugins/helpers/translation.ts`.
- Subir `version` en cada cambio de fuente (la app usa `newer()` para re-descargar).
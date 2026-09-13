# Pruebas y Publicación

## Pruebas
- **Web**: `npm run dev` → http://localhost:3000 (ver `docs/website-tutorial.md`).
- **Móvil**: `npm run build:compile && npm run build:manifest:dev`, luego agrega
  `http://10.0.2.2/.dist/plugins.min.json` (emulador Android) a la app.
- Las pruebas móviles locales necesitan `.env` con `USER_CONTENT_BASE` (defecto: `http://localhost:3000`).

## CI/CD
- El workflow `.github/workflows/publish-plugins.yml` se dispara con push a `master`/`main`
  que toque `plugins/**`, `public/**` o los scripts de publicación.
- Repo principal (`LNReader/lnreader-plugins`): corre `publish:plugins`.
- Forks: corren `publish:plugins -- --all-branches`.
- Publica a la rama `plugins` con el `.dist/plugins.min.json` compilado.

## Stack Técnico
- React 18 + TypeScript + Vite 6.
- TailwindCSS v4 + shadcn/ui + Radix UI.
- Redux Toolkit + Zustand.
- ESLint (typescript-eslint) + Prettier + Husky.

## Precauciones
- Corre `npm run clean:multisrc` antes de regenerar los plugins multisrc.
- La generación multisrc va antes de compilar (lo manejan `build:full` y `dev`).
- El build de producción usa `noCheck: true`, así que los errores de tipos nunca lo rompen.
- Los sitios con Cloudflare pueden bloquear fetches de datacenter; verifica el HTML en la app.

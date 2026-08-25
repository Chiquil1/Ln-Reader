# LNReader Plugins - Agent Guide

## Overview
Community-driven plugin repository for [LNReader](https://github.com/LNReader/lnreader). Hosts source plugins organized by language, plus multi-source plugins that work across multiple sites.

## Quick Start
```bash
npm install
npm run dev               # Generates multisrc plugins + starts Vite dev server at localhost:3000
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Generate multisrc plugins + start dev server (primary dev command) |
| `npm run build:full` | Clean → generate multisrc → compile TS → build manifest |
| `npm run build:icons` | Full build + download plugin icons |
| `npm run lint` / `lint:fix` | ESLint check/fix |
| `npm run format` / `format:check` | Prettier format/check |
| `npm run check:sites` | Validate plugin site configurations |
| `npm run publish:plugins` | Publish to `plugins` branch (runs in CI on push to master/main) |

## Build Pipeline (Order Matters)
1. `clean:multisrc` - Remove generated `*].ts/js` files in `plugins/`
2. `build:multisrc` - Generate multi-source plugins from `plugins/multisrc/*`
3. `build:compile` - TypeScript compile with `tsconfig.production.json` (CommonJS, ES5) → `.js/plugins/`
4. `build:manifest` - Generate `.dist/plugins.min.json` from compiled plugins

## Project Structure
```
plugins/
├── {language}/          # Language-specific plugins (arabic, english, chinese, etc.)
├── multi/               # Multi-language plugins
├── multisrc/            # Multi-source plugin templates (generate → individual plugins)
│   ├── generate-multisrc-plugins.js
│   ├── madara/, lightnovelwp/, readwn/, rulate/, etc.
├── index.ts             # Plugin registry entrypoint
src/
├── components/          # React UI components (shadcn/ui + Radix)
├── hooks/               # Custom React hooks
├── libs/                # Re-export shims for plugin API (fetch, filters, storage, etc.)
├── store/               # Redux Toolkit state
├── types/               # TypeScript types
```

## TypeScript Configs
- **tsconfig.json** (dev): ES2020 modules, Bundler resolution, outputs to `.js/`
- **tsconfig.production.json** (build): CommonJS, ES5 target, `noCheck: true`, outputs to `.js/plugins/`

## Important Conventions
- **Path aliases**: `@/*` → `src/*`, `@plugins/*` → `plugins/*`, `@libs/*` → `src/libs/*`
- **Multi-source plugins**: Template in `plugins/multisrc/{name}/` → generates individual plugins in `plugins/{language}/{name}[site].ts`
- **BLACKLIST.json**: Sites removed at owner request - never re-add without approval
- **Environment**: `.env` overrides `USER_CONTENT_BASE` for mobile testing (default: `http://localhost:3000`)

## Testing
- **Web**: `npm run dev` → http://localhost:3000 (see `docs/website-tutorial.md`)
- **Mobile**: `npm run build:compile && npm run build:manifest:dev` + add `http://10.0.2.2/.dist/plugins.min.json` (Android emulator) to app
- Requires `.env` with `USER_CONTENT_BASE` for local mobile testing

## CI/CD
- GitHub Action `.github/workflows/publish-plugins.yml` triggers on push to `master`/`main` touching `plugins/**`, `public/**`, or publish scripts
- Main repo (`LNReader/lnreader-plugins`): runs `publish:plugins`
- Forks: runs `publish:plugins -- --all-branches`
- Publishes to `plugins` branch with compiled `.dist/plugins.min.json`

## Tech Stack
- React 18 + TypeScript + Vite 6
- TailwindCSS v4 + shadcn/ui + Radix UI
- Redux Toolkit + Zustand
- ESLint (typescript-eslint) + Prettier + Husky

## Gotchas
- Run `npm run clean:multisrc` before regenerating multisrc plugins
- Production build uses `noCheck: true` - type errors won't fail compile; run `npx tsc --project tsconfig.json` separately for type checking
- Multi-source plugin generation must run before compile (handled by `build:full` and `dev`)
- Node.js >= 22 required
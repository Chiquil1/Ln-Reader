# Compilación y Comandos

## Comandos Clave

| Comando | Para qué sirve |
|---------|----------------|
| `npm run dev` | Genera plugins multisrc + inicia el servidor dev (comando principal) |
| `npm run build:full` | Limpia → genera multisrc → compila TS → genera el manifest |
| `npm run build:icons` | Build completo + descarga los iconos de plugins |
| `npm run lint` / `lint:fix` | Revisar/corregir con ESLint |
| `npm run format` / `format:check` | Formatear/revisar con Prettier |
| `npm run check:sites` | Valida la configuración de sitios de los plugins |
| `npm run publish:plugins` | Publica a la rama `plugins` (corre en CI al hacer push a master/main) |

## Pipeline de Build (El Orden Importa)
1. `clean:multisrc` - Borra los `*].ts/js` generados en `plugins/`
2. `build:multisrc` - Genera los plugins multifuente desde `plugins/multisrc/*`
3. `build:compile` - Compila TypeScript con `tsconfig.production.json` (CommonJS, ES5) → `.js/plugins/`
4. `build:manifest` - Genera `.dist/plugins.min.json` desde los plugins compilados

## Configs de TypeScript
- **tsconfig.json** (dev): módulos ES2020, resolución Bundler, salida a `.js/`
- **tsconfig.production.json** (build): CommonJS, objetivo ES5, `noCheck: true`, salida a `.js/plugins/`

## Verificar Antes de Commitear
- Corre `npm run lint` y `npx prettier --check` en los archivos tocados.
- Confirma que el plugin salga con ✅ en la salida de `build:manifest`.
- Producción usa `noCheck: true`: corre `npx tsc --project tsconfig.json` aparte para tipos.

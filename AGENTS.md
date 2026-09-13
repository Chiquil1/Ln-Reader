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

## Reglas de Oro (aplican siempre)
- `npm run build:full` tiene un orden: clean → multisrc → compile → manifest.
- Los plugins deben devolver TODOS los capítulos y el contenido completo, nunca paginado.
- Sube el `version` del plugin en cada cambio; commitea fuente `.ts` + compilado `.js` + `.dist`.
- Nunca re-agregues sitios listados en `BLACKLIST.json` sin aprobación.
- Se requiere Node.js >= 22.

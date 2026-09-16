#!/usr/bin/env node
// Guard de seguridad del traductor EN->ES.
// Aborta si cualquier artefacto .js compilado requiere '@libs/translation',
// porque la app del usuario no lo define y eso rompe 'Actualización fallida'.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.js',
  'plugins',
);
const offenders = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes('@libs/translation'))
        offenders.push(path.relative(base, full));
    }
  }
}

walk(base);

if (offenders.length > 0) {
  console.error(
    `[guard] FATAL: ${offenders.length} .js compilados requieren @libs/translation (rompe Actualización fallida):`,
  );
  for (const f of offenders) console.error('  - ' + f);
  process.exit(1);
}
console.log(`[guard] OK: ningún .js de ${base} requiere @libs/translation`);

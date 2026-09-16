import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';

const COMPILED_PLUGIN_DIR = './.js/plugins';
const TSC = 'node node_modules/typescript/bin/tsc';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lnreader-tl-'));

execSync(
  `${TSC} src/libs/translation.ts --module commonjs --target es5 --noResolve --noCheck --skipLibCheck --outDir ${tmpDir}`,
  { stdio: 'pipe' },
);

const libPath = fs
  .readdirSync(tmpDir)
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(tmpDir, f))
  .find(f => fs.statSync(f).isFile());

if (!libPath) {
  throw new Error('Failed to compile src/libs/translation.ts');
}

const libCode = fs.readFileSync(libPath, 'utf-8').trim();
const bundleStart = libCode.indexOf('"use strict";');
const bundleCode = bundleStart >= 0 ? libCode.slice(bundleStart) : libCode;

const TRANSLATION_FN = `"use strict";\nfunction __translationRequire() { var module = { exports: {} }; var exports = module.exports; ${bundleCode} return module.exports; }\n`;

const requireRe = /require\((["'])@libs\/translation\1\)/g;

let touched = 0;
let skipped = 0;

for (const language of fs.readdirSync(COMPILED_PLUGIN_DIR)) {
  const langPath = path.join(COMPILED_PLUGIN_DIR, language);
  if (!fs.statSync(langPath).isDirectory()) continue;
  for (const plugin of fs.readdirSync(langPath)) {
    if (!plugin.endsWith('.js')) continue;
    const filePath = path.join(langPath, plugin);
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!requireRe.test(raw)) continue;
    if (raw.includes('__translationRequire')) {
      console.log('  skip (already inlined)', language + '/' + plugin);
      skipped += 1;
      continue;
    }
    const inlined = raw.replace(requireRe, () => '__translationRequire()');
    fs.writeFileSync(filePath, TRANSLATION_FN + inlined);
    touched += 1;
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(
  `Inline @libs/translation: ${touched} plugin(s) updated, ${skipped} already inlined.`,
);

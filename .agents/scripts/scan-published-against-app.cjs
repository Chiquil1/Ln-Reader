const fs = require('fs');
const path = require('path');

// EXACTO del app: src/plugins/pluginManager.ts:47-68
const DANGEROUS_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /Function\s*\(/,
  /setTimeout\s*\(/,
  /setInterval\s*\(/,
  /setImmediate\s*\(/,
  /process\./,
  /require\s*\(\s*['"]fs['"]/,
  /require\s*\(\s*['"]child_process['"]/,
  /require\s*\(\s*['"]vm['"]/,
  /require\s*\(\s*['"]cluster['"]/,
  /global\s*=/,
  /window\s*=/,
  /self\s*=/,
  /this\s*\.\s*constructor/,
  /__proto__/,
  /constructor\s*\[/,
  /Object\.constructor/,
  /Array\.constructor/,
  /Function\.constructor/,
];
const validate = code => {
  for (const p of DANGEROUS_PATTERNS) if (p.test(code)) return 'danger:' + p.source;
  const lines = code.split('\n');
  if (lines.length > 5000) return 'lines>' + lines.length;
  return null;
};

// EXACTO del app: packages whitelist (line 33-45) + special @libs/storage
const WHITELIST = new Set([
  'htmlparser2', 'cheerio', 'dayjs', 'urlencode',
  '@libs/novelStatus', '@libs/fetch', '@libs/isAbsoluteUrl', '@libs/filterInputs',
  '@libs/defaultCover', '@libs/aes', '@libs/utils', '@libs/storage',
]);
const allRequires = code => Array.from(code.matchAll(/require\s*\((['"])(.*?)\1\)/g)).map(m => m[2]);

const root = '.js/plugins';
const results = [];
let total = 0, failed = 0;
const requireOffenders = [];
for (const lang of fs.readdirSync(root)) {
  const dir = path.join(root, lang);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    total++;
    const code = fs.readFileSync(path.join(dir, file), 'utf-8');
    const v = validate(code);
    if (v) { failed++; results.push({ file: lang + '/' + file, reason: v }); }
    const badReq = [...new Set(allRequires(code))].filter(p => !WHITELIST.has(p));
    if (badReq.length || v) {
      requireOffenders.push({ file: lang + '/' + file, badReq: badReq.length ? badReq : null, reason: v });
    }
  }
}
results.sort((a, b) => a.reason.localeCompare(b.reason));
console.log(`TOTAL .js: ${total} | FALLAN validatePluginCode: ${failed}`);
console.log('\n=== POR REGEX ===');
const byPattern = {};
for (const r of results) (byPattern[r.reason] = byPattern[r.reason] || []).push(r.file);
for (const [reason, files] of Object.entries(byPattern).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`\n${reason}  (${files.length}):\n  ` + files.join('\n  '));
}
console.log('\n=== require() FUERA del whitelist de la app ===');
let badReqFiles = 0;
for (const o of requireOffenders) {
  if (o.badReq && o.badReq.length) { badReqFiles++; console.log(o.file, '->', o.badReq.join(', ')); }
}
if (badReqFiles === 0) console.log('(ninguno)');
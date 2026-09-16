import path from 'path';
import fs from 'fs';

// type GeneratedScript = {
//   lang: string;
//   filename: string;
//   pluginScript: string;
// };

// export type ScrpitGeneratorFunction = () => GeneratedScript[];

const isScriptGenerator = s => {
  return !!s && typeof s === 'function';
};

// Multisrc templates that already translate internally (parseNovel/parseChapter):
// the wrapper only adds listing + search translation for them to avoid double work.
const INTERNAL_TRANSLATION = new Set(['madara']);

const isEnglish = lang => {
  return (lang || 'English').toLowerCase() === 'english';
};

const wrapWithTranslation = (pluginScript, multisrcName) => {
  const internalTranslation = INTERNAL_TRANSLATION.has(multisrcName);
  const wrapArgs = internalTranslation
    ? `, {
  translateNovel: false,
  translateChapter: false,
}`
    : '';
  const importLine = "import { withTranslation } from '@libs/translation';";
  const wrapped = pluginScript.replace(
    /export default plugin;$/,
    `export default withTranslation(plugin${wrapArgs});`,
  );
  return `${importLine}\n${wrapped}`;
};

const generate = async name => {
  try {
    const generateAll = (await import(`./${name}/generator.js`)).generateAll;
    if (!isScriptGenerator(generateAll)) return false;
    const sources = generateAll();
    for (let source of sources) {
      const { lang, filename, pluginScript } = source;
      if (!lang || !filename || !pluginScript) {
        console.warn(name, ': lang, filename, pluginScript are required!');
        continue;
      }
      const pluginsDir = './plugins';
      const filePath = path.join(
        pluginsDir,
        lang.toLowerCase(),
        filename.replace(/[\s-.]+/g, '') + `[${name}].ts`,
      );
      const finalScript = isEnglish(lang)
        ? wrapWithTranslation(pluginScript, name)
        : pluginScript;
      fs.writeFileSync(filePath, finalScript, { encoding: 'utf-8' });
    }
    return true;
  } catch (e) {
    console.log(`${name} is broken! ${e}\n`);
    return false;
  }
};

const MULTISRC_DIR = './plugins/multisrc';

const run = async () => {
  const sources = fs
    .readdirSync(MULTISRC_DIR)
    .filter(
      name =>
        fs.lstatSync(path.join(MULTISRC_DIR, name)).isDirectory() &&
        !name.endsWith('.broken'),
    );

  for (let name of sources) {
    const success = await generate(name);
    if (success) console.log(`[${name}] OK`);
  }
};

run();

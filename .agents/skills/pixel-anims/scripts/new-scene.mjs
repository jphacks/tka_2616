#!/usr/bin/env node
// Scaffold a pixel-anims page: the template with ENGINE regions intact and every SCENE region emptied.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = process.argv[2];
if (!out) {
  console.error('Usage: node new-scene.mjs <out.html>');
  process.exit(1);
}
const target = resolve(out);
if (existsSync(target)) {
  console.error(`Refusing to overwrite ${target}`);
  process.exit(1);
}
const template = join(dirname(fileURLToPath(import.meta.url)), '../assets/wizard-spellcaster.html');
const page = readFileSync(template, 'utf8')
  .replace(/(\/\/ #region SCENE[^\n]*\n)[\s\S]*?(\/\/ #endregion)/g, '$1// TODO: fill per the SKILL.md engine contract\n$2')
  .replace(/<title>[^<]*<\/title>/, '<title>TODO</title>')
  .replace(/aria-label="[^"]*"/, 'aria-label="TODO"');
writeFileSync(target, page);
console.log(target);

#!/usr/bin/env node
// Render chosen ticks of a pixel-anims page to PNG through headless Chrome/Edge, using the page's #t=N seek mode.
// Exit codes: 0 ok, 1 usage/browser failure, 2 page logged errors, 3 page breaks the skill contract.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const USAGE = 'Usage: node snapshot.mjs <page.html> <tick[,tick...]> [--scale N] [--crop x,y,w,h] [--out DIR]';
const MIN_WIDTH = 512; // headless Chrome on Windows lays out at least ~500px wide and crops narrower shots
const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '../assets/wizard-spellcaster.html');
const args = process.argv.slice(2);
const scaleArg = Number(option('--scale', 4));
const outArg = option('--out', null);
const cropArg = option('--crop', null);
const [page, tickList] = args;
if (!page || !tickList) fail(USAGE);

const html = resolve(page);
if (!existsSync(html)) fail(`Not found: ${html}`);
const ticks = tickList.split(',').filter(Boolean).map(Number);
if (!ticks.length || ticks.some(t => !Number.isInteger(t) || t < 0)) fail(`Ticks must be non-negative integers: ${tickList}`);
if (!Number.isInteger(scaleArg) || scaleArg < 1) fail(`--scale must be a positive integer: ${scaleArg}`);

const source = readFileSync(html, 'utf8');
const size = /const W = (\d+), H = (\d+)/.exec(source);
if (!size) console.warn('warning: no literal "const W = <w>, H = <h>" found; assuming 128x96');
const [w, h] = size ? [+size[1], +size[2]] : [128, 96];
// --crop x,y,w,h (logical px) zooms the shot onto one region, e.g. the actor, to hunt stray pixels.
const crop = cropArg === null ? null : cropArg.split(',').map(Number);
if (crop && (crop.length !== 4 || crop.some(v => !Number.isInteger(v) || v < 0) || !crop[2] || !crop[3] ||
  crop[0] + crop[2] > w || crop[1] + crop[3] > h)) fail(`--crop must be x,y,w,h inside ${w}x${h}: ${cropArg}`);
const [rw, rh] = crop ? [crop[2], crop[3]] : [w, h];
const scale = Math.max(scaleArg, Math.ceil(MIN_WIDTH / rw));
if (scale !== scaleArg) console.warn(`note: scale raised to ${scale} so the shot is at least ${MIN_WIDTH}px wide`);

const problems = contractProblems(source);
const browser = findBrowser() ?? fail('No Chrome/Edge/Chromium found. Set CHROME_PATH.');
const out = resolve(outArg ?? join(dirname(html), 'snapshots'));
mkdirSync(out, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'pixel-anims-')); // per run, so parallel runs don't collide

let pageErrors = 0;
for (const t of ticks) {
  const png = join(out, crop ? `snap-${t}-crop-${crop.join('-')}.png` : `snap-${t}.png`);
  rmSync(png, { force: true });
  const run = spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--user-data-dir=${profile}`,
    '--force-device-scale-factor=1', `--window-size=${rw * scale},${rh * scale}`,
    '--enable-logging=stderr', '--v=0', `--screenshot=${png}`,
    `${pathToFileURL(html).href}#t=${t}${crop ? `&crop=${crop.join(',')}` : ''}`,
  ], { encoding: 'utf8', timeout: 60000 });
  if (run.error) fail(`Browser failed on tick ${t}: ${run.error.message}`);
  const lines = (run.stderr ?? '').split(/\r?\n/);
  for (const line of lines) {
    // Chrome prints page console output as INFO:CONSOLE:<line> or CONSOLE(<line>)
    if (!/CONSOLE[:(]/.test(line) || line.includes('extension://')) continue;
    console.error(`[tick ${t}] ${line.trim()}`);
    if (/Uncaught|Error|pixel-anims/.test(line)) pageErrors++;
  }
  if (!existsSync(png)) fail(`No screenshot written for tick ${t} (browser exit ${run.status}):\n${lines.slice(-8).join('\n')}`);
  console.log(png);
}
rmSync(profile, { recursive: true, force: true });
for (const p of problems) console.error(`contract: ${p}`);
process.exit(pageErrors ? 2 : problems.length ? 3 : 0);

// Static checks the browser can't report: silently overridden engine functions and edited ENGINE regions.
function contractProblems(src) {
  const found = [];
  const names = [...src.matchAll(/^\s*function\s+([\w$]+)\s*\(/gm)].map(m => m[1]);
  const twice = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  if (twice.length) found.push(`function declared twice (the later one silently replaces the first): ${twice.join(', ')}`);
  if (resolve(TEMPLATE) === html || !existsSync(TEMPLATE)) return found;
  const regions = s => new Map([...s.replace(/\r\n/g, '\n').matchAll(/\/\/ #region (ENGINE[^\n]*)\n([\s\S]*?)\/\/ #endregion/g)]
    .map(m => [m[1].trim(), m[2]]));
  const mine = regions(src);
  for (const [name, body] of regions(readFileSync(TEMPLATE, 'utf8')))
    if (mine.get(name) !== body) found.push(`region "${name}" differs from the template; copy ENGINE regions verbatim`);
  return found;
}

function option(name, fallback) {
  const eq = args.findIndex(a => a.startsWith(name + '='));
  if (eq >= 0) return args.splice(eq, 1)[0].slice(name.length + 1);
  const i = args.indexOf(name);
  return i < 0 ? fallback : args.splice(i, 2)[1];
}

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const known = [
    ...roots.flatMap(r => [join(r, 'Google/Chrome/Application/chrome.exe'), join(r, 'Microsoft/Edge/Application/msedge.exe')]),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].find(existsSync);
  if (known) return known;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const found = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
    if (found.status === 0) return found.stdout.split(/\r?\n/)[0].trim();
  }
  return null;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

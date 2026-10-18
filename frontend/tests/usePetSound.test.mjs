import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/hooks/usePetSound.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const settle = () => new Promise(resolve => setImmediate(resolve));
function harness(saved = null) {
 const effects = [], cleanups = [], sources = [], contexts = [], storage = new Map(), listeners = new Map(), fetched = [];
 if (saved) storage.set('kurashimon-sound', saved);
 let time = 1000;
 class Audio {
  state = 'running'; currentTime = 0; destination = {};
  constructor() { contexts.push(this); }
  async decodeAudioData(bytes) { return { duration: .6, file: bytes.file }; }
  createBufferSource() { const node = { connect() {}, disconnect() {}, start(when) { this.when = when; }, stop() { this.stopped = true; }, stopped: false }; sources.push(node); return node; }
  createGain() { return { gain: { setValueAtTime() {} }, connect() {}, disconnect() {} }; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
 }
 const doc = { hidden: false, addEventListener: (k, fn) => listeners.set(k, fn), removeEventListener: k => listeners.delete(k) };
 const sandbox = { fetch: async file => { fetched.push(file); return { ok: true, arrayBuffer: async () => ({ file }) }; }, exports: {}, require: () => ({ useCallback: fn => fn, useRef: value => ({ current: value }), useState: value => [value, () => {}], useEffect: fn => effects.push(fn) }), window: { AudioContext: Audio }, document: doc, performance: { now: () => time }, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) } };
 vm.runInNewContext(source, sandbox);
 const hook = sandbox.exports.usePetSound(); effects.forEach(fn => cleanups.push(fn()));
 return { sandbox, hook, sources, contexts, storage, doc, listeners, fetched, advance: () => { time += 200; }, cleanup: () => cleanups.forEach(fn => fn()) };
}
test('off by default, toggle greets once, disabling stops all playback', async () => {
 const h = harness(); await h.hook.play(); assert.equal(h.contexts.length, 0);
 h.hook.toggle(); await settle(); assert.equal(h.storage.get('kurashimon-sound'), 'on');
 assert.equal(h.sources.length, 1); assert.match(h.sources[0].buffer.file, /voice\/welcome/);
 h.hook.greet(); await settle(); assert.equal(h.sources.length, 1);
 h.hook.toggle(); assert.ok(h.sources.every(n => n.stopped)); h.advance(); await h.hook.play('grow'); assert.equal(h.sources.length, 1); h.cleanup();
});
test('saved preference never autoplays; unlock fetches but makes no sound', async () => {
 const h = harness('on'); assert.equal(h.contexts.length, 0); await h.hook.unlock(); await settle(); assert.equal(h.sources.length, 0);
 await h.hook.play('voice'); assert.match(h.sources[0].buffer.file, /pet\/pet/); h.cleanup();
});
test('UI sounds use Kenney and do not interrupt character or speech lanes', async () => {
 const h = harness('on'); await h.hook.play('fanfare'); assert.equal(h.sources.length, 2);
 assert.match(h.sources[0].buffer.file, /pet\/evolution/); assert.match(h.sources[1].buffer.file, /voice\/cheer/);
 assert.ok(h.sources[1].when > h.sources[0].when + .6);
 await h.hook.play('tap'); assert.match(h.sources[2].buffer.file, /ui\/tap/);
 assert.ok(h.sources.slice(0,2).every(s => !s.stopped));
 await h.hook.play('tap'); assert.equal(h.sources.length, 3);
 h.advance(); await h.hook.play('select'); assert.equal(h.sources[2].stopped, true); assert.equal(h.sources[0].stopped, false);
 h.cleanup(); assert.ok(h.sources.every(s => s.stopped)); assert.equal(h.contexts[0].state, 'closed');
});
for (const [cue, file] of [['complete','complete'],['grow','evolution'],['wave','wave'],['dance','dance'],['sleep','sleep'],['bubble','pet']]) test(`${cue} uses the provided character asset`, async () => {
 const h = harness('on'); await h.hook.play(cue); assert.equal(h.sources[0].buffer.file, `/audio/pet/${file}.mp3`); h.cleanup();
});
test('hidden tab cancels playing and scheduled sounds', async () => {
 const h = harness('on'); await h.hook.play('complete'); h.doc.hidden = true; h.listeners.get('visibilitychange')();
 assert.ok(h.sources.every(s => s.stopped)); h.advance(); await h.hook.play('voice'); assert.equal(h.sources.length, 2); h.cleanup();
});
test('old download cannot replace a newer character action', async () => {
 const h = harness('on'); let release;
 h.sandbox.fetch = file => file.includes('pet/pet') ? new Promise(resolve => { release = () => resolve({ ok: true, arrayBuffer: async () => ({ file }) }); }) : Promise.resolve({ ok: true, arrayBuffer: async () => ({ file }) });
 const old = h.hook.play('voice'); h.advance(); await h.hook.play('grow'); release(); await old;
 assert.equal(h.sources.length, 1); assert.match(h.sources[0].buffer.file, /evolution/); h.cleanup();
});
test('closing or muting during a download prevents delayed sound', async () => {
 for (const action of ['stop', 'toggle']) {
  const h = harness('on'); let release;
  h.sandbox.fetch = file => new Promise(resolve => { release = () => resolve({ ok: true, arrayBuffer: async () => ({ file }) }); });
  const pending = h.hook.play('voice'); h.hook[action](); release(); await pending;
  assert.equal(h.sources.length, 0); h.cleanup();
 }
});
test('missing file does not invent a sound; retry can succeed', async () => {
 const h = harness('on'); const fetch = h.sandbox.fetch; h.sandbox.fetch = async () => ({ ok: false });
 await h.hook.play('voice'); assert.equal(h.sources.length, 0);
 h.sandbox.fetch = fetch; h.advance(); await h.hook.play('voice'); assert.equal(h.sources.length, 1); h.cleanup();
});

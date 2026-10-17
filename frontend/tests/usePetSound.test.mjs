import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/hooks/usePetSound.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function harness(saved = null, character = 'dishes') {
 const effects = [], cleanups = [], oscillators = [], contexts = [], storage = new Map(), listeners = new Map();
 if (saved) storage.set('kurashimon-sound', saved);
 let time = 1000;
 const parameter = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
 class Audio {
  state = 'running'; currentTime = 0; destination = {};
  constructor() { contexts.push(this); }
  createOscillator() { const node = { frequency: parameter(), connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true; }, stopped: false }; oscillators.push(node); return node; }
  async decodeAudioData() { return { duration: 1.3 }; }
  createBufferSource() { return this.createOscillator(); }
  createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
 }
 const doc = { hidden: false, addEventListener: (k, fn) => listeners.set(k, fn), removeEventListener: k => listeners.delete(k) };
 const sandbox = { fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }), exports: {}, require: () => ({ useCallback: fn => fn, useRef: value => ({ current: value }), useState: value => [value, () => {}], useEffect: fn => effects.push(fn) }), window: { AudioContext: Audio }, document: doc, performance: { now: () => time }, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) } };
 vm.runInNewContext(source, sandbox);
 const hook = sandbox.exports.usePetSound(character);
 effects.forEach(fn => cleanups.push(fn()));
 return { sandbox, hook, oscillators, contexts, storage, doc, listeners, advance: () => { time += 200; }, cleanup: () => cleanups.forEach(fn => fn()) };
}
test('off by default; enabling is persisted, disabling stops every scheduled note', async () => {
 const h = harness(); await h.hook.play(); assert.equal(h.contexts.length, 0);
 h.hook.toggle(); assert.equal(h.oscillators.length, 3); assert.equal(h.storage.get('kurashimon-sound'), 'on');
 h.hook.toggle(); assert.ok(h.oscillators.every(n => n.stopped));
 h.advance(); await h.hook.play('grow'); assert.equal(h.oscillators.length, 3); h.cleanup();
});
for (const character of ['dishes', 'ingredients', 'cooking', 'laundry']) test(`${character}: saved preference never autoplays; cues replace voices and cleanup closes audio`, async () => {
 const h = harness('on', character); assert.equal(h.contexts.length, 0);
 await h.hook.play('voice'); assert.equal(h.oscillators.length, 3);
 await h.hook.play('voice'); assert.equal(h.oscillators.length, 3); // rapid taps bounded
 h.advance(); await h.hook.play('complete'); assert.equal(h.oscillators.length, 7); assert.ok(h.oscillators.slice(0,3).every(n => n.stopped));
 h.advance(); await h.hook.play('grow'); assert.equal(h.oscillators.length, 12);
 h.doc.hidden = true; h.listeners.get('visibilitychange')(); assert.ok(h.oscillators.every(n => n.stopped));
 h.advance(); await h.hook.play(); assert.equal(h.oscillators.length, 12);
 h.cleanup(); assert.equal(h.contexts[0].state, 'closed'); assert.equal(h.listeners.size, 0);
});
test('muting while a suspended context resumes cannot start stale audio', async () => {
 const h = harness('on'); await h.hook.play(); const ctx = h.contexts[0]; ctx.state = 'suspended';
 let release; ctx.resume = () => new Promise(resolve => { release = () => { ctx.state = 'running'; resolve(); }; });
 h.advance(); const pending = h.hook.play('grow'); h.hook.toggle(); release(); await pending;
 assert.equal(h.oscillators.length, 3); assert.ok(h.oscillators.every(n => n.stopped)); h.cleanup();
});
test('user gesture can unlock before a network request without making a sound', async () => {
 const h = harness('on'); await h.hook.unlock(); assert.equal(h.contexts.length, 1); assert.equal(h.oscillators.length, 0);
 await h.hook.play('complete'); assert.equal(h.oscillators.length, 4); h.cleanup();
});

test('fanfare uses one decoded sample; muting stops it', async () => {
 const h = harness('on'); await h.hook.unlock(); await h.hook.play('fanfare');
 assert.equal(h.oscillators.length, 1); assert.equal(h.oscillators[0].buffer.duration, 1.3);
 h.hook.toggle(); assert.equal(h.oscillators[0].stopped, true); h.cleanup();
});
test('failed sample falls back; a delayed download cannot play after closing', async () => {
 const h = harness('on'); h.sandbox.fetch = async () => ({ ok: false });
 await h.hook.play('fanfare'); assert.equal(h.oscillators.length, 5); h.cleanup();
 const delayed = harness('on'); let release;
 delayed.sandbox.fetch = () => new Promise(resolve => { release = () => resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }); });
 const pending = delayed.hook.play('fanfare'); delayed.hook.stop(); release(); await pending;
 assert.equal(delayed.oscillators.length, 0); delayed.cleanup();
});

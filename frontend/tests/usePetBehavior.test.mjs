import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/hooks/usePetBehavior.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function harness(hour = 12) {
 let now = 100000, index = 0, effect, cleanup, deps, active = true;
 const slots = [], intervals = new Set(), listeners = new Map();
 const doc = { hidden: false, addEventListener: (k, f) => listeners.set(k, f), removeEventListener: k => listeners.delete(k) };
 class Clock { static now() { return now; } getHours() { return hour; } }
 const sandbox = { exports: {}, Date: Clock, Math, document: doc,
  setInterval: f => { intervals.add(f); return f; }, clearInterval: f => intervals.delete(f),
  require: () => ({ useState(v) { const i = index++; if (!(i in slots)) slots[i] = v; return [slots[i], v => { slots[i] = v; }]; }, useRef(v) { const i = index++; return slots[i] ??= { current: v }; }, useCallback: f => f, useEffect(f, d) { if (!deps || d.some((v,i) => v !== deps[i])) { effect = f; deps = d; } } }) };
 vm.runInNewContext(source, sandbox);
 function render() { index = 0; const result = sandbox.exports.usePetBehavior(active); if (effect) { cleanup?.(); const f = effect; effect = null; cleanup = f(); return render(); } return result; }
 return { render, advance(ms) { now += ms; intervals.forEach(f => f()); return render(); }, hour(v) { hour = v; }, active(v) { active = v; return render(); }, visible(v) { doc.hidden = !v; listeners.get('visibilitychange')?.(); return render(); }, cleanup() { cleanup(); assert.equal(intervals.size, 0); assert.equal(listeners.size, 0); } };
}
test('greet, idle, occasional play, then idle without getting stuck', () => {
 const h = harness(); assert.equal(h.render().motion, 'wave');
 assert.equal(h.advance(4000).motion, 'idle');
 assert.ok(['bubble','dance'].includes(h.advance(20000).motion));
 assert.equal(h.advance(4000).motion, 'idle'); h.cleanup();
});
test('night follows local time, touch wakes briefly, dawn returns to daytime', () => {
 const h = harness(22); assert.equal(h.render().night, true);
 assert.equal(h.advance(4000).motion, 'sleep');
 h.render().play('happy'); assert.equal(h.render().motion, 'happy');
 assert.equal(h.advance(4000).motion, 'sleep');
 h.hour(6); assert.equal(h.advance(1000).night, false); assert.equal(h.render().motion, 'idle'); h.cleanup();
});
test('hidden and suspended screens do not start ambient play; return greets', () => {
 const h = harness(); h.render(); h.advance(4000); h.visible(false);
 assert.equal(h.advance(60000).motion, 'idle');
 assert.equal(h.visible(true).motion, 'wave'); h.advance(4000);
 h.active(false); assert.equal(h.advance(60000).motion, 'idle');
 assert.equal(h.active(true).motion, 'wave'); h.cleanup();
});
test('completion and evolution survive resume, expire and reset to normal', () => {
 const h = harness(); h.render(); h.active(false); h.render().play('dance');
 assert.equal(h.active(true).motion, 'dance'); assert.equal(h.advance(4000).motion, 'idle');
 h.render().play('grow'); assert.equal(h.advance(4000).motion, 'idle');
 h.render().play('bubble'); h.render().reset(); assert.equal(h.render().motion, 'idle'); h.cleanup();
});

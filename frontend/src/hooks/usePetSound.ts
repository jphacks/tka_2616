'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterId } from '@/lib/characters';

type Cue = 'voice' | 'complete' | 'grow' | 'bubble' | 'sleep' | 'dance';
const voices: Record<CharacterId, { pitch: number; wave: OscillatorType }> = {
 dishes: { pitch: 660, wave: 'sine' }, ingredients: { pitch: 780, wave: 'triangle' },
 cooking: { pitch: 440, wave: 'sine' }, laundry: { pitch: 880, wave: 'sine' },
};
// Small syllable-like pitch bends; no recorded voices, downloads or external service.
export function usePetSound(character: CharacterId) {
 const [enabled, setEnabled] = useState(false);
 const [unavailable, setUnavailable] = useState(false);
 const active = useRef(false);
 const context = useRef<AudioContext | null>(null);
 const nodes = useRef(new Set<OscillatorNode>());
 const last = useRef(-Infinity);
 const generation = useRef(0);
 const stop = useCallback(() => {
  generation.current++;
  for (const node of nodes.current) { try { node.stop(); } catch {} }
  nodes.current.clear();
 }, []);
 useEffect(() => {
  try { active.current = localStorage.getItem('kurashimon-sound') === 'on'; setEnabled(active.current); } catch {}
  const hide = () => { if (document.hidden) { stop(); void context.current?.suspend().catch(() => {}); } };
  document.addEventListener('visibilitychange', hide);
  return () => { active.current = false; stop(); document.removeEventListener('visibilitychange', hide); void context.current?.close().catch(() => {}); context.current = null; };
 }, [stop]);
 const play = useCallback(async (cue: Cue = 'voice') => {
  if (!active.current || document.hidden) return;
  const now = performance.now();
  if (now - last.current < 100) return;
  last.current = now;
  const token = generation.current;
  try {
   const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
   if (!Audio) { setUnavailable(true); return; }
   const ctx = context.current ?? (context.current = new Audio());
   if (ctx.state !== 'running') await ctx.resume();
   if (!active.current || document.hidden || token !== generation.current || ctx.state !== 'running') return;
   stop();
   const voice = voices[character];
   const notes = cue === 'grow' ? [1, 1.25, 1.5, 2, 2.5] : cue === 'complete' ? [1, 1.25, 1.5, 2] : cue === 'dance' ? [1, 1.5, 1.25, 1.5] : cue === 'sleep' ? [1, .8] : cue === 'bubble' ? [.8, 1.3, 1.8] : [1, 1.35, 1.15];
   const length = cue === 'sleep' ? .2 : .11;
   for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const start = ctx.currentTime + .01 + i * (length + .035), end = start + length;
    const pitch = voice.pitch * notes[i] * (cue === 'sleep' ? .65 : 1);
    osc.type = voice.wave;
    osc.frequency.setValueAtTime(pitch * .85, start);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.08, start + length * .4);
    osc.frequency.exponentialRampToValueAtTime(pitch * .92, end);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.055, start + .012);
    gain.gain.exponentialRampToValueAtTime(.001, end);
    gain.gain.linearRampToValueAtTime(0, end + .01);
    osc.connect(gain); gain.connect(ctx.destination); nodes.current.add(osc);
    osc.onended = () => { nodes.current.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(start); osc.stop(end + .02);
   }
   setUnavailable(false);
  } catch { setUnavailable(true); }
 }, [character, stop]);
 // Call at the start of a user gesture, before photo uploads await network I/O.
 // This keeps later completion sounds eligible for mobile autoplay policies.
 const unlock = useCallback(async () => {
  if (!active.current || document.hidden) return;
  try {
   const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
   if (!Audio) { setUnavailable(true); return; }
   const ctx = context.current ?? (context.current = new Audio());
   if (ctx.state !== 'running') await ctx.resume();
  } catch { setUnavailable(true); }
 }, []);
 function toggle() {
  const next = !active.current; active.current = next; setEnabled(next);
  try { localStorage.setItem('kurashimon-sound', next ? 'on' : 'off'); } catch {}
  if (next) void play('voice'); else stop();
 }
 return { enabled, unavailable, toggle, play, unlock };
}

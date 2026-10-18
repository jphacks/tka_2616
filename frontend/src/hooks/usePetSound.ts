'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type Lane = 'ui' | 'pet' | 'speech';
type Cue = 'voice' | 'complete' | 'grow' | 'fanfare' | 'bubble' | 'sleep' | 'dance' | 'wave' | 'welcome' | 'cheer' | 'tap' | 'select' | 'open' | 'close' | 'confirm';
const sounds: Record<Cue, { file: string; lane: Lane; volume: number }> = {
 tap: { file: 'ui/tap', lane: 'ui', volume: .55 }, select: { file: 'ui/select', lane: 'ui', volume: .55 },
 open: { file: 'ui/open', lane: 'ui', volume: .5 }, close: { file: 'ui/close', lane: 'ui', volume: .5 }, confirm: { file: 'ui/confirm', lane: 'ui', volume: .5 },
 voice: { file: 'pet/pet', lane: 'pet', volume: .65 }, bubble: { file: 'pet/pet', lane: 'pet', volume: .65 },
 wave: { file: 'pet/wave', lane: 'pet', volume: .65 }, dance: { file: 'pet/dance', lane: 'pet', volume: .55 }, sleep: { file: 'pet/sleep', lane: 'pet', volume: .55 },
 complete: { file: 'pet/complete', lane: 'pet', volume: .65 }, grow: { file: 'pet/evolution', lane: 'pet', volume: .65 }, fanfare: { file: 'pet/evolution', lane: 'pet', volume: .65 },
 welcome: { file: 'voice/welcome', lane: 'speech', volume: .8 }, cheer: { file: 'voice/cheer', lane: 'speech', volume: .8 },
};
export function usePetSound() {
 const [enabled, setEnabled] = useState(false);
 const [unavailable, setUnavailable] = useState(false);
 const active = useRef(false), greeted = useRef(false);
 const context = useRef<AudioContext | null>(null);
 const buffers = useRef(new Map<string, Promise<AudioBuffer>>());
 const nodes = useRef<Record<Lane, Set<AudioBufferSourceNode>>>({ ui: new Set(), pet: new Set(), speech: new Set() });
 const requests = useRef<Record<Lane, number>>({ ui: 0, pet: 0, speech: 0 });
 const last = useRef<Record<Lane, number>>({ ui: -Infinity, pet: -Infinity, speech: -Infinity });
 const stopLane = useCallback((lane: Lane) => {
  requests.current[lane]++;
  for (const source of nodes.current[lane]) { try { source.stop(); } catch {} }
  nodes.current[lane].clear();
 }, []);
 const stop = useCallback(() => { stopLane('ui'); stopLane('pet'); stopLane('speech'); }, [stopLane]);
 useEffect(() => {
  try { active.current = localStorage.getItem('kurashimon-sound') === 'on'; setEnabled(active.current); } catch {}
  const hide = () => { if (document.hidden) { stop(); void context.current?.suspend().catch(() => {}); } };
  document.addEventListener('visibilitychange', hide);
  return () => { active.current = false; stop(); document.removeEventListener('visibilitychange', hide); void context.current?.close().catch(() => {}); context.current = null; buffers.current.clear(); };
 }, [stop]);
 const getContext = useCallback(() => {
  const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) throw new Error('Audio unavailable');
  return context.current ?? (context.current = new Audio());
 }, []);
 const load = useCallback((ctx: AudioContext, file: string) => {
  let pending = buffers.current.get(file);
  if (!pending) {
   pending = fetch(`/audio/${file}.mp3`).then(response => {
    if (!response.ok) throw new Error('Sound unavailable'); return response.arrayBuffer();
   }).then(bytes => ctx.decodeAudioData(bytes)).catch(error => { buffers.current.delete(file); throw error; });
   buffers.current.set(file, pending);
  }
  return pending;
 }, []);
 const play = useCallback(async (cue: Cue = 'voice') => {
  if (!active.current || document.hidden) return;
  const spec = sounds[cue], lane = spec.lane, now = performance.now();
  if (now - last.current[lane] < 90) return;
  last.current[lane] = now;
  stopLane(lane); // Invalidate older downloads immediately, not only after decoding.
  const token = requests.current[lane];
  const withCheer = cue === 'complete' || cue === 'fanfare';
  if (withCheer) stopLane('speech');
  const speechToken = requests.current.speech;
  try {
   const ctx = getContext();
   if (ctx.state !== 'running') await ctx.resume();
   const [buffer, cheer] = await Promise.all([load(ctx, spec.file), withCheer ? load(ctx, sounds.cheer.file).catch(() => null) : Promise.resolve(null)]);
   if (!active.current || document.hidden || token !== requests.current[lane] || ctx.state !== 'running') return;
   const schedule = (data: AudioBuffer, destination: Lane, volume: number, when: number) => {
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = data; gain.gain.setValueAtTime(volume, when);
    source.connect(gain); gain.connect(ctx.destination); nodes.current[destination].add(source);
    source.onended = () => { nodes.current[destination].delete(source); source.disconnect(); gain.disconnect(); };
    source.start(when);
   };
   schedule(buffer, lane, spec.volume, ctx.currentTime + .01);
   if (cheer && speechToken === requests.current.speech) schedule(cheer, 'speech', sounds.cheer.volume, ctx.currentTime + buffer.duration + .12);
   setUnavailable(false);
  } catch { if (active.current && token === requests.current[lane]) setUnavailable(true); }
 }, [getContext, load, stopLane]);
 const unlock = useCallback(async () => {
  if (!active.current || document.hidden) return;
  try {
   const ctx = getContext(); if (ctx.state !== 'running') await ctx.resume();
   for (const file of ['ui/tap', 'pet/pet', 'pet/complete', 'pet/evolution', 'voice/welcome', 'voice/cheer']) void load(ctx, file).catch(() => {});
  } catch { setUnavailable(true); }
 }, [getContext, load]);
 const greet = useCallback(() => {
  if (!active.current || greeted.current || document.hidden) return;
  greeted.current = true; void play('welcome');
 }, [play]);
 function toggle() {
  active.current = !active.current; setEnabled(active.current);
  try { localStorage.setItem('kurashimon-sound', active.current ? 'on' : 'off'); } catch {}
  if (active.current) { void unlock(); greet(); } else stop();
 }
 return { enabled, unavailable, toggle, play, unlock, stop, greet };
}

'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Motion } from '@/components/PondScene';

// Device-local time: quiet evenings, with a short greeting even at night.
export function isPetNight(hour: number) { return hour >= 21 || hour < 6; }
export function usePetBehavior(active: boolean) {
 const [motion, setMotion] = useState<Motion>('idle');
 const [night, setNight] = useState(false);
 const transient = useRef<{ motion: Motion; until: number } | null>(null);
 const nextPlay = useRef(0);
 const play = useCallback((next: Motion) => {
  transient.current = { motion: next, until: Date.now() + 4000 };
  nextPlay.current = Date.now() + 24000;
  setMotion(next);
 }, []);
 const reset = useCallback(() => {
  transient.current = null;
  nextPlay.current = Date.now() + 24000;
  setMotion(isPetNight(new Date().getHours()) ? 'sleep' : 'idle');
 }, []);
 useEffect(() => {
  function tick(greet = false) {
   const now = Date.now();
   const dark = isPetNight(new Date().getHours());
   setNight(dark);
   if (transient.current && transient.current.until <= now) {
    transient.current = null;
    setMotion(dark ? 'sleep' : 'idle');
   }
   if (!active || document.hidden) return;
   if (greet && (!transient.current || transient.current.until <= now)) {
    transient.current = { motion: 'wave', until: now + 4000 };
    nextPlay.current = now + 24000;
   }
   if (!transient.current && !dark && now >= nextPlay.current) {
    transient.current = { motion: Math.random() < .5 ? 'bubble' : 'dance', until: now + 4000 };
    nextPlay.current = now + 24000 + Math.random() * 12000;
   }
   setMotion(transient.current?.motion ?? (dark ? 'sleep' : 'idle'));
  }
  tick(true);
  const interval = setInterval(tick, 1000);
  const visibility = () => tick(!document.hidden);
  document.addEventListener('visibilitychange', visibility);
  return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visibility); };
 }, [active]);
 return { motion, night, play, reset };
}

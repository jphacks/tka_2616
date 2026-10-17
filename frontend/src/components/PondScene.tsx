'use client';
import { useEffect, useRef, useState } from 'react';
export type Motion = 'idle' | 'happy' | 'wave' | 'sleep' | 'grow' | 'bubble' | 'dance';
type Player = { tick: number; pause: () => void; play: () => void };
const speech: Record<Motion, string> = {
 idle: 'きょうも、いっしょに。', happy: 'えへへ、うれしいな！', wave: 'おーい、ここにいるよ。',
 sleep: 'すやすや、またあした。', grow: 'ちょっぴり、大きくなったよ！', bubble: 'ぷくぷく、ふわり。', dance: 'きみといっしょに、るんるん。',
};
export default function PondScene({ level, happy, onPet, motion = 'idle', night = false, paused = false, replay = 0, suspended = false }: {
 level: number; happy: boolean; onPet: () => void; motion?: Motion; night?: boolean; paused?: boolean; replay?: number; suspended?: boolean;
}) {
 const frame = useRef<HTMLIFrameElement>(null);
 const holder = useRef<HTMLDivElement>(null);
 const [width, setWidth] = useState(320);
 const [loaded, setLoaded] = useState(0);
 const [visible, setVisible] = useState(true);
 const [foreground, setForeground] = useState(true);
 const selected = happy ? 'happy' : motion;
 const src = `/scenes/awamon-pond.html?level=${level}&mode=${selected}&night=${night ? 1 : 0}&replay=${replay}`;
 useEffect(() => {
   let request = 0;
   const shouldPause = paused || suspended || !visible || !foreground;
   function sync() {
     const player = (frame.current?.contentWindow as (Window & { pixelAnims?: Player }) | null)?.pixelAnims;
     if (!player) return;
     // Let the initial pose render before freezing a newly loaded frame.
     if (shouldPause && player.tick < 0) { request = requestAnimationFrame(sync); return; }
     if (shouldPause) player.pause(); else player.play();
   }
   sync();
   return () => cancelAnimationFrame(request);
 }, [paused, suspended, visible, foreground, loaded, src]);
 useEffect(() => {
   if (!holder.current) return;
   const resize = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.floor(entry.contentRect.width / 160) * 160)));
   const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
   resize.observe(holder.current); intersection.observe(holder.current);
   const visibility = () => setForeground(!document.hidden);
   visibility(); document.addEventListener('visibilitychange', visibility);
   return () => { resize.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); };
 }, []);
 return <div className={`pixel-pond ${night ? 'night' : ''}`} ref={holder}>
   <div className="pond-sky-label"><span className="pixel-sun"/>{night ? '月あかりの池' : 'ひだまりの池'}</div>
   <iframe key={src} ref={frame} src={src} onLoad={() => setLoaded(v => v + 1)} title={`あわもんの池・進化${level}・${selected}`} tabIndex={-1} style={{ width, height: width * 96 / 160 }} />
   <button className="pet-touch" onClick={onPet} aria-label="あわもんをなでる" />
   <div className="pond-speech" aria-live="polite">{speech[selected]}</div>
 </div>;
}

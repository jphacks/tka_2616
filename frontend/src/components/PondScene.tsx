'use client';
import { useEffect, useRef, useState } from 'react';
import { characters, type CharacterId } from '@/lib/characters';
import { sceneInsets } from '@/lib/sceneViewport';
export type Motion = 'idle' | 'happy' | 'wave' | 'sleep' | 'grow' | 'bubble' | 'dance';
type Player = { tick: number; pause: () => void; play: () => void };
const speech: Record<Motion, string> = {
 idle: 'きょうも、いっしょに。', happy: 'えへへ、うれしいな！', wave: 'おーい、ここにいるよ。',
 sleep: 'すやすや、またあした。', grow: 'ちょっぴり、大きくなったよ！', bubble: 'ぷくぷく、ふわり。', dance: 'きみといっしょに、るんるん。',
};
export default function PondScene({ level, happy, onPet, motion = 'idle', night = false, paused = false, replay = 0, suspended = false, character = 'dishes' }: {
 level: number; happy: boolean; onPet: () => void; motion?: Motion; night?: boolean; paused?: boolean; replay?: number; suspended?: boolean; character?: CharacterId;
}) {
 const profile = characters[character];
 const frame = useRef<HTMLIFrameElement>(null);
 const holder = useRef<HTMLDivElement>(null);
 const [width, setWidth] = useState(320);
 const [loaded, setLoaded] = useState(0);
 const [visible, setVisible] = useState(true);
 const [foreground, setForeground] = useState(true);
 const selected = happy ? 'happy' : motion;
 const src = `/scenes/${profile.scene}.html?level=${level}&mode=${selected}&night=${night ? 1 : 0}&replay=${replay}`;
 useEffect(() => {
   let request = 0;
   const shouldPause = paused || suspended || !visible || !foreground;
   function sync() {
     const player = (frame.current?.contentWindow as (Window & { pixelAnims?: Player }) | null)?.pixelAnims;
     if (!player) return;
     // Let the initial pose render before freezing a newly loaded frame.
     if (player.tick < 0) { request = requestAnimationFrame(sync); return; }
     const canvas = frame.current?.contentDocument?.getElementById('view') as HTMLCanvasElement | null;
     if (canvas && frame.current) {
       canvas.style.clipPath = sceneInsets(canvas.width, canvas.height);
       const doc = frame.current.contentDocument!;
       doc.documentElement.style.background = night ? '#778ba9' : character==='dishes'||character==='laundry' ? '#e0edf1' : '#f5efdf';
       doc.body.style.background = doc.documentElement.style.background;
       frame.current.style.opacity = '1';
     }
     if (shouldPause) player.pause(); else player.play();
   }
   sync();
   const win = frame.current?.contentWindow;
   const resized = () => { cancelAnimationFrame(request); request = requestAnimationFrame(sync); };
   win?.addEventListener('resize', resized);
   return () => { cancelAnimationFrame(request); win?.removeEventListener('resize', resized); };
 }, [paused, suspended, visible, foreground, loaded, src, width, night, character]);
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
   <div className="pond-sky-label"><span className="pixel-sun"/>{night ? profile.night : profile.day}</div>
   <div className="scene-viewport">
   <iframe key={src} ref={frame} src={src} onLoad={() => setLoaded(v => v + 1)} title={`${profile.name}の${profile.place}・進化${level}・${selected}`} tabIndex={-1} style={{ width, height: width * 96 / 160, opacity: 0 }} />
   <button className="pet-touch" onClick={onPet} aria-label={`${profile.name}をなでる`} />
   </div>
   <div className="pond-speech" aria-live="polite">{speech[selected]}</div>
 </div>;
}

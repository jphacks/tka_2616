'use client';
import { useEffect, useRef, useState } from 'react';
export type Motion = 'idle' | 'happy' | 'wave' | 'sleep' | 'grow';
type Player = { tick: number; pause: () => void; play: () => void };
export default function PondScene({ level, happy, onPet, motion = 'idle', night = false, paused = false, replay = 0 }: {
  level: number; happy: boolean; onPet: () => void; motion?: Motion; night?: boolean; paused?: boolean; replay?: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const selected = happy ? 'happy' : motion;
  const src = `/scenes/awamon-pond.html?level=${level}&mode=${selected}&night=${night ? 1 : 0}&replay=${replay}`;
  function sync() {
    const player = (frame.current?.contentWindow as (Window & { pixelAnims?: Player }) | null)?.pixelAnims;
    if (paused && player && player.tick < 0) { requestAnimationFrame(sync); return; }
    if (paused) player?.pause(); else player?.play();
  }
  useEffect(() => { sync(); }, [paused]);
  useEffect(() => {
    if (!holder.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.floor(entry.contentRect.width / 160) * 160)));
    observer.observe(holder.current); return () => observer.disconnect();
  }, []);
  return <div className={`pixel-pond ${night ? 'night' : ''}`} ref={holder}>
    <div className="pond-sky-label"><span className="pixel-sun"/>{night ? '月あかりの池' : 'ひだまりの池'}</div>
    <iframe key={src} ref={frame} src={src} onLoad={sync} title={`あわもんの池・進化${level}・${selected}`} tabIndex={-1} style={{ width, height: width * 96 / 160 }} />
    <button className="pet-touch" onClick={onPet} aria-label="あわもんをなでる" />
    <div className="pond-speech" aria-live="polite">{selected === 'sleep' ? 'すやすや、またあした。' : selected === 'grow' ? 'ちょっぴり、大きくなったよ！' : selected === 'wave' ? 'おーい、ここにいるよ。' : selected === 'happy' ? 'えへへ、うれしいな！' : 'きょうも、いっしょに。'}</div>
  </div>;
}

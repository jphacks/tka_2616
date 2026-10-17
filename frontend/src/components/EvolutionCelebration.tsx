'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { characters, type CharacterId } from '@/lib/characters';
import AwamonSprite from './AwamonSprite';

export type Evolution = { from: number; to: number; preview: boolean };
export default function EvolutionCelebration({ character, evolution, onReveal, onClose }: {
 character: CharacterId; evolution: Evolution; onReveal: () => void; onClose: () => void;
}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const reveal = useRef(onReveal);
 const [ready, setReady] = useState(false);
 const profile = characters[character];
 useEffect(() => { reveal.current = onReveal; }, [onReveal]);
 useEffect(() => {
  const element = dialog.current;
  const focus = document.activeElement as HTMLElement | null;
  element?.showModal();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timer = window.setTimeout(() => { setReady(true); reveal.current(); }, reduced ? 0 : 1500);
  return () => { clearTimeout(timer); element?.close(); focus?.focus(); };
 }, []);
 return <dialog ref={dialog} className={`evolution-celebration ${ready ? 'revealed' : 'charging'}`} aria-labelledby="evolution-title" onCancel={event => { event.preventDefault(); onClose(); }}>
  <div className="evolution-content">
   <div className="evolution-top"><span>{evolution.preview ? 'おためし進化 · 記録は変わりません' : 'きみの「できた！」が、ちからになった'}</span><button type="button" onClick={onClose} aria-label="進化演出を閉じる">×</button></div>
   <div className="evolution-heading" aria-live="polite"><p>{ready ? 'NEW EVOLUTION!' : 'SOMETHING WONDERFUL…'}</p><h2 id="evolution-title">{ready ? 'わあ、進化した！' : 'おや…？ ようすが…！'}</h2></div>
   <div className="evolution-stage" aria-hidden="true">
    <div className="evolution-halo"/>
    <div className="evolution-sparks">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--angle': `${i * 15}deg`, '--distance': `${100 + i % 3 * 24}px`, '--delay': `${i % 4 * .06}s` } as CSSProperties}/>)}</div>
    <div className="evolution-big-sprite" key={ready ? 'new' : 'old'}><AwamonSprite character={character} level={ready ? evolution.to : evolution.from} motion={ready ? 'happy' : 'grow'}/></div>
   </div>
   <div className="evolution-caption"><span>Lv.{evolution.from} → Lv.{evolution.to}</span><h3>{ready ? profile.forms[evolution.to - 1] : profile.forms[evolution.from - 1]}</h3><p>{ready ? `${profile.name}と、またひとつ先へ。` : 'ちいさながんばりが、集まっていく。'}</p></div>
   <button className="primary" type="button" onClick={onClose}>{ready ? 'これからも、よろしくね！' : '演出をスキップ'}</button>
  </div>
 </dialog>;
}

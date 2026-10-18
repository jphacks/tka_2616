'use client';
import { useEffect, useState } from 'react';
import AwamonSprite from './AwamonSprite';
import { characters, type CharacterId } from '@/lib/characters';
export type WaitingKind = 'prepare' | 'before' | 'after' | 'save';
const messages: Record<WaitingKind, [string, string]> = {
 prepare: ['写真を準備しているよ', 'もう少しで、写真が見られるよ。'],
 before: ['はじめの一枚、おあずかり。', '作業の前の写真を保存しているよ。'],
 after: ['どうかな、どうかな…？', '写真を送って、記録を確認しているよ。'],
 save: ['「できた！」を届けているよ', 'きみの記録を、そっとノートに。'],
};
export default function TaskWaiting({ character, level, kind, photo }: { character: CharacterId; level: number; kind: WaitingKind; photo?: string }) {
 const [slow, setSlow] = useState(false);
 useEffect(() => { setSlow(false); const timer = setTimeout(() => setSlow(true), 10000); return () => clearTimeout(timer); }, [kind]);
 return <section className="task-waiting" role="status" aria-live="polite" aria-atomic="true">
  <div className="waiting-stage" aria-hidden="true">
   {photo && <img className="waiting-photo" src={photo} alt=""/>}
   <div className="waiting-pet"><AwamonSprite character={character} level={level} motion="idle"/></div>
   <span className="waiting-bubble">{kind === 'after' ? 'じーっ' : 'ふむふむ'}</span>
  </div>
  <p className="eyebrow">{characters[character].name}と、ひとやすみ</p>
  <h2>{messages[kind][0]}</h2>
  <p>{slow ? 'いつもより時間がかかっているみたい。もう少し待ってね。' : messages[kind][1]}</p>
  <span className="waiting-dots" aria-hidden="true"><i/><i/><i/></span>
  <p className="waiting-note">{slow ? '通信がうまくいかなかったときは、もう一度試せるよ。' : 'このまま、少しだけ待っていてね。'}</p>
 </section>;
}

'use client';
import { useEffect, useRef } from 'react';
import { characters, characterIds, type CharacterId } from '@/lib/characters';
export default function CharacterPicker({ selected, open, onClose, onSelect }: { selected: CharacterId; open: boolean; onClose: () => void; onSelect: (id: CharacterId) => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 useEffect(() => { if(open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
 return <dialog className="flow-dialog character-picker" ref={dialog} onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="dialog-top"><span>今日は、だれとがんばる？</span><button data-sound="close" aria-label="キャラ選択を閉じる" onClick={onClose}>×</button></div>
  <p>キャラごとに、記録と成長が残ります。<br/>途中の作業は、切り替えてもそのまま。</p>
  <div className="character-options">{characterIds.map(id=>{const c=characters[id];return <button key={id} data-sound="none" aria-pressed={id===selected} data-character={id} onClick={()=>onSelect(id)}><img src={`/assets/${c.asset}/pixel/form-1.png`} alt="" width="64" height="64"/><span><strong>{c.name}</strong><small>{c.task}</small><span>{c.description}</span></span><b aria-hidden="true">{selected===id?'✓':'›'}</b></button>;})}</div>
 </dialog>;
}

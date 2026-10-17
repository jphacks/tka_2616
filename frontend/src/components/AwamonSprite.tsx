'use client';
import { characters, type CharacterId } from '@/lib/characters';
import type { Motion } from './PondScene';
export default function AwamonSprite({ happy = false, small = false, level = 1, motion = 'idle', character = 'dishes' }: { happy?: boolean; small?: boolean; level?: number; motion?: Motion; character?: CharacterId }) {
  const selected = happy ? 'happy' : motion;
  const names = { idle: 'のんびりしている', happy: 'うれしそうに跳ねる', wave: '手を振る', sleep: 'すやすや眠る', grow: '成長を喜ぶ', bubble: '泡で遊ぶ', dance: '踊っている' };
  return <div role="img" aria-label={`${names[selected]}${characters[character].name}`} className={`awamon pixel-sprite ${happy ? 'happy' : ''} ${small ? 'small' : ''}`} style={{ backgroundImage: `url('/assets/${characters[character].asset}/pixel/${selected}-${Math.max(1, Math.min(5, level))}.png')` }} />;
}

'use client';
import type { Motion } from './PondScene';
export default function AwamonSprite({ happy = false, small = false, level = 1, motion = 'idle' }: { happy?: boolean; small?: boolean; level?: number; motion?: Motion }) {
  const selected = happy ? 'happy' : motion;
  const names = { idle: 'のんびりしている', happy: 'うれしそうに跳ねる', wave: '手を振る', sleep: 'すやすや眠る', grow: '成長を喜ぶ', bubble: '泡で遊ぶ', dance: '踊っている' };
  return <div role="img" aria-label={`${names[selected]}あわもん`} className={`awamon pixel-sprite ${happy ? 'happy' : ''} ${small ? 'small' : ''}`} style={{ backgroundImage: `url('/assets/awamon/pixel/${selected}-${Math.max(1, Math.min(5, level))}.png')` }} />;
}

'use client';
import type { Motion } from './PondScene';
export const evolutionNames = ['あわのこ', 'めばえ', 'ふたば', 'はなかんむり', '池のまもりびと'];
const motions: [Motion, string, string][] = [['idle','のんびり','01'],['happy','よろこぶ','02'],['wave','手をふる','03'],['sleep','すやすや','04'],['grow','成長する','05'],['bubble','泡あそび','06'],['dance','ダンス','07']];
export default function DevelopmentPanel({ level, preview, motion, night, paused, onLevel, onMotion, onNight, onPause, onReplay, onReset }: {
 level: number; preview: boolean; motion: Motion; night: boolean; paused: boolean;
 onLevel: (level: number) => void; onMotion: (motion: Motion) => void; onNight: () => void; onPause: () => void; onReplay: () => void; onReset: () => void;
}) {
 return <details className="development-panel" open><summary><span>あわもん実験室</span><small>DEV TOOLS <span aria-hidden="true">＋</span></small></summary><div className="dev-inner"><p>ボタンで、好きな姿と動きをおためし。<br/>しずくや食器洗いの記録は変わりません。</p><fieldset><legend>うごき</legend><div className="motion-buttons">{motions.map(([id,label,num])=><button key={id} aria-pressed={motion===id} onClick={()=>onMotion(id)}><small>{num}</small>{label}</button>)}</div></fieldset><fieldset><legend>進化と池のレベル</legend><div className="evolution-buttons">{evolutionNames.map((name,i)=><button key={name} aria-pressed={level===i+1} onClick={()=>onLevel(i+1)}><img src={`/assets/awamon/pixel/form-${i+1}.png`} width="64" height="64" alt=""/><span>Lv.{i+1}</span><small>{name}</small></button>)}</div></fieldset><div className="dev-transport"><button aria-pressed={night} onClick={onNight}>{night?'☾ 夜':'☼ 昼'}</button><button aria-pressed={paused} onClick={onPause}>{paused?'▶ 再生':'Ⅱ 一時停止'}</button><button onClick={onReplay}>↻ もう一度</button></div><div className="dev-bottom"><span role="status">{preview ? 'おためし表示中' : '育成データを表示中'}</span><button onClick={onReset}>実際の池に戻す</button></div></div></details>;
}

'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PondScene, { type Motion } from '@/components/PondScene';
import DevelopmentPanel, { evolutionNames } from '@/components/DevelopmentPanel';
import AwamonSprite from '@/components/AwamonSprite';

type Analysis = { status: string; reason: string; observed_changes: string[]; uncertainties: string[] };
type Session = { id: string; started_at: string; completed_at: string | null; status: string; completion_method: string | null; reward_amount: number; analysis: Analysis | null };
type Game = { total_drops: number; pond_level: number; next_level_at: number | null; completed_count: number; today_rewards: number; active_session: Session | null; ai_enabled: boolean };
type Step = 'before' | 'wash' | 'after' | 'result' | 'reward' | null;
const names = ['はじまりの水たまり', 'ちいさな池', 'みどりの池', '花咲く池', 'なかまたちの池'];
const thresholds = [0, 30, 80, 150, 250];

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { cache: 'no-store', ...options });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.detail === 'string' ? error.detail : 'うまく接続できませんでした。もう一度試してください。');
  }
  return response.json();
}
async function resize(file: File): Promise<Blob> {
  if (file.size > 20 * 1024 * 1024) throw new Error('20MB以下の写真を選んでください。');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('写真を開けませんでした。JPEG・PNG・WebPを選んでください。'); });
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('写真を準備できませんでした。')), 'image/jpeg', .85));
}
function Icon({ name }: { name: 'drop' | 'camera' | 'leaf' | 'home' | 'book' | 'arrow' }) {
  const paths = {
    drop: 'M10 2h4v4h2v4h2v4h2v6h-2v2H6v-2H4v-6h2v-4h2V6h2z',
    camera: 'M8 3h8v3h6v15H2V6h6zM8 10v7h8v-7z',
    leaf: 'M18 2h4v8h-2v4h-4v2h-4v2H8v4H4v-4h4v-4h4v-4h4V6h2z',
    home: 'M10 2h4v3h3v3h3v3h2v11h-8v-7h-4v7H2V11h2V8h3V5h3z',
    book: 'M2 3h8v2h4V3h8v18h-8v2h-4v-2H2zM10 7v12h4V7z',
    arrow: 'M13 3h3v3h3v3h3v6h-3v3h-3v3h-3v-6H2V9h11z',
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" shapeRendering="crispEdges" aria-hidden="true"><path d={paths[name]}/></svg>;
}
export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [tab, setTab] = useState('pond');
  const [step, setStep] = useState<Step>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [happy, setHappy] = useState(false);
  const [previewLevel, setPreviewLevel] = useState<number | null>(null);
  const [motion, setMotion] = useState<Motion>('idle');
  const [night, setNight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const previousLevel = useRef<number | null>(null);
  const [guide, setGuide] = useState(false);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(async () => {
    const [g, h] = await Promise.all([api<Game>('/game-state'), api<Session[]>('/sessions')]);
    setGame(g); setHistory(h); return g;
  }, []);
  useEffect(() => { refresh().catch(e => setError(e.message)); return () => { if (timer.current) clearTimeout(timer.current); }; }, [refresh]);
  useEffect(() => { if (!photo) { setPreview(''); return; } const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url); }, [photo]);
  useEffect(() => { if (step || guide) dialog.current?.showModal(); else dialog.current?.close(); }, [step, guide]);
  useEffect(() => { if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  function pet() { setReplay(v => v + 1); setPaused(false); setHappy(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setHappy(false), 2200); }
  async function action(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'もう一度試してください。'); }
    finally { lock.current = false; setBusy(false); }
  }
  function begin() {
    setError(''); setPhoto(null);
    if (game?.active_session) { setSession(game.active_session); setStep(game.active_session.analysis ? 'result' : 'wash'); }
    else { setSession(null); setStep('before'); }
  }
  async function upload() {
    if (!photo) return;
    await action(async () => {
      const form = new FormData(); form.append('image', photo, 'photo.jpg'); form.append('consent', String(consent));
      const result = await api<Session>(step === 'before' ? '/sessions' : `/sessions/${session!.id}/complete`, { method: 'POST', body: form });
      setSession(result); setPhoto(null);
      setStep(result.completed_at ? 'reward' : step === 'before' ? 'wash' : 'result');
      if (result.completed_at) pet();
      await refresh();
    });
  }
  async function confirm() {
    await action(async () => {
      const result = await api<Session>(`/sessions/${session!.id}/confirm`, { method: 'POST' });
      setSession(result); setStep('reward'); pet(); await refresh();
    });
  }
  function close() { if (busy) return; setStep(null); setGuide(false); setError(''); setPhoto(null); }
  const level = game?.pond_level || 1;
  const displayLevel = previewLevel ?? level;
  useEffect(() => {
    if (!game) return;
    if (previousLevel.current !== null && game.pond_level > previousLevel.current) { setMotion('grow'); setReplay(v => v + 1); }
    previousLevel.current = game.pond_level;
  }, [game]);
  function chooseMotion(next: Motion) { setHappy(false); setMotion(next); setPaused(false); setReplay(v => v + 1); }
  function chooseLevel(next: number) { setPreviewLevel(next); chooseMotion('grow'); }
  function resetPreview() { setPreviewLevel(null); setNight(false); setPaused(false); chooseMotion('idle'); }
  const total = game?.total_drops || 0;
  const progress = game?.next_level_at ? (total - thresholds[level - 1]) / (game.next_level_at - thresholds[level - 1]) * 100 : game ? 100 : 0;
  return <div className="app-shell">
    <header className="header"><a className="brand" href="/" aria-label="あわもん ホーム"><span className="brand-mark"><span className="brand-pixel" aria-hidden="true"/></span><span>あわもん<small>AWAMON</small></span></a><button className="help" onClick={() => { setError(''); setGuide(true); }}><span>?</span> あそびかた</button></header>
    <div className="app-body">
      <aside className="sidebar"><p className="eyebrow">MY LITTLE POND</p><nav aria-label="メインメニュー"><button className={tab === 'pond' ? 'selected' : ''} onClick={() => setTab('pond')}><Icon name="home"/>わたしの池<span>›</span></button><button className={tab === 'journal' ? 'selected' : ''} onClick={() => setTab('journal')}><Icon name="book"/>おもいでノート<span>›</span></button></nav><div className="sidebar-note"><span>ひと洗い、ひと育ち。</span><p>いつもの家事が、<br/>ちいさな楽しみになる。</p><div className="tiny-flower">✿</div></div><div className="prototype">PIXEL EDITION · v0.2</div></aside>
      <main>
        <div className="page-heading"><div><p className="eyebrow">SAVE A LITTLE HAPPINESS</p><h1>{tab === 'pond' ? 'おかえりなさい。' : 'おもいでノート'}</h1><p>{tab === 'pond' ? '今日も、きみのペースで。あわもんが待っているよ。' : 'ひとつひとつの「洗えた！」が、この池を育てています。'}</p></div><div className="drop-balance"><Icon name="drop"/><strong>{game ? total : '—'}</strong><span>しずく</span></div></div>
        {!step && !guide && error && <div role="alert" className="error">{error}<button onClick={() => action(async () => { await refresh(); })}>再接続</button></div>}
        {tab === 'pond' ? <>
          <section className="pond-card" aria-label="わたしの池"><div className="pond-title"><div><span className="level-tag">Lv.{displayLevel}</span><h2>{names[displayLevel - 1]}</h2></div><span className="live-tag">{previewLevel !== null ? 'おためし' : 'MY LITTLE POND'}<i/><i/></span></div><PondScene level={displayLevel} happy={happy} onPet={pet} motion={motion} night={night} paused={paused} replay={replay}/><div className="pond-footer"><span><span className="status-dot"/>{evolutionNames[displayLevel - 1]}</span><span>あわもんをタップしてみてね</span></div></section>
          <div className="bottom-grid"><section className="wash-card"><div className="card-label"><Icon name="camera"/><span>いつもの食器洗いを、ちょっと楽しく。</span></div><h2>{game?.active_session ? '続きから、はじめよう。' : '洗うたび、池にしずく。'}</h2><p>洗う前と、洗った後をパシャリ。<br/>がんばった分だけ、ちいさな世界が育ちます。</p><button className="primary" disabled={!game || busy} onClick={begin}><Icon name="camera"/>{game?.active_session ? '食器洗いを再開する' : '食器を洗う'}<Icon name="arrow"/></button><div className="reward-note"><span><Icon name="drop"/> 1回で10しずく</span><span>今日のしずく {game?.today_rewards || 0} / 3回</span></div></section>
          <section className="growth-card"><div className="card-label"><Icon name="leaf"/><span>池の成長</span></div><h2>{level < 5 ? '次の景色まで、あと少し。' : 'にぎやかな池になったね。'}</h2><div className="growth-destination"><div className="plant-art" aria-hidden="true">{level < 3 ? '♧' : '✿'}</div><div><small>{level < 5 ? `NEXT · LEVEL ${level + 1}` : 'LEVEL 5 · COMPLETE'}</small><strong>{names[Math.min(level, 4)]}</strong></div></div><div className="progress-label"><span>{level < 5 ? `あと ${(game?.next_level_at || 30) - total} しずく` : 'これからも、いっしょに。'}</span><span>{total} / {game?.next_level_at || 250}</span></div><div className="progress" role="progressbar" aria-label="次の池までの成長" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }}/></div><p className="soft-note">お休みしても、池はそのまま。<br/>少しずつ、いっしょに育とう。</p></section></div>
          <DevelopmentPanel level={displayLevel} preview={previewLevel !== null || motion !== 'idle' || night} motion={happy ? 'happy' : motion} night={night} paused={paused} onLevel={chooseLevel} onMotion={chooseMotion} onNight={() => setNight(v => !v)} onPause={() => setPaused(v => !v)} onReplay={() => { setPaused(false); setReplay(v => v + 1); }} onReset={resetPreview}/>
          <section className="memory-strip"><span className="memory-icon"><Icon name="book"/></span><div><h3>{history.length ? 'またひとつ、きれいになったね。' : '最初のおもいでは、これから。'}</h3><p>{history.length ? `これまで ${game?.completed_count} 回の食器洗いを記録しました。` : '食器を洗うと、ここに日々の足あとが残ります。'}</p></div><button aria-label="おもいでノートを開く" onClick={() => setTab('journal')}>→</button></section>
        </> : <section className="journal">{history.length ? history.map(s => <article key={s.id}><span className="journal-icon"><Icon name="drop"/></span><div><time>{new Date(s.completed_at!).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><h3>食器を洗いました</h3><p>{s.completion_method === 'ai' ? '写真の変化から記録' : '自分で完了を記録'}</p></div><strong>+{s.reward_amount}<small>しずく</small></strong></article>) : <div className="empty"><AwamonSprite level={level}/><h2>最初の1ページを、いっしょに。</h2><p>食器を洗った記録がここに並びます。</p><button className="primary" disabled={!game} onClick={begin}>食器を洗う</button></div>}</section>}
        <footer className="footer"><span>ひと洗いが、ちいさな世界を育てる。</span><span>あわもん <Icon name="drop"/></span></footer>
      </main>
    </div>
    <dialog ref={dialog} onCancel={e => { e.preventDefault(); close(); }} className="flow-dialog"><div className="dialog-top"><span>{guide ? 'あわもんとの暮らし' : step === 'reward' ? 'おつかれさま！' : 'あわもんと食器洗い'}</span><button onClick={close} disabled={busy} aria-label="閉じる">×</button></div>
      {guide ? <div className="guide"><AwamonSprite level={level}/><h2>洗うたび、ちいさな幸せ。</h2><ol><li>洗う前の食器を撮る</li><li>いつものペースで食器を洗う</li><li>洗った後を撮って、完了を記録</li></ol><p>1回10しずく、1日3回まで。しずくがたまると池に植物や仲間が増えます。お休みしても減りません。</p><h3>写真について</h3><p>写真は縮小し、位置情報などを取り除きます。AI判定に同意した場合のみOpenAIに送信します。サーバーの写真は完了・取り消し時、または24時間経過後の定期処理（最大約1分後）に削除します。</p><p>OpenAIには保存を無効にして送信しますが、サービス側の保持がゼロになる保証はありません。写真は衛生状態を証明するものではありません。</p><p className="soft-note">現在は個人用ローカル試作です。キャラクターは仮デザイン。オフラインでは完了を保存できません。</p><p><a href="/design" style={{ textDecoration: "underline" }}>キャラクターの4案を見比べる →</a></p></div> : <>
      {step !== 'reward' && <div className="steps">{['撮る', '洗う', '記録する'].map((label, i) => <span key={label} className={(step === 'before' ? 0 : step === 'wash' ? 1 : 2) === i ? 'current' : ''}>{i + 1}<small>{label}</small></span>)}</div>}
      {(step === 'before' || step === 'after') && <div className="capture"><p className="eyebrow">{step === 'before' ? 'BEFORE' : 'AFTER'}</p><h2>{step === 'before' ? '洗う前を、パシャリ。' : 'きれいになったら、もう1枚。'}</h2><p>食器全体が入るように。{step === 'after' ? 'なるべく同じ角度で撮ろう。' : '明るい場所がおすすめです。'}</p><label className={`photo-picker ${preview ? 'has-photo' : ''}`}>
      {preview ? <img src={preview} alt="選択した写真のプレビュー"/> : <><Icon name="camera"/><strong>写真を撮る・選ぶ</strong><span>JPEG / PNG / WebP</span></>}<input aria-label="食器の写真" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) { setPhoto(null); action(async () => setPhoto(await resize(file))); } e.target.value = ''; }}/></label>{preview && <p className="soft-note">写真をタップすると選び直せます。</p>}
      {step === 'before' && <>{game?.ai_enabled ? <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>前後の写真をOpenAIに送り、AIで変化を確認する</label> : <p className="privacy">今は自己申告モード。写真を外部AIへ送りません。</p>}<p className="privacy">写真は完了時または24時間後に削除します。AIを使わなくても、同じしずくがもらえます。</p></>}
      <button className="primary" onClick={upload} disabled={!photo || busy}>{busy ? '写真を確認しています…' : step === 'before' ? 'この写真ではじめる' : 'この写真で記録する'}<Icon name="arrow"/></button></div>}
      {step === 'wash' && <div className="wash-state"><AwamonSprite level={level}/><p className="eyebrow">TAKE YOUR TIME</p><h2>ゆっくりで、だいじょうぶ。</h2><p>あわもんも、ここで応援中。<br/>洗い終わったら教えてね。</p><div className="wash-tip">画面を閉じても、続きから再開できます。</div><button className="primary" onClick={() => { setPhoto(null); setStep('after'); }}>洗い終わった！ 写真を撮る<Icon name="camera"/></button><button className="text-button" disabled={busy} onClick={confirm}>写真を撮らず、自分で完了を記録</button><button className="text-button muted" disabled={busy} onClick={() => action(async () => { await api(`/sessions/${session!.id}`, { method: 'DELETE' }); await refresh(); close(); setStep(null); })}>今回はお休みする</button></div>}
      {step === 'result' && <div className="result"><AwamonSprite small level={level}/><h2>食器洗い、おつかれさま。</h2><p>{session?.analysis?.reason || '洗い終わったら、自分で完了を記録できます。'}</p>{session?.analysis?.observed_changes?.map((v, i) => <p className="observation" key={i}>{v}</p>)}{session?.analysis?.uncertainties?.map((v, i) => <p className="soft-note" key={i}>{v}</p>)}<button className="primary" onClick={confirm} disabled={busy}>{busy ? '記録しています…' : '洗いました！ 完了を記録'}</button><button className="text-button" disabled={busy} onClick={() => { setPhoto(null); setStep('after'); }}>洗った後の写真を撮り直す</button></div>}
      {step === 'reward' && <div className="reward"><div className="reward-sprite"><AwamonSprite happy={happy} level={level}/></div><p className="eyebrow">A LITTLE HAPPINESS!</p><h2>きれいにしてくれて、ありがとう。</h2><div className="earned"><Icon name="drop"/><strong>+{session?.reward_amount || 0}</strong><span>しずく</span></div><p>{session?.reward_amount ? 'きみのひと洗いが、池のうるおいになりました。' : '今日のしずくは3回分たまりました。今回のがんばりもノートに記録したよ。'}</p><button className="primary" onClick={close}>池にもどる<Icon name="arrow"/></button></div>}
      </>}{error && <p role="alert" className="error">{error}</p>}{busy && <p role="status" className="busy-note">少しだけ待ってね…</p>}
    </dialog>
  </div>;
}

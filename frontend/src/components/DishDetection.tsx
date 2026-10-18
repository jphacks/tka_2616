'use client';
import { useEffect, useState } from 'react';
type Detection = { status: string; objects: { label: string; confidence: number; box: number[] }[] };
export default function DishDetection({ photo, preview }: { photo: Blob; preview: string }) {
 const [result, setResult] = useState<Detection | null>(null);
 const [attempt, setAttempt] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let current = true;
  setResult(null);
  const form = new FormData(); form.append('image', photo, 'photo.jpg');
  const start = setTimeout(() => { fetch('/api/detections', { method: 'POST', body: form, signal: controller.signal, cache: 'no-store' })
   .then(async response => { if (!response.ok) throw new Error('unavailable'); return response.json() as Promise<Detection>; })
   .then(data => { if (current) setResult(data); })
   .catch(() => { if (current) setResult({ status: 'unavailable', objects: [] }); })
   .finally(() => clearTimeout(timeout)); }, 0);
  return () => { current = false; clearTimeout(start); clearTimeout(timeout); controller.abort(); };
 }, [photo, attempt]);
 const ready = result?.status === 'ready';
 const labels = [...new Set(result?.objects.map(item => item.label) ?? [])];
 return <section className="dish-detection" aria-label="あわもんの食器さがし">
  <div className="detection-photo"><img src={preview} alt="食器を探している写真"/>
   {ready && <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">{result.objects.map((item, i) => <rect key={i} x={item.box[0]*1000} y={item.box[1]*1000} width={(item.box[2]-item.box[0])*1000} height={(item.box[3]-item.box[1])*1000} vectorEffect="non-scaling-stroke"/>)}</svg>}
   {ready && result.objects.map((item, i) => <span className="detection-tag" key={i} style={{ left: `${Math.min(item.box[0], .75)*100}%`, top: `${Math.min(item.box[1], .92)*100}%` }}>{item.label}</span>)}
  </div>
  <p role="status">{!result ? 'あわもんが食器を探しているよ…' : labels.length ? `${labels.join('・')}、見つけた！` : ready ? 'うまく見つけられなかったけど、このまま進めるよ。' : '食器さがしはお休み中。このまま進めて大丈夫。'}</p>
  {ready && result.objects.length > 0 && <div className="detection-labels">{labels.map(label => <span key={label}>{label} × {result.objects.filter(item => item.label === label).length}</span>)}</div>}
  <small>見つけた食器の候補だよ。洗えたかは、前後の写真で確認するね。</small>
  {result && (!ready || !labels.length) && <button className="text-button" type="button" onClick={() => setAttempt(value => value + 1)}>もう一度さがす</button>}
 </section>;
}

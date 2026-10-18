'use client';
import { useEffect, useState } from 'react';
type Detection = { status: string; objects: { label: string; confidence: number; box: number[] }[] };
export default function DishDetection({ photo, preview }: { photo: Blob; preview: string }) {
 const [result, setResult] = useState<Detection | null>(null);
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
 }, [photo]);
 const ready = result?.status === 'ready';
 const labels = [...new Set(result?.objects.map(item => item.label) ?? [])];
 return <section className="dish-detection" aria-label="あわもんの食器さがし">
  <div className="detection-photo"><img src={preview} alt="選択した写真のプレビュー"/>
   {ready && <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">{result.objects.map((item, i) => <rect key={i} x={item.box[0]*1000} y={item.box[1]*1000} width={(item.box[2]-item.box[0])*1000} height={(item.box[3]-item.box[1])*1000} vectorEffect="non-scaling-stroke"/>)}</svg>}
   {ready && result.objects.map((item, i) => <span className="detection-tag" key={i} style={{ left: `${Math.min(item.box[0], .75)*100}%`, top: `${Math.min(item.box[1], .92)*100}%` }}>{item.label}</span>)}
  </div>
  {ready && result.objects.length > 0 && <div className="detection-labels">{labels.map(label => <span key={label}>{label} × {result.objects.filter(item => item.label === label).length}</span>)}</div>}
 </section>;
}

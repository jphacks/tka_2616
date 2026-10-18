export type Analysis = {
 status: string;
 reason: string;
 observed_changes: string[];
 washing_evidence?: string[];
 alternative_explanations?: string[];
 uncertainties: string[];
};

export default function PhotoAssessment({ analysis, method }: { analysis: Analysis | null; method?: string | null }) {
 const selfReported = method === 'self_report';
 const label = selfReported ? '自分で完了を記録' : method === 'ai' ? '写真の変化から完了を記録' : '写真の確認結果';
 const verdict = analysis?.status === 'likely_done' ? '完了に合う変化が見つかりました' : analysis?.status === 'not_detected' ? '写真から対象を見つけられませんでした' : '写真だけでは完了を確かめきれませんでした';
 const changes = analysis?.observed_changes?.filter(Boolean) ?? [];
 const evidence = analysis?.washing_evidence?.filter(Boolean) ?? [];
 const uncertainties = analysis?.uncertainties?.filter(Boolean) ?? [];
 const alternatives = analysis?.alternative_explanations?.filter(Boolean) ?? [];
 return <section className="photo-assessment" aria-label="写真の確認と記録方法">
  <span className="assessment-method">{label}</span>
  {selfReported && <p className="assessment-note">あなたの「できた！」を記録しました。写真での確認結果とは別の記録です。</p>}
  {analysis ? <>
   <h3>写真で確認できたこと</h3>
   <p className="assessment-note">写真から確認できる範囲には限りがあります。</p>
   {changes.length ? <ul>{changes.map((text, i) => <li key={i}>{text}</li>)}</ul> : <p>具体的な変化は確認できませんでした。</p>}
   <h3>判定理由</h3>
   <p className="assessment-verdict">{verdict}</p>
   {analysis.reason && <p>{analysis.reason}</p>}
   {(evidence.length > 0 || uncertainties.length > 0 || alternatives.length > 0) && <details>
    <summary>根拠・わからなかったこと</summary>
    {evidence.length > 0 && <><h4>判断の根拠</h4><ul>{evidence.map((text, i) => <li key={i}>{text}</li>)}</ul></>}
    {uncertainties.length > 0 && <><h4>わからなかったこと</h4><ul>{uncertainties.map((text, i) => <li key={i}>{text}</li>)}</ul></>}
    {alternatives.length > 0 && <><h4>ほかに考えられること</h4><ul>{alternatives.map((text, i) => <li key={i}>{text}</li>)}</ul></>}
   </details>}
  </> : <p>写真による判定は行っていません。</p>}
 </section>;
}

import type { CharacterId } from '@/lib/characters';

export type Analysis = {
 status: string;
 reason: string;
 observed_changes: string[];
 washing_evidence?: string[];
 alternative_explanations?: string[];
 uncertainties: string[];
};

const celebrations: Record<CharacterId, { title: string; confirmed: string; encouragement: string }> = {
 dishes: { title: 'ぴかぴか、できた！', confirmed: '洗えたことが確認できました！', encouragement: '食器も、あわもんも、にっこり。' },
 ingredients: { title: 'おいしく使えたね！', confirmed: '食材を使った変化が確認できました！', encouragement: '食材を大切にできたね。べじもんも大よろこび！' },
 cooking: { title: 'ひと品、できあがり！', confirmed: '料理のできあがりが確認できました！', encouragement: 'きみのひと品に、なべもんもにっこり。' },
 laundry: { title: '干せたね、おつかれさま！', confirmed: '洗濯物を干せたことが確認できました！', encouragement: 'ひなたもんも、ぽかぽかうれしそう。' },
};

export default function PhotoAssessment({ analysis, method, character }: { analysis: Analysis | null; method?: string | null; character: CharacterId }) {
 const completed = method === 'ai' || method === 'self_report';
 const copy = celebrations[character];
 if (completed) return <section className="achievement-card" aria-label="今日のできた！">
  <span className="achievement-stars" aria-hidden="true">✦　★　✦</span>
  <span className="achievement-badge">できた！</span>
  <h3>{copy.title}</h3>
  <p className="achievement-message">{method === 'ai' ? copy.confirmed : 'きみの「できた！」を記録したよ！'}</p>
  <p className="achievement-cheer">{copy.encouragement}</p>
 </section>;
 return <section className="assessment-prompt" aria-label="完了の確認">
  <h3>できたら、教えてね。</h3>
  <p>{analysis?.status === 'not_detected' ? '作業したものが、写真では見つけられなかったよ。' : '写真だけでは、はっきりわからなかったよ。'}</p>
  <p>終わっていたら、下のボタンで記録しよう。<br/>きみのがんばりに、同じごほうびを贈るよ。</p>
 </section>;
}

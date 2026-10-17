# ハッカソン向け演出と認識の方針（2026-10-18）

## 実装した進化演出

レベル上昇を検出すると全画面のdialogを表示。1.5秒のためから新形態を大きく表示し、24個の四角い粒と進化名・レベルを見せる。閉じると元のごほうび画面へ戻る。スキップ・Escape対応。reduced motion時はためを省略して静止表示。実験室直前の「大進化デモを見る」は育成記録を変更しない。

音ONの場合、新形態登場時にKenney Music JinglesのPizzicato 07を再生。音源・CC0原文はfrontend/public/audio。音源の取得失敗時は従来の合成音に戻す。閉じる・ミュート・画面非表示後に遅れて鳴らないよう、読み込み前後に世代番号をチェックする。

TypeScript/production build成功。音制御9テスト＋既存クリップ1テスト成功。実機の画面・聴感は未確認、音源は仮選定。

## 音の候補

- Kenney Music Jingles: https://kenney.nl/assets/music-jingles （85ファイル、CC0。進化・達成の短い音楽）
- Kenney Interface Sounds: https://kenney.nl/assets/interface-sounds （100ファイル、CC0。操作音）
- 効果音ラボ: https://soundeffect-lab.info/sound/anime/ （レベルアップ、可愛く輝く、ぷよん等。採用前に素材ごとの利用条件を確認）
- ElevenLabs Sound Effects: https://elevenlabs.io/sound-effects （文章からオリジナルの鳴き声・効果音を生成。公式案内では商用利用は有料プラン）
- VOICEVOX: https://voicevox.hiroshiba.jp/ （日本語の短い台詞。ソフトウェアと各音声ライブラリの条件に従う）

## 現在の写真フロー

作業前を撮影→プレビューを確認して送信→作業→作業後を撮影・送信→同意とAPI設定があるときだけ前後の2画像をOpenAI Responses APIで比較。
likely_done＋具体的な根拠なら自動で完了、ごほうびへ。uncertain/not_detected/通信失敗/AI不使用なら本人が完了を記録可能。後写真を省略する経路もある。1回10、1日3回まで、キャラごとに独立。前写真は完了時削除、未完了は24時間で削除。

モデル名はOPENAI_VISION_MODELで指定。プロンプトはbackend/app/tasks.py（タスク固有）、backend/app/vision.py（共通指示・JSON schema）。画像中の指示を無視し、視覚的根拠、別の説明、不確実性を分けて返す。単に食器が消えた・食材が減っただけでは成功扱いしない。ChatGPTの画面を操作しているわけではない。

## YOLOEの提案（未実装）

公式: https://github.com/THU-MIG/yoloe
導入資料: https://docs.ultralytics.com/models/yoloe/

物体名や見本を指定して、対象の枠・マスクを得られる。最初は食材活用で carrot / tomato / cabbage などを検出し、写真上の対象を色で示す。前後の元画像と検出結果をVLMに渡し、変化の説明はVLM、最後の確認は本人が補える構成がよい。

物体検出だけで洗浄・調理の実施・食品ロス削減量は証明できない。検出個数の差も遮蔽・画角の違いに左右される。検出失敗でユーザーの達成を否定しない。

ハッカソンでは撮影後の静止画推論から始め、機材で測定してからライブ撮影へ広げる。モデルとテキストエンコーダは事前取得・ウォームアップし、当日のダウンロードに依存させない。GPUを使う場合も待ち時間は実測する。今回モデル導入やAPIプロンプト変更はしていない。

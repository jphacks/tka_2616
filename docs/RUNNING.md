# 開発・実行ガイド

作品の概要とデモは [README](../README.md) を参照してください。

## 起動

Node.js 22以上、Python 3.12以上、uvが必要です。リポジトリのルートで実行します。

```bash
./scripts/setup.sh
./scripts/dev.sh
```

- アプリ：http://127.0.0.1:3000
- API仕様：http://127.0.0.1:8010/docs
- 初期デザイン比較：http://127.0.0.1:3000/design
- 終了：Ctrl+C

APIキーなしでも、作業前写真を選んで開始し、作業中画面の「自分で完了を記録」から育成を試せます。作業後写真を送信してから自己申告することもできます。写真がないPCではファイルを選んでください。各キャラの記録・成長は独立しています。

「実験室」の姿・動作と「大進化デモ」はプレビューで、報酬・履歴を変更しません。「実際の池に戻す」（キャラごとに場所名が変わります）で実データと自動モーションに戻ります。音は初期OFFです。

## OpenAIによる写真比較

```bash
cp backend/.env.example backend/.env
```

`backend/.env` に以下を設定して開発サーバーを再起動します。

```dotenv
OPENAI_API_KEY=自分のAPIキー
OPENAI_VISION_MODEL=利用できる画像入力・構造化出力対応モデル名
```

2つとも設定するとAI判定が有効になります。既定モデルはありません。利用可否はアカウント・モデルに依存します。`.env` はGit管理対象外で、キーをブラウザ側へ渡しません。

撮影時の同意チェックがある場合だけ、前後2枚をResponses APIへ送信します。タスク固有の指示は [tasks.py](../backend/app/tasks.py)、共通指示・JSON Schema・エラー処理は [vision.py](../backend/app/vision.py) にあります。

- `likely_done`：作業完了に整合する具体的な視覚的根拠がある → 完了・報酬へ。
- `uncertain` / `not_detected`：本人が完了を記録するか、再撮影する。
- API失敗、拒否、未完了、根拠なし：不確かとして本人の確認へ。
- 通信エラー時は、結果の再確認や自己申告が可能。タイムアウト後もサーバーで保存済みの場合があるため、記録を確認してください。

## YOLOEの食器検出

```bash
./scripts/setup-detection.sh
```

開発サーバーを再起動します。CPU用のPyTorch等と、約27MBのYOLOE11s-seg-pfモデルを取得します。モデルは `backend/models/` に置かれ、Git管理対象外です。一度導入すると、通常のsetupでも検出用依存を維持します。

あわもんの撮影プレビューでだけ、食器の枠・名前・個数を表示します。GPTには検出結果を渡さず、前後の元画像を送ります。食材検出は未実装です。

- API：`POST /api/detections`
- CPUで同時1件。初回にモデルを読み込み、以後再利用。
- 検出写真・検出結果は保存せず、外部APIへも送りません。
- 未導入・検出失敗でも通常の完了フローを利用できます。
- サーバープロセスの環境変数 `YOLOE_ENABLED=0` で無効化できます。

## スマホから使う

このアプリには認証・ユーザー分離がありません。開発者が管理する端末間での限定利用を想定し、両サーバーはループバックで起動します。

同じtailnetにPCとスマホを接続したうえで、PCでTailscale Serveを使って3000番ポートをHTTPSで共有します。現在の `frontend/next.config.ts` は開発者のホストに合わせた `allowedDevOrigins` を含みます。別の環境では、実際に使うTailscaleホスト名に変更してNextを再起動してください。接続設定の詳細は [Tailscale Serve公式資料](https://tailscale.com/kb/1242/tailscale-serve) を参照してください。

PWAのmanifestとオフライン案内はありますが、オフラインでの完了保存は未対応です。

## 保存・報酬・写真

- DB：`backend/data/awamon.sqlite3`。環境変数 `AWAMON_DB` で変更可能。
- キャラごとに1回10ポイント、1日3回まで（日本時間）。上限後も完了記録・反応は継続。
- レベルのしきい値：0 / 30 / 80 / 150 / 250ポイント。
- トランザクションで完了と報酬を一括確定し、並行・再送による二重付与を防止。
- 前写真だけ一時保存。後写真は判定中のメモリーのみ。
- 画像を1280px以内へ縮小・再エンコードし、EXIFを削除。受信上限8MB、JPEG / PNG / WebPを実デコードで検証。
- 前写真は完了・取り消し時、または24時間経過後に削除。稼働中は60秒ごと、停止中に期限が切れた場合は次回起動時に削除。SQLiteの `secure_delete` を有効化。バックアップは別途管理が必要。
- OpenAIには `store: false` で送信。サービス側での保持がゼロになる保証ではありません。

## 検証

リポジトリのルートから実行します。

```bash
backend/.venv/bin/pytest backend/tests -q
npm run typecheck --prefix frontend
node --test frontend/tests/usePetBehavior.test.mjs frontend/tests/usePetSound.test.mjs frontend/tests/sceneViewport.test.ts
```

本番ビルドは `npm run build --prefix frontend`。同じ作業ディレクトリで開発サーバーが稼働している場合は、止めてから実行してください。

自動テストは報酬の再送・並行実行、日次上限、途中再開、写真の検証と削除、AI判定のフォールバック、検出API、音声制御、自動モーション、スマホ表示領域などを対象にしています。実APIでの精度・ユーザーへの効果を保証するテストではありません。[検証記録](VERIFICATION.md)

## 素材と再生成

- キャラクター・動作：[ピクセルアート制作](PIXEL_DESIGN.md)
- 各キャラの仕様：[仲間の仕様](COMPANIONS.md)
- 音源と台詞：[音源の出典・再生成](../frontend/public/audio/README.md)
- スライド：[発表資料](../deliverables/pitch/kurashimon-90sec-revised.pptx)

アプリ用の音声ファイルは同梱され、実行時のVOICEVOXサーバーは不要です。素材の再生成には元の音源など追加の入力が必要です。

# あわもん

食器を洗って、水の妖精と小さな池を育てる個人用ローカルMVPです。Next.js / TypeScript + FastAPI / SQLite。

## 起動

Node.js 22以上、Python 3.12以上、[uv](https://docs.astral.sh/uv/) が必要です。

```bash
./scripts/setup.sh
./scripts/dev.sh
```

- アプリ: http://127.0.0.1:3000
- キャラ4案の比較: http://127.0.0.1:3000/design
- API仕様: http://127.0.0.1:8010/docs
- 終了: Ctrl+C

APIキーなしで使えます。「食器を洗う」から写真を選び、洗った後に自己申告で完了を記録できます。写真なしの完了操作も洗い中画面にあります。カメラがないPCではファイル選択を利用します。途中で閉じても再開できます。

ローカルの単一ユーザー用です。認証・ユーザー分離は未実装のため、サーバーはループバックに限定しています。スマホ実機からの利用には認証・HTTPS・接続設定が別途必要です。PWAのmanifestとオフライン案内を用意していますが、オフライン記録は未対応です。

## AI判定（任意）

`backend/.env.example` を `backend/.env` にコピーし、利用権限のある画像入力・Structured Outputs対応モデルを明示して、サーバーを再起動してください。

```dotenv
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=...
```

候補モデルの利用可能性はアカウントに依存するため、既定モデルを置いていません。AIが有効でも、撮影画面の同意チェックがない場合には外部送信しません。実APIでの推論は未検証です。APIキーをフロントエンドへ渡す設定はありません。

[公式の画像入力仕様](https://developers.openai.com/api/docs/guides/images-vision)と[構造化出力仕様](https://developers.openai.com/api/docs/guides/structured-outputs)に沿ってResponses APIを呼びます。失敗・拒否・未完了・根拠なしは `uncertain` に戻します。写真から衛生を保証せず、自己申告でも同じ報酬を付与します。

## 保存と報酬

- DB: `backend/data/awamon.sqlite3`。環境変数 `AWAMON_DB` で変更可能。
- 1回10しずく、1日3回まで（日本時間）。上限後も記録と喜ぶ演出は継続。
- SQLiteの書き込みトランザクションで完了と報酬を一括確定。並行・再送でも二重付与しません。
- 成長は報酬の合計から計算。しきい値は0 / 30 / 80 / 150 / 250。
- 前写真だけを一時保存。後写真は判定リクエスト中のメモリーのみ。
- 画像を1280px以内へ縮小・再エンコードし、EXIFを削除。受信上限8MB、JPEG / PNG / WebPを実デコードで検証。
- 前写真は完了・取り消し時または24時間経過後に削除。稼働中は60秒ごと、停止中に期限が切れた場合は次回起動時に削除。SQLiteのsecure_deleteを有効化。バックアップの管理は別途必要。
- OpenAIには `store: false` で送信します。サービス側の保持をゼロにする保証ではありません。

## 検証

```bash
cd backend
.venv/bin/pytest -q
cd ../frontend
npm run build
```

報酬の並行実行・再送、日次上限、途中再開、取り消し、期限切れ、形式・容量、同意、解析回数上限、AI失敗時のフォールバックをテストします。

## キャラクター

アプリは水色のピクセル版キャラに更新しました。7つの動き・5段階の進化・昼夜を、ホームの「あわもん実験室」から任意に表示できます。プレビューは記録やしずくを変更しません。

新しい原稿と生成手順は [docs/PIXEL_DESIGN.md](docs/PIXEL_DESIGN.md) を参照。旧試作の元データは `art/prototype/` に保存しています。

```bash
backend/.venv/bin/python art/scripts/build_candidates.py
backend/.venv/bin/python art/prototype/build.py
```

静止画4案は `art/candidates/` にあります。比較シート、8倍表示、シルエット、顔アップ、パレットを同じスクリプトで再生成できます。正式なデザインマスターではありません。追加指示に基づき、水色の開発用アニメーションは先行制作しました。正式なデザインレビューは未実施です。

## 設計と未実施項目

仕様の基準は [docs/DESIGN.md](docs/DESIGN.md)。実装との差分は末尾のv0.4・v0.5追記に記載。元の `設計.md` は参照先案内に整理しています。

未実施: キャラの人間による採用評価、実APIのモデル検証・90ペア評価、ブラウザー操作とスマホ実機での表示検証、認証・公開運用向け制限、YOLOE、実機でのPWA・カメラ・表示検証。モーションはidle/happy/wave/sleep/grow/bubble/danceを実装済みです。

Gitの `main` ブランチで変更を管理しています。現時点ではローカルのみで、リモートリポジトリは未設定です。

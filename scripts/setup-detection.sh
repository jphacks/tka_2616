#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
UV_CACHE_DIR="${UV_CACHE_DIR:-/tmp/awamon-uv}" uv sync --project backend --frozen --extra detection
mkdir -p backend/models
model=backend/models/yoloe-11s-seg-pf.pt
if [[ ! -s "$model" ]]; then
  curl -fL --retry 2 https://github.com/ultralytics/assets/releases/download/v8.3.0/yoloe-11s-seg-pf.pt -o "$model.download"
  mv "$model.download" "$model"
fi
echo '食器さがしの準備ができました。開発サーバーを再起動してください。'

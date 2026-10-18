#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
extras=()
if [[ -s backend/models/yoloe-11s-seg-pf.pt ]]; then extras=(--extra detection); fi
UV_CACHE_DIR="${UV_CACHE_DIR:-/tmp/awamon-uv}" uv sync --project backend --frozen "${extras[@]}"
npm --cache "${npm_config_cache:-/tmp/awamon-npm}" ci --prefix frontend
echo '準備できました。./scripts/dev.sh で起動できます。'

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
UV_CACHE_DIR="${UV_CACHE_DIR:-/tmp/awamon-uv}" uv sync --project backend --frozen
npm --cache "${npm_config_cache:-/tmp/awamon-npm}" ci --prefix frontend
echo '準備できました。./scripts/dev.sh で起動できます。'

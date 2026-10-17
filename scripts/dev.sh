#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x backend/.venv/bin/uvicorn || ! -d frontend/node_modules ]]; then
  echo '先に ./scripts/setup.sh を実行してください。' >&2
  exit 1
fi
# The public app and backend are deliberately bound to loopback for this single-user prototype.
(cd backend && exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010) &
backend_pid=$!
(cd frontend && exec node node_modules/next/dist/bin/next dev --hostname 127.0.0.1) &
frontend_pid=$!
cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM
wait -n "$backend_pid" "$frontend_pid"

#!/usr/bin/env bash
set -euo pipefail

echo "[verify-fast] Starting fast verification"

if [ ! -f package.json ]; then
  echo "[verify-fast] package.json not found: app not bootstrapped yet"
  echo "[verify-fast] Harness-only state accepted"
  exit 0
fi

npm run lint
npm run typecheck
npm test

echo "[verify-fast] Passed"


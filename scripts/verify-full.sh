#!/usr/bin/env bash
set -euo pipefail

echo "[verify-full] Starting full verification"

if [ ! -f package.json ]; then
  echo "[verify-full] package.json not found: app not bootstrapped yet"
  echo "[verify-full] Docker/app checks are pending by design"
  exit 0
fi

npm run lint
npm run typecheck
npm test
npm run build

if [ -f docker-compose.yml ] || [ -f compose.yml ]; then
  docker compose up --build -d
  ./scripts/smoke-docker.sh
  docker compose down
else
  echo "[verify-full] Docker Compose file not found"
  exit 1
fi

echo "[verify-full] Passed"


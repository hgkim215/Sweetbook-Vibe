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
  COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-growthbook-verify}"
  trap 'docker compose --project-name "$COMPOSE_PROJECT_NAME" down -v >/dev/null 2>&1 || true' EXIT
  docker compose --project-name "$COMPOSE_PROJECT_NAME" up --build -d
  ./scripts/smoke-docker.sh
  BASE_URL="http://localhost:${PORT:-3000}" node scripts/smoke-api-flow.mjs
  docker compose --project-name "$COMPOSE_PROJECT_NAME" down -v
  trap - EXIT
else
  echo "[verify-full] Docker Compose file not found"
  exit 1
fi

echo "[verify-full] Passed"

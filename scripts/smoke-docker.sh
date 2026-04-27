#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
URL="http://localhost:${PORT}/api/health"

for attempt in $(seq 1 30); do
  if curl -fsS "$URL" >/tmp/growthbook-health.json; then
    if grep -q '"ok":true' /tmp/growthbook-health.json; then
      echo "[smoke-docker] Health check passed: $URL"
      exit 0
    fi
  fi
  echo "[smoke-docker] Waiting for app... attempt ${attempt}/30"
  sleep 1
done

echo "[smoke-docker] Health check failed: $URL"
exit 1

#!/usr/bin/env bash
set -euo pipefail

if [ ! -f package.json ]; then
  echo "[smoke-docker] App not bootstrapped yet"
  exit 0
fi

echo "[smoke-docker] TODO: add HTTP smoke checks after app ports are defined"


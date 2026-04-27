#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/commit-and-push.sh \"commit message\""
  exit 1
fi

MESSAGE="$1"
BRANCH="$(git branch --show-current)"

if [ "$BRANCH" != "dev" ]; then
  echo "Refusing to auto-push from '$BRANCH'. Switch to dev first."
  exit 1
fi

./scripts/verify-fast.sh

git add -A

if git diff --cached --quiet; then
  echo "No staged changes to commit."
  exit 0
fi

git commit -m "$MESSAGE"
git push origin dev

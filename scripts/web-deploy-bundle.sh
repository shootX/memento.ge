#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${WEB_DEPLOY_BRANCH:-web-deploy}"
BUNDLE="${1:-memento-web.bundle}"

git branch -D "$BRANCH" 2>/dev/null || true
git subtree split --prefix=web -b "$BRANCH"
git bundle create "$BUNDLE" "$BRANCH:refs/heads/main"
echo "Created bundle: $BUNDLE ($BRANCH -> refs/heads/main)"

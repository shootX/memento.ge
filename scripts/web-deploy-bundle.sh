#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${WEB_DEPLOY_BRANCH:-web-deploy}"
BUNDLE="${1:-memento-web.bundle}"
MAIN_REF="refs/heads/main"

git branch -D "$BRANCH" 2>/dev/null || true
git subtree split --prefix=web -b "$BRANCH"
COMMIT="$(git rev-parse "$BRANCH")"
git update-ref "$MAIN_REF" "$COMMIT"
git bundle create "$BUNDLE" "$MAIN_REF"
echo "Created bundle: $BUNDLE ($BRANCH @ $COMMIT -> $MAIN_REF)"

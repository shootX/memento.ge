#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${WEB_DEPLOY_BRANCH:-web-deploy}"
BUNDLE="${1:-/opt/cursor/artifacts/memento-web.bundle}"
DRY_RUN="${WEB_DEPLOY_DRY_RUN:-0}"
MAIN_REF="refs/heads/main"
SOURCE_REF="${WEB_DEPLOY_SOURCE_REF:-HEAD}"

WORKTREE="$(mktemp -d)"
trap 'rm -rf "$WORKTREE"' EXIT

git worktree add --detach "$WORKTREE" "$SOURCE_REF"
cd "$WORKTREE"

git branch -D "$BRANCH" 2>/dev/null || true
git subtree split --prefix=web -b "$BRANCH"
COMMIT="$(git rev-parse "$BRANCH")"
git update-ref "$MAIN_REF" "$COMMIT"
mkdir -p "$(dirname "$BUNDLE")"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN: would create bundle $BUNDLE ($BRANCH @ $COMMIT -> $MAIN_REF)"
  exit 0
fi
git bundle create "$BUNDLE" "$MAIN_REF"
echo "Created bundle: $BUNDLE ($BRANCH @ $COMMIT -> $MAIN_REF)"
git bundle list-heads "$BUNDLE"

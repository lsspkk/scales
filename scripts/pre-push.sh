#!/usr/bin/env bash
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "pre-push: building app..."
cd "$REPO_ROOT/app"
npm run build

echo "pre-push: build succeeded."

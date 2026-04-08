#!/bin/bash
# Push codebase to GitHub
# Run with: bash scripts/push-to-github.sh
set -e

cd "$(git rev-parse --show-toplevel)"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN environment variable is not set"
  exit 1
fi

REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/dev-miraj/softworks-it-farm.git"

echo "Configuring git..."
git config user.email "dev-miraj@users.noreply.github.com"
git config user.name "Md Mirajul Islam"

echo "Adding GitHub remote..."
git remote remove github 2>/dev/null || true
git remote add github "$REPO_URL"

echo "Fetching remote to get its commit..."
git fetch github main

echo "Merging remote README commit..."
git merge github/main --allow-unrelated-histories -m "chore: merge initial GitHub commit"

echo "Pushing to GitHub..."
git push github main

echo ""
echo "SUCCESS: Code pushed to https://github.com/dev-miraj/softworks-it-farm"

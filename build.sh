#!/bin/sh
# Build the static OHIF site into ./dist (for CDN upload — pure static files).
# Uses the 'export' target of Dockerfile.railway. Requires Docker BuildKit.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"

docker build -f "$HERE/Dockerfile.railway" --target export --output "type=local,dest=$HERE/dist" "$HERE"

echo ""
echo "Static site built -> $HERE/dist"
echo "Railway/dev:  docker compose up -d --build   (serves via nginx, target=serve)"
echo "CDN deploy:   see deploy/deploy.sh + deploy/HEADERS.md"

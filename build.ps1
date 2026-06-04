# Build the static OHIF site into ./dist (for CDN upload — pure static files).
# Uses the 'export' target of Dockerfile.railway. Requires Docker BuildKit.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

docker build -f "$here\Dockerfile.railway" --target export --output "type=local,dest=$here\dist" $here

Write-Host ""
Write-Host "Static site built -> $here\dist"
Write-Host "Railway/dev:  docker compose up -d --build   (serves via nginx, target=serve)"
Write-Host "CDN deploy:   see deploy/deploy.sh + deploy/HEADERS.md"

#!/bin/sh
# Deploy the static OHIF build (./dist) to S3-compatible Object Storage.
# Works with AWS S3 or FPT Object Storage (set S3_ENDPOINT for the latter).
#
# Prereqs: ./build.ps1 (or ./build.sh) already produced ../dist
#
# Env:
#   S3_BUCKET            (required)  e.g. medisync-pacs-viewer
#   DICOMWEB_ROOT        (required)  prod DICOMweb endpoint (pacs-dicomweb-proxy),
#                                    e.g. https://api-pacs.medisync.vn/wado
#   S3_ENDPOINT          (optional)  FPT Object Storage endpoint, e.g. https://hcm.fptcloud...
#   CF_DISTRIBUTION_ID   (optional)  CloudFront dist id for invalidation
set -e

: "${S3_BUCKET:?set S3_BUCKET}"
HERE="$(cd "$(dirname "$0")" && pwd)"
DIST="$HERE/../dist"
[ -d "$DIST" ] || { echo "Build first: ../dist not found"; exit 1; }

# Render the PROD runtime config into dist (the baked medisync-runtime.js holds
# the DEV value). window.MEDISYNC_DICOMWEB_ROOT wins over the build-time fallback.
if [ -n "$DICOMWEB_ROOT" ]; then
  printf 'window.MEDISYNC_DICOMWEB_ROOT = "%s";\n' "$DICOMWEB_ROOT" > "$DIST/medisync-runtime.js"
  echo "Wrote dist/medisync-runtime.js -> $DICOMWEB_ROOT"
else
  echo "WARN: DICOMWEB_ROOT unset — dist/medisync-runtime.js keeps its baked (dev) value!"
fi

EP=""
[ -n "$S3_ENDPOINT" ] && EP="--endpoint-url $S3_ENDPOINT"

# These files change every deploy → must NOT be cached long.
MUTABLE="index.html app-config.js medisync-runtime.js medisync-extras.js medisync-toolbar.js"

# 1) Immutable, content-hashed assets — long cache. (Exclude the mutable ones.)
EXCLUDES=""
for f in $MUTABLE; do EXCLUDES="$EXCLUDES --exclude $f"; done
# shellcheck disable=SC2086
aws s3 sync "$DIST" "s3://$S3_BUCKET" $EP --delete \
  --cache-control "public, max-age=31536000, immutable" \
  $EXCLUDES

# 2) Mutable files — no-cache so a deploy is picked up immediately.
for f in $MUTABLE; do
  [ -f "$DIST/$f" ] || continue
  # shellcheck disable=SC2086
  aws s3 cp "$DIST/$f" "s3://$S3_BUCKET/$f" $EP \
    --cache-control "no-cache, must-revalidate"
done

# 3) Invalidate the mutable paths at the CDN (CloudFront shown; FPT CDN: use its API/console).
if [ -n "$CF_DISTRIBUTION_ID" ]; then
  # shellcheck disable=SC2086
  aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" \
    --paths /index.html /app-config.js /medisync-runtime.js /medisync-extras.js /medisync-toolbar.js
fi

echo "Deployed ./dist -> s3://$S3_BUCKET"
echo "NOTE: COOP/COEP/CORP headers are NOT object metadata — set them at the CDN. See HEADERS.md."

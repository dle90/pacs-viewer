#!/bin/sh
# Render runtime medisync-runtime.js from $DICOMWEB_ROOT at container start,
# BEFORE nginx serves. The nginx image runs /docker-entrypoint.d/*.sh in order
# (after 20-envsubst-on-templates.sh). One image serves every env by changing
# the DICOMWEB_ROOT service variable — no rebuild.
set -e
: "${DICOMWEB_ROOT:=}"
envsubst '${DICOMWEB_ROOT}' \
  < /etc/pacs-viewer/medisync-runtime.js.template \
  > /usr/share/nginx/html/medisync-runtime.js
echo "[pacs-viewer] medisync-runtime.js rendered: DICOMWEB_ROOT='${DICOMWEB_ROOT}'"

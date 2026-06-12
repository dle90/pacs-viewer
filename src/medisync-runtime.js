// Medisync runtime config — the ONLY per-environment file.
//
// Loaded FIRST in <head> (before app-config.js) so window.config can read it.
// On deploy, upload this file with `Cache-Control: no-cache` while every other
// asset stays immutable — switching environments = swap this one file, no rebuild.
//
//   dev     -> http://localhost:8080/wado        (pacs-dicomweb-proxy, published)
//   staging -> https://api-pacs.staging.medisync.vn/wado
//   prod    -> https://api-pacs.medisync.vn/wado  (or CF Worker edge-cache)
window.MEDISYNC_DICOMWEB_ROOT = "https://pacs-dicomweb-proxy-production.up.railway.app/wado";

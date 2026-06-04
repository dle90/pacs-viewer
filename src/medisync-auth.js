// medisync-auth.js — attach the Medisync view-token to DICOMweb requests.
//
// Loaded in <head> right after medisync-runtime.js (before app-config.js + the app
// bundle). The RIS/HIS opens the viewer bound to one study, e.g.
//
//     https://viewer.medisync.vn/?StudyInstanceUIDs=<uid>#token=<JWT>
//
// The view-token lives in the URL HASH ("#") so it never lands on the request line
// and is never logged by nginx / the proxy. Token claims: iss aud uuid sub studyUid
// exp. A token whose `studyUid` is set is scoped to that one study; a token with
// `studyUid` null/absent is a MASTER token (any study + list-all) — handy to test the
// viewer with the HIS private key in hand, without the full HIS-RIS issue flow.
//
// This script:
//   1. reads the token from the hash (query "?token=" + sessionStorage as fallbacks;
//      sessionStorage lets an in-tab reload keep working after the URL is scrubbed),
//   2. scrubs `token` out of the address bar so it isn't shoulder-surfed / shared,
//   3. injects `Authorization: Bearer <token>` on every fetch + XMLHttpRequest that
//      targets the DICOMweb origin — and ONLY that origin, so the token never leaks
//      to fonts / CDN / analytics.
//
// Both transports are wrapped because OHIF/Cornerstone uses fetch (QIDO + WADO-RS
// metadata) AND XMLHttpRequest (WADO-RS frame / image retrieval).
(function () {
  'use strict';

  var STORE_KEY = 'medisync_view_token';

  function param(qs, key) {
    try { return new URLSearchParams(qs || '').get(key); } catch (e) { return null; }
  }

  // hash → query → sessionStorage. { token, fromUrl }.
  function readToken() {
    var fromHash = param((window.location.hash || '').replace(/^#/, ''), 'token');
    if (fromHash) return { token: fromHash, fromUrl: true };
    var fromQuery = param(window.location.search, 'token');
    if (fromQuery) return { token: fromQuery, fromUrl: true };
    try {
      var stored = window.sessionStorage.getItem(STORE_KEY);
      if (stored) return { token: stored, fromUrl: false };
    } catch (e) { /* storage blocked */ }
    return { token: null, fromUrl: false };
  }

  // Drop ?token / #token from the URL, preserving everything else — notably
  // ?StudyInstanceUIDs=, which OHIF reads for routing.
  function scrubUrl() {
    try {
      var url = new URL(window.location.href);
      var changed = false;
      if (url.searchParams.has('token')) { url.searchParams.delete('token'); changed = true; }
      var h = (url.hash || '').replace(/^#/, '');
      if (h) {
        var hp = new URLSearchParams(h);
        if (hp.has('token')) { hp.delete('token'); url.hash = hp.toString(); changed = true; }
      }
      if (changed) history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* non-fatal */ }
  }

  var found = readToken();
  var TOKEN = found.token;
  if (!TOKEN) return;   // no token → public mode, or read-auth disabled at the proxy.

  window.MEDISYNC_VIEW_TOKEN = TOKEN;
  if (found.fromUrl) {
    try { window.sessionStorage.setItem(STORE_KEY, TOKEN); } catch (e) { /* ignore */ }
    scrubUrl();
  }

  var BEARER = 'Bearer ' + TOKEN;

  // Attach only to requests hitting the DICOMweb origin. Resolved lazily (per
  // request) so it doesn't matter whether medisync-runtime.js ran before this file.
  function attachTo(rawUrl) {
    if (!rawUrl) return false;
    var root = (window.MEDISYNC_DICOMWEB_ROOT || '').trim();
    if (!root) return false;
    try {
      var here = window.location.href;
      return new URL(rawUrl, here).origin === new URL(root, here).origin;
    } catch (e) { return false; }
  }

  // ── fetch (QIDO-RS + WADO-RS metadata) ──────────────────────────────────────
  var _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function (input, init) {
      try {
        var url = (typeof input === 'string') ? input
          : (input && input.url) ? input.url : null;
        if (attachTo(url)) {
          init = init || {};
          var headers = new Headers(
            (init && init.headers) ||
            (typeof input !== 'string' && input && input.headers) || {});
          if (!headers.has('Authorization')) headers.set('Authorization', BEARER);
          init.headers = headers;
        }
      } catch (e) { /* fall through with original args */ }
      return _fetch.call(this, input, init);
    };
  }

  // ── XMLHttpRequest (WADO-RS frame / image retrieval) ────────────────────────
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try { this.__medisyncAttach = attachTo(url); } catch (e) { this.__medisyncAttach = false; }
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    try { if (this.__medisyncAttach) this.setRequestHeader('Authorization', BEARER); }
    catch (e) { /* header already set / forbidden — ignore */ }
    return _send.apply(this, arguments);
  };

  try {
    console.info('[medisync-auth] view-token attached to DICOMweb requests' +
      (found.fromUrl ? ' (from URL, scrubbed)' : ' (from session)'));
  } catch (e) { /* ignore */ }
})();

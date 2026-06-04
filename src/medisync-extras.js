// Medisync PACS — runtime extras for OHIF
// Loaded after app-config.js. Adds Vietnamese i18n, MEDISYNC branding,
// and bridges custom toolbar buttons to bundled Cornerstone3D tools.
(function () {
  'use strict';

  // ---- Vietnamese translations (extends OHIF defaults) ----
  // OHIF ships with en-US only; we add 'vi' at runtime via i18next.
  var viResources = {
    Buttons: {
      Zoom: 'Phóng to',
      Pan: 'Di chuyển',
      'Window Level': 'Cửa sổ / Mức',
      'Reset View': 'Đặt lại',
      Length: 'Đo chiều dài',
      Angle: 'Đo góc',
      'Cobb Angle': 'Góc Cobb',
      Bidirectional: 'Đo hai chiều',
      'Elliptical ROI': 'Hình elip',
      'Circle ROI': 'Hình tròn',
      'Rectangle ROI': 'Hình chữ nhật',
      'Planar Freehand ROI': 'Đa giác (vẽ tự do)',
      Capture: 'Chụp ảnh',
      Layout: 'Bố cục',
      'More Tools': 'Công cụ khác',
      MPR: 'Tái tạo đa mặt phẳng',
      Crosshairs: 'Kính ngắm chéo',
      Cine: 'Phát ảnh động',
      Magnify: 'Kính lúp',
      Rotate: 'Xoay',
      Flip: 'Lật',
      Invert: 'Đảo màu',
      Calibration: 'Hiệu chuẩn',
    },
    Header: {
      About: 'Giới thiệu',
      Preferences: 'Tùy chọn',
      'Logout': 'Đăng xuất',
    },
    Modals: {
      Cancel: 'Hủy',
      Save: 'Lưu',
      Close: 'Đóng',
      OK: 'Đồng ý',
    },
    StudyList: {
      'Study List': 'Danh sách ca chụp',
      'Patient Name': 'Tên bệnh nhân',
      'Patient ID': 'Mã BN',
      'Study Date': 'Ngày chụp',
      'Modality': 'Phương thức',
      'Description': 'Mô tả',
      'Accession': 'Số tiếp nhận',
      'Search': 'Tìm kiếm',
      'No studies available': 'Không có ca chụp nào',
    },
    SidePanel: {
      'Study List': 'Danh sách ca',
      'Measurements': 'Phép đo',
      'Series': 'Chuỗi ảnh',
    },
    MeasurementTable: {
      Measurements: 'Danh sách phép đo',
      Description: 'Mô tả',
      'Export CSV': 'Xuất CSV',
      'Create Report': 'Tạo báo cáo',
    },
    Common: {
      Loading: 'Đang tải...',
      'No data': 'Không có dữ liệu',
    },
  };

  function tryAddVietnamese() {
    // i18next is exposed globally in OHIF v3 builds
    var i18n = window.i18next || (window.OHIF && window.OHIF.i18n);
    if (!i18n || typeof i18n.addResourceBundle !== 'function') return false;
    Object.keys(viResources).forEach(function (ns) {
      i18n.addResourceBundle('vi', ns, viResources[ns], true, true);
    });
    if (typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage('vi');
    }
    return true;
  }

  // i18next loads asynchronously; poll briefly until it's ready
  var attempts = 0;
  var maxAttempts = 50; // ~10s at 200ms
  var iv = setInterval(function () {
    attempts++;
    if (tryAddVietnamese() || attempts >= maxAttempts) {
      clearInterval(iv);
    }
  }, 200);

  // ---- MEDISYNC branding overlay ----
  // Adds a small fixed badge in the top-right corner of the viewer
  function addBrandingBadge() {
    if (document.getElementById('medisync-brand-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'medisync-brand-badge';
    badge.textContent = 'MEDISYNC PACS';
    badge.style.cssText = [
      'position: fixed',
      'top: 4px',
      'right: 12px',
      'z-index: 9999',
      'font-family: system-ui, sans-serif',
      'font-size: 11px',
      'font-weight: 600',
      'letter-spacing: 0.5px',
      'color: #5acce6',
      'opacity: 0.7',
      'pointer-events: none',
      'user-select: none',
    ].join(';');
    document.body.appendChild(badge);
  }
  if (document.body) {
    addBrandingBadge();
  } else {
    document.addEventListener('DOMContentLoaded', addBrandingBadge);
  }

  // ===========================================================================
  // Custom tools (Cardiothoracic Ratio, Spine Labeling, Spine Balance)
  // Custom commands (pseudo-color cycle, image alignment)
  // Floating side panel (prior studies timeline)
  // ===========================================================================

  var VERTEBRA_LABELS = [
    'C1','C2','C3','C4','C5','C6','C7',
    'T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12',
    'L1','L2','L3','L4','L5','S1'
  ];
  var COLORMAP_CYCLE = ['Grayscale', 'hot_iron', 'Rainbow', 'hsv'];

  // Per-toolGroup vertebra-label counter (resets per toolGroup)
  var spineLabelCounters = {};

  function getSpineLabelCallback(toolGroupId) {
    return function (callback /*, eventDetails */) {
      var idx = spineLabelCounters[toolGroupId] || 0;
      var label = VERTEBRA_LABELS[idx % VERTEBRA_LABELS.length];
      spineLabelCounters[toolGroupId] = idx + 1;
      callback(label);
    };
  }

  // Cardiothoracic ratio text: long axis = thoracic, short axis = cardiac
  function ctrTextLines(data) {
    try {
      var stats = data && (data.cachedStats || (data.data && data.data.cachedStats));
      if (!stats) return ['CTR: --'];
      var key = Object.keys(stats)[0];
      if (!key) return ['CTR: --'];
      var s = stats[key];
      var thoracic = Math.max(s.length || 0, s.width || 0);
      var cardiac  = Math.min(s.length || 0, s.width || 0);
      if (!thoracic || !cardiac) return ['CTR: --'];
      var ratio = (cardiac / thoracic).toFixed(2);
      return [
        'CTR: ' + ratio,
        'Cardiac: '  + cardiac.toFixed(1)  + ' mm',
        'Thoracic: ' + thoracic.toFixed(1) + ' mm',
      ];
    } catch (e) { return ['CTR: --']; }
  }

  // Spine balance text: horizontal offset (sagittal vertical axis)
  function svaTextLines(data) {
    try {
      var stats = data && (data.cachedStats || (data.data && data.data.cachedStats));
      var handles = data && data.data && data.data.handles && data.data.handles.points;
      if (!handles || handles.length < 2) return ['SVA: --'];
      var dx = Math.abs(handles[1][0] - handles[0][0]);
      var dy = Math.abs(handles[1][1] - handles[0][1]);
      var len = stats && stats[Object.keys(stats)[0]] && stats[Object.keys(stats)[0]].length;
      var lines = ['SVA Δx: ' + dx.toFixed(1), 'Δy: ' + dy.toFixed(1)];
      if (len) lines.push('L: ' + len.toFixed(1) + ' mm');
      return lines;
    } catch (e) { return ['SVA: --']; }
  }

  function registerCustomTools() {
    var cst = window.cornerstoneTools;
    if (!cst || !cst.addTool || !cst.ToolGroupManager) return false;

    // Subclass existing tools so we keep all the click/drag/render plumbing.
    if (!cst._medisyncToolsRegistered) {
      try {
        var Bidi  = cst.BidirectionalTool;
        var Arrow = cst.ArrowAnnotateTool;
        var Len   = cst.LengthTool;
        if (!Bidi || !Arrow || !Len) return false;

        var CTR = class CardiothoracicRatioTool extends Bidi {};
        CTR.toolName = 'CardiothoracicRatio';

        var SL = class SpineLabelingTool extends Arrow {};
        SL.toolName = 'SpineLabeling';

        var SB = class SpineBalanceTool extends Len {};
        SB.toolName = 'SpineBalance';

        cst.addTool(CTR);
        cst.addTool(SL);
        cst.addTool(SB);
        cst._medisyncToolsRegistered = true;
        // eslint-disable-next-line no-console
        console.log('[Medisync] Custom tools registered: CardiothoracicRatio, SpineLabeling, SpineBalance');
      } catch (e) {
        console.warn('[Medisync] Failed to register custom tools:', e);
        return false;
      }
    }

    // Add to every existing toolGroup (idempotent — addTool on existing throws, swallow it)
    var groups = [];
    try { groups = cst.ToolGroupManager.getAllToolGroups() || []; } catch (e) {}
    groups.forEach(function (tg) {
      if (!tg || tg._medisyncToolsAdded) return;
      try { tg.addTool('CardiothoracicRatio', { getTextLines: ctrTextLines }); } catch (e) {}
      try { tg.addTool('SpineLabeling',       { getTextCallback: getSpineLabelCallback(tg.id) }); } catch (e) {}
      try { tg.addTool('SpineBalance',        { getTextLines: svaTextLines }); } catch (e) {}
      tg._medisyncToolsAdded = true;
    });
    return true;
  }

  // ----- Pseudo color cycle (per active viewport) -----
  var colormapIndex = {};
  function cyclePseudoColor() {
    try {
      var svc = window.services && window.services.cornerstoneViewportService;
      var grid = window.services && window.services.viewportGridService;
      var displaySetSvc = window.services && window.services.displaySetService;
      if (!svc || !grid) return;
      var state = grid.getState && grid.getState();
      var activeId = state && state.activeViewportId;
      if (!activeId) return;
      var idx = colormapIndex[activeId] || 0;
      var next = (idx + 1) % COLORMAP_CYCLE.length;
      var colormap = COLORMAP_CYCLE[next];
      colormapIndex[activeId] = next;

      var viewportInfo = state.viewports && (state.viewports.get ? state.viewports.get(activeId) : state.viewports[activeId]);
      var displaySetInstanceUIDs = (viewportInfo && viewportInfo.displaySetInstanceUIDs) || [];
      var dsUID = displaySetInstanceUIDs[0];

      window.commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          viewportId: activeId,
          displaySetInstanceUID: dsUID,
          colormap: { name: colormap },
          immediate: true,
        },
        context: 'CORNERSTONE',
      });
      console.log('[Medisync] Pseudo color →', colormap);
    } catch (e) { console.warn('[Medisync] cyclePseudoColor failed', e); }
  }

  // ----- Image alignment across viewports -----
  function alignImages(opts) {
    try {
      var mode = (opts && opts.mode) || 'center';
      var grid = window.services && window.services.viewportGridService;
      var svc = window.services && window.services.cornerstoneViewportService;
      if (!grid || !svc) return;
      var state = grid.getState();
      var ids = [];
      if (state && state.viewports) {
        if (typeof state.viewports.forEach === 'function') {
          state.viewports.forEach(function (_, id) { ids.push(id); });
        } else {
          ids = Object.keys(state.viewports);
        }
      }
      ids.forEach(function (id) {
        var vp = svc.getCornerstoneViewport(id);
        if (!vp) return;
        var canvas = vp.canvas;
        var img = vp.getImageData ? vp.getImageData() : null;
        if (!canvas || !img || !img.dimensions) return;
        var imgWidth  = img.dimensions[0];
        var canvasW = canvas.clientWidth || canvas.width;
        if (!canvasW || !imgWidth) return;
        // Compute pan in canvas units (cornerstone3D pan units depend on viewport — use a heuristic)
        var halfDelta = (canvasW - imgWidth) / 2;
        var panX = 0;
        if (mode === 'left'      || mode === 'lockLeft')  panX = -halfDelta;
        else if (mode === 'right'|| mode === 'lockRight') panX =  halfDelta;
        else                                              panX = 0;
        try {
          if (typeof vp.setPan === 'function') {
            var current = (vp.getPan && vp.getPan()) || [0, 0];
            vp.setPan([panX, current[1]]);
            vp.render();
          }
        } catch (e) {}
      });
      console.log('[Medisync] Aligned viewports →', mode);
      // Lock variants: re-run on stack/image change
      if (mode === 'lockLeft' || mode === 'lockRight') {
        window._medisyncAlignLock = mode;
      } else {
        window._medisyncAlignLock = null;
      }
    } catch (e) { console.warn('[Medisync] alignImages failed', e); }
  }

  function registerCustomCommands() {
    var cm = window.commandsManager;
    if (!cm || !cm.registerCommand) return false;
    if (cm._medisyncCommandsRegistered) return true;
    try {
      cm.registerCommand('CORNERSTONE', 'cyclePseudoColor', { commandFn: cyclePseudoColor });
      cm.registerCommand('CORNERSTONE', 'alignImages',      { commandFn: alignImages });
      cm._medisyncCommandsRegistered = true;
      console.log('[Medisync] Custom commands registered: cyclePseudoColor, alignImages');
      return true;
    } catch (e) {
      console.warn('[Medisync] Failed to register commands:', e);
      return false;
    }
  }

  // ===========================================================================
  // Floating "Prior Studies" timeline panel
  // Pulls from /wado QIDO-RS, shows other studies for the current patient.
  // ===========================================================================
  var TIMELINE_ID = 'medisync-timeline-panel';

  function buildTimelinePanel() {
    if (document.getElementById(TIMELINE_ID)) return;
    var p = document.createElement('div');
    p.id = TIMELINE_ID;
    p.style.cssText = [
      'position: fixed',
      'left: 8px',
      'bottom: 8px',
      'width: 220px',
      'max-height: 40vh',
      'overflow-y: auto',
      'background: rgba(20,28,36,0.92)',
      'border: 1px solid #1f2937',
      'border-radius: 6px',
      'padding: 8px',
      'z-index: 9998',
      'font-family: system-ui, sans-serif',
      'font-size: 11px',
      'color: #cbd5e1',
      'box-shadow: 0 4px 16px rgba(0,0,0,0.4)',
    ].join(';');
    p.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      '  <strong style="color:#5acce6;font-size:11px;letter-spacing:0.5px;">CA CHỤP CŨ</strong>' +
      '  <button id="medisync-timeline-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;line-height:1;">×</button>' +
      '</div>' +
      '<div id="medisync-timeline-body" style="font-size:11px;">Đang tải...</div>';
    document.body.appendChild(p);
    document.getElementById('medisync-timeline-close').onclick = function () {
      p.style.display = 'none';
    };
  }

  function getCurrentPatientID() {
    // Read from URL: /viewer?StudyInstanceUIDs=... — we still need PatientID
    // Try the OHIF DisplaySetService first
    try {
      var dss = window.services && window.services.displaySetService;
      if (dss && dss.getActiveDisplaySets) {
        var sets = dss.getActiveDisplaySets() || [];
        if (sets[0] && sets[0].instances && sets[0].instances[0]) {
          return sets[0].instances[0].PatientID;
        }
      }
    } catch (e) {}
    return null;
  }

  function refreshTimeline() {
    var body = document.getElementById('medisync-timeline-body');
    if (!body) return;
    var pid = getCurrentPatientID();
    if (!pid) { body.textContent = 'Chưa có ca chụp.'; return; }
    fetch('/wado/studies?PatientID=' + encodeURIComponent(pid) + '&includefield=StudyDescription,ModalitiesInStudy,NumberOfStudyRelatedSeries', {
      headers: { Accept: 'application/dicom+json' },
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (studies) {
        if (!studies || !studies.length) { body.textContent = 'Không có ca chụp cũ.'; return; }
        var rows = studies.map(function (s) {
          var date  = (s['00080020'] && s['00080020'].Value && s['00080020'].Value[0]) || '';
          var desc  = (s['00081030'] && s['00081030'].Value && s['00081030'].Value[0]) || '(no description)';
          var mods  = (s['00080061'] && s['00080061'].Value && s['00080061'].Value.join(',')) || '';
          var uid   = (s['0020000D'] && s['0020000D'].Value && s['0020000D'].Value[0]) || '';
          var pretty = date ? (date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)) : '';
          return '<a href="/viewer?StudyInstanceUIDs=' + uid + '" target="_blank" '
            + 'style="display:block;padding:6px;margin-bottom:4px;border:1px solid #334155;border-radius:4px;color:#cbd5e1;text-decoration:none;background:#0f172a;">'
            + '<div style="color:#5acce6;font-weight:600;">' + pretty + ' <span style="float:right;color:#94a3b8;">' + mods + '</span></div>'
            + '<div style="color:#cbd5e1;margin-top:2px;font-size:10px;">' + desc + '</div>'
            + '</a>';
        });
        body.innerHTML = rows.join('');
      })
      .catch(function () { body.textContent = 'Lỗi khi tải ca chụp.'; });
  }

  // ----- QIDO study-list response sanitizer (fetch + XHR) -----
  // OHIF's getModalities() crashes on `Cannot read properties of undefined
  // (reading 'length')` when a QIDO /studies response includes an entry whose
  // `00080061 ModalitiesInStudy` element is present but has no `.Value` field
  // (e.g. orphan studies built from Secondary Capture only with no PatientID).
  // The crash kills the StudyBrowser thumbnail render for the whole study panel.
  function sanitizeQIDOArray(data) {
    if (!Array.isArray(data)) return false;
    var dirty = false;
    data.forEach(function (s) {
      if (s && s['00080061'] && !('Value' in s['00080061'])) {
        s['00080061'].Value = [];
        dirty = true;
      }
    });
    return dirty;
  }
  function isStudyListURL(u) {
    return typeof u === 'string'
      && /\/studies(\?|$)/.test(u)
      && !/\/series|\/instances/.test(u);
  }

  // Wrap window.fetch — used by some OHIF code paths.
  (function patchFetchForQIDO() {
    if (window._medisyncFetchPatched) return;
    window._medisyncFetchPatched = true;
    var orig = window.fetch.bind(window);
    window.fetch = function (url, init) {
      var u = typeof url === 'string' ? url : (url && url.url);
      if (!isStudyListURL(u)) return orig(url, init);
      return orig(url, init).then(function (resp) {
        if (!resp.ok) return resp;
        var ctype = resp.headers.get('content-type') || '';
        if (!/json/.test(ctype)) return resp;
        return resp.clone().json().then(function (data) {
          if (!sanitizeQIDOArray(data)) return resp;
          var headers = new Headers(resp.headers);
          return new Response(JSON.stringify(data), { status: resp.status, statusText: resp.statusText, headers: headers });
        }).catch(function () { return resp; });
      });
    };
    console.log('[Medisync] QIDO fetch sanitizer installed');
  })();

  // Wrap XMLHttpRequest — dicomweb-client (the primary QIDO path in OHIF v3)
  // uses XHR, not fetch, so the wrapper above misses it. Shadow the
  // responseText/response getters on the instance so every handler
  // (onreadystatechange, onload, addEventListener) reads sanitized JSON
  // regardless of registration order.
  (function patchXHRForQIDO() {
    if (window._medisyncXHRPatched || !window.XMLHttpRequest) return;
    window._medisyncXHRPatched = true;
    var origOpen = XMLHttpRequest.prototype.open;
    var rtDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText');
    var rDesc  = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response');
    if (!rtDesc || !rtDesc.get) {
      console.warn('[Medisync] XHR sanitizer: responseText getter unavailable, skipping');
      return;
    }
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        var u = typeof url === 'string' ? url : (url && String(url)) || '';
        if (isStudyListURL(u)) {
          var xhr = this;
          // Sanitize lazily on first read after readyState=4.
          var define = function (prop, baseDesc) {
            if (!baseDesc || !baseDesc.get) return;
            Object.defineProperty(xhr, prop, {
              configurable: true,
              get: function () {
                var raw = baseDesc.get.call(this);
                if (this.readyState !== 4) return raw;
                if (this._lr_cached !== undefined) return this._lr_cached;
                var ct = this.getResponseHeader('Content-Type') || '';
                if (!/json/i.test(ct) || typeof raw !== 'string') {
                  this._lr_cached = raw;
                  return raw;
                }
                try {
                  var data = JSON.parse(raw);
                  if (sanitizeQIDOArray(data)) {
                    this._lr_cached = JSON.stringify(data);
                    console.log('[Medisync] QIDO XHR sanitizer scrubbed', data.length, 'entries');
                  } else {
                    this._lr_cached = raw;
                  }
                } catch (e) { this._lr_cached = raw; }
                return this._lr_cached;
              },
            });
          };
          define('responseText', rtDesc);
          define('response',     rDesc);
        }
      } catch (e) { /* swallow — don't break OHIF if the patch fails */ }
      return origOpen.apply(this, arguments);
    };
    console.log('[Medisync] QIDO XHR sanitizer installed');
  })();

  // ----- Display-set sanitizer -----
  // Some series carry no Modality / SeriesDescription (notably Secondary Capture
  // SOPClassUID 1.2.840.10008.5.1.4.1.1.7 — scout shots, dose reports). The
  // OHIF v3.8 StudyBrowser crashes on these with "Cannot read properties of
  // undefined (reading 'length')", which leaves the left-panel thumbnail dock
  // empty for the whole study. Patch each display set to guarantee Modality is
  // a string so the thumbnail render path survives.
  var SC_SOPCLASS = '1.2.840.10008.5.1.4.1.1.7';
  function sanitizeDisplaySet(ds) {
    if (!ds) return;
    if (!ds.Modality || typeof ds.Modality !== 'string') {
      var sop = (ds.images && ds.images[0] && ds.images[0].SOPClassUID) || ds.SOPClassUID || '';
      ds.Modality = (sop === SC_SOPCLASS) ? 'OT' : 'OT';
    }
    if (typeof ds.SeriesDescription !== 'string') {
      ds.SeriesDescription = ds.SeriesDescription || '';
    }
  }
  function patchDisplaySetService() {
    var dss = window.services && window.services.displaySetService;
    if (!dss || dss._medisyncPatched) return false;
    try {
      var orig = dss.getActiveDisplaySets && dss.getActiveDisplaySets.bind(dss);
      if (orig) {
        dss.getActiveDisplaySets = function () {
          var list = orig() || [];
          for (var i = 0; i < list.length; i++) sanitizeDisplaySet(list[i]);
          return list;
        };
      }
      // Also sanitize whatever's already in the service
      if (orig) (orig() || []).forEach(sanitizeDisplaySet);
      dss._medisyncPatched = true;
      console.log('[Medisync] displaySetService sanitizer installed');
      return true;
    } catch (e) {
      console.warn('[Medisync] displaySet patch failed', e);
      return false;
    }
  }

  // ----- GPU compatibility: Norm16 texture path for Intel UHD/Iris -----
  // Cornerstone3D defaults to Float32 R32F volume textures. On Intel UHD GPUs
  // running Chrome ANGLE/D3D11, the resulting vtk.js shader fails to compile
  // (vtkPolyDataVS error → null shader program → black viewports). Switching
  // to Norm16 (R16) textures uses a simpler shader path that compiles cleanly
  // on those drivers — and is faster + uses 50% less VRAM as a bonus. The GPU
  // probe must already report `EXT_texture_norm16: true` (true on all WebGL2
  // hardware shipped since 2018, including the affected Intel UHDs).
  var _norm16Patched = false;
  function patchCornerstoneConfig() {
    if (_norm16Patched) return true;
    var cs = window.cornerstone;
    if (!cs || !cs.getConfiguration || !cs.setConfiguration) return false;
    try {
      var cfg = cs.getConfiguration() || {};
      cfg.rendering = cfg.rendering || {};
      cfg.rendering.useNorm16Texture = true;
      cfg.rendering.preferSizeOverAccuracy = true;
      cs.setConfiguration(cfg);
      _norm16Patched = true;
      console.log('[Medisync] cornerstone3D: Norm16 textures enabled (Intel UHD compat + 50% VRAM)');
      return true;
    } catch (e) {
      console.warn('[Medisync] could not enable Norm16 textures', e);
      return false;
    }
  }

  // ----- Boot loop: poll until OHIF runtime is ready -----
  // `registerCustomTools` is idempotent and intentionally re-runs each tick so
  // newly-mounted ToolGroups (created lazily by OHIF) pick up our custom tools.
  // `buildTimelinePanel` + `refreshTimeline` are NOT idempotent in a useful
  // sense — building the panel twice is wasted DOM, and refresh fires a QIDO
  // network call. Previously both ran every 200ms for ~30s once OHIF was up,
  // which produced ~150 QIDO requests per page load (one per tick) and made
  // Orthanc cold-start latency painfully visible. Fix: gate one-shot init on
  // a flag and only re-run the truly per-tick work.
  var bootAttempts = 0;
  var oneShotDone = false;
  var bootTimer = setInterval(function () {
    bootAttempts++;
    var hasTools = window.cornerstoneTools && window.cornerstoneTools.addTool;
    var hasCmds  = window.commandsManager && window.commandsManager.registerCommand;
    // Norm16 patch is independent of tools/commands — apply ASAP, before any
    // viewport mounts.
    patchCornerstoneConfig();
    if (hasTools && hasCmds) {
      registerCustomTools();
      registerCustomCommands();
      if (!oneShotDone) {
        buildTimelinePanel();
        refreshTimeline();
        oneShotDone = true;
      }
      patchDisplaySetService();
      // Continue trying to attach tools to newly created toolGroups for ~30s
      if (bootAttempts > 150) clearInterval(bootTimer);
    } else if (bootAttempts > 200) {
      clearInterval(bootTimer);
    }
    // Re-attempt sanitizer install for ~10s — it depends on services being up,
    // which can land slightly after commandsManager.
    if (bootAttempts < 50) patchDisplaySetService();
  }, 200);

  // Refresh timeline whenever URL changes (study switch)
  var lastHref = location.href;
  setInterval(function () {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(refreshTimeline, 1500); // give OHIF time to load the new study
    }
  }, 1000);
})();

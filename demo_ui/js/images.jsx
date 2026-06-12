// images.jsx — procedural grayscale "scan-like" image generator (canvas).
// Draws abstract CT/MR cross-sections so viewports read as real medical images.
// Windowing (W/L), invert, rotate, flip are applied as cheap CSS filters/transform
// on top of a cached base raster, so dragging W/L feels instant.
(function () {
  // -- seeded PRNG + value noise -------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fillNoise(ctx, w, h, seed, alpha) {
    const rng = mulberry32(seed);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng() - 0.5) * alpha * 255;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  // soft radial blob
  function blob(ctx, x, y, rx, ry, inner, outer) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.beginPath(); ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function g(v) { return `rgb(${v},${v},${v})`; }

  // -- scene drawers --------------------------------------------------------
  function drawBrain(ctx, S, seed, plane) {
    const cx = S / 2, cy = S / 2;
    const rng = mulberry32(seed);
    // scalp / skull
    blob(ctx, cx, cy + 6, S * 0.40, S * 0.45, g(70), g(8));
    // skull bright ring
    ctx.save();
    ctx.lineWidth = S * 0.022; ctx.strokeStyle = g(225);
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, S * 0.375, S * 0.43, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = S * 0.012; ctx.strokeStyle = g(120);
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, S * 0.405, S * 0.46, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // brain tissue
    blob(ctx, cx, cy + 10, S * 0.33, S * 0.38, g(120), g(95));
    // gyri/sulci texture
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, S * 0.33, S * 0.38, 0, 0, Math.PI * 2); ctx.clip();
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 220; i++) {
      const a = rng() * Math.PI * 2, rr = rng() * S * 0.34;
      const x = cx + Math.cos(a) * rr * 0.9, y = cy + 10 + Math.sin(a) * rr;
      ctx.strokeStyle = g(60 + rng() * 70);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + (rng() - .5) * 30, y + (rng() - .5) * 30, x + (rng() - .5) * 40, y + (rng() - .5) * 40, x + (rng() - .5) * 24, y + (rng() - .5) * 24);
      ctx.stroke();
    }
    ctx.restore();
    // ventricles (dark butterfly)
    ctx.fillStyle = g(35);
    ctx.beginPath();
    ctx.ellipse(cx - S * 0.05, cy + 4, S * 0.05, S * 0.11, -0.25, 0, Math.PI * 2);
    ctx.ellipse(cx + S * 0.05, cy + 4, S * 0.05, S * 0.11, 0.25, 0, Math.PI * 2);
    ctx.fill();
    // midline
    ctx.strokeStyle = g(150); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.27); ctx.lineTo(cx, cy + S * 0.32); ctx.stroke();
  }

  function drawChest(ctx, S, seed, plane) {
    const cx = S / 2, cy = S / 2;
    const rng = mulberry32(seed);
    // body wall
    blob(ctx, cx, cy, S * 0.46, S * 0.40, g(95), g(10));
    // fat/skin ring
    ctx.save();
    ctx.lineWidth = S * 0.03; ctx.strokeStyle = g(130);
    ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.43, S * 0.37, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // lungs (dark)
    blob(ctx, cx - S * 0.20, cy - S * 0.02, S * 0.17, S * 0.27, g(14), g(40));
    blob(ctx, cx + S * 0.20, cy - S * 0.02, S * 0.17, S * 0.27, g(14), g(40));
    // vascular markings in lungs
    ctx.save();
    ctx.lineWidth = 1.2; ctx.strokeStyle = g(90);
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 26; i++) {
        const ox = cx + s * S * 0.20, oy = cy - S * 0.02;
        const a = rng() * Math.PI * 2, len = rng() * S * 0.14;
        ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len); ctx.stroke();
      }
    }
    ctx.restore();
    // mediastinum / heart
    blob(ctx, cx + S * 0.01, cy + S * 0.06, S * 0.13, S * 0.15, g(115), g(85));
    // spine (posterior bright vertebra)
    ctx.fillStyle = g(210);
    ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.28, S * 0.06, S * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g(60);
    ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.28, S * 0.028, S * 0.022, 0, 0, Math.PI * 2); ctx.fill();
    // transverse processes
    ctx.strokeStyle = g(190); ctx.lineWidth = S * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.04, cy + S * 0.30); ctx.lineTo(cx - S * 0.11, cy + S * 0.33);
    ctx.moveTo(cx + S * 0.04, cy + S * 0.30); ctx.lineTo(cx + S * 0.11, cy + S * 0.33);
    ctx.moveTo(cx, cy + S * 0.33); ctx.lineTo(cx, cy + S * 0.39);
    ctx.stroke();
    // ribs (bright arcs around)
    ctx.strokeStyle = g(215); ctx.lineWidth = S * 0.016;
    for (let s = -1; s <= 1; s += 2) {
      for (let k = 0; k < 4; k++) {
        const ang0 = s > 0 ? -0.4 : Math.PI + 0.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, S * (0.40 - k * 0.01), S * (0.34 - k * 0.01), 0, ang0 - 0.5, ang0 + 0.5 * s, s < 0);
        ctx.stroke();
      }
    }
  }

  // base raster cache keyed by scene+seed+plane
  const cache = new Map();
  function getBase(scene, seed, plane, S) {
    const key = scene + ":" + seed + ":" + plane;
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement("canvas");
    c.width = S; c.height = S;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, S, S);
    if (scene === "brain") drawBrain(ctx, S, seed, plane);
    else drawChest(ctx, S, seed, plane);
    fillNoise(ctx, S, S, seed + 7, 0.05);
    // vignette
    const vg = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);
    cache.set(key, c);
    return c;
  }

  // React component
  const { useRef, useEffect } = React;
  function DicomImage({ scene = "chest", slice = 0, plane = "axial", ww = 350, wc = 40, invert = false, rotate = 0, flipH = false, flipV = false, refWW = 350, style }) {
    const ref = useRef(null);
    const S = 512;
    useEffect(() => {
      const cv = ref.current; if (!cv) return;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, S, S);
      const base = getBase(scene, 1000 + slice * 13, plane, S);
      ctx.drawImage(base, 0, 0);
    }, [scene, slice, plane]);
    // windowing via filter: narrower window -> higher contrast; center -> brightness
    const contrast = Math.max(0.4, Math.min(2.6, refWW / Math.max(40, ww)));
    const brightness = Math.max(0.4, Math.min(2.0, 1 + (40 - wc) / 400));
    const filter = `contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})${invert ? " invert(1)" : ""}`;
    const transform = `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;
    return (
      <canvas ref={ref} width={S} height={S}
        style={{ width: "100%", height: "100%", objectFit: "contain", filter, transform, ...style }} />
    );
  }

  window.DicomImage = DicomImage;
})();

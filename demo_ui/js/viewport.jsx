// viewport.jsx — viewport grid w/ interactive tools, overlays, MPR cube, cine.
(function () {
  const { useState, useRef, useEffect, useCallback } = React;
  const Icon = window.Icon;
  const DicomImage = window.DicomImage;
  const D = window.PACS_DATA;

  const PLANE_LABEL = { axial: "AXIAL", sagittal: "SAGITTAL", coronal: "CORONAL", "3d": "VOLUME 3D" };
  const FOV_MM = 360;

  // anatomical orientation cube for MPR / 3D
  function OrientCube({ plane }) {
    return (
      <div className="vp-cube" title="Định hướng giải phẫu">
        <div className="vp-cube-box">
          <span className="cf cf-t">H</span><span className="cf cf-b">F</span>
          <span className="cf cf-l">R</span><span className="cf cf-r">L</span>
          <span className="cf cf-c">{plane === "3d" ? "3D" : plane[0].toUpperCase()}</span>
        </div>
      </div>
    );
  }

  function Measurement({ m, onRemove }) {
    const col = "#5acce6";
    if (m.type === "rectangle") {
      const x = Math.min(m.x1, m.x2), y = Math.min(m.y1, m.y2), w = Math.abs(m.x2 - m.x1), h = Math.abs(m.y2 - m.y1);
      return (
        <g>
          <rect x={x + "%"} y={y + "%"} width={w + "%"} height={h + "%"} fill="rgba(90,204,230,0.08)" stroke={col} strokeWidth="1.4" />
          <foreignObject x={x + "%"} y={(y) + "%"} width="120" height="40" style={{ overflow: "visible" }}>
            <div className="vp-mlabel">{m.val}</div>
          </foreignObject>
        </g>
      );
    }
    if (m.type === "ellipse") {
      const cx = (m.x1 + m.x2) / 2, cy = (m.y1 + m.y2) / 2, rx = Math.abs(m.x2 - m.x1) / 2, ry = Math.abs(m.y2 - m.y1) / 2;
      return (
        <g>
          <ellipse cx={cx + "%"} cy={cy + "%"} rx={rx + "%"} ry={ry + "%"} fill="rgba(90,204,230,0.08)" stroke={col} strokeWidth="1.4" />
          <foreignObject x={(cx - rx) + "%"} y={(cy - ry) + "%"} width="140" height="40" style={{ overflow: "visible" }}>
            <div className="vp-mlabel">{m.val}</div>
          </foreignObject>
        </g>
      );
    }
    if (m.type === "text") {
      return (
        <foreignObject x={m.x1 + "%"} y={m.y1 + "%"} width="160" height="30" style={{ overflow: "visible" }}>
          <div className="vp-mlabel vp-mtext">✎ Chú thích</div>
        </foreignObject>
      );
    }
    if (m.type === "probe") {
      return (
        <g>
          <circle cx={m.x1 + "%"} cy={m.y1 + "%"} r="3" fill={col} />
          <foreignObject x={m.x1 + "%"} y={m.y1 + "%"} width="120" height="30" style={{ overflow: "visible" }}>
            <div className="vp-mlabel">{m.val}</div>
          </foreignObject>
        </g>
      );
    }
    // line-based: length, bidirectional, angle
    return (
      <g>
        <line x1={m.x1 + "%"} y1={m.y1 + "%"} x2={m.x2 + "%"} y2={m.y2 + "%"} stroke={col} strokeWidth="1.6" />
        <circle cx={m.x1 + "%"} cy={m.y1 + "%"} r="2.5" fill={col} />
        <circle cx={m.x2 + "%"} cy={m.y2 + "%"} r="2.5" fill={col} />
        <foreignObject x={((m.x1 + m.x2) / 2) + "%"} y={((m.y1 + m.y2) / 2) + "%"} width="120" height="30" style={{ overflow: "visible" }}>
          <div className="vp-mlabel">{m.val}</div>
        </foreignObject>
      </g>
    );
  }

  function Cell({ cell, vm, isActive }) {
    const { series } = cell;
    const ref = useRef(null);
    const [view, setView] = useState({ zoom: 1, px: 0, py: 0, slice: series.thumbSlice });
    const [meas, setMeas] = useState([]);
    const [draft, setDraft] = useState(null);
    const [loupe, setLoupe] = useState(null);
    const drag = useRef(null);

    // cine
    useEffect(() => {
      if (!vm.toggles.cine || !isActive) return;
      const iv = setInterval(() => {
        setView((v) => ({ ...v, slice: (v.slice + 1) % series.images }));
      }, 1000 / vm.fps);
      return () => clearInterval(iv);
    }, [vm.toggles.cine, vm.fps, isActive, series.images]);

    // reset / erase / clear signals from toolbar
    useEffect(() => { if (vm.resetSignal) setView((v) => ({ ...v, zoom: 1, px: 0, py: 0 })); }, [vm.resetSignal]);
    useEffect(() => { if (vm.eraseSignal && isActive) setMeas((m) => m.slice(0, -1)); }, [vm.eraseSignal]);
    useEffect(() => { if (vm.clearSignal && isActive) setMeas([]); }, [vm.clearSignal]);
    // jump to series default slice when active series changes
    useEffect(() => { setView((v) => ({ ...v, slice: series.thumbSlice })); }, [series.id]);

    const rel = (e) => {
      const r = ref.current.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, r };
    };

    const measureTools = ["length", "bidirectional", "angle", "ellipse", "rectangle", "circleroi"];
    const onDown = (e) => {
      vm.setActiveCell(cell.idx);
      const p = rel(e);
      const t = vm.activeTool;
      if (t === "text") { setMeas((m) => [...m, { type: "text", x1: p.x, y1: p.y }]); return; }
      if (t === "probe") {
        const hu = Math.round(-50 + Math.random() * 120);
        setMeas((m) => [...m, { type: "probe", x1: p.x, y1: p.y, val: hu + " HU" }]); return;
      }
      drag.current = { t, x0: p.x, y0: p.y, sx: e.clientX, sy: e.clientY, v0: { ...view }, wl0: { ...vm.wl } };
      if (measureTools.includes(t)) setDraft({ type: t === "circleroi" ? "ellipse" : t, x1: p.x, y1: p.y, x2: p.x, y2: p.y, val: "" });
    };
    const onMove = (e) => {
      const p = rel(e);
      if (vm.activeTool === "magnify") setLoupe({ x: p.x, y: p.y });
      const dr = drag.current;
      if (!dr) return;
      const dx = e.clientX - dr.sx, dy = e.clientY - dr.sy;
      if (dr.t === "wl") {
        vm.setWL({ ww: Math.max(1, Math.round(dr.wl0.ww + dx * 3)), wc: Math.round(dr.wl0.wc - dy * 2), presetKey: null });
      } else if (dr.t === "zoom") {
        setView((v) => ({ ...v, zoom: Math.max(0.3, Math.min(8, dr.v0.zoom - dy * 0.005)) }));
      } else if (dr.t === "pan") {
        setView((v) => ({ ...v, px: dr.v0.px + dx, py: dr.v0.py + dy }));
      } else if (dr.t === "scroll") {
        const ns = Math.max(0, Math.min(series.images - 1, Math.round(dr.v0.slice + dy * 0.3)));
        setView((v) => ({ ...v, slice: ns }));
      } else if (measureTools.includes(dr.t)) {
        setDraft((d) => {
          if (!d) return d;
          const nd = { ...d, x2: p.x, y2: p.y };
          nd.val = computeVal(nd);
          return nd;
        });
      }
    };
    const onUp = () => {
      if (draft && Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 1.5) {
        setMeas((m) => [...m, draft]);
      }
      setDraft(null); drag.current = null;
    };
    const onWheel = (e) => {
      e.preventDefault();
      setView((v) => ({ ...v, slice: Math.max(0, Math.min(series.images - 1, v.slice + (e.deltaY > 0 ? 1 : -1))) }));
      vm.setActiveCell(cell.idx);
    };

    function computeVal(d) {
      const dxmm = (d.x2 - d.x1) / 100 * FOV_MM / view.zoom;
      const dymm = (d.y2 - d.y1) / 100 * FOV_MM / view.zoom;
      if (d.type === "length" || d.type === "bidirectional") return Math.hypot(dxmm, dymm).toFixed(1) + " mm";
      if (d.type === "angle") return (Math.abs(Math.atan2(dymm, dxmm) * 180 / Math.PI)).toFixed(1) + "°";
      if (d.type === "rectangle") return Math.abs(dxmm).toFixed(0) + "×" + Math.abs(dymm).toFixed(0) + " mm · " + Math.round(-30 + Math.random() * 80) + " HU";
      if (d.type === "ellipse") return "Ø " + Math.abs(dxmm).toFixed(0) + " mm · " + Math.round(-30 + Math.random() * 80) + " HU";
      return "";
    }

    const cur = { wl: "ns-resize", pan: "grab", zoom: "ns-resize", scroll: "ns-resize", magnify: "none", crosshair: "crosshair" }[vm.activeTool] || "crosshair";
    const slicePct = series.images > 1 ? (view.slice / (series.images - 1)) * 100 : 0;
    const keyed = vm.keyed.has(cell.series.id);

    return (
      <div
        ref={ref}
        className={"vp" + (isActive ? " is-active" : "")}
        style={{ cursor: cur }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => { onUp(); setLoupe(null); }}
        onWheel={onWheel}
        onDoubleClick={() => setView({ zoom: 1, px: 0, py: 0, slice: view.slice })}>

        <div className="vp-img" style={{ transform: `translate(${view.px}px,${view.py}px) scale(${view.zoom})` }}>
          <DicomImage scene={series.scene} slice={view.slice} plane={cell.plane}
            ww={vm.wl.ww} wc={vm.wl.wc} refWW={400}
            invert={vm.toggles.invert} rotate={vm.rotate} flipH={vm.toggles.flipH} flipV={vm.toggles.flipV} />
        </div>

        {/* measurement overlay */}
        <svg className="vp-svg" preserveAspectRatio="none">
          {meas.map((m, i) => <Measurement key={i} m={m} />)}
          {draft ? <Measurement m={draft} /> : null}
        </svg>

        {/* magnify loupe */}
        {loupe && vm.activeTool === "magnify" ? (
          <div className="vp-loupe" style={{ left: loupe.x + "%", top: loupe.y + "%" }}>
            <div className="vp-loupe-inner" style={{ transform: `translate(${-loupe.x * 2 + 50}%, ${-loupe.y * 2 + 50}%) scale(2.4)` }}>
              <DicomImage scene={series.scene} slice={view.slice} plane={cell.plane} ww={vm.wl.ww} wc={vm.wl.wc} refWW={400} invert={vm.toggles.invert} />
            </div>
          </div>
        ) : null}

        {/* corner overlays */}
        {!vm.toggles.hideInfo ? (
          <div className="vp-overlay" style={{ opacity: vm.overlayDim / 100 }}>
            <div className="vp-ov tl">
              <div className="vp-ovstrong">{vm.isAnon ? "ẨN DANH" : D.PATIENT.name}</div>
              <div>{vm.isAnon ? "•••••••••" : D.PATIENT.id} · {D.PATIENT.sex} · {D.PATIENT.age}T</div>
              <div className="mono">{D.STUDY.accession}</div>
            </div>
            <div className="vp-ov tr">
              <div className="vp-ovstrong">{D.STUDY.institution}</div>
              <div>{D.STUDY.desc}</div>
              <div className="mono">{D.STUDY.date} {D.STUDY.time}</div>
            </div>
            <div className="vp-ov bl mono">
              <div>Loạt {series.no} · {PLANE_LABEL[cell.plane] || "AXIAL"}</div>
              <div>Ảnh {view.slice + 1}/{series.images}</div>
              <div className="vp-accent">W {vm.wl.ww} · L {vm.wl.wc}</div>
            </div>
            <div className="vp-ov br mono">
              <div>{D.STUDY.modality} · {series.modality}</div>
              <div>{D.STUDY.kvp} kVp · {D.STUDY.mAs} mAs</div>
              <div>{D.STUDY.thickness} mm · Zoom {view.zoom.toFixed(1)}×</div>
            </div>
          </div>
        ) : null}

        {/* ruler */}
        {vm.toggles.ruler ? <div className="vp-ruler"><span /><span /><span /><span /><span /><em>5 cm</em></div> : null}

        {/* plane chip + cube for MPR/3D */}
        {(vm.mode === "MPR" || vm.layout === "mpr" || vm.mode === "3D") ? (
          <>
            <div className="vp-planechip">{PLANE_LABEL[cell.plane] || "AXIAL"}</div>
            {(cell.plane === "3d" || vm.mode === "3D") ? <OrientCube plane={cell.plane} /> : null}
          </>
        ) : null}

        {keyed ? <div className="vp-keymark"><Icon name="starFill" size={14} /> KEY</div> : null}

        {/* scrollbar */}
        {series.images > 1 ? (
          <div className="vp-scrollbar"><div className="vp-scrollthumb" style={{ top: `calc(${slicePct}% - 14px)` }} /></div>
        ) : null}

        {isActive ? <div className="vp-activeborder" /> : null}
      </div>
    );
  }

  function ViewportGrid({ vm }) {
    const layout = D.LAYOUTS.find((l) => l.id === vm.layout) || D.LAYOUTS[0];
    const series = D.SERIES.find((s) => s.id === vm.activeSeries) || D.SERIES[1];
    const isMPR = layout.mpr || vm.mode === "MPR";
    const planes = ["axial", "sagittal", "coronal", "3d"];
    const cells = [];
    for (let i = 0; i < layout.cells; i++) {
      cells.push({
        idx: i, key: series.id + "-c" + i,
        series: isMPR ? { ...series, plane: planes[i] } : series,
        plane: isMPR ? planes[i] : (vm.mode === "3D" ? "3d" : series.plane),
      });
    }
    return (
      <div className="vpgrid" style={{ gridTemplateColumns: `repeat(${layout.cols},1fr)`, gridTemplateRows: `repeat(${layout.rows},1fr)` }}>
        {cells.map((c) => <Cell key={c.key} cell={c} vm={vm} isActive={vm.activeCell === c.idx} />)}
        {vm.loading ? (
          <div className="vp-loadbar">
            <div className="vp-loadtitle">Đang tải loạt ảnh… {vm.loadPct}%</div>
            <div className="vp-loadtrack"><div className="vp-loadfill" style={{ width: vm.loadPct + "%" }} /></div>
            <div className="vp-loadsub mono">WADO-RS · 6 web workers · stream {series.images} ảnh</div>
          </div>
        ) : null}
      </div>
    );
  }

  window.ViewportGrid = ViewportGrid;
})();

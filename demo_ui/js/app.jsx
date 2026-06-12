// app.jsx — main App: state, view-model, keyboard shortcuts, modals, tweaks.
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const Icon = window.Icon;
  const D = window.PACS_DATA;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "railMode": "top",
    "rightMode": "docked",
    "density": "regular",
    "accent": "#5acce6",
    "showOverlay": true,
    "panelSide": "left"
  }/*EDITMODE-END*/;

  // hotkey map -> tool id / action
  const HOTKEYS = {
    w: "wl", p: "pan", z: "zoom", s: "scroll", m: "magnify", q: "crosshair",
    l: "length", a: "angle", b: "bidirectional", e: "ellipse", r: "rectangle", o: "circleroi", t: "text",
    "1": "invert", "X": "probe",
  };

  function App() {
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

    const [mode, setMode] = useState("2D");
    const [activeTool, setActiveTool] = useState("wl");
    const [toggles, setToggles] = useState({ invert: false, flipH: false, flipV: false, sync: true, cine: false, key: false, anon: false, hideInfo: false, ruler: false });
    const [wl, setWLState] = useState({ ww: 400, wc: 40, presetKey: "soft" });
    const [layout, setLayout] = useState("1x1");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [ddPos, setDdPos] = useState(null);
    const [overflowTools, setOverflowTools] = useState([]);
    const [activeSeries, setActiveSeries] = useState("s2");
    const [activeCell, setActiveCell] = useState(0);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [priorsOpen, setPriorsOpen] = useState(false);
    const [customize, setCustomize] = useState(false);
    const [pinned, setPinned] = useState({});
    const [rotate, setRotate] = useState(0);
    const [slab, setSlab] = useState(3);
    const [blend, setBlend] = useState("MIP");
    const [fps, setFps] = useState(18);
    const [overlayDim, setOverlayDim] = useState(90);
    const [crosshairRef, setCrosshairRef] = useState(true);
    const [keyed, setKeyed] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [loadPct, setLoadPct] = useState(0);
    const [tagsOpen, setTagsOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [resetSignal, setResetSignal] = useState(0);
    const [eraseSignal, setEraseSignal] = useState(0);
    const [clearSignal, setClearSignal] = useState(0);

    const toastTimer = useRef(null);
    const toast = useCallback((msg) => {
      setToastMsg(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
    }, []);

    const setWL = useCallback((patch) => setWLState((w) => ({ ...w, ...patch })), []);
    const onToggle = (k) => setToggles((s) => ({ ...s, [k]: !s[k] }));

    const closeDD = () => { setOpenDropdown(null); setDdPos(null); };
    const posFromEvent = (e) => {
      if (!e || !e.currentTarget) return null;
      const r = e.currentTarget.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - 290);
      return { left: Math.max(8, left), top: r.bottom + 6 };
    };
    const onDropdown = (id, e) => {
      if (e) e.stopPropagation();
      if (openDropdown === id) { closeDD(); return; }
      setDdPos(posFromEvent(e)); setOpenDropdown(id);
    };

    const onPreset = (p) => { setWL({ ww: p.ww, wc: p.wc, presetKey: p.key }); closeDD(); toast("Cửa sổ: " + p.label + " (" + p.ww + "/" + p.wc + ")"); };

    const simulateLoad = useCallback((images) => {
      if (images < 200) return;
      setLoading(true); setLoadPct(0);
      let pct = 0;
      const iv = setInterval(() => {
        pct += Math.random() * 16 + 6;
        if (pct >= 100) { pct = 100; clearInterval(iv); setTimeout(() => setLoading(false), 350); }
        setLoadPct(Math.round(pct));
      }, 90);
    }, []);

    const onSeries = (s) => { setActiveSeries(s.id); simulateLoad(s.images); };

    const onMode = (m) => {
      setMode(m); closeDD();
      if (m === "MPR") setLayout("mpr");
      else if (m === "3D") setLayout("1x1");
      else setLayout("1x1");
    };
    const onLayout = (l) => { setLayout(l.id); if (l.mpr) setMode("MPR"); closeDD(); };

    const doAction = (id) => {
      if (id === "reset") { setRotate(0); setToggles((s) => ({ ...s, flipH: false, flipV: false })); setResetSignal((n) => n + 1); toast("Đã đặt lại viewport"); }
      else if (id === "rotateLeft") setRotate((r) => r - 90);
      else if (id === "rotateRight") setRotate((r) => r + 90);
      else if (id === "eraser") { setEraseSignal((n) => n + 1); toast("Đã xoá phép đo cuối"); }
      else if (id === "clearall") { setClearSignal((n) => n + 1); toast("Đã xoá tất cả phép đo"); }
      else if (id === "capture") toast("Đã chụp ảnh viewport → clipboard");
    };

    const onTool = (tool, e) => {
      if (e) e.stopPropagation();
      if (tool.mode) { setActiveTool(tool.id); closeDD(); }
      else if (tool.toggle) {
        if (tool.id === "key") {
          setKeyed((set) => { const n = new Set(set); n.has(activeSeries) ? n.delete(activeSeries) : n.add(activeSeries); return n; });
          toast("Key Image — loạt " + (D.SERIES.find((s) => s.id === activeSeries)?.no));
        }
        onToggle(tool.id); closeDD();
      }
      else if (tool.dropdown) onDropdown(tool.dropdown, e);
      else if (tool.action) { doAction(tool.id); closeDD(); }
    };
    const onSpecialty = (sp) => { setActiveTool(sp.id); closeDD(); toast("Công cụ: " + sp.label); };
    const onOverflow = (gkey, hidden, e) => { if (e) e.stopPropagation(); setOverflowTools(hidden); setDdPos(posFromEvent(e)); setOpenDropdown("overflow"); };
    const togglePin = (id) => setPinned((p) => ({ ...p, [id]: p[id] === false ? true : false }));
    const openTags = () => { setTagsOpen(true); closeDD(); };

    // keyboard shortcuts
    useEffect(() => {
      const onKey = (ev) => {
        if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
        const k = ev.key;
        if (k === "Escape") { closeDD(); setTagsOpen(false); setCustomize(false); return; }
        if (ev.shiftKey) {
          const map = { S: () => onToggle("sync"), P: () => onToggle("cine"), X: () => setActiveTool("probe"), C: () => onSpecialty(D.SPECIALTY_TOOLS[1]), V: () => onSpecialty(D.SPECIALTY_TOOLS[2]), B: () => onSpecialty(D.SPECIALTY_TOOLS[3]), K: () => onSpecialty(D.SPECIALTY_TOOLS[4]) };
          const f = map[k.toUpperCase()];
          if (f) { ev.preventDefault(); f(); }
          return;
        }
        const lower = k.toLowerCase();
        if (["2", "3", "4", "5", "6"].includes(k)) {
          const p = D.WL_PRESETS.find((x) => x.hot === k); if (p) { ev.preventDefault(); onPreset(p); } return;
        }
        if (k === "1") { ev.preventDefault(); onToggle("invert"); return; }
        const tool = HOTKEYS[lower];
        if (tool) { ev.preventDefault(); ["invert"].includes(tool) ? onToggle(tool) : setActiveTool(tool); }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [activeSeries]);

    // apply accent + density tweaks
    useEffect(() => {
      const root = document.documentElement;
      root.style.setProperty("--accent", t.accent);
      root.setAttribute("data-density", t.density);
      root.setAttribute("data-rail", t.railMode);
    }, [t.accent, t.density, t.railMode]);

    useEffect(() => { setToggles((s) => ({ ...s, hideInfo: !t.showOverlay })); }, [t.showOverlay]);

    const isMammo = false;
    const isAnon = toggles.anon;
    const series = D.SERIES.find((s) => s.id === activeSeries) || D.SERIES[1];

    const vm = {
      mode, onMode, activeTool, setActiveTool, toggles, onToggle, wl, setWL, onPreset,
      layout, onLayout, openDropdown, onDropdown, ddPos, overflowTools, onOverflow,
      activeSeries, onSeries, activeCell, setActiveCell, leftCollapsed, setLeftCollapsed,
      priorsOpen, togglePriors: () => setPriorsOpen((v) => !v), customize, toggleCustomize: () => setCustomize((v) => !v),
      pinned, togglePin, rotate, slab, setSlab, blend, setBlend, fps, setFps, overlayDim, setOverlayDim,
      crosshairRef, toggleCrosshairRef: () => setCrosshairRef((v) => !v), keyed, loading, loadPct,
      onTool, onSpecialty, openTags, toast, isMammo, isAnon, railMode: t.railMode,
      rightMode: t.rightMode, setRightMode: (m) => setTweak("rightMode", m),
      resetSignal, eraseSignal, clearSignal,
    };

    const rightFloatingClosed = t.rightMode === "hidden";

    return (
      <div className={"app side-" + t.panelSide} data-rail={t.railMode} onClick={closeDD}>
        <window.Toolbar vm={vm} />
        <div className="stage">
          <window.LeftPanel vm={vm} />
          <main className="center">
            <window.ViewportGrid vm={vm} />
            <window.PriorsPanel vm={vm} />
            {/* floating reopen handle for right panel */}
            {rightFloatingClosed ? (
              <button className="sb-reopen" onClick={() => setTweak("rightMode", "floating")} title="Mở bảng điều khiển">
                <Icon name="sliders" size={18} />
              </button>
            ) : null}
          </main>
          <window.RightSidebar vm={vm} />
        </div>

        {/* DICOM tags modal */}
        {tagsOpen ? (
          <div className="modal-backdrop" onClick={() => setTagsOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head"><span><Icon name="tags" size={16} /> DICOM TAGS</span><button onClick={() => setTagsOpen(false)}><Icon name="close" size={16} /></button></div>
              <div className="modal-body">
                <table className="tags">
                  <thead><tr><th>Tag</th><th>Mô tả</th><th>Giá trị</th></tr></thead>
                  <tbody>
                    {D.DICOM_TAGS.map((row, i) => (
                      <tr key={i}><td className="mono">{row[0]}</td><td>{row[1]}</td><td className="mono">{isAnon && i < 2 ? "•••••••" : row[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* toast */}
        {toastMsg ? <div className="toast">{toastMsg}</div> : null}

        <Tweaks t={t} setTweak={setTweak} />
      </div>
    );
  }

  function Tweaks({ t, setTweak }) {
    const { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } = window;
    return (
      <TweaksPanel>
        <TweakSection label="Bố cục thanh công cụ" />
        <TweakRadio label="Kiểu rail" value={t.railMode} options={["top", "left", "hybrid"]} onChange={(v) => setTweak("railMode", v)} />
        <TweakSection label="Bảng điều khiển phải" />
        <TweakRadio label="Chế độ" value={t.rightMode} options={["docked", "floating", "hidden"]} onChange={(v) => setTweak("rightMode", v)} />
        <TweakRadio label="Panel loạt ảnh" value={t.panelSide} options={["left", "right"]} onChange={(v) => setTweak("panelSide", v)} />
        <TweakSection label="Mật độ & màu" />
        <TweakRadio label="Mật độ" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakColor label="Màu nhấn" value={t.accent} options={["#5acce6", "#38bdf8", "#34d399", "#a78bfa"]} onChange={(v) => setTweak("accent", v)} />
        <TweakToggle label="Overlay thông tin mặc định" value={t.showOverlay} onChange={(v) => setTweak("showOverlay", v)} />
      </TweaksPanel>
    );
  }

  window.PACSApp = App;
})();

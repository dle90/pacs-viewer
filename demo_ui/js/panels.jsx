// panels.jsx — left series panel, right contextual sidebar, prior-studies panel.
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const DicomImage = window.DicomImage;
  const D = window.PACS_DATA;

  // ---- LEFT: study / series with thumbnails -------------------------------
  function LeftPanel({ vm }) {
    if (vm.leftCollapsed) {
      return (
        <div className="lp lp-collapsed">
          <button className="lp-expand" onClick={() => vm.setLeftCollapsed(false)} title="Mở danh sách loạt">
            <Icon name="chevronRight" size={18} />
          </button>
          <div className="lp-collabel">LOẠT ẢNH</div>
        </div>
      );
    }
    return (
      <aside className="lp">
        <div className="lp-head">
          <div className="lp-headtitle"><Icon name="layers" size={15} /> LOẠT ẢNH</div>
          <button className="lp-collapse" onClick={() => vm.setLeftCollapsed(true)} title="Thu gọn">
            <Icon name="chevronLeft" size={16} />
          </button>
        </div>
        <div className="lp-studymeta">
          <span className="lp-patient">{vm.isAnon ? "ẨN DANH BỆNH NHÂN" : D.PATIENT.name} <span className="lp-pmeta">{D.PATIENT.sex} · {D.PATIENT.age}T</span></span>
          <span className="lp-modtag">{D.STUDY.modality}</span>
          <span className="lp-studydesc">{D.STUDY.desc}</span>
          <span className="lp-studydate">{D.STUDY.date} · {D.SERIES.length} loạt</span>
        </div>
        <div className="lp-list">
          {D.SERIES.map((s) => (
            <button key={s.id} className={"lp-series" + (vm.activeSeries === s.id ? " sel" : "")} onClick={() => vm.onSeries(s)}>
              <div className="lp-thumb">
                <DicomImage scene={s.scene} slice={s.thumbSlice} plane={s.plane} ww={s.scene === "brain" ? 80 : 400} wc={40} />
                <span className="lp-thumbno">{s.images}</span>
                {vm.keyed.has(s.id) ? <span className="lp-thumbkey"><Icon name="starFill" size={11} /></span> : null}
              </div>
              <div className="lp-sinfo">
                <div className="lp-sno">Loạt {s.no} <span className="lp-smod">{s.modality}</span></div>
                <div className="lp-sdesc">{s.desc}</div>
                <div className="lp-scount mono">{s.images} ảnh · {s.plane}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="lp-priorbtn" onClick={vm.togglePriors}>
          <Icon name="clock" size={15} /> CA CHỤP CŨ
          <span className="lp-priorcount">{D.PRIORS.length}</span>
        </button>
      </aside>
    );
  }

  // ---- RIGHT: contextual sidebar -----------------------------------------
  function Section({ title, icon, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className={"sb-sec" + (open ? "" : " closed")}>
        <button className="sb-sechead" onClick={() => setOpen(!open)}>
          <span>{icon ? <Icon name={icon} size={14} /> : null} {title}</span>
          <Icon name={open ? "chevronUp" : "chevronDown"} size={14} />
        </button>
        {open ? <div className="sb-secbody">{children}</div> : null}
      </div>
    );
  }

  function Slider({ label, value, min, max, step = 1, unit = "", onChange }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div className="sb-slider">
        <div className="sb-slabel"><span>{label}</span><span className="mono">{value}{unit}</span></div>
        <input type="range" min={min} max={max} step={step} value={value}
          style={{ "--pct": pct + "%" }}
          onChange={(e) => onChange(parseFloat(e.target.value))} />
      </div>
    );
  }

  function RightSidebar({ vm }) {
    if (vm.rightMode === "hidden") return null;
    const floating = vm.rightMode === "floating";
    return (
      <aside className={"sb" + (floating ? " sb-floating" : "")}>
        <div className="sb-head">
          <span><Icon name="sliders" size={15} /> ĐIỀU KHIỂN</span>
          {floating ? <button className="sb-x" onClick={() => vm.setRightMode("hidden")}><Icon name="close" size={14} /></button> : null}
        </div>
        <div className="sb-scroll">
          <Section title="CỬA SỔ (W/L)" icon="windowlevel">
            <div className="sb-pills">
              {D.WL_PRESETS.map((p) => (
                <button key={p.key} className={"sb-pill" + (vm.wl.presetKey === p.key ? " sel" : "")} onClick={() => vm.onPreset(p)}>
                  {p.label}
                </button>
              ))}
            </div>
            <Slider label="Width" value={vm.wl.ww} min={1} max={2000} onChange={(v) => vm.setWL({ ww: v })} />
            <Slider label="Center" value={vm.wl.wc} min={-1000} max={1000} onChange={(v) => vm.setWL({ wc: v })} />
          </Section>

          <Section title="BỐ CỤC" icon="layout4">
            <div className="sb-laygrid">
              {D.LAYOUTS.map((l) => (
                <button key={l.id} className={"sb-lay" + (vm.layout === l.id ? " sel" : "")} onClick={() => vm.onLayout(l)} title={l.label}>
                  <Icon name={l.icon} size={22} />
                </button>
              ))}
            </div>
          </Section>

          {vm.mode === "MPR" || vm.layout === "mpr" ? (
            <Section title="MPR / THỂ TÍCH" icon="cube3d">
              <Slider label="Slab" value={vm.slab} min={0.5} max={20} step={0.5} unit=" mm" onChange={vm.setSlab} />
              <div className="sb-radio">
                {["MIP", "MinIP", "Average"].map((b) => (
                  <button key={b} className={"sb-rb" + (vm.blend === b ? " sel" : "")} onClick={() => vm.setBlend(b)}>{b}</button>
                ))}
              </div>
              <label className="sb-check"><input type="checkbox" checked={vm.toggles.crosshair === undefined ? false : vm.crosshairRef} onChange={vm.toggleCrosshairRef} /> Tham chiếu chéo (3D cursor)</label>
            </Section>
          ) : null}

          <Section title="CINE" icon="cine" defaultOpen={vm.toggles.cine}>
            <div className="sb-cine">
              <button className="sb-cinebtn" onClick={() => vm.onToggle("cine")}>
                <Icon name={vm.toggles.cine ? "pause" : "cine"} size={18} /> {vm.toggles.cine ? "Tạm dừng" : "Phát"}
              </button>
              <Slider label="Tốc độ (fps)" value={vm.fps} min={1} max={60} onChange={vm.setFps} />
            </div>
          </Section>

          <Section title="HIỂN THỊ" icon="eye">
            <label className="sb-check"><input type="checkbox" checked={vm.toggles.invert} onChange={() => vm.onToggle("invert")} /> Đảo màu (Invert)</label>
            <label className="sb-check"><input type="checkbox" checked={!vm.toggles.hideInfo} onChange={() => vm.onToggle("hideInfo")} /> Overlay thông tin</label>
            <label className="sb-check"><input type="checkbox" checked={vm.toggles.ruler} onChange={() => vm.onToggle("ruler")} /> Thước tỷ lệ</label>
            <label className="sb-check"><input type="checkbox" checked={vm.toggles.anon} onChange={() => vm.onToggle("anon")} /> Ẩn danh bệnh nhân</label>
            <Slider label="Độ sáng" value={vm.overlayDim} min={20} max={100} unit="%" onChange={vm.setOverlayDim} />
          </Section>
        </div>
      </aside>
    );
  }

  // ---- PRIOR STUDIES timeline --------------------------------------------
  function PriorsPanel({ vm }) {
    if (!vm.priorsOpen) return null;
    return (
      <div className="pr" onClick={(e) => e.stopPropagation()}>
        <div className="pr-head">
          <span><Icon name="clock" size={15} /> CA CHỤP CŨ</span>
          <button className="pr-x" onClick={vm.togglePriors}><Icon name="close" size={15} /></button>
        </div>
        <div className="pr-sub">{vm.isAnon ? "•••••" : D.PATIENT.name} · {D.PATIENT.id}</div>
        <div className="pr-list">
          <div className="pr-item pr-current">
            <div className="pr-dot" />
            <div className="pr-body">
              <div className="pr-date">{D.STUDY.date} <span className="pr-now">CA HIỆN TẠI</span></div>
              <div className="pr-desc"><span className="pr-mod">{D.STUDY.modality}</span> {D.STUDY.desc}</div>
            </div>
          </div>
          {D.PRIORS.map((p, i) => (
            <a key={i} className="pr-item" href="#" target="_blank" onClick={(e) => { e.preventDefault(); vm.toast("Mở ca cũ ở tab mới: " + p.date); }}>
              <div className="pr-dot" />
              <div className="pr-body">
                <div className="pr-date">{p.date}</div>
                <div className="pr-desc"><span className="pr-mod">{p.modality}</span> {p.desc}</div>
                <div className="pr-meta mono">{p.series} loạt · mở tab mới ↗</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  window.LeftPanel = LeftPanel;
  window.RightSidebar = RightSidebar;
  window.PriorsPanel = PriorsPanel;
})();

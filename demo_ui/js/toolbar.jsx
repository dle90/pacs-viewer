// toolbar.jsx — top toolbar: logo, mode tabs, grouped icon tools w/ tooltips,
// dropdowns, and a customize (pin/unpin) mode. Reads window.PACS_DATA.
(function () {
  const { useState, useRef, useEffect } = React;
  const Icon = window.Icon;
  const D = window.PACS_DATA;

  function Tip({ label, hot, children, side = "bottom" }) {
    return (
      <span className="tb-tipwrap">
        {children}
        <span className={"tb-tip tb-tip-" + side}>
          {label}{hot ? <kbd className="tb-kbd">{hot}</kbd> : null}
        </span>
      </span>
    );
  }

  function ToolBtn({ tool, vm }) {
    const active =
      (tool.mode && vm.activeTool === tool.id) ||
      (tool.toggle && vm.toggles[tool.id]) ||
      (tool.dropdown && vm.openDropdown === tool.dropdown);
    const onClick = (e) => vm.onTool(tool, e);
    return (
      <Tip label={tool.label} hot={tool.hot}>
        <button
          className={"tb-btn" + (active ? " is-active" : "") + (vm.customize ? " is-cust" : "")}
          onClick={onClick}
          data-id={tool.id}>
          <Icon name={tool.id === "key" && vm.toggles.key ? "starFill" : tool.icon} size={18} />
          {tool.dropdown ? <span className="tb-caret"><Icon name="chevronDown" size={12} /></span> : null}
          {vm.customize ? (
            <span
              className={"tb-pin" + (vm.pinned[tool.id] === false ? " off" : "")}
              onClick={(e) => { e.stopPropagation(); vm.togglePin(tool.id); }}>
              <Icon name="pin" size={11} />
            </span>
          ) : null}
        </button>
      </Tip>
    );
  }

  function Group({ gkey, group, vm }) {
    const visible = group.tools.filter((t) => vm.pinned[t.id] !== false);
    const hidden = group.tools.filter((t) => vm.pinned[t.id] === false);
    const shown = vm.customize ? group.tools : visible;
    return (
      <div className="tb-group" data-group={gkey}>
        <div className="tb-grow">
          {shown.map((t) => <ToolBtn key={t.id} tool={t} vm={vm} />)}
          {!vm.customize && hidden.length ? (
            <Tip label={"Thêm công cụ (" + hidden.length + ")"}>
              <button className="tb-btn tb-more" onClick={(e) => vm.onOverflow(gkey, hidden, e)}>
                <Icon name="menu" size={18} />
              </button>
            </Tip>
          ) : null}
        </div>
        <div className="tb-glabel">{group.label}</div>
      </div>
    );
  }

  function Dropdown({ vm }) {
    const open = vm.openDropdown;
    if (!open) return null;
    let body = null, title = "";
    if (open === "overflow") {
      title = "Công cụ khác";
      body = (
        <div className="dd-list">
          {(vm.overflowTools || []).map((t) => (
            <button key={t.id} className="dd-item" onClick={() => vm.onTool(t)}>
              <span><Icon name={t.icon} size={15} /> {t.label}</span>
              {t.hot ? <kbd className="tb-kbd sm">{t.hot}</kbd> : null}
            </button>
          ))}
        </div>
      );
    } else if (open === "wlpresets") {
      title = "Cửa sổ W/L";
      body = (
        <div className="dd-list">
          {D.WL_PRESETS.map((p) => (
            <button key={p.key} className={"dd-item" + (vm.wl.presetKey === p.key ? " sel" : "")} onClick={() => vm.onPreset(p)}>
              <span>{p.label}</span>
              <span className="dd-meta mono">{p.ww}/{p.wc}{p.hot ? <kbd className="tb-kbd sm">{p.hot}</kbd> : null}</span>
            </button>
          ))}
        </div>
      );
    } else if (open === "specialty") {
      title = "Công cụ chuyên biệt";
      body = (
        <div className="dd-list">
          {D.SPECIALTY_TOOLS.map((t) => (
            <button key={t.id} className={"dd-item" + (vm.activeTool === t.id ? " sel" : "")} onClick={() => vm.onSpecialty(t)}>
              <span>{t.label}</span>{t.hot ? <kbd className="tb-kbd sm">{t.hot}</kbd> : null}
            </button>
          ))}
        </div>
      );
    } else if (open === "layout") {
      title = "Bố cục lưới";
      body = (
        <div className="dd-grid">
          {D.LAYOUTS.map((l) => (
            <button key={l.id} className={"dd-lay" + (vm.layout === l.id ? " sel" : "")} onClick={() => vm.onLayout(l)}>
              <Icon name={l.icon} size={26} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      );
    } else if (open === "save") {
      title = "Lưu / Tải xuống";
      body = (
        <div className="dd-list">
          {D.SAVE_OPTS.map((grp) => (
            <div key={grp.group} className="dd-sub">
              <div className="dd-subhead">{grp.group}</div>
              {grp.items.map((it) => (
                <button key={it} className="dd-item" onClick={() => vm.toast("Đang chuẩn bị: " + grp.group + " — " + it)}>
                  <span>{it}</span><Icon name="download" size={15} />
                </button>
              ))}
            </div>
          ))}
        </div>
      );
    } else if (open === "info") {
      title = "Thông tin & dữ liệu";
      body = (
        <div className="dd-list">
          <button className="dd-item" onClick={() => { vm.openTags(); }}>
            <span><Icon name="tags" size={15} /> Xem DICOM Tags</span>
          </button>
          <button className={"dd-item" + (vm.toggles.hideInfo ? " sel" : "")} onClick={() => vm.onToggle("hideInfo")}>
            <span><Icon name={vm.toggles.hideInfo ? "eyeOff" : "eye"} size={15} /> {vm.toggles.hideInfo ? "Hiện" : "Ẩn"} thông tin BN</span>
          </button>
          <button className={"dd-item" + (vm.toggles.anon ? " sel" : "")} onClick={() => vm.onToggle("anon")}>
            <span><Icon name="anon" size={15} /> Ẩn danh (làm mờ BN)</span>
          </button>
        </div>
      );
    }
    const pos = vm.ddPos || { left: 80, top: 96 };
    return (
      <div className="dd-panel" style={{ left: pos.left, top: pos.top }} onClick={(e) => e.stopPropagation()}>
        <div className="dd-title">{title}</div>
        {body}
      </div>
    );
  }

  function ModeTabs({ vm }) {
    const modes = vm.isMammo ? [{ id: "MG", label: "Mammo Viewer" }] : [
      { id: "2D", label: "2D" }, { id: "MPR", label: "MPR" }, { id: "3D", label: "3D" },
    ];
    return (
      <div className={"tb-modes" + (vm.isMammo ? " mammo" : "")}>
        {modes.map((m) => (
          <button key={m.id} className={"tb-mode" + (vm.mode === m.id ? " is-active" : "")} onClick={() => vm.onMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
    );
  }

  function Toolbar({ vm }) {
    return (
      <header className="tb" data-rail={vm.railMode}>
        <div className="tb-brand">
          <div className="tb-logo">
            <span className="tb-logo-mark"><Icon name="layers" size={20} /></span>
            <span className="tb-logo-text">MEDISYNC<span className="tb-logo-sub">PACS</span></span>
          </div>
          <ModeTabs vm={vm} />
        </div>

        <div className="tb-tools">
          {Object.entries(D.TOOLBAR).map(([k, g], i) => (
            <React.Fragment key={k}>
              {i > 0 ? <div className="tb-divider" /> : null}
              <Group gkey={k} group={g} vm={vm} />
            </React.Fragment>
          ))}
        </div>

        <div className="tb-right">
          <Tip label="Cửa sổ W/L — presets" hot="2–6">
            <button className={"tb-pillbtn" + (vm.openDropdown === "wlpresets" ? " is-active" : "")} onClick={(e) => vm.onDropdown("wlpresets", e)}>
              <Icon name="windowlevel" size={16} />
              <span className="mono">{vm.wl.ww}/{vm.wl.wc}</span>
              <Icon name="chevronDown" size={12} />
            </button>
          </Tip>
          <Tip label={vm.customize ? "Xong tuỳ biến" : "Tuỳ biến thanh công cụ"}>
            <button className={"tb-btn tb-gear" + (vm.customize ? " is-active" : "")} onClick={vm.toggleCustomize}>
              <Icon name="settings" size={19} />
            </button>
          </Tip>
        </div>

        <Dropdown vm={vm} />
        {vm.customize ? <div className="tb-custhint">Bấm <Icon name="pin" size={12} /> trên mỗi công cụ để ghim/bỏ khỏi thanh — công cụ bỏ ghim chuyển vào menu <Icon name="menu" size={12} />.</div> : null}
      </header>
    );
  }

  window.Toolbar = Toolbar;
})();

// icons.jsx — clean line-icon set for the Medisync PACS viewer.
// All icons are 24x24 viewBox, stroke = currentColor, drawn at 1.7 stroke.
(function () {
  const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

  const PATHS = {
    // mode tabs
    grid2d: <><rect x="4" y="4" width="16" height="16" rx="1.5" {...P} /><line x1="4" y1="12" x2="20" y2="12" {...P} /><line x1="12" y1="4" x2="12" y2="20" {...P} /></>,
    mpr: <><path d="M4 8 L12 4 L20 8 L12 12 Z" {...P} /><path d="M4 8 V16 L12 20 V12" {...P} /><path d="M20 8 V16 L12 20" {...P} /></>,
    cube3d: <><path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" {...P} /><path d="M4 7.5 L12 12 L20 7.5 M12 12 V21" {...P} /></>,

    // group A — display / mouse modes
    windowlevel: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 4 a8 8 0 0 1 0 16 Z" fill="currentColor" stroke="none" /></>,
    pan: <><path d="M12 3 v18 M3 12 h18" {...P} /><path d="M12 3 l-2.5 2.5 M12 3 l2.5 2.5 M12 21 l-2.5 -2.5 M12 21 l2.5 -2.5 M3 12 l2.5 -2.5 M3 12 l2.5 2.5 M21 12 l-2.5 -2.5 M21 12 l-2.5 2.5" {...P} /></>,
    zoom: <><circle cx="10.5" cy="10.5" r="6.5" {...P} /><line x1="15.5" y1="15.5" x2="21" y2="21" {...P} /><line x1="10.5" y1="7.5" x2="10.5" y2="13.5" {...P} /><line x1="7.5" y1="10.5" x2="13.5" y2="10.5" {...P} /></>,
    scroll: <><rect x="5" y="3" width="14" height="5" rx="1" {...P} /><rect x="5" y="16" width="14" height="5" rx="1" {...P} /><line x1="5" y1="11.5" x2="19" y2="11.5" {...P} strokeDasharray="2 2.5" /></>,
    magnify: <><circle cx="10.5" cy="10.5" r="6.5" {...P} /><line x1="15.5" y1="15.5" x2="21" y2="21" {...P} /><circle cx="10.5" cy="10.5" r="2.4" {...P} /></>,
    probe: <><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><path d="M12 3 v4 M12 17 v4 M3 12 h4 M17 12 h4" {...P} /></>,
    crosshair: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 2 v6 M12 16 v6 M2 12 h6 M16 12 h6" {...P} /></>,
    reset: <><path d="M4 12 a8 8 0 1 1 2.3 5.6" {...P} /><path d="M4 19 v-5 h5" {...P} /></>,

    // group B — measure / annotate
    length: <><line x1="4" y1="20" x2="20" y2="4" {...P} /><path d="M4 16 l4 4 M16 4 l4 4 M7.5 12.5 l1.8 1.8 M11 9 l1.8 1.8 M14.5 5.5 l1.8 1.8" {...P} /></>,
    angle: <><path d="M5 19 H20" {...P} /><path d="M5 19 L17 6" {...P} /><path d="M9.5 19 a5 5 0 0 1 1.4 -4.6" {...P} /></>,
    bidirectional: <><line x1="4" y1="4" x2="20" y2="20" {...P} /><line x1="20" y1="7" x2="7" y2="20" {...P} /></>,
    ellipse: <><ellipse cx="12" cy="12" rx="8.5" ry="6" {...P} /></>,
    rectangle: <><rect x="4" y="6" width="16" height="12" rx="1" {...P} /></>,
    circleroi: <><circle cx="12" cy="12" r="7.5" {...P} /></>,
    text: <><path d="M5 6 h14 M5 6 v-1.5 M19 6 v-1.5 M12 6 v13 M9.5 19 h5" {...P} /></>,
    specialty: <><path d="M12 3 v18 M7 7 h10 M8 12 h8 M9 17 h6" {...P} /></>,
    eraser: <><path d="M8 20 H20" {...P} /><path d="M5.5 16.5 L13 9 l5 5 l-6 6 H8 Z" {...P} /></>,
    clearall: <><path d="M6 7 h12 l-1 13 H7 Z" {...P} /><path d="M9 7 V5 h6 v2 M10 11 v6 M14 11 v6" {...P} /></>,

    // group C — transform
    rotateRight: <><path d="M20 12 a8 8 0 1 0 -2.3 5.6" {...P} /><path d="M20 5 v5 h-5" {...P} /></>,
    rotateLeft: <><path d="M4 12 a8 8 0 1 1 2.3 5.6" {...P} /><path d="M4 5 v5 h5" {...P} /></>,
    flipH: <><line x1="12" y1="3" x2="12" y2="21" {...P} strokeDasharray="2 2.5" /><path d="M10 7 L4 12 l6 5 Z" {...P} /><path d="M14 7 L20 12 l-6 5 Z" {...P} /></>,
    flipV: <><line x1="3" y1="12" x2="21" y2="12" {...P} strokeDasharray="2 2.5" /><path d="M7 10 L12 4 l5 6 Z" {...P} /><path d="M7 14 L12 20 l5 -6 Z" {...P} /></>,
    invert: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 3.5 a8.5 8.5 0 0 1 0 17 Z" fill="currentColor" stroke="none" /></>,

    // group D — layout
    sync: <><path d="M5 9 a7 7 0 0 1 12 -3 M19 6 v3 h-3" {...P} /><path d="M19 15 a7 7 0 0 1 -12 3 M5 18 v-3 h3" {...P} /></>,
    cine: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M10 8.5 L16 12 L10 15.5 Z" fill="currentColor" stroke="none" /></>,
    pause: <><circle cx="12" cy="12" r="8.5" {...P} /><line x1="10" y1="9" x2="10" y2="15" {...P} /><line x1="14" y1="9" x2="14" y2="15" {...P} /></>,
    layout1: <><rect x="4" y="4" width="16" height="16" rx="1.5" {...P} /></>,
    layout2: <><rect x="4" y="4" width="16" height="16" rx="1.5" {...P} /><line x1="12" y1="4" x2="12" y2="20" {...P} /></>,
    layout4: <><rect x="4" y="4" width="16" height="16" rx="1.5" {...P} /><line x1="12" y1="4" x2="12" y2="20" {...P} /><line x1="4" y1="12" x2="20" y2="12" {...P} /></>,
    layout1x3: <><rect x="4" y="4" width="16" height="16" rx="1.5" {...P} /><line x1="9.3" y1="4" x2="9.3" y2="20" {...P} /><line x1="14.6" y1="4" x2="14.6" y2="20" {...P} /></>,

    // group E — export / meta
    star: <><path d="M12 3.5 l2.6 5.3 5.9 .9 -4.3 4.2 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.2 5.9 -.9 Z" {...P} /></>,
    starFill: <><path d="M12 3.5 l2.6 5.3 5.9 .9 -4.3 4.2 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.2 5.9 -.9 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></>,
    save: <><path d="M5 3 h11 l3 3 v15 H5 Z" {...P} /><path d="M8 3 v5 h7 V3 M8 21 v-7 h8 v7" {...P} /></>,
    download: <><path d="M12 4 v10 M8 11 l4 4 4 -4" {...P} /><path d="M5 19 h14" {...P} /></>,
    capture: <><rect x="3" y="7" width="18" height="13" rx="2" {...P} /><circle cx="12" cy="13.5" r="3.5" {...P} /><path d="M8.5 7 L10 4 h4 l1.5 3" {...P} /></>,
    trash: <><path d="M6 7 h12 l-1 13 H7 Z" {...P} /><path d="M4 7 h16 M9 7 V4.5 h6 V7" {...P} /></>,
    info: <><circle cx="12" cy="12" r="8.5" {...P} /><line x1="12" y1="11" x2="12" y2="16.5" {...P} /><circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="currentColor" /></>,
    tags: <><path d="M3 12 L12 3 H20 V11 L11 20 Z" {...P} /><circle cx="16" cy="8" r="1.3" {...P} /></>,
    eye: <><path d="M2.5 12 C5 7 9 5 12 5 s7 2 9.5 7 C19 17 15 19 12 19 s-7 -2 -9.5 -7 Z" {...P} /><circle cx="12" cy="12" r="2.8" {...P} /></>,
    eyeOff: <><path d="M4 5 L20 19" {...P} /><path d="M9.5 6 C10.3 5.7 11.1 5.5 12 5.5 c3 0 7 2 9.5 6.5 -0.9 1.6 -2 2.9 -3.2 3.9 M6.4 8.2 C4.6 9.3 3.3 10.6 2.5 12 5 16.5 9 18.5 12 18.5 c1 0 2 -0.2 3 -0.6" {...P} /></>,
    anon: <><circle cx="12" cy="8" r="3.5" {...P} /><path d="M5 20 c0 -4 3.5 -6 7 -6 s7 2 7 6" {...P} /><line x1="4" y1="9" x2="20" y2="15" {...P} strokeWidth="2.4" stroke="#0f172a" /><line x1="4" y1="9" x2="20" y2="15" {...P} /></>,

    // chrome / misc
    chevronDown: <><path d="M6 9 l6 6 6 -6" {...P} /></>,
    chevronLeft: <><path d="M15 6 l-6 6 6 6" {...P} /></>,
    chevronRight: <><path d="M9 6 l6 6 -6 6" {...P} /></>,
    chevronUp: <><path d="M6 15 l6 -6 6 6" {...P} /></>,
    close: <><path d="M6 6 L18 18 M18 6 L6 18" {...P} /></>,
    pin: <><path d="M9 3 h6 l-1 6 3 3 v2 H7 v-2 l3 -3 Z M12 14 v7" {...P} /></>,
    plus: <><path d="M12 5 v14 M5 12 h14" {...P} /></>,
    minus: <><path d="M5 12 h14" {...P} /></>,
    search: <><circle cx="11" cy="11" r="7" {...P} /><line x1="16" y1="16" x2="21" y2="21" {...P} /></>,
    user: <><circle cx="12" cy="8" r="3.6" {...P} /><path d="M5 20 c0 -4 3.5 -6.5 7 -6.5 s7 2.5 7 6.5" {...P} /></>,
    clock: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 7 v5.5 l3.5 2" {...P} /></>,
    layers: <><path d="M12 3 L21 8 L12 13 L3 8 Z" {...P} /><path d="M3 13 L12 18 L21 13 M3 17.5 L12 22.5 L21 17.5" {...P} /></>,
    ruler: <><rect x="3" y="8" width="18" height="8" rx="1" transform="rotate(0 12 12)" {...P} /><path d="M7 8 v3 M11 8 v4 M15 8 v3 M19 8 v4" {...P} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...P} /><path d="M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M5 5 l2 2 M17 17 l2 2 M19 5 l-2 2 M7 17 l-2 2" {...P} /></>,
    menu: <><path d="M4 7 h16 M4 12 h16 M4 17 h16" {...P} /></>,
    bell: <><path d="M6 16 V11 a6 6 0 0 1 12 0 v5 l2 2 H4 Z" {...P} /><path d="M10 21 a2 2 0 0 0 4 0" {...P} /></>,
    sliders: <><path d="M4 8 h10 M18 8 h2 M4 16 h2 M10 16 h10" {...P} /><circle cx="16" cy="8" r="2" {...P} /><circle cx="8" cy="16" r="2" {...P} /></>,
    fullscreen: <><path d="M4 9 V4 h5 M20 9 V4 h-5 M4 15 v5 h5 M20 15 v5 h-5" {...P} /></>,
    compare: <><rect x="3" y="5" width="8" height="14" rx="1" {...P} /><rect x="13" y="5" width="8" height="14" rx="1" {...P} /></>,
    report: <><path d="M6 3 h9 l3 3 v15 H6 Z" {...P} /><path d="M9 9 h6 M9 13 h6 M9 17 h4" {...P} /></>,
    ai: <><path d="M12 4 a8 8 0 1 0 0 16 8 8 0 0 0 0 -16 Z" {...P} /><path d="M9 10 a1 1 0 0 1 2 0 v4 M13 14 v-4 a1 1 0 0 1 2 0" {...P} /><line x1="9" y1="13" x2="11" y2="13" {...P} /></>,
  };

  function Icon({ name, size = 20, style, className }) {
    const body = PATHS[name];
    if (!body) return null;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">{body}</svg>
    );
  }

  window.Icon = Icon;
  window.ICON_NAMES = Object.keys(PATHS);
})();

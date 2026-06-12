// data.jsx — mock clinical data + tool/preset definitions for the viewer.
(function () {
  // Current patient + study
  const PATIENT = {
    name: "NGUYỄN VĂN MINH",
    id: "PID-2024-08831",
    sex: "Nam", age: "58",
    dob: "1967-03-12",
  };

  const STUDY = {
    desc: "CT NGỰC — BỤNG CÓ TIÊM THUỐC",
    modality: "CT",
    date: "09/06/2026",
    time: "08:42",
    accession: "ACC-CT-559210",
    institution: "BV ĐA KHOA MEDISYNC",
    bodyPart: "CHEST/ABDOMEN",
    kvp: "120", mAs: "210", thickness: "1.0",
  };

  // Series in the current study (left panel)
  const SERIES = [
    { id: "s1", no: 1, desc: "Scout / Topogram", scene: "chest", images: 2, plane: "axial", thumbSlice: 0, modality: "CT" },
    { id: "s2", no: 2, desc: "Ngực — Axial (phổi)", scene: "chest", images: 512, plane: "axial", thumbSlice: 30, modality: "CT", active: true },
    { id: "s3", no: 3, desc: "Ngực — Axial (trung thất)", scene: "chest", images: 512, plane: "axial", thumbSlice: 70, modality: "CT" },
    { id: "s4", no: 4, desc: "Bụng — Axial (tĩnh mạch cửa)", scene: "chest", images: 624, plane: "axial", thumbSlice: 90, modality: "CT" },
    { id: "s5", no: 5, desc: "MPR Coronal tái tạo", scene: "chest", images: 320, plane: "coronal", thumbSlice: 40, modality: "CT" },
    { id: "s6", no: 6, desc: "MPR Sagittal tái tạo", scene: "chest", images: 280, plane: "sagittal", thumbSlice: 60, modality: "CT" },
    { id: "s7", no: 7, desc: "Sọ não — Axial (đối chiếu)", scene: "brain", images: 188, plane: "axial", thumbSlice: 40, modality: "MR" },
  ];

  // Prior studies (timeline panel)
  const PRIORS = [
    { date: "12/01/2026", modality: "CT", desc: "CT Ngực thường quy", series: 4, current: false },
    { date: "03/09/2025", modality: "CT", desc: "CT Ngực — Bụng có tiêm", series: 6, current: false },
    { date: "21/04/2025", modality: "DX", desc: "X-quang ngực thẳng", series: 1, current: false },
    { date: "08/11/2024", modality: "MR", desc: "MRI sọ não", series: 5, current: false },
  ];

  // W/L presets (width / center) per spec
  const WL_PRESETS = [
    { key: "soft", label: "Mô mềm", ww: 400, wc: 40, hot: "2" },
    { key: "lung", label: "Phổi", ww: 1500, wc: -600, hot: "3" },
    { key: "bone", label: "Xương", ww: 1800, wc: 400, hot: "4" },
    { key: "brain", label: "Não", ww: 80, wc: 40, hot: "5" },
    { key: "abdomen", label: "Bụng", ww: 350, wc: 50, hot: "6" },
    { key: "angio", label: "Mạch máu", ww: 640, wc: 160, hot: "" },
  ];

  // Toolbar groups. Each tool: {id, icon, label, hot, mode?(mouse mode toggle), dropdown?}
  const TOOLBAR = {
    A: {
      label: "Hiển thị",
      tools: [
        { id: "wl", icon: "windowlevel", label: "Cửa sổ (W/L)", hot: "W", mode: true },
        { id: "pan", icon: "pan", label: "Di chuyển", hot: "P", mode: true },
        { id: "zoom", icon: "zoom", label: "Phóng to", hot: "Z", mode: true },
        { id: "scroll", icon: "scroll", label: "Cuộn lát ảnh", hot: "S", mode: true },
        { id: "magnify", icon: "magnify", label: "Kính lúp", hot: "M", mode: true },
        { id: "probe", icon: "probe", label: "Đo pixel (Probe)", hot: "⇧X", mode: true },
        { id: "crosshair", icon: "crosshair", label: "3D Cursor", hot: "Q", mode: true },
        { id: "reset", icon: "reset", label: "Đặt lại viewport", hot: "", action: true },
      ],
    },
    B: {
      label: "Đo đạc",
      tools: [
        { id: "length", icon: "length", label: "Chiều dài", hot: "L", mode: true },
        { id: "angle", icon: "angle", label: "Góc", hot: "A", mode: true },
        { id: "bidirectional", icon: "bidirectional", label: "Hai chiều", hot: "B", mode: true },
        { id: "ellipse", icon: "ellipse", label: "Ellipse ROI", hot: "E", mode: true },
        { id: "rectangle", icon: "rectangle", label: "Chữ nhật ROI", hot: "R", mode: true },
        { id: "text", icon: "text", label: "Chú thích", hot: "T", mode: true },
        { id: "specialty", icon: "specialty", label: "Công cụ chuyên biệt", hot: "", dropdown: "specialty" },
        { id: "eraser", icon: "eraser", label: "Xoá phép đo cuối", hot: "", action: true },
        { id: "clearall", icon: "clearall", label: "Xoá tất cả phép đo", hot: "", action: true },
      ],
    },
    C: {
      label: "Biến đổi",
      tools: [
        { id: "rotateLeft", icon: "rotateLeft", label: "Xoay trái", hot: "", action: true },
        { id: "rotateRight", icon: "rotateRight", label: "Xoay phải", hot: "", action: true },
        { id: "flipH", icon: "flipH", label: "Lật ngang", hot: "", toggle: true },
        { id: "flipV", icon: "flipV", label: "Lật dọc", hot: "", toggle: true },
        { id: "invert", icon: "invert", label: "Đảo màu", hot: "1", toggle: true },
      ],
    },
    D: {
      label: "Bố cục",
      tools: [
        { id: "sync", icon: "sync", label: "Đồng bộ cuộn", hot: "⇧S", toggle: true },
        { id: "cine", icon: "cine", label: "Cine (phát ảnh)", hot: "⇧P", toggle: true },
        { id: "layout", icon: "layout4", label: "Bố cục lưới", hot: "", dropdown: "layout" },
      ],
    },
    E: {
      label: "Xuất / Dữ liệu",
      tools: [
        { id: "key", icon: "star", label: "Key Image", hot: "", toggle: true },
        { id: "save", icon: "download", label: "Lưu / Tải", hot: "", dropdown: "save" },
        { id: "capture", icon: "capture", label: "Chụp viewport", hot: "", action: true },
        { id: "info", icon: "info", label: "Thông tin / DICOM", hot: "", dropdown: "info" },
      ],
    },
  };

  const SPECIALTY_TOOLS = [
    { id: "ctr", label: "CTR — tỷ lệ tim/ngực", hot: "" },
    { id: "cobb", label: "Cobb Angle — góc cột sống", hot: "⇧C" },
    { id: "spinelabel", label: "Spine Labeling — đánh số đốt", hot: "⇧V" },
    { id: "sva", label: "Spine Balance (SVA)", hot: "⇧B" },
    { id: "calib", label: "Calibration — hiệu chuẩn thước", hot: "⇧K" },
  ];

  const LAYOUTS = [
    { id: "1x1", icon: "layout1", label: "1 × 1", cells: 1, cols: 1, rows: 1 },
    { id: "1x2", icon: "layout2", label: "1 × 2", cells: 2, cols: 2, rows: 1 },
    { id: "2x2", icon: "layout4", label: "2 × 2", cells: 4, cols: 2, rows: 2 },
    { id: "1x3", icon: "layout1x3", label: "1 × 3", cells: 3, cols: 3, rows: 1 },
    { id: "mpr", icon: "mpr", label: "MPR (3+3D)", cells: 4, cols: 2, rows: 2, mpr: true },
  ];

  const SAVE_OPTS = [
    { group: "Ảnh hiện tại", items: ["JPEG (.jpg)", "DICOM (.dcm)"] },
    { group: "Loạt hiện tại", items: ["DICOM (.zip)", "JPEG (.zip) ≤200 ảnh"] },
    { group: "Cả ca chụp", items: ["DICOM (.zip)", "JPEG (.zip) ≤200 ảnh"] },
  ];

  // DICOM tags for the info dialog
  const DICOM_TAGS = [
    ["(0010,0010)", "Patient Name", "NGUYEN^VAN^MINH"],
    ["(0010,0020)", "Patient ID", "PID-2024-08831"],
    ["(0008,0060)", "Modality", "CT"],
    ["(0008,1030)", "Study Description", "CT CHEST/ABDOMEN W/ CONTRAST"],
    ["(0018,0050)", "Slice Thickness", "1.0 mm"],
    ["(0018,0060)", "KVP", "120"],
    ["(0018,1152)", "Exposure", "210 mAs"],
    ["(0028,0010)", "Rows", "512"],
    ["(0028,0011)", "Columns", "512"],
    ["(0028,1050)", "Window Center", "40"],
    ["(0028,1051)", "Window Width", "400"],
    ["(0020,0032)", "Image Position", "-172.5\\-180.0\\-45.2"],
  ];

  window.PACS_DATA = { PATIENT, STUDY, SERIES, PRIORS, WL_PRESETS, TOOLBAR, SPECIALTY_TOOLS, LAYOUTS, SAVE_OPTS, DICOM_TAGS };
})();

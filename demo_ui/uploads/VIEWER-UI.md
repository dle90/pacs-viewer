# Màn hình PACS Viewer — Giao diện & Chức năng

Tài liệu mô tả giao diện hiển thị và các chức năng của màn hình xem ảnh (PACS Viewer) trong hệ thống Medisync.

> Viewer là **OHIF Viewer** được tùy biến nặng bằng cách inject 4 file JS ở `pacs-viewer/src/`:
> `medisync-runtime.js` (cấu hình endpoint runtime), `medisync-auth.js` (xác thực/JWT), `medisync-extras.js` (i18n tiếng Việt, công cụ chuyên biệt, panel ca cũ, vá lỗi OHIF), `medisync-toolbar.js` (thay toolbar + sidebar phải). Cấu hình OHIF ở `ohif-config.js`.

---

## 1. Tổng quan

- **Nền tảng:** OHIF Viewer + cornerstone3D (render WebGL), tải ảnh qua **WADO-RS** (DICOMweb).
- **Giao diện:** theme tối (nền slate `#1e293b`, nhấn cyan `#5acce6`), **toàn bộ nhãn tiếng Việt**.
- **Phím tắt:** kiểu RadiAnt (chữ thường: `w` `p` `z` `s`…).
- **Điều hướng vào viewer:** từ danh sách ca → mở `/viewer?StudyInstanceUIDs=<UID>` (cùng tab).

## 2. Bố cục màn hình

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MEDISYNC PACS │[2D|MPR|3D]│ A hiển thị │ B đo │ C biến đổi │ D layout │ E xuất │  ← Toolbar trên
├──────────┬──────────────────────────────────────────────┬───────────────┤
│ Panel    │                                              │  Sidebar PHẢI │
│ TRÁI     │           VIEWPORT (cornerstone3D)           │ (#medisync-   │
│ (OHIF)   │     ảnh DICOM · overlay info · MPR/3D cube    │  sidebar)     │
│ study /  │                                              │  W/L presets, │
│ thumbnail│                                              │  layout,cine, │
│ thu/mở   │                                              │  sliders…     │
└──────────┴──────────────────────────────────────────────┴───────────────┘
```

## 3. Thanh công cụ trên (`#medisync-toolbar`)

Thay hoàn toàn toolbar gốc của OHIF. Từ trái sang phải:

### Logo + Tab chế độ xem
- Logo chữ **"MEDISYNC PACS"**.
- **Tab chế độ:** `2D` · `MPR` · `3D` (chuyển kiểu hiển thị). Ca **nhũ ảnh (MG)** ẩn tab và đổi nhãn thành **"Mammo Viewer"** (chỉ 2D).

### Nhóm A — Hiển thị (mouse-mode)
| Nút | Chức năng | Phím |
|---|---|---|
| W/L | Cửa sổ (window/level) bằng kéo chuột | `w` |
| Pan | Di chuyển ảnh | `p` |
| Zoom | Phóng to/thu nhỏ | `z` |
| Scroll | Cuộn qua các lát ảnh | `s` |
| Magnify | Kính lúp | `m` |
| Probe | Đo giá trị pixel tại 1 điểm | `shift+x` |
| 3D Cursor (Crosshairs) | Tham chiếu chéo giữa các mặt phẳng | `q` |
| W/L Presets ▾ | 5 preset cửa sổ (80/40 · 160/80 · 256/128 · 320/160 · 640/320) | `2`–`6` |
| Reset | Đặt lại viewport | |

### Nhóm B — Đo đạc / chú thích
Length (`l`), Angle (`a`), Bidirectional (`b`), Ellipse ROI (`e`), Rectangle ROI (`r`), Text/Annotation (`t`), và **Specialty Tools ▾**:
- **CTR** — tỷ lệ tim/ngực
- **Cobb Angle** — góc Cobb (`shift+c`)
- **Spine Labeling** — đánh số đốt sống (`shift+v`)
- **Spine Balance (SVA)** (`shift+b`)
- **Calibration** — hiệu chuẩn thước đo (`shift+k`)

Kèm: **Xóa phép đo cuối** và **Xóa tất cả phép đo**.

### Nhóm C — Biến đổi ảnh
Xoay phải / xoay trái, lật ngang / lật dọc, đảo màu (invert).

### Nhóm D — Bố cục
- **Sync Scroll** — đồng bộ cuộn giữa các viewport (`shift+s`).
- **Cine** — phát ảnh động (`shift+p`).

### Nhóm E — Xuất / Metadata (mép phải)
- **★ Key Image** — đánh dấu ảnh quan trọng.
- **Lưu / Tải ▾:** ảnh hiện tại (JPEG / DICOM `.dcm`), loạt hiện tại (DICOM `.zip` / JPEG `.zip` ≤200 ảnh), ca hiện tại (DICOM `.zip` / JPEG `.zip` ≤200 ảnh).
- **Capture** — chụp ảnh viewport.
- **Xóa / Ẩn ▾:** ẩn ca (khôi phục được), bỏ ẩn, **xóa vĩnh viễn** ảnh / loạt / ca (cả bản ghi Mongo).
- **Info ▾:** xem **DICOM Tags**, ẩn/hiện thông tin bệnh nhân (overlay), **ẩn danh** (làm mờ thông tin BN).

## 4. Panel trái (OHIF gốc — thu/mở được)

Danh sách **ca chụp / loạt + thumbnail** của bệnh nhân. Có nút thu/mở; nội dung fade + trượt vào mượt khi mở. *(Panel phải gốc của OHIF đã bị ẩn để nhường chỗ cho sidebar tùy biến.)*

## 5. Vùng giữa — Viewport

- Lưới viewport **cornerstone3D** (mặc định 1×1; đổi layout qua sidebar).
- **Overlay thông tin** bệnh nhân/ảnh ở các góc (ẩn/hiện hoặc ẩn danh qua Info ▾).
- **Overlay tiến độ tải** khi stream CT/MR nhiều lát (500–800+ ảnh, ~60–120s).
- **MPR/3D:** bộ **chọn mặt phẳng** (Axial / Sagittal / Coronal / 3D) và **cube định hướng giải phẫu** (A P L R H F) trên viewport thể tích.
- **Nhũ ảnh (MG):** overlay **nén/paddle/kVp/mAs**; đồng bộ nhũ ảnh hai bên.

## 6. Sidebar phải (`#medisync-sidebar`)

Bảng tùy biến nền tối, rộng 240px, cố định bên phải — truy cập nhanh theo dạng "pill"/section, thay đổi theo ngữ cảnh:
- **W/L presets** (các mức cửa sổ).
- **Bố cục (layout)** viewport.
- **Cine** (thanh phát ảnh động).
- **Sliders / checkbox** điều khiển hiển thị.
- **MPR:** blend mode + độ dày slab (slab thickness).
- **MG:** điều khiển nhũ ảnh (đồng bộ mammo, nén…).

## 7. Panel "Ca chụp cũ" (Prior Studies / Timeline)

Panel nổi bật/tắt được, tiêu đề **"CA CHỤP CŨ"** — liệt kê các ca chụp trước của cùng bệnh nhân (ngày, modality, mô tả). **Mỗi ca mở ở tab mới** (`target="_blank"`).

## 8. Bảng phím tắt chính

| Phím | Chức năng | | Phím | Chức năng |
|---|---|---|---|---|
| `w` | W/L | | `l` | Length |
| `p` | Pan | | `a` | Angle |
| `z` | Zoom | | `b` | Bidirectional |
| `s` | Scroll lát ảnh | | `e` | Ellipse ROI |
| `m` | Magnify | | `r` | Rectangle ROI |
| `q` | 3D Cursor | | `o` | Circle ROI |
| `1` | Pseudo color (invert) | | `t` | Text/Annotation |
| `2`–`6` | W/L preset 1–5 | | `shift+p` | Cine |
| `shift+s` | Sync scroll | | `shift+x` | Probe |
| `shift+←/→/↓` | Căn ảnh trái/phải/giữa | | `shift+k` | Calibration |

*(Danh sách đầy đủ trong `ohif-config.js`, mục `hotkeys`; người dùng có thể chỉnh.)*

## 9. Chế độ theo loại ảnh (modality)

- **CT / MR:** đủ `2D / MPR / 3D`; có tái tạo đa mặt phẳng, slab thickness, cube định hướng.
- **MG (nhũ ảnh):** chế độ **Mammo Viewer** — bố cục/đồng bộ chuyên biệt, overlay kỹ thuật chụp.
- **DX / CR / XA / US:** chủ yếu 2D với công cụ đo và W/L preset tương ứng.

## 10. Cơ chế tải ảnh (tóm tắt)

Browser (OHIF, `imageRendering: wadors`, 6 web worker, lazy-load) → **proxy** `:18080/wado` (thêm CORS + `Cache-Control: immutable`) → **Orthanc** (private) → PostgreSQL index + pixel trên disk (Advanced Storage). Ảnh đã tải được trình duyệt cache mạnh; mở lại ca gần như tức thì. Production có thêm Cloudflare Worker edge-cache.

---

### Tham chiếu mã nguồn
- Toolbar + sidebar: `src/medisync-toolbar.js`
- i18n, công cụ chuyên biệt, panel ca cũ, vá lỗi: `src/medisync-extras.js`
- Cấu hình OHIF (data source, hotkeys, W/L presets, branding): `src/ohif-config.js`
- Endpoint runtime: `src/medisync-runtime.js` · Xác thực: `src/medisync-auth.js`

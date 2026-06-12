# CLAUDE.md — demo_ui (Prototype giao diện PACS Viewer)

Bản **mockup/prototype giao diện** màn hình Medisync PACS Viewer, do Claude thiết kế. Đây là **prototype trình bày (clickable design)** để lặp nhanh về bố cục/giao diện **trước khi** port sang bản tùy biến OHIF thật ở `pacs-viewer/src/medisync-*.js`.

> ⚠️ Đây KHÔNG phải viewer thật: **không kết nối OHIF/DICOM**, mọi dữ liệu là mock, ảnh là placeholder SVG. Thuần giao diện.

## Cách chạy

Không cần build, không cài đặt. Mở thẳng file trong trình duyệt:
```
pacs-viewer/demo_ui/Medisync PACS Viewer.html
```
(hoặc serve tĩnh: `cd pacs-viewer/demo_ui && python3 -m http.server`).

Cơ chế: **React 18 UMD + Babel Standalone** transpile JSX **ngay trên trình duyệt** (qua `<script type="text/babel">`) — zero-config, chỉ dùng cho dev/demo (chậm, không tối ưu cho prod). Cần internet (React/Babel tải từ unpkg CDN).

## Kiến trúc

`Medisync PACS Viewer.html` nạp `styles.css` + các module `.jsx` theo thứ tự, mỗi module gắn component vào `window.*`; script cuối mount `window.PACSApp` vào `#root`.

| File | Expose (`window.*`) | Vai trò |
|---|---|---|
| `tweaks-panel.jsx` | `useTweaks`, `TweaksPanel` | Hook + panel chỉnh thiết kế trực tiếp (xem mục Tweaks). Nạp đầu tiên. |
| `js/icons.jsx` | `Icon`, `ICON_NAMES` | Bộ icon SVG (`PATHS`). |
| `js/images.jsx` | `DicomImage` | Render **ảnh DICOM giả** (SVG placeholder). |
| `js/data.jsx` | `PACS_DATA` | **Mock data**: PATIENT, STUDY, SERIES, PRIORS, WL presets, TOOLBAR, SPECIALTY, LAYOUTS. |
| `js/toolbar.jsx` | `Toolbar` | Thanh công cụ trên: `ToolBtn`, `Group`, `Dropdown`, `ModeTabs`, `Tip` (tooltip). |
| `js/panels.jsx` | `LeftPanel`, `RightSidebar`, `PriorsPanel` | Panel trái (study/thumbnail), sidebar phải (`Section`, `Slider`), panel ca cũ. |
| `js/viewport.jsx` | `ViewportGrid` | Lưới viewport: `Cell`, `OrientCube`, `Measurement`, `PLANE`/`FOV`. |
| `js/app.jsx` | `PACSApp` | App chính: state, view-model, hotkeys, modal; ghép toàn bộ. |

## Hệ thống Tweaks (chỉnh thiết kế trực tiếp)

`tweaks-panel.jsx` cung cấp `window.useTweaks` + panel UI cho phép đổi **biến thể bố cục/giao diện** ngay lúc chạy. Các tham số (xem `TWEAK_DEFAULTS` trong `app.jsx`):
- `railMode` (vị trí thanh công cụ: `top`/…), `rightMode` (sidebar phải: `docked`/floating), `panelSide` (`left`), `density` (`regular`/…), `accent` (màu nhấn, mặc định `#5acce6`), `showOverlay`.

Giá trị được lưu vào `app.jsx` giữa marker `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` — đây là cơ chế để công cụ thiết kế ghi lại lựa chọn.

## Quan hệ với viewer thật

- **Thiết kế (folder này)** → **triển khai thật**: `pacs-viewer/src/medisync-toolbar.js` + `medisync-extras.js` (tùy biến trên OHIF).
- `uploads/VIEWER-UI.md` — tài liệu mô tả giao diện/chức năng viewer thật, dùng làm input tham chiếu cho thiết kế.
- `screenshots/` — ảnh chụp tham chiếu thiết kế (vd `dropdown.png`).

## Quy ước

- JSX viết theo IIFE `(function(){ … })()`, không dùng `import/export` (vì transpile trên trình duyệt) — chia sẻ qua `window.*`.
- Phụ thuộc thứ tự nạp script trong HTML (module dùng `window.X` phải nạp sau file định nghĩa `X`).
- Hotkeys định nghĩa trong `app.jsx` (`HOTKEYS`), khớp phong cách phím tắt của viewer thật (`w/p/z/s/l/a…`).

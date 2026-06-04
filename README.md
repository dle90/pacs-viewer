# pacs-viewer (OHIF)

Web viewer của Medisync — OHIF v3.8.3 + customization (toolbar 24-icon, i18n VN, W/L presets, branding). **SPA tĩnh**, gọi DICOMweb **cross-origin** tới [`pacs-dicomweb-proxy`](../pacs-dicomweb-proxy) (KHÔNG nói chuyện trực tiếp với Orthanc).

**Hỗ trợ 2 đích deploy từ cùng 1 build:**
- **Railway / container** (trước mắt): nginx serve image (`Dockerfile.railway`).
- **CDN-static** (đích cuối, FPT): `dist/` lên Object Storage + CDN (`deploy/`).

## Thành phần

| Path | Vai trò |
|---|---|
| `src/ohif-config.js` | Config OHIF; DICOMweb root đọc runtime từ `window.MEDISYNC_DICOMWEB_ROOT` |
| `src/medisync-runtime.js` | **File đổi theo env** — set `window.MEDISYNC_DICOMWEB_ROOT` (dev default) |
| `src/medisync-extras.js` / `src/medisync-toolbar.js` | i18n/branding/tools + toolbar |
| `Dockerfile.railway` | Đa target: `customize` → `export` (CDN) / `serve` (Railway, nginx) |
| `nginx.conf.template` | serve: COOP/COEP + CORP + SPA fallback + cache (Railway/dev) |
| `medisync-runtime.js.template` + `docker-entrypoint.d/40-pacs-viewer-config.sh` | Render `medisync-runtime.js` từ env `DICOMWEB_ROOT` lúc start |
| `railway.json` | Deploy Railway |
| `build.ps1` / `build.sh` | Build `dist/` (target `export`) cho CDN |
| `deploy/deploy.sh` + `deploy/HEADERS.md` | Đẩy `dist/` lên CDN + rule headers |

## Chạy dev (giống Railway)

```powershell
docker compose up -d --build   # nginx serve image, http://localhost:3000
```
- DICOMweb root = `http://localhost:8080/wado` (env `DICOMWEB_ROOT`) → cần [`pacs-dicomweb-proxy`](../pacs-dicomweb-proxy) + [`pacs`](../pacs) chạy.
- Mở study: `http://localhost:3000/?StudyInstanceUIDs=<UID>`. Sửa `src/*` → `docker compose up -d --build` lại.

## Deploy Railway (trước mắt)
- `railway.json` → builder DOCKERFILE `Dockerfile.railway` (build target `serve`).
- Set service var **`DICOMWEB_ROOT`** = URL public của pacs-dicomweb-proxy (vd `https://api-pacs.medisync.vn/wado`). nginx render `medisync-runtime.js` lúc start → 1 image mọi env.
- Cần CDN cache trước? đặt **Cloudflare** trước service Railway.

## Deploy CDN-static (đích cuối — FPT)
```bash
./build.ps1                                   # -> dist/ (static)
S3_BUCKET=medisync-pacs-viewer DICOMWEB_ROOT=https://api-pacs.medisync.vn/wado \
  S3_ENDPOINT=https://<fpt-object-storage> ./deploy/deploy.sh
```
1. `build.ps1` → `dist/`.
2. `deploy.sh` ghi `dist/medisync-runtime.js` = prod `DICOMWEB_ROOT`, sync lên bucket (immutable assets + no-cache mutable).
3. **Set COOP/COEP + SPA fallback ở CDN** — xem [deploy/HEADERS.md](deploy/HEADERS.md). (Headers KHÔNG phải metadata S3.)

→ Chuyển Railway → CDN **không sửa code**, chỉ đổi đích serve + set headers/config ở CDN.

## Yêu cầu máy client
Decode JPEG2000/JPEG-LS bằng WASM + WebGL2: tối thiểu 4 core/8GB/trình duyệt 64-bit; CT/MR nặng + MPR/3D: 6–8 core/16–32GB/GPU rời.

## TODO
- [ ] Build pipeline riêng (Vite/TS) cho `medisync-toolbar.js` thay raw JS inject.
- [ ] Nhận JWT view-token (URL hash) → gắn `Authorization` cho DICOMweb (proxy verify — xem `../pacs-dicomweb-proxy/auth`).

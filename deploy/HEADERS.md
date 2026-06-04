# CDN headers cho pacs-viewer (pure static)

Static hosting (S3) **không có nginx** → các header dưới phải set ở **tầng CDN/edge** (CloudFront response-headers-policy, FPT CDN header rules, hoặc Cloudflare Transform Rules). Đây là phần KHÔNG thể bỏ — thiếu là viewer hỏng.

## 1. COOP / COEP / CORP — BẮT BUỘC (mọi response)

```
Cross-Origin-Opener-Policy:   same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

- **COOP + COEP** bật `SharedArrayBuffer` → Cornerstone3D cần cho **MPR / 3D / volume**. Thiếu → viewport 3D đen.
- **CORP cross-origin** → cho phép nhúng viewer làm **iframe** trong RIS (khác origin) dưới COEP.
- Lưu ý: COEP `require-corp` khiến **mọi subresource cross-origin** (gồm DICOMweb từ `pacs-dicomweb-proxy`) phải có CORP/CORS hợp lệ — proxy đã set `Cross-Origin-Resource-Policy: cross-origin` + CORS.

## 2. Cache-Control

| Đối tượng | Cache-Control |
|---|---|
| Asset content-hashed (`*.[hash].js/css`, fonts, wasm…) | `public, max-age=31536000, immutable` |
| `index.html` | `no-cache, must-revalidate` |
| `app-config.js`, `medisync-runtime.js`, `medisync-auth.js`, `medisync-extras.js`, `medisync-toolbar.js` | `no-cache, must-revalidate` |

`deploy.sh` set sẵn Cache-Control qua S3 metadata (cột này). COOP/COEP/CORP thì PHẢI set ở CDN (không phải metadata S3).

## 3. Đổi environment KHÔNG cần rebuild

`medisync-runtime.js` là **file duy nhất đổi theo env** (`window.MEDISYNC_DICOMWEB_ROOT`). Mỗi env upload 1 bản khác (no-cache). Mọi thứ khác immutable, dùng chung.

## 4. SPA fallback

Route không khớp file → trả `index.html` (client-side routing OHIF):
- CloudFront: custom error response 403/404 → `/index.html` (200).
- FPT CDN / S3 static website: error document = `index.html`.

## Tham chiếu nhanh theo nền tảng

- **CloudFront**: Response headers policy (COOP/COEP/CORP) + behavior cache policy + custom error pages.
- **FPT CDN**: Header rules cho COOP/COEP/CORP; origin = FPT Object Storage bucket; error document `index.html`.
- **Cloudflare**: Transform Rules (response headers) + `_headers` không áp dụng (đó là Pages); dùng Rules.

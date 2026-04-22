# Deployment Guide (Tuỳ chọn)

> Deploy là **tuỳ chọn** — site chạy hoàn toàn trên local mà không cần deploy.
> Xem [handover-guide.md](./handover-guide.md) cho hướng dẫn chạy local.

---

## Option A: Netlify (Khuyến nghị)

Netlify free tier: thương mại được, auto-deploy, CDN toàn cầu, HTTPS miễn phí.

### Bước 1 — Fork / push repo lên GitHub

Đảm bảo code đã được push lên GitHub (branch `main`).

### Bước 2 — Kết nối Netlify

1. Vào [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Chọn **GitHub** → authorize → chọn repo `LeNguyenNamHieu`
3. Netlify tự phát hiện `netlify.toml` — cấu hình build tự động điền:
   - Build command: `npm run build`
   - Publish directory: `public`
4. Click **Deploy site**

### Bước 3 — Thêm environment variables

1. Site settings → **Environment variables** → **Add variable**
2. Thêm 2 biến:
   - `SUPABASE_URL` = `https://xxxxxxxxxxxx.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGci...`
3. **Trigger redeploy:** Deploys → **Trigger deploy** → Deploy site

### Bước 4 — Cập nhật Supabase redirect URL

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: thay bằng URL Netlify (vd: `https://nam-hieu-booking.netlify.app`)
3. **Redirect URLs**: thêm `https://nam-hieu-booking.netlify.app/**`

### Bước 5 — Đổi tên domain (tuỳ chọn)

Site settings → **Domain management** → **Add custom domain**

### `netlify.toml` reference

```toml
[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://esm.sh 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://img.vietqr.io https://*.supabase.co; connect-src 'self' https://*.supabase.co"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## Option B: Vercel

> Lưu ý: Vercel free tier có điều khoản "non-commercial" cho hobby plan.
> Dùng cho dự án học thuật / cá nhân — không bán dịch vụ qua Vercel URL này.

### Bước 1 — Import project

1. [vercel.com](https://vercel.com) → **New Project** → Import từ GitHub
2. Framework Preset: **Other**
3. Output Directory: `public`
4. Build Command: `npm run build`

### Bước 2 — Thêm env vars

Settings → **Environment Variables** → thêm `SUPABASE_URL` và `SUPABASE_ANON_KEY`

### Bước 3 — Redeploy

Deployments → **Redeploy**

### `vercel.json` reference

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/404.html", "status": 404 }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## Option C: GitHub Pages

GitHub Pages phục vụ static files từ branch `gh-pages` hoặc thư mục `docs/`.
Vì project dùng `public/` làm output và cần build step, cần GitHub Actions workflow.

### `.github/workflows/deploy-gh-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

Sau đó: Repo Settings → **Pages** → Source: **GitHub Actions**

Thêm secrets: Settings → **Secrets and variables** → Actions → `SUPABASE_URL`, `SUPABASE_ANON_KEY`

> Lưu ý: GitHub Pages không hỗ trợ custom headers (CSP, cache-control) — dùng Netlify nếu cần security headers.

---

## Sau khi deploy

- [ ] Mở URL → kiểm tra site load không lỗi
- [ ] Mở DevTools Console → không có lỗi đỏ
- [ ] Test đặt sân end-to-end
- [ ] Kiểm tra headers: `curl -I https://your-site.netlify.app`
- [ ] Cập nhật Supabase Redirect URLs (nếu dùng Supabase mode)

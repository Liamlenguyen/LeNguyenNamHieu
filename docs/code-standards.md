# Code Standards — Sân Bóng Nam Hiếu

## File Naming

- **Kebab-case** cho tất cả file: `field-detail-page.js`, `format-vn.js`, `my-bookings-page.js`
- Tên file mô tả rõ mục đích — đủ để hiểu không cần đọc nội dung
- HTML pages: `kebab-case.html`
- CSS: `input.css` (source), `styles.css` (generated)

## Indentation & Formatting

- **2 spaces** cho JS, HTML, CSS, JSON
- Không dùng tab
- Trailing newline ở cuối file
- Dòng tối đa ~100 ký tự (không cứng nhắc)

## JavaScript

### Variables

```js
// Dùng const mặc định
const fieldId = getParam('id');

// Dùng let khi cần reassign
let currentPage = 1;

// Không dùng var
// BAD: var name = 'test';
```

### Modules

- Vanilla JS ESM: `import`/`export` — không CommonJS, không bundler
- Mỗi page có 1 module riêng: `fields-page.js`, `field-detail-page.js`, ...
- Shared utilities trong module riêng: `format-vn.js`, `validators.js`

### Functions

```js
// Async/await với try/catch — không để silent failures
async function loadFields() {
  try {
    const fields = await api.getFields();
    renderFields(fields);
  } catch (err) {
    console.error('[fields-page] loadFields failed:', err);
    showErrorToast('Không thể tải danh sách sân. Vui lòng thử lại.');
  }
}

// JSDoc cho public functions
/**
 * Format số tiền theo định dạng VND.
 * @param {number} amount - Số tiền (nguyên)
 * @returns {string} vd: "150.000 ₫"
 */
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

### Error Handling

- Mọi `async` function phải có `try/catch`
- Log lỗi với prefix module: `console.error('[module-name] message', err)`
- Hiển thị user-friendly message — không expose stack trace ra UI
- Sử dụng `showErrorToast()` hoặc inline error element

### DOM Manipulation

```js
// Dùng querySelector, không getElementById (nhất quán)
const btn = document.querySelector('#submit-btn');

// Guard null trước khi dùng
if (!btn) return;

// Event listeners — không inline onclick
btn.addEventListener('click', handleSubmit);
// BAD: <button onclick="handleSubmit()">
```

## HTML

### Structure

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tên trang — Sân Bóng Nam Hiếu</title>
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="/env.js"></script>           <!-- env trước module JS -->
</head>
<body>
  <div data-partial="header"></div>         <!-- shared header -->
  <main>
    <!-- page content -->
  </main>
  <div data-partial="footer"></div>         <!-- shared footer -->
  <script type="module" src="/assets/js/page-name.js"></script>
</body>
</html>
```

### Semantic Elements

- `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>` — dùng đúng semantic
- `<button>` cho actions, `<a>` cho navigation
- `alt` attribute bắt buộc cho tất cả `<img>`
- `aria-label` cho icons không có text visible

### Tailwind

- Utility-first: class trực tiếp trên element
- Không viết custom CSS nếu Tailwind class đã có
- Custom tokens (colors, spacing) định nghĩa trong `src/styles/input.css`
- Responsive: `md:`, `lg:` prefix — mobile-first

```html
<!-- GOOD: Tailwind utilities -->
<div class="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">

<!-- BAD: custom CSS cho layout đơn giản -->
<div class="card-container">  <!-- requires custom .card-container CSS -->
```

## CSS (Tailwind input.css)

```css
@import "tailwindcss";

/* Custom tokens dùng @theme */
@theme {
  --color-pitch-500: #2d6a4f;
  --color-pitch-600: #1b4332;
  /* ... */
}

/* Component classes chỉ khi cần reuse > 3 lần */
@layer components {
  .btn-primary {
    @apply bg-pitch-600 text-white px-4 py-2 rounded-lg hover:bg-pitch-700;
  }
}
```

## Commits

Dùng **Conventional Commits**:

```
feat: thêm filter giá trên trang danh sách sân
fix: sửa lỗi slot grid không hiển thị ngày hôm nay
docs: cập nhật supabase-setup.md
refactor: tách logic booking form thành module riêng
chore: thêm .env.example
test: thêm thủ tục test double-booking
```

- **Tiếng Anh** cho commit messages và code comments
- **Tiếng Việt** cho user-facing text (UI, toasts, error messages)
- Không có AI references trong commits

## Localization

### Vietnamese conventions

```js
// Phone VN
const VN_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

// Currency: VND stored as integer (no decimals)
// Display: Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Timezone: Asia/Bangkok (UTC+7)
const now = new Date();
const vnTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Bangkok',
  // ...
}).format(now);

// Date display: dd/mm/yyyy
// Date storage: ISO 8601 (YYYY-MM-DD)
```

## File Size

- Code files: giữ dưới **200 dòng**
- Nếu file vượt 200 dòng: tách thành modules nhỏ hơn theo concern
- HTML pages: không giới hạn cứng (content-heavy pages ok)

## Security

- Không inline event handlers: `onclick="..."` bị cấm — dùng `addEventListener`
- Không `innerHTML` với user input — dùng `textContent` hoặc sanitize
- Không commit `.env`, `.env.local`, `public/env.js`
- Service-role key không bao giờ xuất hiện trong frontend code

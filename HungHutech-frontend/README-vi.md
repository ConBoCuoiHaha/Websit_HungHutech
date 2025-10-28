Hướng dẫn chạy Frontend (Vue 3 - Vue CLI)

- Yêu cầu: Node 18+, Yarn 4 hoặc npm.
- Cấu hình API: cập nhật `Hung-frontend/.env.development` nếu backend không chạy ở `http://localhost:5000`.

Lệnh chạy:
- Cài đặt: `yarn install` hoặc `npm install`
- Dev server: `yarn serve` hoặc `npm run serve`

Ghi chú:
- Ứng dụng sẽ đọc `window.appGlobal.baseUrl` từ `public/index.html` (mặc định `http://localhost:5000`).
- Trang demo "Danh sách Nhân viên" sử dụng API `GET /api/nhanvien` từ backend Node.js.


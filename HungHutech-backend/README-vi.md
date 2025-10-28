Hướng dẫn chạy Backend (Node.js + MongoDB)

- Yêu cầu: Node 18+, MongoDB chạy cục bộ hoặc connection string từ dịch vụ MongoDB.
- Cấu hình: sao chép `.env.example` thành `.env` và chỉnh `MONGO_URI` nếu cần.

Lệnh chạy:
- Cài đặt: `npm install`
- Phát triển (tự reload): `npm start`

API chính:
- Sức khỏe: `GET /` ⇒ "OrangeHRM Node.js Backend is running!"
- Dịch i18n: `GET /core/i18n/messages`
- Nhân viên: `GET/POST /api/nhanvien`, `GET/PUT/DELETE /api/nhanvien/:id`

Xác thực (JWT):
- Đăng ký: `POST /api/auth/register` (lần đầu cho phép tạo admin, sau đó chỉ admin được tạo thêm)
- Đăng nhập: `POST /api/auth/login`
- Thông tin người dùng: `GET /api/auth/me`
- Các API dưới `/api/*` (trừ `/api/auth/*`) yêu cầu header: `Authorization: Bearer <token>`

Phân trang/tìm kiếm/sắp xếp:
- Các endpoint danh sách trả `{ items, page, limit, total }`
- Query params: `page`, `limit` (mặc định 1/20), `q` (tìm kiếm), `sort` (vd: `ten:asc,ngay_tao:desc`)

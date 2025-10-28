# 🧪 API Testing Guide

Hướng dẫn test các API endpoints

---

## 🔧 Setup

### 1. Cài đặt REST Client

**Option 1: Visual Studio Code Extension**
- Cài extension: REST Client
- Tạo file `.http` hoặc `.rest`

**Option 2: Postman**
- Download Postman
- Import collection

**Option 3: cURL**
- Dùng command line

---

## 🔐 Authentication Flow

### 1. Đăng ký tài khoản đầu tiên (Admin)

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "123456",
  "role": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

### 2. Đăng nhập

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "123456"
}
```

### 3. Lấy thông tin user hiện tại

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 👥 Nhân viên APIs

### Lấy danh sách nhân viên (có phân trang)

```http
GET http://localhost:5000/api/nhanvien?page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tìm kiếm nhân viên

```http
GET http://localhost:5000/api/nhanvien?q=nguyen
Authorization: Bearer YOUR_TOKEN_HERE
```

### Sắp xếp nhân viên

```http
GET http://localhost:5000/api/nhanvien?sort=ten:asc
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo nhân viên mới

```http
POST http://localhost:5000/api/nhanvien
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ma_nhan_vien": "NV001",
  "ho_dem": "Nguyễn Văn",
  "ten": "An",
  "ngay_sinh": "1990-01-15",
  "gioi_tinh": "Nam",
  "lien_he": {
    "email_cong_viec": "an.nguyen@company.com",
    "di_dong": "0901234567"
  },
  "thong_tin_cong_viec": {
    "ngay_vao_lam": "2020-01-01"
  }
}
```

### Lấy thông tin nhân viên theo ID

```http
GET http://localhost:5000/api/nhanvien/EMPLOYEE_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

### Cập nhật nhân viên

```http
PUT http://localhost:5000/api/nhanvien/EMPLOYEE_ID
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten": "Bình",
  "lien_he": {
    "di_dong": "0909999999"
  }
}
```

### Xóa nhân viên (soft delete)

```http
DELETE http://localhost:5000/api/nhanvien/EMPLOYEE_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🏢 Chức danh APIs

### Lấy danh sách chức danh

```http
GET http://localhost:5000/api/chucdanh
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo chức danh

```http
POST http://localhost:5000/api/chucdanh
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten_chuc_danh": "Giám đốc",
  "mo_ta": "Giám đốc điều hành"
}
```

### Cập nhật chức danh

```http
PUT http://localhost:5000/api/chucdanh/JOB_TITLE_ID
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten_chuc_danh": "CEO",
  "mo_ta": "Chief Executive Officer"
}
```

### Xóa chức danh

```http
DELETE http://localhost:5000/api/chucdanh/JOB_TITLE_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🏢 Phòng ban APIs

### Lấy danh sách phòng ban

```http
GET http://localhost:5000/api/phongban
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo phòng ban

```http
POST http://localhost:5000/api/phongban
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten": "Phòng Kỹ thuật",
  "mo_ta": "Phát triển sản phẩm"
}
```

---

## 📍 Địa điểm APIs

### Lấy danh sách địa điểm

```http
GET http://localhost:5000/api/diadiem
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo địa điểm

```http
POST http://localhost:5000/api/diadiem
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten": "Trụ sở chính",
  "thanh_pho": "Hà Nội",
  "quoc_gia": "Việt Nam",
  "dia_chi": "Số 1 Đường Láng"
}
```

---

## 🏖️ Nghỉ phép APIs

### Lấy danh sách loại ngày nghỉ

```http
GET http://localhost:5000/api/loaingaynghi
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo yêu cầu nghỉ phép

```http
POST http://localhost:5000/api/yeucaunghiphep
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "nhan_vien_id": "EMPLOYEE_ID",
  "loai_ngay_nghi_id": "LEAVE_TYPE_ID",
  "ngay_bat_dau": "2024-10-20",
  "ngay_ket_thuc": "2024-10-22",
  "so_ngay": 3,
  "ly_do": "Nghỉ phép năm"
}
```

### Phê duyệt/Từ chối yêu cầu nghỉ phép

```http
PATCH http://localhost:5000/api/yeucaunghiphep/REQUEST_ID/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "trang_thai": "Da duyet",
  "ghi_chu_duyet": "Đồng ý"
}
```

---

## ⏰ Chấm công APIs

### Lấy danh sách chấm công

```http
GET http://localhost:5000/api/chamcong?ngay_bat_dau=2024-10-01&ngay_ket_thuc=2024-10-31
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo bản ghi chấm công

```http
POST http://localhost:5000/api/chamcong
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "nhan_vien_id": "EMPLOYEE_ID",
  "ngay": "2024-10-14",
  "gio_vao": "08:00",
  "gio_ra": "17:00",
  "tong_gio_lam": 8
}
```

---

## 📊 Dashboard APIs

### Lấy thống kê tổng quan

```http
GET http://localhost:5000/api/dashboard/summary
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "employees": 150,
  "leavePending": 5,
  "claimsPending": 3
}
```

---

## 📋 Directory APIs

### Lấy danh bạ nhân viên

```http
GET http://localhost:5000/api/directory/employees?q=nguyen
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📱 Buzz (Social) APIs

### Lấy danh sách bài viết

```http
GET http://localhost:5000/api/buzz?page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo bài viết mới

```http
POST http://localhost:5000/api/buzz
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "noi_dung": "Chào mừng tất cả mọi người đến với hệ thống mới!"
}
```

### Like bài viết

```http
POST http://localhost:5000/api/buzz/POST_ID/like
Authorization: Bearer YOUR_TOKEN_HERE
```

### Comment bài viết

```http
POST http://localhost:5000/api/buzz/POST_ID/comment
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "noi_dung": "Bài viết hay quá!"
}
```

### Lấy comments của bài viết

```http
GET http://localhost:5000/api/buzz/POST_ID/comments
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🗂️ Dự án APIs

### Lấy danh sách dự án

```http
GET http://localhost:5000/api/projects
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo dự án mới

```http
POST http://localhost:5000/api/projects
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten_du_an": "Website công ty",
  "ma_du_an": "WEB-001",
  "khach_hang": "ABC Corp",
  "ngay_bat_dau": "2024-10-01"
}
```

---

## 👔 Tuyển dụng APIs

### Lấy danh sách vị trí tuyển dụng

```http
GET http://localhost:5000/api/recruitment/vacancies
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo vị trí tuyển dụng

```http
POST http://localhost:5000/api/recruitment/vacancies
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ten_vi_tri": "Senior Developer",
  "so_luong": 2,
  "mo_ta": "Cần tuyển developer có kinh nghiệm",
  "trang_thai": "Open"
}
```

### Lấy danh sách ứng viên

```http
GET http://localhost:5000/api/recruitment/candidates
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📊 KPI APIs

### Lấy danh sách KPI

```http
GET http://localhost:5000/api/performance/kpis
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo KPI mới

```http
POST http://localhost:5000/api/performance/kpis
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "nhan_vien_id": "EMPLOYEE_ID",
  "ten_kpi": "Hoàn thành dự án đúng hạn",
  "mo_ta": "Tỷ lệ dự án hoàn thành đúng deadline",
  "muc_tieu": 90,
  "thoi_gian_bat_dau": "2024-01-01",
  "thoi_gian_ket_thuc": "2024-12-31"
}
```

---

## 💰 Claims APIs

### Lấy danh sách yêu cầu bồi hoàn

```http
GET http://localhost:5000/api/claims
Authorization: Bearer YOUR_TOKEN_HERE
```

### Tạo yêu cầu bồi hoàn

```http
POST http://localhost:5000/api/claims
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "nhan_vien_id": "EMPLOYEE_ID",
  "loai_chi_phi": "Đi lại",
  "so_tien": 500000,
  "ngay_chi_phi": "2024-10-14",
  "mo_ta": "Chi phí taxi đi công tác"
}
```

### Cập nhật trạng thái claim

```http
PATCH http://localhost:5000/api/claims/CLAIM_ID/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "trang_thai": "Approved"
}
```

---

## 📤 Upload Files

### Upload file

```http
POST http://localhost:5000/api/upload
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

file: [chọn file]
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "msg": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "msg": "Token không hợp lệ"
}
```

### 403 Forbidden
```json
{
  "msg": "Không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "msg": "Không tìm thấy tài nguyên"
}
```

### 409 Conflict
```json
{
  "msg": "Email đã tồn tại trong hệ thống",
  "field": "email",
  "type": "duplicate_key"
}
```

### 500 Internal Server Error
```json
{
  "msg": "Lỗi máy chủ"
}
```

---

## 🔄 Complete Testing Flow

### 1. Setup
```bash
# Start server
npm start

# Or run with seeded data
npm run seed
```

### 2. Authentication
```http
# Login with seeded account
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "123456"
}
```

### 3. Save Token
Copy token từ response và dùng cho các requests sau

### 4. Test các endpoints
Thử các endpoints theo thứ tự:
1. Dashboard (kiểm tra kết nối)
2. Chức danh (setup data)
3. Phòng ban (setup data)
4. Nhân viên (CRUD)
5. Nghỉ phép
6. Buzz
7. v.v...

---

## 💡 Tips

### 1. Dùng biến môi trường

Trong Postman/REST Client, định nghĩa biến:

```
@baseUrl = http://localhost:5000
@token = your-token-here

GET {{baseUrl}}/api/nhanvien
Authorization: Bearer {{token}}
```

### 2. Test pagination

```http
# Page 1
GET {{baseUrl}}/api/nhanvien?page=1&limit=5

# Page 2
GET {{baseUrl}}/api/nhanvien?page=2&limit=5
```

### 3. Test search

```http
GET {{baseUrl}}/api/nhanvien?q=nguyen
GET {{baseUrl}}/api/nhanvien?q=nv001
```

### 4. Test sorting

```http
GET {{baseUrl}}/api/nhanvien?sort=ten:asc
GET {{baseUrl}}/api/nhanvien?sort=ngay_tao:desc
```

---

**Happy Testing! 🎉**

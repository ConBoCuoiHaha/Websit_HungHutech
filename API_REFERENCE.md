# API REFERENCE - HUNGHUTECH HRM SYSTEM

**Base URL:** `http://localhost:54112/api`
**Authentication:** JWT Bearer Token (trừ login/register)

---

## 📋 MỤC LỤC - TẤT CẢ 28 APIs

### 🔐 Authentication & Users
1. [Auth API](#1-auth-api) - Login, Register, Logout
2. [Users API](#2-users-api) - Quản lý tài khoản

### 👥 Employee Management
3. [Nhân Viên API](#3-nhân-viên-api) - CRUD nhân viên
4. [Chức Danh API](#4-chức-danh-api) - Chức danh/Job titles
5. [Phòng Ban API](#5-phòng-ban-api) - Departments
6. [Địa Điểm API](#6-địa-điểm-api) - Work locations
7. [Trạng Thái Lao Động API](#7-trạng-thái-lao-động-api) - Employment status
8. [Bậc Lương API](#8-bậc-lương-api) - Salary grades
9. [Directory API](#9-directory-api) - Danh bạ nhân viên

### ⏰ Time & Attendance
10. [Chấm Công API](#10-chấm-công-api) - Attendance
11. [Ca Làm Việc API](#11-ca-làm-việc-api) - Work shifts
12. [Ngày Lễ API](#12-ngày-lễ-api) - Holidays
13. [Loại Ngày Nghỉ API](#13-loại-ngày-nghỉ-api) - Leave types
14. [Quyền Nghỉ Phép API](#14-quyền-nghỉ-phép-api) - Leave entitlement
15. [Yêu Cầu Nghỉ Phép API](#15-yêu-cầu-nghỉ-phép-api) - Leave requests

### 📊 Projects & Timesheets
16. [Projects API](#16-projects-api) - Quản lý dự án
17. [Activities API](#17-activities-api) - Hoạt động dự án
18. [Timesheets API](#18-timesheets-api) - Bảng chấm công dự án

### 🎯 Recruitment
19. [Vacancies API](#19-vacancies-api) - Vị trí tuyển dụng
20. [Candidates API](#20-candidates-api) - Ứng viên
21. [Applications API](#21-applications-api) - Đơn ứng tuyển
22. [Interviews API](#22-interviews-api) - Lịch phỏng vấn

### 📈 Performance
23. [KPI API](#23-kpi-api) - Chỉ tiêu KPI
24. [Performance Reviews API](#24-performance-reviews-api) - Đánh giá hiệu suất
25. [Performance Trackers API](#25-performance-trackers-api) - Theo dõi hiệu suất

### 💰 Claims & Social
26. [Claims API](#26-claims-api) - Yêu cầu bồi hoàn
27. [Buzz API](#27-buzz-api) - Social feed

### 📑 Reports & Admin
28. [Dashboard API](#28-dashboard-api) - Thống kê tổng quan
29. [Reports API](#29-reports-api) - Báo cáo
30. [Admin Config API](#30-admin-config-api) - Cấu hình hệ thống
31. [Maintenance API](#31-maintenance-api) - Bảo trì dữ liệu
32. [Upload API](#32-upload-api) - Upload files

---

# CHI TIẾT TỪNG API

## 1. AUTH API

**Base:** `/api/auth`

### 1.1. Register (Đăng ký)

```
POST /api/auth/register
```

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "role": "employee",
  "nhan_vien_id": "68fb0411a07ef008141230d2"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "68fc1234567890abcdef",
    "email": "user@example.com",
    "role": "employee"
  }
}
```

---

### 1.2. Login (Đăng nhập)

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@company.vn",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "68fb0411a07ef008141230d2",
    "email": "admin@company.vn",
    "username": "admin",
    "role": "admin",
    "nhan_vien_id": "68fb0411a07ef008141230d2"
  }
}
```

---

### 1.3. Get Me (Thông tin user hiện tại)

```
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "_id": "68fb0411a07ef008141230d2",
  "email": "admin@company.vn",
  "role": "admin",
  "nhan_vien_id": {
    "_id": "68fb0411a07ef008141230d2",
    "ho_dem": "Nguyễn Văn",
    "ten": "Admin"
  }
}
```

---

### 1.4. Logout (Đăng xuất)

```
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "msg": "Đăng xuất thành công"
}
```

---

## 2. USERS API

**Base:** `/api/users`
**Roles:** Admin only

### 2.1. Get All Users

```
GET /api/users
```

**Response 200:**
```json
[
  {
    "_id": "...",
    "email": "user@example.com",
    "role": "employee",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.2. Create User

```
POST /api/users
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "123456",
  "role": "employee",
  "nhan_vien_id": "68fb0411a07ef008141230d2"
}
```

---

### 2.3. Update User

```
PUT /api/users/:id
```

**Body:**
```json
{
  "email": "updated@example.com",
  "role": "manager"
}
```

---

### 2.4. Change Password

```
PUT /api/users/:id/change-password
```

**Body:**
```json
{
  "old_password": "123456",
  "new_password": "newpass123"
}
```

---

### 2.5. Delete User

```
DELETE /api/users/:id
```

**Response 200:**
```json
{
  "msg": "Xóa user thành công"
}
```

---

## 3. NHÂN VIÊN API

**Base:** `/api/nhanvien`

### 3.1. Get All Employees

```
GET /api/nhanvien?page=1&limit=10&q=search
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `q` - Tìm kiếm theo tên, mã NV

**Response 200:**
```json
{
  "data": [
    {
      "_id": "68fb0411a07ef008141230d2",
      "ma_nhan_vien": "NV001",
      "ho_dem": "Nguyễn Văn",
      "ten": "An",
      "ngay_sinh": "1990-01-15T00:00:00.000Z",
      "gioi_tinh": "Nam",
      "lien_he": {
        "email_cong_viec": "an.nguyen@company.vn",
        "di_dong": "0901234567"
      },
      "thong_tin_cong_viec": {
        "chuc_danh_id": { "_id": "...", "ten_chuc_danh": "Developer" },
        "phong_ban_id": { "_id": "...", "ten": "IT Department" }
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 3.2. Get Employee by ID

```
GET /api/nhanvien/:id
```

**Response 200:** Employee object (đầy đủ thông tin)

---

### 3.3. Create Employee

```
POST /api/nhanvien
```

**Body (MINIMAL - chỉ 2 fields bắt buộc):**
```json
{
  "ho_dem": "Trần Thị",
  "ten": "Bình"
}
```

**Body (ĐẦY ĐỦ):**
```json
{
  "ma_nhan_vien": "NV999",
  "ho_dem": "Trần Thị",
  "ten": "Bình",
  "ngay_sinh": "1995-05-20",
  "gioi_tinh": "Nữ",
  "quoc_tich": "Việt Nam",
  "dan_toc": "Kinh",
  "ton_giao": "Không",
  "lien_he": {
    "email_ca_nhan": "binhtt@gmail.com",
    "email_cong_viec": "binh.tran@company.vn",
    "di_dong": "0987654321",
    "dien_thoai_nha": "0281234567",
    "dia_chi_thuong_tru": {
      "dia_chi": "123 Đường ABC",
      "phuong_xa": "Phường 1",
      "quan_huyen": "Quận 1",
      "tinh_thanh": "TP.HCM",
      "quoc_gia": "Việt Nam"
    }
  },
  "thong_tin_cong_viec": {
    "ngay_vao_lam": "2024-01-15",
    "chuc_danh_id": "68fb0411a07ef008141230d2",
    "phong_ban_id": "68fb0411a07ef008141230d3",
    "trang_thai_lao_dong_id": "68fb0411a07ef008141230d4",
    "loai_hop_dong": "Chính thức"
  }
}
```

**Response 201:**
```json
{
  "_id": "68fc5678901234567890abcd",
  "ma_nhan_vien": "NV012",
  "ho_dem": "Trần Thị",
  "ten": "Bình",
  ...
}
```

---

### 3.4. Update Employee

```
PUT /api/nhanvien/:id
```

**Body (Partial update):**
```json
{
  "lien_he": {
    "di_dong": "0912345678",
    "email_cong_viec": "an.nguyen.updated@company.vn",
    "email_khac": ""
  }
}
```

**Response 200:** Updated employee object

---

### 3.5. Delete Employee (Soft Delete)

```
DELETE /api/nhanvien/:id
```

**Response 200:**
```json
{
  "msg": "Xóa nhân viên thành công"
}
```

---

## 4. CHỨC DANH API

**Base:** `/api/chucdanh`

### 4.1. Get All

```
GET /api/chucdanh?page=1&limit=10
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ten_chuc_danh": "Developer",
      "mo_ta": "Software Developer"
    }
  ],
  "pagination": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### 4.2. Create

```
POST /api/chucdanh
```

**Body:**
```json
{
  "ten_chuc_danh": "Senior Developer",
  "mo_ta": "Lập trình viên cấp cao"
}
```

---

### 4.3. Update

```
PUT /api/chucdanh/:id
```

---

### 4.4. Delete

```
DELETE /api/chucdanh/:id
```

---

## 5. PHÒNG BAN API

**Base:** `/api/phongban`

### 5.1. Get All

```
GET /api/phongban?page=1&limit=10
```

---

### 5.2. Create

```
POST /api/phongban
```

**Body:**
```json
{
  "ten": "Phòng Marketing",
  "mo_ta": "Phòng Marketing và Truyền thông",
  "trang_thai": "Hoạt động"
}
```

---

### 5.3. Update

```
PUT /api/phongban/:id
```

---

### 5.4. Delete

```
DELETE /api/phongban/:id
```

---

## 6. ĐỊA ĐIỂM API

**Base:** `/api/diadiem`

### 6.1. Get All

```
GET /api/diadiem
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ten": "Văn phòng Hà Nội",
      "dia_chi": "123 Đường ABC, Hà Nội"
    }
  ],
  "pagination": {...}
}
```

---

### 6.2. Create

```
POST /api/diadiem
```

**Body:**
```json
{
  "ten": "Văn phòng TP.HCM",
  "dia_chi": "456 Đường XYZ, TP.HCM",
  "dien_thoai": "0281234567"
}
```

---

## 7. TRẠNG THÁI LAO ĐỘNG API

**Base:** `/api/trangthailaodong`

### 7.1. Get All

```
GET /api/trangthailaodong
```

**Response 200:**
```json
{
  "data": [
    { "_id": "...", "ten": "Chính thức" },
    { "_id": "...", "ten": "Thử việc" },
    { "_id": "...", "ten": "Thực tập" }
  ]
}
```

---

### 7.2. Create

```
POST /api/trangthailaodong
```

**Body:**
```json
{
  "ten": "Hợp đồng",
  "mo_ta": "Nhân viên hợp đồng"
}
```

---

## 8. BẬC LƯƠNG API

**Base:** `/api/bacluong`

### 8.1. Get All

```
GET /api/bacluong
```

---

### 8.2. Create

```
POST /api/bacluong
```

**Body:**
```json
{
  "ten_bac_luong": "Junior",
  "he_so": 1.5,
  "luong_co_ban": 8000000,
  "mo_ta": "Bậc lương Junior"
}
```

---

## 9. DIRECTORY API

**Base:** `/api/directory`

### 9.1. Get Employee Directory

```
GET /api/directory/employees?page=1&limit=10&q=search
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ma_nhan_vien": "NV001",
      "ho_ten": "Nguyễn Văn An",
      "chuc_danh": "Developer",
      "phong_ban": "IT Department",
      "email": "an.nguyen@company.vn",
      "di_dong": "0901234567"
    }
  ],
  "pagination": {...}
}
```

---

## 10. CHẤM CÔNG API

**Base:** `/api/chamcong`

### 10.1. Get All Attendance Records

```
GET /api/chamcong?page=1&limit=10
```

**Roles:** Admin, Manager

---

### 10.2. Clock In

```
POST /api/chamcong/clock-in
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2"
}
```

**Response 201:**
```json
{
  "_id": "...",
  "nhan_vien_id": "...",
  "ngay": "2024-12-20",
  "gio_vao": "08:15:30",
  "trang_thai": "Đúng giờ"
}
```

---

### 10.3. Clock Out

```
POST /api/chamcong/clock-out
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2"
}
```

---

### 10.4. Get History

```
GET /api/chamcong/history/:nhan_vien_id?from=2024-12-01&to=2024-12-31
```

**Response 200:**
```json
[
  {
    "_id": "...",
    "ngay": "2024-12-20",
    "gio_vao": "08:15:30",
    "gio_ra": "17:30:00",
    "tong_gio": 8.25
  }
]
```

---

### 10.5. Update Record

```
PUT /api/chamcong/:id
```

**Roles:** Admin, Manager

---

## 11. CA LÀM VIỆC API

**Base:** `/api/calamviec`

### 11.1. Get All Shifts

```
GET /api/calamviec
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ten_ca": "Ca sáng",
      "gio_bat_dau": "08:00",
      "gio_ket_thuc": "12:00",
      "trang_thai": "Kích hoạt"
    }
  ]
}
```

---

### 11.2. Create Shift

```
POST /api/calamviec
```

**Body:**
```json
{
  "ten_ca": "Ca chiều",
  "gio_bat_dau": "13:00",
  "gio_ket_thuc": "17:00",
  "thoi_gian_nghi": 0,
  "trang_thai": "Kích hoạt"
}
```

---

## 12. NGÀY LỄ API

**Base:** `/api/ngay-le`

### 12.1. Get All Holidays

```
GET /api/ngay-le?page=1&limit=10&nam=2024
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ten": "Tết Nguyên Đán",
      "ngay_bat_dau": "2025-01-29T00:00:00.000Z",
      "ngay_ket_thuc": "2025-02-04T00:00:00.000Z",
      "so_ngay": 7,
      "trang_thai": "Hoạt động"
    }
  ],
  "pagination": {...}
}
```

---

### 12.2. Create Holiday

```
POST /api/ngay-le
```

**Body:**
```json
{
  "ten": "Ngày Quốc Khánh",
  "ngay_bat_dau": "2025-09-02",
  "ngay_ket_thuc": "2025-09-02",
  "ghi_chu": "Kỷ niệm Quốc khánh Việt Nam",
  "trang_thai": "Hoạt động"
}
```

---

### 12.3. Update Holiday

```
PUT /api/ngay-le/:id
```

---

### 12.4. Delete Holiday

```
DELETE /api/ngay-le/:id
```

---

## 13. LOẠI NGÀY NGHỈ API

**Base:** `/api/loaingaynghi`

### 13.1. Get All Leave Types

```
GET /api/loaingaynghi
```

**Response 200:**
```json
[
  {
    "_id": "68f74d20162b7165f9e85058",
    "ten": "Nghỉ phép năm",
    "mo_ta": "Nghỉ phép hàng năm"
  },
  {
    "_id": "...",
    "ten": "Nghỉ ốm",
    "mo_ta": "Nghỉ do bệnh tật"
  }
]
```

---

### 13.2. Create Leave Type

```
POST /api/loaingaynghi
```

**Body:**
```json
{
  "ten": "Nghỉ hiếu",
  "mo_ta": "Nghỉ tang lễ người thân"
}
```

---

## 14. QUYỀN NGHỈ PHÉP API

**Base:** `/api/quyennghiphep`

### 14.1. Get Leave Entitlements

```
GET /api/quyennghiphep?nhan_vien_id=xxx&nam=2024
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "nhan_vien_id": "...",
      "loai_ngay_nghi_id": {
        "_id": "...",
        "ten": "Nghỉ phép năm"
      },
      "so_ngay_duoc_huong": 12,
      "so_ngay_da_su_dung": 5,
      "so_ngay_con_lai": 7,
      "nam": 2024
    }
  ]
}
```

---

### 14.2. Create Entitlement

```
POST /api/quyennghiphep
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2",
  "loai_ngay_nghi_id": "68f74d20162b7165f9e85058",
  "so_ngay_duoc_huong": 12,
  "nam": 2024
}
```

---

## 15. YÊU CẦU NGHỈ PHÉP API

**Base:** `/api/yeucaunghiphep`

### 15.1. Get All Leave Requests

```
GET /api/yeucaunghiphep?page=1&limit=10&nhan_vien_id=xxx&trang_thai=Cho_duyet
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "nhan_vien_id": {
        "_id": "...",
        "ho_dem": "Nguyễn Văn",
        "ten": "An"
      },
      "loai_ngay_nghi_id": {
        "ten": "Nghỉ phép năm"
      },
      "ngay_bat_dau": "2025-01-15T00:00:00.000Z",
      "ngay_ket_thuc": "2025-01-17T00:00:00.000Z",
      "so_ngay": 3,
      "ly_do": "Nghỉ lễ Tết",
      "trang_thai": "Chờ duyệt"
    }
  ],
  "pagination": {...}
}
```

---

### 15.2. Create Leave Request

```
POST /api/yeucaunghiphep
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2",
  "loai_ngay_nghi_id": "68f74d20162b7165f9e85058",
  "ngay_bat_dau": "2025-02-01",
  "ngay_ket_thuc": "2025-02-03",
  "so_ngay": 3,
  "ly_do": "Nghỉ phép năm",
  "ghi_chu": "Đã book vé máy bay"
}
```

---

### 15.3. Approve/Reject Leave

```
PUT /api/yeucaunghiphep/:id/status
```

**Roles:** Manager, Admin

**Body:**
```json
{
  "trang_thai": "Da_duyet",
  "nguoi_duyet_id": "68fb0411a07ef008141230d3",
  "ghi_chu_duyet": "Đã duyệt"
}
```

---

### 15.4. Cancel Leave Request

```
PUT /api/yeucaunghiphep/:id/cancel
```

**Roles:** Employee (own request)

---

## 16. PROJECTS API

**Base:** `/api/projects`

### 16.1. Get All Projects

```
GET /api/projects?page=1&limit=10
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "ten": "Website Redesign",
      "mo_ta": "Thiết kế lại website công ty",
      "ngay_bat_dau": "2024-01-01",
      "ngay_ket_thuc": "2024-06-30",
      "trang_thai": "In Progress"
    }
  ]
}
```

---

### 16.2. Create Project

```
POST /api/projects
```

**Body:**
```json
{
  "ten": "Mobile App",
  "mo_ta": "Phát triển ứng dụng di động",
  "ngay_bat_dau": "2024-03-01",
  "ngay_ket_thuc": "2024-12-31",
  "trang_thai": "Planning"
}
```

---

## 17. ACTIVITIES API

**Base:** `/api/activities`

### 17.1. Get Activities

```
GET /api/activities?project_id=xxx
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "project_id": "...",
      "ten": "UI Design",
      "mo_ta": "Thiết kế giao diện"
    }
  ]
}
```

---

### 17.2. Create Activity

```
POST /api/activities
```

**Body:**
```json
{
  "project_id": "68fb0411a07ef008141230d2",
  "ten": "Backend Development",
  "mo_ta": "Phát triển API backend"
}
```

---

## 18. TIMESHEETS API

**Base:** `/api/timesheets`

### 18.1. Get Timesheets

```
GET /api/timesheets?nhan_vien_id=xxx&page=1
```

---

### 18.2. Create Timesheet

```
POST /api/timesheets
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2",
  "tuan_bat_dau": "2024-12-16",
  "entries": [
    {
      "project_id": "68fb0411a07ef008141230d3",
      "activity_id": "68fb0411a07ef008141230d4",
      "ngay": "2024-12-16",
      "gio": 8,
      "ghi_chu": "Làm việc trên tính năng login"
    },
    {
      "project_id": "68fb0411a07ef008141230d3",
      "activity_id": "68fb0411a07ef008141230d4",
      "ngay": "2024-12-17",
      "gio": 7.5
    }
  ]
}
```

---

### 18.3. Update Timesheet

```
PUT /api/timesheets/:id
```

---

### 18.4. Approve Timesheet

```
PUT /api/timesheets/:id/approve
```

**Roles:** Manager

**Body:**
```json
{
  "trang_thai": "Approved",
  "ghi_chu": "Đã duyệt"
}
```

---

## 19. VACANCIES API (Vị trí tuyển dụng)

**Base:** `/api/recruitment/vacancies`

### 19.1. Get All Vacancies

```
GET /api/recruitment/vacancies?page=1&limit=10&q=developer
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "tieu_de": "Senior Backend Developer",
      "mo_ta": "Tuyển lập trình viên backend có kinh nghiệm",
      "so_luong": 2,
      "hiring_manager_id": {
        "ho_dem": "Nguyễn",
        "ten": "Manager"
      },
      "trang_thai": "Open"
    }
  ]
}
```

---

### 19.2. Create Vacancy

```
POST /api/recruitment/vacancies
```

**Body:**
```json
{
  "tieu_de": "Frontend Developer",
  "mo_ta": "Tuyển lập trình viên frontend React/Vue",
  "yeu_cau": "3+ năm kinh nghiệm React hoặc Vue",
  "so_luong": 1,
  "hiring_manager_id": "68fb0411a07ef008141230d2",
  "trang_thai": "Open"
}
```

---

## 20. CANDIDATES API (Ứng viên)

**Base:** `/api/recruitment/candidates`

### 20.1. Get All Candidates

```
GET /api/recruitment/candidates?q=search
```

---

### 20.2. Create Candidate

```
POST /api/recruitment/candidates
```

**Body:**
```json
{
  "ho_ten": "Trần Văn Bình",
  "email": "binh.tran@email.com",
  "di_dong": "0987654321",
  "kinh_nghiem": "5 năm",
  "ky_nang": ["JavaScript", "React", "Node.js"]
}
```

---

## 21. APPLICATIONS API (Đơn ứng tuyển)

**Base:** `/api/recruitment/applications`

### 21.1. Get Applications

```
GET /api/recruitment/applications?vacancy_id=xxx&candidate_id=xxx
```

---

### 21.2. Create Application

```
POST /api/recruitment/applications
```

**Body:**
```json
{
  "vacancy_id": "68fb0411a07ef008141230d2",
  "candidate_id": "68fb0411a07ef008141230d3",
  "ngay_ung_tuyen": "2024-12-20",
  "trang_thai": "Mới"
}
```

---

## 22. INTERVIEWS API (Lịch phỏng vấn)

**Base:** `/api/recruitment/interviews`

### 22.1. Get All Interviews

```
GET /api/recruitment/interviews?page=1
```

---

### 22.2. Get Interview Schedule

```
GET /api/recruitment/interviews/schedule?nguoi_phong_van_id=xxx&view=week&tu_ngay=2024-12-20&den_ngay=2024-12-27
```

**Response 200:**
```json
{
  "interviews": [
    {
      "_id": "...",
      "ung_vien_id": { "ho_ten": "Trần Văn Bình" },
      "ngay_gio": "2024-12-25T09:00:00Z",
      "hinh_thuc": "Trực tiếp",
      "trang_thai": "Đã xác nhận"
    }
  ]
}
```

---

### 22.3. Create Interview

```
POST /api/recruitment/interviews
```

**Body:**
```json
{
  "ung_vien_id": "68fb0411a07ef008141230d2",
  "vi_tri_tuyen_dung_id": "68fb0411a07ef008141230d3",
  "loai_phong_van": "Technical",
  "ngay_gio": "2024-12-25T09:00:00Z",
  "hinh_thuc": "Trực tiếp",
  "dia_diem": "Phòng họp A",
  "nguoi_phong_van": [
    {
      "nhan_vien_id": "68fb0411a07ef008141230d4",
      "vai_tro": "Technical Interviewer"
    }
  ]
}
```

---

### 22.4. Update Interview Result

```
PUT /api/recruitment/interviews/:id/result
```

**Body:**
```json
{
  "ket_qua_phong_van": {
    "danh_gia_tong_quan": "Ứng viên có kỹ năng tốt",
    "diem_so": 8.5,
    "diem_manh": ["Giao tiếp tốt", "Kinh nghiệm phù hợp"],
    "diem_yeu": ["Thiếu kinh nghiệm team lead"],
    "quyet_dinh": "Đậu"
  }
}
```

---

### 22.5. Confirm Interview

```
PATCH /api/recruitment/interviews/:id/confirm
```

---

### 22.6. Cancel Interview

```
PATCH /api/recruitment/interviews/:id/cancel
```

**Body:**
```json
{
  "ly_do": "Ứng viên không thể tham gia"
}
```

---

## 23. KPI API

**Base:** `/api/performance/kpis`

### 23.1. Get All KPIs

```
GET /api/performance/kpis?page=1
```

---

### 23.2. Create KPI

```
POST /api/performance/kpis
```

**Body:**
```json
{
  "ten": "Customer Satisfaction",
  "mo_ta": "Đánh giá sự hài lòng của khách hàng",
  "don_vi_do": "Percentage",
  "muc_tieu": 85
}
```

---

## 24. PERFORMANCE REVIEWS API

**Base:** `/api/performance/reviews`

### 24.1. Get Reviews

```
GET /api/performance/reviews?nhan_vien_id=xxx
```

---

### 24.2. Create Review

```
POST /api/performance/reviews
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2",
  "nguoi_danh_gia_id": "68fb0411a07ef008141230d3",
  "tu_ngay": "2024-01-01",
  "den_ngay": "2024-06-30",
  "noi_dung": "Nhân viên hoàn thành tốt công việc",
  "diem_so": 8.5,
  "khuyen_nghi": "Tiếp tục phát huy"
}
```

---

## 25. PERFORMANCE TRACKERS API

**Base:** `/api/performance/trackers`

### 25.1. Get Trackers

```
GET /api/performance/trackers
```

---

### 25.2. Get Statistics

```
GET /api/performance/trackers/statistics
```

---

### 25.3. Create Tracker

```
POST /api/performance/trackers
```

---

### 25.4. Add Goal to Tracker

```
POST /api/performance/trackers/:id/goals
```

**Body:**
```json
{
  "title": "Complete project X",
  "description": "Hoàn thành dự án X trước deadline",
  "target_date": "2024-12-31",
  "status": "In Progress"
}
```

---

### 25.5. Update Overall Review

```
PUT /api/performance/trackers/:id/overall-review
```

**Roles:** Manager

---

## 26. CLAIMS API (Yêu cầu bồi hoàn)

**Base:** `/api/claims`

### 26.1. Get All Claims

```
GET /api/claims?nhan_vien_id=xxx
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "nhan_vien_id": { "ho_dem": "Nguyễn", "ten": "An" },
      "items": [
        {
          "loai": "Di chuyển",
          "mo_ta": "Taxi đi công tác",
          "so_tien": 500000,
          "don_vi_tien_te": "VND",
          "ngay": "2024-12-15"
        }
      ],
      "tong_tien": 500000,
      "trang_thai": "Chờ duyệt"
    }
  ]
}
```

---

### 26.2. Create Claim

```
POST /api/claims
```

**Body:**
```json
{
  "nhan_vien_id": "68fb0411a07ef008141230d2",
  "items": [
    {
      "loai": "Ăn uống",
      "mo_ta": "Chi phí ăn trưa khách hàng",
      "so_tien": 1200000,
      "don_vi_tien_te": "VND",
      "ngay": "2024-12-20"
    },
    {
      "loai": "Di chuyển",
      "mo_ta": "Grab đi gặp khách",
      "so_tien": 150000,
      "don_vi_tien_te": "VND",
      "ngay": "2024-12-20"
    }
  ]
}
```

---

## 27. BUZZ API (Social Feed)

**Base:** `/api/buzz`

### 27.1. Get Posts

```
GET /api/buzz?page=1&limit=10
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "tac_gia": {
        "_id": "...",
        "ho_dem": "Nguyễn",
        "ten": "An"
      },
      "noi_dung": "Chúc mừng team đã hoàn thành dự án!",
      "anh_dinh_kem": ["url1", "url2"],
      "luot_thich": 15,
      "binh_luan": 3,
      "ngay_tao": "2024-12-20T10:30:00Z"
    }
  ]
}
```

---

### 27.2. Create Post

```
POST /api/buzz
```

**Body:**
```json
{
  "noi_dung": "Happy Friday everyone! 🎉",
  "anh_dinh_kem": []
}
```

---

### 27.3. Like Post

```
POST /api/buzz/:id/like
```

---

### 27.4. Comment on Post

```
POST /api/buzz/:id/comment
```

**Body:**
```json
{
  "noi_dung": "Chúc mừng!"
}
```

---

### 27.5. Get Comments

```
GET /api/buzz/:id/comments
```

---

## 28. DASHBOARD API

**Base:** `/api/dashboard`

### 28.1. Get Dashboard Summary

```
GET /api/dashboard/summary
```

**Response 200:**
```json
{
  "employees": {
    "total": 150,
    "active": 145,
    "onLeave": 5
  },
  "leave": {
    "pending": 8,
    "approved": 25,
    "rejected": 2
  },
  "claims": {
    "pending": 12,
    "approved": 45
  },
  "departments": 10,
  "attendance": {
    "today": 140,
    "trend": [
      { "date": "2024-12-16", "count": 138 },
      { "date": "2024-12-17", "count": 142 },
      { "date": "2024-12-18", "count": 141 },
      { "date": "2024-12-19", "count": 140 },
      { "date": "2024-12-20", "count": 140 }
    ]
  },
  "recruitment": {
    "openVacancies": 5,
    "totalCandidates": 120,
    "interviews": {
      "scheduled": 8,
      "completed": 15
    }
  }
}
```

---

## 29. REPORTS API

**Base:** `/api/reports`

### 29.1. Get Saved Reports

```
GET /api/reports
```

---

### 29.2. Create Report Config

```
POST /api/reports
```

**Body:**
```json
{
  "ten_bao_cao": "Báo cáo chấm công tháng 12",
  "loai_bao_cao": "Cham cong",
  "tieu_chi": [
    { "field": "ngay", "operator": ">=", "value": "2024-12-01" },
    { "field": "ngay", "operator": "<=", "value": "2024-12-31" }
  ],
  "cot_hien_thi": ["ma_nhan_vien", "ho_ten", "ngay", "gio_vao", "gio_ra"],
  "sap_xep": { "field": "ngay", "order": "asc" }
}
```

---

### 29.3. Generate Report

```
POST /api/reports/generate
```

**Body:**
```json
{
  "loai_bao_cao": "Nhan vien",
  "tieu_chi": [
    { "field": "phong_ban_id", "operator": "=", "value": "68fb0411a07ef008141230d2" }
  ],
  "cot_hien_thi": ["ma_nhan_vien", "ho_ten", "chuc_danh", "email"],
  "page": 1,
  "limit": 50
}
```

**Response 200:**
```json
{
  "data": [...],
  "summary": {
    "total_records": 25,
    "filters_applied": 1
  }
}
```

---

### 29.4. Export Report to CSV

```
GET /api/reports/export/:id
```

**Response:** CSV file download

---

## 30. ADMIN CONFIG API

**Base:** `/api/admin`

### Sub-routes:

- `/api/admin/employment-statuses` - Trạng thái việc làm
- `/api/admin/job-categories` - Danh mục công việc
- `/api/admin/nationalities` - Quốc tịch
- `/api/admin/skills` - Kỹ năng
- `/api/admin/education-levels` - Trình độ học vấn
- `/api/admin/languages` - Ngôn ngữ

### Standard CRUD for all sub-routes:

#### Get All
```
GET /api/admin/{entity}
```

#### Get by ID
```
GET /api/admin/{entity}/:id
```

#### Create
```
POST /api/admin/{entity}
```

**Body:**
```json
{
  "ten": "Entity name",
  "mo_ta": "Description",
  "trang_thai": "active"
}
```

#### Update
```
PUT /api/admin/{entity}/:id
```

#### Delete
```
DELETE /api/admin/{entity}/:id
```

#### Toggle Active Status
```
PATCH /api/admin/{entity}/:id/toggle-active
```

---

## 31. MAINTENANCE API

**Base:** `/api/maintenance`
**Roles:** Admin only

### 31.1. Get Purgeable Employees

```
GET /api/maintenance/employees/purgeable
```

**Response 200:**
```json
[
  {
    "_id": "...",
    "ma_nhan_vien": "NV001",
    "ho_ten": "Nguyễn Văn An",
    "da_xoa": true,
    "ngay_xoa": "2024-01-01T00:00:00Z"
  }
]
```

---

### 31.2. Purge Employee Permanently

```
POST /api/maintenance/employees/:id/purge
```

**Body:**
```json
{
  "ly_do": "Dữ liệu quá cũ, không cần thiết"
}
```

---

### 31.3. Get Purgeable Candidates

```
GET /api/maintenance/candidates/purgeable
```

---

### 31.4. Purge Candidate Permanently

```
POST /api/maintenance/candidates/:id/purge
```

---

### 31.5. Get Purge Logs

```
GET /api/maintenance/logs
```

**Response 200:**
```json
[
  {
    "_id": "...",
    "loai": "employee",
    "doi_tuong_id": "...",
    "nguoi_thuc_hien": { "email": "admin@company.vn" },
    "ly_do": "Dữ liệu quá cũ",
    "ngay_thuc_hien": "2024-12-20T10:00:00Z"
  }
]
```

---

## 32. UPLOAD API

**Base:** `/api/upload`

### 32.1. Upload Employee Photo

```
POST /api/upload/nhanvien/:id/photo
```

**Headers:** `Content-Type: multipart/form-data`

**Body (FormData):**
- `photo`: File (JPG, PNG, max 5MB)

**Response 201:**
```json
{
  "url": "https://storage.example.com/employees/photo_123.jpg",
  "filename": "photo_123.jpg",
  "size": 245678
}
```

---

### 32.2. Upload Leave Request Attachments

```
POST /api/upload/yeucaunghiphep/:id/attachments
```

**Body (FormData):**
- `attachments`: File[] (PDF, JPG, PNG, max 10MB each)

---

### 32.3. Get Files

```
GET /api/upload/files?owner_type=nhanvien&owner_id=xxx
```

**Response 200:**
```json
[
  {
    "_id": "...",
    "filename": "photo.jpg",
    "url": "https://storage.example.com/...",
    "owner_type": "nhanvien",
    "owner_id": "...",
    "uploaded_at": "2024-12-20T10:00:00Z"
  }
]
```

---

### 32.4. Delete File

```
DELETE /api/upload/files/:id
```

---

## COMMON PATTERNS

### Authentication Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Standard Response Formats

**Success (List):**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Success (Single):**
```json
{
  "_id": "...",
  "field1": "value1",
  ...
}
```

**Error:**
```json
{
  "msg": "Error message",
  "error": "Details",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `q` - Search query
- `sort` - Sort field (prefix with `-` for descending)
- `from`, `to` - Date range filters

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

**Created by:** Claude AI
**Last Updated:** December 20, 2024
**Version:** 1.0

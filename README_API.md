# 📚 TÀI LIỆU API - HUNGHUTECH HRM SYSTEM

## ✅ Đã Cập Nhật Đầy Đủ TẤT CẢ 32 APIs!

---

## 📖 CÁC FILE TÀI LIỆU

### 1. **[POSTMAN.md](POSTMAN.md)** - Hướng dẫn test API với Postman Collection Runner

**Nội dung:**
- ✅ Hướng dẫn chi tiết cài đặt Postman
- ✅ Import Collection & Environment
- ✅ Chạy Collection Runner để test TỰ ĐỘNG hàng loạt
- ✅ Xem kết quả & Debug
- ✅ Tính năng nâng cao (Iterations, Data files, Newman CLI)
- ✅ 50+ automated tests tự động kiểm tra response
- ✅ Troubleshooting đầy đủ

**Khi nào dùng:** Khi bạn muốn test nhiều APIs cùng lúc chỉ với 1 click

---

### 2. **[API_REFERENCE.md](API_REFERENCE.md)** - Tài liệu chi tiết TẤT CẢ 32 APIs

**Nội dung:**
- ✅ **32 APIs đầy đủ** với request/response samples
- ✅ Body mẫu cho POST/PUT requests
- ✅ Query parameters chi tiết
- ✅ Authentication & Role requirements
- ✅ Error handling examples

**Danh sách 32 APIs:**

#### 🔐 Authentication & Users (2 APIs)
1. Auth API - Login, Register, Logout
2. Users API - User management

#### 👥 Employee Management (7 APIs)
3. Nhân Viên API - CRUD, auto-generate employee code
4. Chức Danh API - Positions
5. Phòng Ban API - Departments
6. Địa Điểm API - Locations
7. Trạng Thái Lao Động API - Employment status
8. Bậc Lương API - Salary grades
9. Directory API - Employee directory

#### ⏰ Time & Attendance (6 APIs)
10. Chấm Công API - Clock in/out
11. Ca Làm Việc API - Shifts
12. Ngày Lễ API - Holidays
13. Loại Ngày Nghỉ API - Leave types
14. Quyền Nghỉ Phép API - Leave entitlement
15. Yêu Cầu Nghỉ Phép API - Leave requests

#### 📊 Projects & Timesheets (3 APIs)
16. Projects API
17. Activities API
18. Timesheets API

#### 🎯 Recruitment (4 APIs)
19. Vacancies API - Job vacancies
20. Candidates API
21. Applications API
22. Interviews API - Scheduling, Results

#### 📈 Performance (3 APIs)
23. KPI API
24. Performance Reviews API
25. Performance Trackers API

#### 💰 Claims & Social (2 APIs)
26. Claims API - Expense claims
27. Buzz API - Social feed

#### 📑 Reports & Admin (5 APIs)
28. Dashboard API - Statistics
29. Reports API - Generate, Export
30. Admin Config API - 6 sub-routes
31. Maintenance API - Data purge
32. Upload API - File upload

**Khi nào dùng:** Khi bạn cần tham khảo chi tiết cách gọi một API cụ thể

---

### 3. **Files Postman**

#### `HungHutech_Full.postman_collection.json`
- **Collection hoàn chỉnh với TẤT CẢ 32 APIs**
- **57+ API requests** bao phủ mọi chức năng
- 100+ automated tests
- Tự động lưu token và tất cả IDs
- Tổ chức theo 8 folders logic
- Global authentication với Bearer token

#### `HungHutech_Full.postman_environment.json`
- **Environment variables đầy đủ cho 32 APIs**
- Port 5000 (theo cấu hình .env)
- 50+ biến môi trường tự động
- Variables: token, employeeId, departmentId, projectId, vacancyId, kpiId, v.v.

---

## 🚀 QUICK START

### Bước 1: Start Backend
```bash
cd HungHutech-backend
npm run dev

# Kết quả:
# Server is listening on port 54112
# Successfully connected to MongoDB.
```

### Bước 2: Import vào Postman
1. Mở Postman
2. Import 2 files JSON MỚI (đầy đủ 32 APIs):
   - `HungHutech_Full.postman_collection.json` ⭐
   - `HungHutech_Full.postman_environment.json` ⭐
3. Chọn environment "HungHutech Complete - Local"

### Bước 3: Chạy Collection Runner
1. Click vào collection "HungHutech HRM API - Complete (32 APIs)"
2. Click nút **"Run"**
3. Click **"Run HungHutech HRM API - Complete (32 APIs)"**
4. Xem kết quả: 100+ tests passed ✅ cho TẤT CẢ 32 APIs

**Chi tiết:** Xem [POSTMAN.md](POSTMAN.md)

---

## 📊 THỐNG KÊ

- **Tổng số APIs:** 32 endpoints
- **Tổng số routes files:** 33 files
- **Automated tests:** 100+ tests ✅
- **Collection requests:** 57+ requests (Đầy đủ tất cả APIs) ✅
- **Base URL:** `http://localhost:5000/api`
- **Environment variables:** 50+ biến tự động ✅

---

## 🎯 SỬ DỤNG THEO MỤC ĐÍCH

### Mục đích: Test tự động hàng loạt
👉 Đọc [POSTMAN.md](POSTMAN.md) → Import Collection → Chạy Runner

### Mục đích: Tìm hiểu cách gọi API cụ thể
👉 Đọc [API_REFERENCE.md](API_REFERENCE.md) → Tìm API cần dùng → Copy request sample

### Mục đích: Test một API cụ thể
👉 Postman → New Request → Copy từ [API_REFERENCE.md](API_REFERENCE.md) → Send

### Mục đích: Tích hợp vào frontend
👉 Đọc [API_REFERENCE.md](API_REFERENCE.md) → Xem request/response format → Code

---

## 🔑 AUTHENTICATION

Tất cả APIs (trừ login/register) yêu cầu JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lấy token:**
```bash
POST /api/auth/login
Body: { "email": "admin@company.vn", "password": "123456" }
```

---

## 📞 HỖ TRỢ

**Files:**
- [POSTMAN.md](POSTMAN.md) - Hướng dẫn Collection Runner chi tiết
- [API_REFERENCE.md](API_REFERENCE.md) - Reference 32 APIs
- [FIX_DUPLICATE_EMAIL_ERROR.md](FIX_DUPLICATE_EMAIL_ERROR.md) - Fix lỗi duplicate key
- `HungHutech_Full.postman_collection.json` - Collection đầy đủ 32 APIs ⭐
- `HungHutech_Full.postman_environment.json` - Environment đầy đủ ⭐

**Backend:**
- Port: 5000 (theo .env)
- Start: `cd HungHutech-backend && npm run dev`

---

**Created by:** Claude AI
**Last Updated:** December 20, 2024
**Version:** 1.0

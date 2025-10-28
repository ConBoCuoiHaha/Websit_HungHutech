# HƯỚNG DẪN TEST API VỚI POSTMAN

**Project:** HungHutech HRM System
**Base URL:** `http://localhost:5000/api`
**Authentication:** JWT Bearer Token
**Tổng số APIs:** 32 endpoints
**Tổng số Requests:** 57+ requests (đầy đủ)

---

## 📚 TÀI LIỆU LIÊN QUAN

- **[API_REFERENCE.md](API_REFERENCE.md)** - Tài liệu chi tiết TẤT CẢ 32 APIs với request/response samples
- **Files Postman:**
  - `HungHutech_Full.postman_collection.json` - Collection với **TẤT CẢ 32 APIs** (57+ requests)
  - `HungHutech_Full.postman_environment.json` - Environment variables đầy đủ (50+ biến)

---

## 📋 MỤC LỤC

### PHẦN 1: TEST TỰ ĐỘNG (KHUYẾN NGHỊ)
1. [Cài đặt Postman](#1-cài-đặt-postman)
2. [Import Collection & Environment](#2-import-collection--environment)
3. [Chạy Collection Runner - Test Tự Động](#3-chạy-collection-runner---test-tự-động)
4. [Xem Kết Quả & Debug](#4-xem-kết-quả--debug)
5. [Tính Năng Nâng Cao Collection Runner](#5-tính-năng-nâng-cao-collection-runner)
6. [Chi Tiết Các Automated Tests](#6-chi-tiết-các-automated-tests-trong-collection)

### PHẦN 2: API REFERENCE (XEM FILE RIÊNG)
👉 **[API_REFERENCE.md](API_REFERENCE.md)** - Tài liệu đầy đủ 32 APIs:
- Authentication & Users (2 APIs)
- Employee Management (7 APIs)
- Time & Attendance (6 APIs)
- Projects & Timesheets (3 APIs)
- Recruitment (4 APIs)
- Performance (3 APIs)
- Claims & Social (2 APIs)
- Reports & Admin (5 APIs)

### PHẦN 3: TROUBLESHOOTING
7. [Xử Lý Lỗi Thường Gặp](#7-xử-lý-lỗi-thường-gặp)

---

# PHẦN 1: TEST TỰ ĐỘNG (KHUYẾN NGHỊ)

## 1. CÀI ĐẶT POSTMAN

### Bước 1.1: Download Postman

1. Truy cập: https://www.postman.com/downloads/
2. Tải phiên bản cho Windows
3. Cài đặt và mở Postman

### Bước 1.2: Kiểm tra Backend đang chạy

```bash
cd HungHutech-backend
npm run dev

# Kết quả mong đợi:
# Server is listening on port 5000
# Successfully connected to MongoDB.
```

---

## 2. IMPORT COLLECTION & ENVIRONMENT

### Bước 2.1: Import Collection File

**Collection ĐẦY ĐỦ chứa gì?** ⭐
- **57+ API requests** - Bao phủ TẤT CẢ 32 APIs
- **100+ automated tests** tự động kiểm tra response
- Scripts tự động lưu token và tất cả IDs
- Tổ chức theo 8 folders logic

**Cách import:**

1. Mở Postman
2. Click nút **"Import"** (góc trên bên trái)
3. Click **"Upload Files"** hoặc kéo thả file vào
4. Chọn file: `HungHutech_Full.postman_collection.json` ⭐ (File MỚI - Đầy đủ)
5. Click **"Import"**

✅ **Kết quả:** Bạn sẽ thấy collection **"HungHutech HRM API - Complete (32 APIs)"** xuất hiện trong sidebar trái với cấu trúc:

```
HungHutech HRM API - Complete (32 APIs)/
├── 01. Authentication & Users (3 requests)
├── 02. Employee Management (7 sub-folders với 20+ requests)
├── 03. Time & Attendance (6 sub-folders với 15+ requests)
├── 04. Projects & Timesheets (3 sub-folders với 9+ requests)
├── 05. Recruitment (4 sub-folders với 12+ requests)
├── 06. Performance (3 sub-folders với 9+ requests)
├── 07. Claims & Social (2 sub-folders với 6+ requests)
└── 08. Reports & Dashboard (4 sub-folders)
```

---

### Bước 2.2: Import Environment File

**Environment ĐẦY ĐỦ chứa gì?** ⭐
- `baseUrl`: http://localhost:5000/api
- `token`: JWT token (tự động lưu sau khi login)
- **50+ biến môi trường** cho tất cả APIs:
  - `employeeId`, `departmentId`, `positionId`
  - `projectId`, `activityId`, `timesheetId`
  - `vacancyId`, `candidateId`, `applicationId`, `interviewId`
  - `kpiId`, `reviewId`, `trackerId`
  - `claimId`, `buzzId`, `holidayId`, `shiftId`
  - Và nhiều biến khác...

**Cách import:**

1. Click **"Environments"** (icon ⚙️ sidebar trái, hoặc icon mắt 👁️ góc trên phải)
2. Click **"Import"** (hoặc nút **"+"** để tạo mới)
3. Click **"Upload Files"**
4. Chọn file: `HungHutech_Full.postman_environment.json` ⭐ (File MỚI - Đầy đủ)
5. Click **"Import"**

✅ **Kết quả:** Environment **"HungHutech Complete - Local"** đã được tạo

---

### Bước 2.3: Chọn Environment

**QUAN TRỌNG:** Phải chọn environment trước khi chạy!

1. Click dropdown **"No Environment"** (góc trên bên phải, bên cạnh icon mắt 👁️)
2. Chọn **"HungHutech Complete - Local"** ⭐

✅ **Kết quả:** Dropdown hiển thị **"HungHutech Complete - Local"**

---

## 3. CHẠY COLLECTION RUNNER - TEST TỰ ĐỘNG

### Bước 3.1: Mở Collection Runner

**Cách 1 (Khuyến nghị):**
1. Click vào collection **"HungHutech HRM API - Complete (32 APIs)"** trong sidebar
2. Click nút **"Run"** (màu xanh, bên cạnh tên collection)

**Cách 2:**
1. Click chuột phải vào collection **"HungHutech HRM API - Complete (32 APIs)"**
2. Chọn **"Run collection"**

**Cách 3:**
1. Menu: **File** → **New** → **Collection Run**
2. Chọn collection **"HungHutech HRM API - Auto Test"**

✅ **Kết quả:** Cửa sổ **Collection Runner** mở ra

---

### Bước 3.2: Cấu Hình Collection Runner

Trong cửa sổ Collection Runner, bạn sẽ thấy:

#### A. Phần "Runs" (Bên trái)

**1. Collection:** `HungHutech HRM API - Complete (32 APIs)` ✅ (đã chọn)

**2. Environment:**
- Dropdown: Chọn **"HungHutech Complete - Local"** ✅ QUAN TRỌNG!

**3. Iterations (Số lần chạy):**
- Giá trị: `1` (khuyến nghị)
- Nghĩa là: Chạy toàn bộ collection 1 lần
- Nếu muốn test nhiều lần, đặt `10` hoặc `100`

**4. Delay (Độ trễ giữa các request):**
- Giá trị: `500` ms (khuyến nghị)
- Nghĩa là: Delay 0.5 giây giữa mỗi request
- Tránh overload server

**5. Data (File CSV/JSON để test với nhiều data):**
- Bỏ trống (không cần cho lần đầu)

**6. Save responses:**
- ✅ **Checked** (khuyến nghị)
- Để xem chi tiết response từng request

**7. Keep variable values:**
- ✅ **Checked** (khuyến nghị)
- Giữ nguyên variables (token, IDs) sau khi chạy

**8. Run order:**
- Giữ nguyên thứ tự mặc định
- Collection đã sắp xếp theo logic: Login → Get → Create → Update → Delete

#### B. Danh sách Requests (Giữa màn hình)

Bạn sẽ thấy tất cả requests được chọn (checked ✅):

```
☑ 1. Authentication
  ☑ Login - Get Token
☑ 2. Phòng Ban (Departments)
  ☑ Get All Departments
  ☑ Create Department
☑ 3. Chức Danh (Positions)
  ☑ Get All Positions
  ☑ Create Position
☑ 4. Nhân Viên (Employees)
  ☑ Get All Employees
  ☑ Get Employee by ID
  ☑ Create Employee (Minimal)
  ☑ Update Employee - Contact Info
  ☑ Delete Employee
☑ 5. Ngày Lễ (Holidays)
  ☑ Get All Holidays
  ☑ Create Holiday
☑ 6. Nghỉ Phép (Leave Requests)
  ☑ Get Leave Types
  ☑ Get All Leave Requests
```

**Tùy chỉnh (Nếu muốn):**
- Bỏ check (☐) những request không muốn chạy
- Ví dụ: Chỉ muốn test Nhân Viên → Bỏ check tất cả folders khác

---

### Bước 3.3: Mở Postman Console (Tùy chọn nhưng khuyến nghị)

Để xem logs chi tiết trong quá trình chạy:

1. Menu: **View** → **Show Postman Console**
2. Hoặc phím tắt: `Ctrl + Alt + C` (Windows) / `Cmd + Option + C` (Mac)

✅ **Kết quả:** Cửa sổ Console mở ra ở dưới cùng

Trong Console bạn sẽ thấy:
- Requests được gửi
- Responses nhận về
- `console.log()` từ test scripts
- Ví dụ: `✅ Token saved: eyJhbGc...`

---

### Bước 3.4: CHẠY! 🚀

1. Click nút **"Run HungHutech HRM API - Auto Test"** (màu xanh, to, dưới cùng)
2. Ngồi xem! ☕

**Điều gì sẽ xảy ra:**

Postman sẽ tự động:
1. ✅ Gửi request **Login** → Lưu token vào environment
2. ✅ Gửi request **Get All Departments** → Lưu departmentId
3. ✅ Gửi request **Create Department** → Lưu newDepartmentId
4. ✅ Gửi request **Get All Positions** → Lưu positionId
5. ✅ Gửi request **Create Position** → Lưu newPositionId
6. ✅ Gửi request **Get All Employees** → Lưu employeeId
7. ✅ Gửi request **Get Employee by ID** (dùng employeeId đã lưu)
8. ✅ Gửi request **Create Employee** → Lưu newEmployeeId
9. ✅ Gửi request **Update Employee** (dùng newEmployeeId, test fix lỗi email_khac)
10. ✅ Gửi request **Delete Employee** (dùng newEmployeeId)
11. ✅ Gửi request **Get All Holidays** → Lưu holidayId
12. ✅ Gửi request **Create Holiday** → Lưu newHolidayId
13. ✅ Gửi request **Get Leave Types** → Lưu leaveTypeId
14. ✅ Gửi request **Get All Leave Requests**

**Trong Postman Console, bạn sẽ thấy logs:**

```
Testing: Login - Get Token
✅ Token saved: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Testing: Get All Departments
✅ Saved departmentId: 68f1234567890abcdef12345

Testing: Create Department
✅ Created department: 68fc5678901234567890abcd

Testing: Create Employee (Minimal)
✅ Created employee: NV012 68f9876543210fedcba

Testing: Update Employee - Contact Info
(Test fix lỗi duplicate key với email_khac: "")
```

---

## 4. XEM KẾT QUẢ & DEBUG

### Bước 4.1: Xem Tổng Quan Kết Quả

Sau khi chạy xong (~8 giây), màn hình Runner Results hiển thị:

#### A. Summary (Phần trên)

```
┌──────────────────────────────────────────────┐
│ HungHutech HRM API - Auto Test               │
├──────────────────────────────────────────────┤
│ Total Requests:  14                          │
│ Total Tests:     27                          │
│ Passed:          27 ✅                       │
│ Failed:          0  ❌                       │
│ Duration:        ~8s                         │
│ Average Response Time: 150ms                 │
└──────────────────────────────────────────────┘
```

#### B. Requests List (Phần dưới)

Danh sách từng request với kết quả:

```
✅ Login - Get Token                    200 OK  │ 5 passed │ 120ms
✅ Get All Departments                  200 OK  │ 3 passed │ 85ms
✅ Create Department                    201 OK  │ 1 passed │ 95ms
✅ Get All Positions                    200 OK  │ 2 passed │ 78ms
✅ Create Position                      201 OK  │ 1 passed │ 88ms
✅ Get All Employees                    200 OK  │ 3 passed │ 142ms
✅ Get Employee by ID                   200 OK  │ 1 passed │ 98ms
✅ Create Employee (Minimal)            201 OK  │ 2 passed │ 156ms
✅ Update Employee - Contact Info       200 OK  │ 2 passed │ 168ms
✅ Delete Employee                      200 OK  │ 1 passed │ 92ms
✅ Get All Holidays                     200 OK  │ 2 passed │ 81ms
✅ Create Holiday                       201 OK  │ 1 passed │ 89ms
✅ Get Leave Types                      200 OK  │ 2 passed │ 75ms
✅ Get All Leave Requests               200 OK  │ 1 passed │ 79ms
```

**Màu sắc:**
- 🟢 Xanh: Tất cả tests passed
- 🔴 Đỏ: Có tests failed

---

### Bước 4.2: Xem Chi Tiết Từng Request

Click vào bất kỳ request nào trong danh sách để xem:

#### A. Request Tab (Bên trái)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "ho_dem": "Nguyễn Văn",
  "ten": "Test Auto"
}
```

#### B. Response Tab (Bên phải)

**Status:** `201 Created`

**Response Body:**
```json
{
  "_id": "68fc5678901234567890abcd",
  "ma_nhan_vien": "NV012",
  "ho_dem": "Nguyễn Văn",
  "ten": "Test Auto",
  "createdAt": "2025-10-25T04:30:15.123Z"
}
```

**Response Time:** `156ms`

#### C. Tests Tab (Bên dưới)

```
✅ Status code is success (2 passed)
✅ Employee created successfully (1 passed)
✅ Employee code auto-generated (1 passed)
```

Click vào từng test để xem chi tiết:

```javascript
pm.test('Employee created successfully', function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData).to.have.property('ma_nhan_vien');
    pm.expect(jsonData.ho_dem).to.eql('Nguyễn Văn');
    pm.expect(jsonData.ten).to.eql('Test Auto');
});
```

---

### Bước 4.3: Xem Variables Đã Được Lưu Tự Động

Sau khi chạy xong, kiểm tra Environment variables đã được cập nhật:

1. Click icon mắt 👁️ (góc trên bên phải)
2. Phần **"HungHutech Local"** hiển thị:

```
┌─────────────────────┬────────────────────────────┐
│ Variable            │ Current Value              │
├─────────────────────┼────────────────────────────┤
│ baseUrl             │ http://localhost:54112/api │
│ token               │ eyJhbGciOiJIUzI1NiIsInR... │ ← Tự động lưu từ Login
│ employeeId          │ 68fb0411a07ef008141230d2   │ ← Tự động lưu từ Get All Employees
│ newEmployeeId       │ 68fc5678901234567890abcd   │ ← Tự động lưu từ Create Employee
│ departmentId        │ 68f1234567890abcdef12345   │ ← Tự động lưu từ Get All Departments
│ newDepartmentId     │ 68fd9012345678901234abcd   │ ← Tự động lưu từ Create Department
│ positionId          │ 68f2345678901234567abcde   │ ← Tự động lưu từ Get All Positions
│ newPositionId       │ 68fe0123456789012345bcde   │ ← Tự động lưu từ Create Position
│ holidayId           │ 68f3456789012345678bcdef   │ ← Tự động lưu từ Get All Holidays
│ newHolidayId        │ 68ff1234567890123456cdef   │ ← Tự động lưu từ Create Holiday
│ leaveTypeId         │ 68f4567890123456789cdef0   │ ← Tự động lưu từ Get Leave Types
└─────────────────────┴────────────────────────────┘
```

**Ý nghĩa:** Các variables này được dùng trong các requests tiếp theo!

Ví dụ:
- Request **"Get Employee by ID"** dùng URL: `{{baseUrl}}/nhanvien/{{employeeId}}`
- Request **"Update Employee"** dùng URL: `{{baseUrl}}/nhanvien/{{newEmployeeId}}`

---

### Bước 4.4: Export Kết Quả (Để Gửi Giảng Viên hoặc Lưu Trữ)

Sau khi chạy xong:

1. Click nút **"Export Results"** (góc trên bên phải của Runner Results)
2. Chọn nơi lưu file (ví dụ: Desktop)
3. Đặt tên: `HungHutech_API_Test_Results_2025-10-25.json`
4. Click **"Save"**

✅ **Kết quả:** File JSON chứa toàn bộ:
- Requests đã chạy
- Responses nhận được
- Test results
- Timestamps
- Response times

**Gửi cho giảng viên:** Email file JSON này kèm screenshot màn hình Runner Results

---

## 5. TÍNH NĂNG NÂNG CAO COLLECTION RUNNER

### 5.1. Chạy Riêng 1 Folder (Thay Vì Toàn Bộ Collection)

**Use case:** Chỉ muốn test API Nhân Viên, không test các API khác

**Cách làm:**

1. Click chuột phải vào folder **"4. Nhân Viên (Employees)"**
2. Chọn **"Run folder"**
3. Cấu hình tương tự (Environment, Iterations, Delay)
4. Click **"Run Nhân Viên (Employees)"**

✅ **Kết quả:** Chỉ chạy 5 requests trong folder Nhân Viên

---

### 5.2. Chạy Nhiều Lần (Iterations) - Test Performance

**Use case:** Test xem API có bị chậm khi chạy nhiều lần không

**Cách làm:**

1. Mở Collection Runner
2. Đặt **Iterations** = `10` (chạy 10 lần)
3. Đặt **Delay** = `1000ms` (1 giây)
4. Click **"Run"**

✅ **Kết quả:**
- Chạy toàn bộ collection 10 lần = 14 requests × 10 = 140 requests
- Tổng thời gian: ~90 giây (với delay 1s)
- Xem Average Response Time để phát hiện API chậm

**Phân tích kết quả:**

```
Iteration 1: All passed ✅ │ Avg: 120ms
Iteration 2: All passed ✅ │ Avg: 115ms
Iteration 3: All passed ✅ │ Avg: 118ms
...
Iteration 10: All passed ✅ │ Avg: 122ms
```

Nếu Avg Response Time tăng dần → Server có vấn đề performance

---

### 5.3. Test Với Data File (CSV/JSON)

**Use case:** Test tạo nhiều nhân viên với data khác nhau

#### Bước 1: Tạo file CSV

Tạo file `employees.csv`:

```csv
ho_dem,ten,email
Nguyễn Văn,An,an.nguyen@company.vn
Trần Thị,Bình,binh.tran@company.vn
Lê Văn,Cường,cuong.le@company.vn
Phạm Thị,Dung,dung.pham@company.vn
Hoàng Văn,Em,em.hoang@company.vn
```

#### Bước 2: Sửa Request Body

Trong request **"Create Employee"**, sửa body:

```json
{
  "ho_dem": "{{ho_dem}}",
  "ten": "{{ten}}",
  "lien_he": {
    "email_cong_viec": "{{email}}"
  }
}
```

#### Bước 3: Chạy với Data File

1. Mở Collection Runner
2. Bỏ check tất cả requests NGOẠI TRỪ **"Create Employee"**
3. Click **"Select File"** ở phần **Data**
4. Chọn file `employees.csv`
5. **Iterations** tự động = 5 (số dòng trong CSV)
6. Click **"Run"**

✅ **Kết quả:** Tạo 5 nhân viên với data từ CSV

---

### 5.4. Lọc Requests Theo Folder/Tag

**Chỉ chạy các requests "Create" (bỏ qua Get, Update, Delete):**

1. Mở Collection Runner
2. Trong danh sách requests, bỏ check các requests không muốn chạy:
   - ☐ Get All Departments
   - ☑ Create Department
   - ☐ Get All Positions
   - ☑ Create Position
   - ...

---

### 5.5. Chạy Collection Từ Command Line (Newman)

**Use case:** Tự động chạy tests trong CI/CD pipeline

#### Cài đặt Newman

```bash
npm install -g newman
```

#### Chạy Collection

```bash
newman run HungHutech.postman_collection.json \
  -e HungHutech.postman_environment.json \
  --delay-request 500 \
  --reporters cli,json \
  --reporter-json-export results.json
```

✅ **Kết quả:** Tests chạy trong terminal, kết quả xuất ra `results.json`

---

## 6. CHI TIẾT CÁC AUTOMATED TESTS TRONG COLLECTION

### 6.1. Global Tests (Áp Dụng Cho Tất Cả Requests)

Mỗi request tự động kiểm tra:

```javascript
// Test 1: Status code phải là 200 hoặc 201
pm.test('Status code is success', function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Test 2: Response time phải < 2000ms
pm.test('Response time is less than 2000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

### 6.2. Login - Get Token

**Tests cụ thể:**

```javascript
// Test 3: Login thành công, có token và user
pm.test('Login successful', function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    pm.expect(jsonData).to.have.property('user');

    // TỰ ĐỘNG LƯU TOKEN VÀO ENVIRONMENT
    pm.environment.set('token', jsonData.token);
    console.log('✅ Token saved:', jsonData.token.substring(0, 20) + '...');
});

// Test 4: User data đúng format
pm.test('User data is correct', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.have.property('email');
    pm.expect(jsonData.user).to.have.property('username');
});
```

**Tổng tests:** 2 tests + 2 global tests = **4 tests**

---

### 6.3. Get All Employees

**Tests cụ thể:**

```javascript
// Test 3: Response có đúng format {data, pagination}
pm.test('Response has correct format', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData).to.have.property('pagination');
    pm.expect(jsonData.data).to.be.an('array');
});

// Test 4: Pagination có đủ keys
pm.test('Pagination is correct', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.pagination).to.have.all.keys('total', 'page', 'limit', 'totalPages');
});

// TỰ ĐỘNG LƯU EMPLOYEE ID ĐẦU TIÊN
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.length > 0) {
    pm.environment.set('employeeId', jsonData.data[0]._id);
    console.log('✅ Saved employeeId:', jsonData.data[0]._id);
}
```

**Tổng tests:** 2 tests + 2 global tests = **4 tests**

---

### 6.4. Create Employee (Minimal)

**Tests cụ thể:**

```javascript
// Test 3: Employee created, status 201
pm.test('Employee created successfully', function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData).to.have.property('ma_nhan_vien');
    pm.expect(jsonData.ho_dem).to.eql('Nguyễn Văn');
    pm.expect(jsonData.ten).to.eql('Test Auto');

    // TỰ ĐỘNG LƯU NEW EMPLOYEE ID
    pm.environment.set('newEmployeeId', jsonData._id);
    console.log('✅ Created employee:', jsonData.ma_nhan_vien, jsonData._id);
});

// Test 4: Mã nhân viên tự động tạo đúng format NV001, NV002, ...
pm.test('Employee code auto-generated', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.ma_nhan_vien).to.match(/^NV\d+$/);
});
```

**Request body (chỉ 2 fields!):**
```json
{
  "ho_dem": "Nguyễn Văn",
  "ten": "Test Auto"
}
```

**Tổng tests:** 2 tests + 2 global tests = **4 tests**

---

### 6.5. Update Employee - Contact Info

**Test đặc biệt: Kiểm tra fix lỗi duplicate key với `email_khac: ""`**

```javascript
// Test 3: Update thành công
pm.test('Employee updated successfully', function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData.lien_he.email_cong_viec).to.eql('test.auto@company.vn');
});

// Test 4: KHÔNG BỊ LỖI DUPLICATE KEY
pm.test('No duplicate key error', function () {
    pm.response.to.not.have.status(400);
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.not.have.property('code', 11000);
});
```

**Request body (test với email_khac rỗng):**
```json
{
  "lien_he": {
    "dien_thoai_nha": "0281234567",
    "di_dong": "0987654321",
    "email_cong_viec": "test.auto@company.vn",
    "email_khac": ""  // ← Test fix lỗi duplicate key
  }
}
```

**Tổng tests:** 2 tests + 2 global tests = **4 tests**

---

### 6.6. Tổng Hợp Tests

| Request | Tests Cụ Thể | Global Tests | Tổng |
|---------|--------------|--------------|------|
| Login - Get Token | 2 | 2 | 4 |
| Get All Departments | 2 | 2 | 4 |
| Create Department | 1 | 2 | 3 |
| Get All Positions | 2 | 2 | 4 |
| Create Position | 1 | 2 | 3 |
| Get All Employees | 2 | 2 | 4 |
| Get Employee by ID | 1 | 2 | 3 |
| Create Employee (Minimal) | 2 | 2 | 4 |
| Update Employee - Contact Info | 2 | 2 | 4 |
| Delete Employee | 1 | 2 | 3 |
| Get All Holidays | 2 | 2 | 4 |
| Create Holiday | 1 | 2 | 3 |
| Get Leave Types | 2 | 2 | 4 |
| Get All Leave Requests | 1 | 2 | 3 |
| **TỔNG** | | | **50 tests** |

---

# PHẦN 2: TEST THỦ CÔNG (TÙY CHỌN)

## 7. TEST MANUAL - AUTHENTICATION

*(Nếu bạn muốn test từng API một cách thủ công thay vì dùng Collection Runner)*

### 7.1. Login để lấy JWT Token

**Method:** `POST`
**URL:** `http://localhost:54112/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@company.vn",
  "password": "123456"
}
```

**Cách làm trong Postman:**
1. Tạo New Request
2. Chọn method: **POST**
3. Nhập URL
4. Tab **Headers**: Key = `Content-Type`, Value = `application/json`
5. Tab **Body**: Chọn **raw**, chọn **JSON**, paste body
6. Click **Send**

**Response mong đợi:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "email": "admin@company.vn",
    "username": "admin"
  }
}
```

⚠️ **Copy token** từ response, dùng cho tất cả requests sau!

---

## 8. TEST MANUAL - API NHÂN VIÊN

### 8.1. Lấy danh sách nhân viên

**Method:** `GET`
**URL:** `http://localhost:54112/api/nhanvien?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <YOUR_TOKEN_HERE>
Content-Type: application/json
```

**Response:**
```json
{
  "data": [ {...nhân viên...} ],
  "pagination": {
    "total": 16,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 8.2. Tạo nhân viên mới

**Method:** `POST`
**URL:** `http://localhost:54112/api/nhanvien`

**Headers:**
```
Authorization: Bearer <YOUR_TOKEN_HERE>
Content-Type: application/json
```

**Body (MINIMAL - chỉ cần 2 trường):**
```json
{
  "ho_dem": "Trần Thị",
  "ten": "Bình"
}
```

**Response:**
```json
{
  "_id": "...",
  "ma_nhan_vien": "NV012",  // Tự động tạo
  "ho_dem": "Trần Thị",
  "ten": "Bình"
}
```

---

### 8.3. Cập nhật nhân viên

**Method:** `PUT`
**URL:** `http://localhost:54112/api/nhanvien/<EMPLOYEE_ID>`

**Body:**
```json
{
  "ho_dem": "Nguyễn Văn",
  "ten": "An Updated",
  "lien_he": {
    "di_dong": "0912345678",
    "email_cong_viec": "an.nguyen.updated@company.vn",
    "email_khac": ""  // Được phép rỗng, không bị lỗi duplicate
  }
}
```

---

### 8.4. Xóa nhân viên (Soft Delete)

**Method:** `DELETE`
**URL:** `http://localhost:54112/api/nhanvien/<EMPLOYEE_ID>`

**Response:**
```json
{
  "msg": "Xóa nhân viên thành công"
}
```

---

## 9. TEST MANUAL - API PHÒNG BAN

### 9.1. Lấy danh sách phòng ban

**Method:** `GET`
**URL:** `http://localhost:54112/api/phongban?page=1&limit=10`

---

### 9.2. Tạo phòng ban mới

**Method:** `POST`
**URL:** `http://localhost:54112/api/phongban`

**Body:**
```json
{
  "ten": "Phòng Marketing",
  "mo_ta": "Phòng Marketing và Truyền thông"
}
```

---

## 10. TEST MANUAL - API CHỨC DANH

### 10.1. Lấy danh sách chức danh

**Method:** `GET`
**URL:** `http://localhost:54112/api/chucdanh?page=1&limit=10`

---

### 10.2. Tạo chức danh mới

**Method:** `POST`
**URL:** `http://localhost:54112/api/chucdanh`

**Body:**
```json
{
  "ten_chuc_danh": "Senior Developer",
  "mo_ta": "Lập trình viên cấp cao"
}
```

---

## 11. TEST MANUAL - API NGÀY LỄ

### 11.1. Lấy danh sách ngày lễ

**Method:** `GET`
**URL:** `http://localhost:54112/api/ngay-le?page=1&limit=10`

---

### 11.2. Tạo ngày lễ mới

**Method:** `POST`
**URL:** `http://localhost:54112/api/ngay-le`

**Body:**
```json
{
  "ten": "Ngày Quốc Khánh",
  "ngay_bat_dau": "2025-09-02",
  "ngay_ket_thuc": "2025-09-02",
  "ghi_chu": "Kỷ niệm Quốc khánh Việt Nam"
}
```

---

## 12. TEST MANUAL - API NGHỈ PHÉP

### 12.1. Lấy loại ngày nghỉ

**Method:** `GET`
**URL:** `http://localhost:54112/api/loaingaynghi`

---

### 12.2. Lấy danh sách yêu cầu nghỉ phép

**Method:** `GET`
**URL:** `http://localhost:54112/api/yeucaunghiphep?page=1&limit=10`

---

### 12.3. Tạo yêu cầu nghỉ phép

**Method:** `POST`
**URL:** `http://localhost:54112/api/yeucaunghiphep`

**Body:**
```json
{
  "loai_ngay_nghi_id": "68f74d20162b7165f9e85058",
  "tu_ngay": "2025-02-01",
  "den_ngay": "2025-02-03",
  "ly_do": "Nghỉ phép năm",
  "ghi_chu": "Đã book vé máy bay"
}
```

⚠️ **Lưu ý:**
- `nhan_vien_id` tự động lấy từ user đang login
- `loai_ngay_nghi_id` lấy từ API `/api/loaingaynghi`

---

# PHẦN 3: TROUBLESHOOTING

## 13. XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Lỗi: "Could not get any response"

**Nguyên nhân:** Backend không chạy

**Giải pháp:**
```bash
cd HungHutech-backend
npm run dev

# Kiểm tra logs:
# Server is listening on port 54112
# Successfully connected to MongoDB.
```

---

### ❌ Lỗi: "401 Unauthorized" ở tất cả requests

**Nguyên nhân:** Token không được lưu hoặc hết hạn (12 giờ)

**Giải pháp:**

**Cách 1 (Tự động):**
1. Chạy lại Collection Runner
2. Request "Login - Get Token" sẽ tự động lưu token mới

**Cách 2 (Manual):**
1. Chạy riêng request "Login - Get Token"
2. Copy token từ response
3. Click icon mắt 👁️ → Environment "HungHutech Local"
4. Click vào dòng `token`
5. Paste vào cột **"Current Value"**
6. Click **Save** (Ctrl+S)

---

### ❌ Lỗi: "Cannot read property '_id' of undefined"

**Nguyên nhân:** Database rỗng, không có data để lấy ID

**Giải pháp:**

1. Chạy các requests "Create" trước:
   - Create Department
   - Create Position
   - Create Employee

2. Hoặc chạy Collection Runner theo đúng thứ tự (đã sắp xếp sẵn):
   - Login → Get All (lưu ID) → Create (lưu new ID) → Update → Delete

---

### ❌ Test Failed: "Status code is 400 Bad Request"

**Nguyên nhân:** Dữ liệu gửi lên không hợp lệ

**Giải pháp:**

1. Click vào request bị failed trong Runner Results
2. Tab **Response** → Xem error message:

```json
{
  "msg": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "ho_dem",
      "message": "Họ đệm là bắt buộc"
    }
  ]
}
```

3. Sửa request body theo error message
4. Chạy lại

---

### ❌ Test Failed: "Duplicate key error"

**Nguyên nhân:** Trùng `ma_nhan_vien`, `email_cong_viec`, hoặc `email_khac`

**Giải pháp:**

**Với `ma_nhan_vien`:** Bỏ qua field này, để hệ thống tự động tạo
```json
{
  "ho_dem": "Nguyễn Văn",
  "ten": "An"
  // KHÔNG có "ma_nhan_vien"
}
```

**Với `email_khac` rỗng:** Đã fix! Không gửi empty string:
- Frontend: Không gửi field nếu rỗng
- Backend: Tự động xóa empty string trước khi lưu

---

### ❌ Lỗi: Port 5000 không hoạt động

**Nguyên nhân:** Backend đang chạy port 54112 do port 5000 bị chiếm

**Giải pháp:**

**Option 1 (Khuyến nghị):** Dùng port 54112
- Environment `baseUrl`: `http://localhost:54112/api` ✅

**Option 2:** Giải phóng port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Restart backend
npm run dev
```

---

## 🎯 CHECKLIST DEMO CHO GIẢNG VIÊN

Khi demo cho giảng viên:

- [ ] **Chuẩn bị:**
  - [ ] Backend đang chạy (`npm run dev`)
  - [ ] MongoDB đang chạy
  - [ ] Postman đã import Collection & Environment

- [ ] **Mở các cửa sổ:**
  - [ ] Postman Collection Runner
  - [ ] Postman Console (View → Show Postman Console)
  - [ ] Backend terminal (để thầy/cô thấy logs)

- [ ] **Giải thích trước khi chạy:**
  - "Đây là Collection với 14 requests và 27 automated tests"
  - "Mỗi request có tests tự động kiểm tra response"
  - "Token và IDs được lưu tự động, dùng cho requests sau"
  - "Tôi chỉ cần click 1 nút, Postman sẽ test toàn bộ API"

- [ ] **Chạy Collection Runner:**
  - [ ] Environment: "HungHutech Local" ✅
  - [ ] Iterations: 1
  - [ ] Delay: 500ms
  - [ ] Click "Run HungHutech HRM API - Auto Test"

- [ ] **Trong khi chạy (~8 giây):**
  - "Postman đang tự động login và lưu token" (Login)
  - "Đang test API Get danh sách" (Get All)
  - "Đang test API Create với auto-generated code" (Create Employee)
  - "Đang test fix lỗi duplicate email_khac" (Update Employee)

- [ ] **Sau khi chạy xong:**
  - [ ] Show kết quả: "27/27 tests passed ✅"
  - [ ] Show Duration: "~8 giây"
  - [ ] Click vào 1-2 requests để show chi tiết tests
  - [ ] Show Environment variables đã lưu tự động (icon mắt 👁️)
  - [ ] Show Postman Console logs
  - [ ] Show Backend terminal logs

- [ ] **Export kết quả:**
  - [ ] Click "Export Results"
  - [ ] Lưu file JSON
  - [ ] "Đây là báo cáo chi tiết có thể gửi email cho thầy/cô"

---

## 📞 HỖ TRỢ

**Files trong project:**
- `HungHutech.postman_collection.json` - Collection file (import vào Postman)
- `HungHutech.postman_environment.json` - Environment file (import vào Postman)
- `POSTMAN.md` - File này
- `FIX_DUPLICATE_EMAIL_ERROR.md` - Chi tiết fix lỗi duplicate key

**Backend:**
- Port: 54112 (thay vì 5000)
- Start: `cd HungHutech-backend && npm run dev`

**Nếu gặp vấn đề:**
1. Kiểm tra backend logs
2. Kiểm tra MongoDB đang chạy
3. Kiểm tra Environment đã chọn đúng "HungHutech Local"
4. Xem Postman Console để debug

---

**Created by:** Claude AI
**Last Updated:** October 25, 2025
**Version:** 2.0

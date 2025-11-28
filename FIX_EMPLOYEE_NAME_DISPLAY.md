# 🔧 Fix: Tên nhân viên không hiển thị trên trang xác nhận bảng lương

## 📋 Vấn đề

Khi gửi bảng lương cho nhân viên trên website, cột "Nhân viên" bị trống - không hiển thị tên nhân viên.

![Screenshot showing empty employee name column](screenshot-reference)

---

## 🔍 Nguyên nhân

**Backend API** `/api/payroll/runs/:runId/confirmations` đã populate `entries.nhan_vien_id` nhưng KHÔNG trả về field này trong response.

**Code lỗi** (payrollConfirmation.controller.js:457-467):
```javascript
const formattedEntries = entries.map(entry => ({
  _id: entry._id,
  ma_nhan_vien: entry.ma_nhan_vien,
  ho_ten: entry.ho_ten,
  // ❌ THIẾU: nhan_vien_id: entry.nhan_vien_id
  luong_thuc_nhan: entry.luong_thuc_nhan,
  trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
  // ...
}));
```

**Frontend** đang tìm kiếm field này (PayrollConfirmation.vue:110-114):
```vue
<div v-if="row.nhan_vien_id">
  <div><strong>{{ row.nhan_vien_id.ho_dem }} {{ row.nhan_vien_id.ten }}</strong></div>
  <div class="text-secondary">{{ row.nhan_vien_id.ma_nhan_vien }}</div>
</div>
```

Vì backend không trả về `nhan_vien_id`, nên frontend không thể hiển thị tên nhân viên.

---

## ✅ Giải pháp - Đã áp dụng

### **Thay đổi 1: Populate thêm fields** (Line 437)

**Trước:**
```javascript
const run = await PayrollRun.findById(runId).populate('entries.nhan_vien_id', 'ma_nhan_vien ho_ten');
```

**Sau:**
```javascript
const run = await PayrollRun.findById(runId).populate('entries.nhan_vien_id', 'ma_nhan_vien ho_dem ten ho_ten');
```

### **Thay đổi 2: Include nhan_vien_id trong response** (Line 461)

**Trước:**
```javascript
const formattedEntries = entries.map(entry => ({
  _id: entry._id,
  ma_nhan_vien: entry.ma_nhan_vien,
  ho_ten: entry.ho_ten,
  luong_thuc_nhan: entry.luong_thuc_nhan,
  // ...
}));
```

**Sau:**
```javascript
const formattedEntries = entries.map(entry => ({
  _id: entry._id,
  ma_nhan_vien: entry.ma_nhan_vien,
  ho_ten: entry.ho_ten,
  nhan_vien_id: entry.nhan_vien_id, // ✅ ADDED - Include populated employee data
  luong_thuc_nhan: entry.luong_thuc_nhan,
  // ...
}));
```

---

## 🧪 Cách kiểm tra

### **Bước 1: Restart Backend**

Backend cần được khởi động lại để áp dụng code mới:

```bash
# Stop current backend (Ctrl+C)
cd HungHutech-backend
npm start
```

### **Bước 2: Refresh Website**

1. Mở trình duyệt
2. Vào trang: http://localhost:8080
3. Login as admin/manager
4. Navigate: **Lương → Bảng lương**
5. Click vào nút **"Xác nhận"** (green button)
6. Hoặc click vào bảng lương đã gửi để xem chi tiết

### **Bước 3: Kiểm tra tên nhân viên**

**Kết quả mong đợi:**

Cột "Nhân viên" giờ sẽ hiển thị:
```
Trần Minh An
NV201
```

Thay vì trống như trước.

---

## 🔍 Kiểm tra API Response

Bạn có thể kiểm tra API response bằng cách:

### **Method 1: Browser DevTools**

1. F12 → Network tab
2. Refresh trang xác nhận bảng lương
3. Tìm request: `GET /api/payroll/runs/:runId/confirmations`
4. Xem response JSON:

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "_id": "...",
        "ma_nhan_vien": "NV201",
        "ho_ten": "Trần Minh An",
        "nhan_vien_id": {              // ← ✅ THIS FIELD NOW EXISTS!
          "_id": "692680b41dc5d89ac1d3c5d8",
          "ma_nhan_vien": "NV201",
          "ho_dem": "Trần Minh",
          "ten": "An",
          "ho_ten": "Trần Minh An"
        },
        "luong_thuc_nhan": 36202000,
        "trang_thai_xac_nhan": "Cho_xac_nhan"
      }
    ]
  }
}
```

### **Method 2: Postman/Thunder Client**

```http
GET http://localhost:5000/api/payroll/runs/YOUR_RUN_ID/confirmations
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected response:** JSON object with `nhan_vien_id` populated with employee details.

---

## 📊 Technical Details

### **File Modified:**
- [payrollConfirmation.controller.js:437](HungHutech-backend/controllers/payrollConfirmation.controller.js#L437)
- [payrollConfirmation.controller.js:461](HungHutech-backend/controllers/payrollConfirmation.controller.js#L461)

### **API Endpoint:**
- `GET /api/payroll/runs/:runId/confirmations`
- Role: Admin, Manager
- Returns: List of payroll entries with populated employee information

### **Frontend Component:**
- [PayrollConfirmation.vue:108-114](HungHutech-frontend/src/pages/PayrollConfirmation.vue#L108-L114)
- Displays employee name from `row.nhan_vien_id.ho_dem` and `row.nhan_vien_id.ten`

---

## ✅ Verification Checklist

Sau khi restart backend và refresh website:

- [ ] Cột "Nhân viên" hiển thị tên đầy đủ (Ví dụ: "Trần Minh An")
- [ ] Cột "Nhân viên" hiển thị mã nhân viên (Ví dụ: "NV201")
- [ ] Statistics cards update correctly
- [ ] "Chi tiết" button opens detail dialog with employee info
- [ ] "Xử lý" button (for rejected entries) shows employee name in dialog

---

## 🎯 Summary

**Problem:** Tên nhân viên không hiển thị vì backend không trả về `nhan_vien_id` trong response

**Solution:**
1. ✅ Populate thêm fields: `ho_dem`, `ten`
2. ✅ Include `nhan_vien_id` trong formatted response

**Result:** Frontend giờ nhận được đầy đủ thông tin nhân viên và hiển thị chính xác!

---

**Generated:** 2025-11-27
**Status:** ✅ FIXED
**File Modified:** `HungHutech-backend/controllers/payrollConfirmation.controller.js`
**Action Required:** Restart backend + Refresh website

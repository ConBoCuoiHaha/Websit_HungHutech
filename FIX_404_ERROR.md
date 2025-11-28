# 🔧 Fix Lỗi "Lỗi kết nối: 404" Ở Màn Hình Bảng Lương

## 🎯 Vấn Đề

Khi vào màn hình "Bảng lương" trên Android app, hiển thị:
```
Lỗi kết nối: 404
```

---

## ✅ Các Nguyên Nhân & Cách Fix

### **Nguyên nhân 1: User Chưa Đăng Nhập (PHỔ BIẾN NHẤT)**

**Triệu chứng:**
- App hiển thị màn hình chính
- Click "Bảng lương" → Lỗi 404

**Giải pháp:**
1. **Đảm bảo đã login:**
   - Mở app
   - Nhập username và password
   - Click "Đăng nhập"
   - Đợi đăng nhập thành công

2. **Kiểm tra token đã lưu:**
   - Sau khi login, app phải lưu JWT token
   - Token này được gửi kèm mọi API request
   - Nếu không có token → Backend trả 401 Unauthorized

3. **Test:**
   - Sau khi login thành công
   - Click "Bảng lương" lại
   - Should work!

---

### **Nguyên nhân 2: Backend Chưa Chạy**

**Kiểm tra:**
```bash
# Trên PC, kiểm tra backend đang chạy
netstat -ano | findstr :5000
```

**Nếu không thấy kết quả:**
```bash
cd HungHutech-backend
npm start
```

**Đợi thấy:**
```
Successfully connected to MongoDB.
Server running on http://localhost:5000
```

---

### **Nguyên nhân 3: IP Address Sai**

**Vấn đề:**
- PC IP: `192.168.88.50`
- Phone kết nối WiFi khác
- → Không thể kết nối

**Kiểm tra IP của PC:**
```bash
ipconfig
```

**Tìm dòng:**
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.88.50
```

**Nếu IP khác `192.168.88.50`:**

1. **Cách 1: Thay đổi IP trong build.gradle.kts**
   ```kotlin
   buildConfigField("String", "BASE_URL", "\"http://YOUR_NEW_IP:5000/api/\"")
   ```
   - Rebuild APK
   - Install lại

2. **Cách 2: Dùng Setting trong app** (nếu đã implement)
   - App Settings → Server URL
   - Nhập: `http://YOUR_NEW_IP:5000/api/`

---

### **Nguyên nhân 4: Firewall Chặn**

**Windows Firewall có thể chặn port 5000**

**Giải pháp:**
1. Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Port → TCP → 5000
5. Allow the connection

**Hoặc tắt firewall tạm thời để test:**
```
# Run as Administrator
netsh advfirewall set allprofiles state off
```

---

### **Nguyên nhân 5: API Routes Chưa Mount (ÍT KHI XẢY RA)**

**Kiểm tra app.js:**
```javascript
app.use('/api/payroll', payrollConfirmationRoutes); // Line 149
```

**Test endpoint:**
```bash
curl http://192.168.88.50:5000/api/payroll/entries/my-pending
```

**Expected:**
```json
{"msg":"Thiếu token xác thực"}  // ← This is GOOD! Endpoint exists
```

**NOT:**
```
Cannot GET /api/payroll/entries/my-pending  // ← This means route not found
```

---

## 🧪 Debugging Steps

### **Bước 1: Kiểm Tra Backend**

```bash
# Terminal 1 - Start backend
cd HungHutech-backend
npm start

# Terminal 2 - Test endpoint
curl http://192.168.88.50:5000/api/payroll/entries/my-pending
```

**Expected:** `{"msg":"Thiếu token xác thực"}`

---

### **Bước 2: Kiểm Tra Android Logs**

**Sau khi rebuild app với error logging mới:**

1. Mở Android Studio
2. Logcat tab (Alt + 6)
3. Filter: `PayrollList`
4. Run app → Click "Bảng lương"
5. Xem logs:

```
E/PayrollList: API Error: Lỗi 401: {"msg":"Thiếu token xác thực"}
```

**Hoặc:**

```
E/PayrollList: Network Error: Failed to connect to /192.168.88.50:5000
```

---

### **Bước 3: Test Với Token Hợp Lệ**

**Lấy token từ website:**
1. Mở website: http://localhost:8080
2. Login
3. F12 → Application → Local Storage
4. Copy `token` value

**Test API với token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://192.168.88.50:5000/api/payroll/entries/my-pending
```

**Expected:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

## 🔨 Quick Fixes

### **Fix #1: Rebuild APK với Error Logging**

Tôi đã thêm error logging vào [PayrollListActivity.java:152-172](ChamCong/app/src/main/java/com/hunghutech/hrm/ui/payroll/PayrollListActivity.java#L152-L172)

**Rebuild APK:**
1. Android Studio → Build → Clean Project
2. Build → Build APK
3. Install APK mới
4. Test → Xem Logcat để biết error chi tiết

---

### **Fix #2: Đảm Bảo Login Trước**

**QUAN TRỌNG:** App phải login thành công trước khi vào "Bảng lương"

**Test login:**
1. Mở app
2. Login với:
   - Username: `nhanvien1` (hoặc tài khoản nhân viên khác)
   - Password: (password của user)
3. Đợi thông báo "Đăng nhập thành công"
4. **THEN** click "Bảng lương"

---

### **Fix #3: Tạo Test Data Trên Website**

**Nếu không có dữ liệu bảng lương:**

1. Mở website: http://localhost:8080
2. Login as admin/manager
3. Navigate: Lương → Bảng lương
4. Tạo 1 payroll run
5. Click "Xác nhận" → Chọn nhân viên → Gửi
6. **THEN** test app

---

## 📊 Expected Behavior After Fix

### **Khi CHƯA login:**
- Click "Bảng lương" → Redirect về Login screen (nếu có implement)
- HOẶC hiển thị: "Vui lòng đăng nhập"

### **Khi ĐÃ login NHƯNG không có dữ liệu:**
- Hiển thị: "Không có bảng lương nào"
- Empty state với icon

### **Khi ĐÃ login VÀ có dữ liệu:**
- Hiển thị danh sách bảng lương
- Filter chips hoạt động
- Click vào item → Navigate to detail

---

## 🎯 Root Cause Analysis

**Lỗi 404 thực ra là 401 Unauthorized** nhưng app hiểu sai.

**Backend trả:**
- 401: Thiếu token
- 403: Không có quyền
- 404: Endpoint không tồn tại

**App hiển thị tất cả là "Lỗi kết nối: XXX"**

**Solution:**
- Tôi đã improve error handling để hiển thị error message từ backend
- Rebuild APK để xem message chính xác

---

## ✅ Checklist

- [ ] Backend đang chạy (`npm start`)
- [ ] App đã login thành công
- [ ] Token được lưu (check Logcat)
- [ ] IP address đúng
- [ ] Firewall không chặn
- [ ] Đã có test data (gửi xác nhận từ website)
- [ ] Rebuild APK với error logging mới
- [ ] Check Logcat để xem error chi tiết

---

## 📞 Next Steps

1. **Login vào app**
2. **Rebuild APK** (nếu cần error logging)
3. **Test lại** → Xem Logcat
4. **Nếu vẫn lỗi:** Post Logcat error message

---

**Generated:** 2025-11-27
**Status:** Error logging added, ready to debug

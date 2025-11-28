# 🎯 COMPLETE SETUP & TESTING GUIDE

## ✅ Issues Fixed

1. ✅ **"Không tìm thấy thông tin nhân viên"** - All 15 users linked to employees
2. ✅ **"Không thấy nút Gửi cho nhân viên"** - Button already exists in table (green "Xác nhận" button)
3. ✅ **Android build errors** - All 5 compilation errors fixed

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Start Backend** ⚙️

```bash
cd HungHutech-backend
npm start
```

**Expected output:**
```
Successfully connected to MongoDB.
Server running on http://localhost:5000
```

**Leave this terminal running!**

---

### **STEP 2: Start Website** 🌐

**Open NEW terminal:**

```bash
cd HungHutech-frontend
npm run dev
```

**Expected output:**
```
App running at:
- Local:   http://localhost:8080
```

**Open browser:** http://localhost:8080

---

### **STEP 3: Website - Send Payroll Confirmation** 📧

1. **Login as Admin/Manager:**
   - Username: `admin` or `manager`
   - Password: (your password)

2. **Navigate to Payroll:**
   - Menu: **Lương → Bảng lương**
   - You should see list of payroll runs

3. **Click Green "Xác nhận" Button:**
   - In the table, find the row with your payroll run
   - Look for green button labeled **"Xác nhận"** (Confirm)
   - Click it

4. **Select Employees:**
   - Modal appears with employee list
   - Check 1-3 employees (e.g., "Trần Minh An - NV201")
   - (Optional) Add note in "Ghi chú" field
   - Click **"Gửi cho nhân viên"** (Send to employees)

5. **Verify Success:**
   - Should see success message
   - Statistics update (e.g., "Chờ xác nhận: 3")
   - Employee entries show orange badge "Chờ xác nhận"

---

### **STEP 4: Build Android APK** 📱

**Option A: Android Studio (Recommended)**

1. Open Android Studio
2. File → Open → Select `ChamCong` folder
3. Wait for Gradle sync (1-3 minutes)
4. Build → Build Bundle(s) / APK(s) → **Build APK(s)**
5. Wait 2-5 minutes
6. APK location: `ChamCong/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Command Line**

```bash
cd ChamCong
gradlew.bat clean assembleDebug
```

---

### **STEP 5: Install APK on Phone** 📲

**Method 1: USB Cable**

```bash
adb devices
adb install -r ChamCong\app\build\outputs\apk\debug\app-debug.apk
```

**Method 2: Copy File**
- Copy `app-debug.apk` to phone via email/Drive
- Open file on phone → Install

**Requirements:**
- Android 6.0+ (API 23+)
- Fingerprint sensor
- WiFi connected to same network as PC (192.168.88.x)

---

### **STEP 6: Test Mobile App** ✅

1. **Open App & Login:**
   - Username: Employee username (e.g., `NV201`)
   - Password: Employee password
   - Click "Đăng nhập"
   - **IMPORTANT:** Wait for success message!

2. **Navigate to Payroll:**
   - Click **"Bảng lương"** button on home screen
   - Should see list of pending payrolls
   - Look for orange badge "Chờ xác nhận"

3. **View Detail:**
   - Click on a payroll entry
   - See full breakdown:
     - Lương cơ bản
     - Phụ cấp
     - Khấu trừ (BHXH, BHYT, BHTN, thuế TNCN)
     - Thực nhận

4. **Confirm Payroll:**
   - Scroll down
   - Click **"✓ Xác nhận đúng"** button
   - Biometric prompt appears
   - Scan fingerprint
   - See success message
   - Status changes to green checkmark "Đã xác nhận"

5. **Verify on Website:**
   - Refresh website confirmation page
   - Should see updated statistics
   - Entry shows "Đã xác nhận" with green badge
   - Click "Lịch sử" to see confirmation timestamp

---

## 🧪 TEST SCENARIOS

### **Scenario 1: Happy Path - Confirm** ✅

1. Website: Send confirmation to employee
2. Mobile: Login → Bảng lương → See pending
3. Mobile: Open detail → Confirm with fingerprint
4. Website: Refresh → See "Đã xác nhận" status

**Expected:** ✅ Full flow works, audit trail recorded

---

### **Scenario 2: Rejection Flow** ❌

1. Mobile: Open pending payroll → Click "✗ Không đồng ý"
2. Mobile: Enter reason (min 10 chars): "Sai số giờ OT"
3. Mobile: Submit → See success message
4. Website: Filter "Từ chối" → See rejection
5. Website: Click "Xử lý" → Enter solution → Check "Gửi lại"
6. Mobile: See payroll appears again (new deadline)
7. Mobile: Confirm this time → Success

**Expected:** ✅ Full rejection-resolution cycle works

---

### **Scenario 3: Deadline Validation** ⏰

1. Website: Send confirmation (default deadline: today + 3 days)
2. Wait for deadline to pass OR manually change in database
3. Mobile: Try to confirm expired payroll
4. **Expected:** Error "Đã quá hạn xác nhận"

---

### **Scenario 4: Filters & Status** 🔍

**Mobile App:**
1. Test filter chips:
   - "Tất cả" → All payrolls
   - "Chờ xác nhận" → Only pending (orange)
   - "Đã xác nhận" → Only confirmed (green)
   - "Từ chối" → Only rejected (red)

2. Pull to refresh → Reload data

**Website:**
1. Test statistics cards update in real-time
2. Filter by status chips
3. Select multiple entries → Bulk send

---

## ❗ TROUBLESHOOTING

### **Issue 1: Mobile shows "Lỗi 404: Không tìm thấy thông tin nhân viên"**

**Solution:**
```bash
cd HungHutech-backend
node scripts/linkUserToEmployee.js
```

This links users to their employee records.

---

### **Issue 2: Backend not running**

**Check:**
```bash
netstat -ano | findstr :5000
```

**If nothing:** Backend not running, start it:
```bash
cd HungHutech-backend
npm start
```

---

### **Issue 3: Mobile can't connect**

**Check PC IP:**
```bash
ipconfig
```

**Look for:** `IPv4 Address. . . . . . . . . . . : 192.168.88.50`

**If different:**
1. Update `ChamCong/app/build.gradle.kts` line 19:
   ```kotlin
   buildConfigField("String", "BASE_URL", "\"http://YOUR_NEW_IP:5000/api/\"")
   ```
2. Rebuild APK

---

### **Issue 4: Biometric not working**

**Requirements:**
- ✅ Physical device (not emulator)
- ✅ Fingerprint enrolled in Settings → Security
- ✅ Android 6.0+ (API 23+)

---

### **Issue 5: No data on mobile**

**Cause:** No confirmations sent from website yet

**Solution:**
1. Login to website
2. Navigate: Lương → Bảng lương
3. Click green "Xác nhận" button
4. Select employees → Send
5. **Then** test mobile app

---

## 📊 DATA FLOW VERIFICATION

### **Flow 1: Website → Mobile**

```
Website (Admin/Manager)
  ↓ Click "Xác nhận" button
  ↓ Select employees
  ↓ POST /api/payroll/runs/:runId/send-confirmations
Backend
  ↓ Update entries to 'Cho_xac_nhan'
  ↓ Set deadline = now + 3 days
Mobile (Employee)
  ↓ GET /api/payroll/entries/my-pending
  ↓ Display pending payrolls (orange badge)
```

---

### **Flow 2: Mobile → Website**

```
Mobile (Employee)
  ↓ Scan fingerprint
  ↓ POST /api/payroll/entries/:entryId/confirm
Backend
  ↓ Validate deadline
  ↓ Update to 'Da_xac_nhan'
  ↓ Record audit trail
Website (Admin/Manager)
  ↓ GET /api/payroll/runs/:runId/confirmations
  ↓ Display "Đã xác nhận" (green badge)
  ↓ Update statistics
```

---

## ✅ SUCCESS CRITERIA

**Backend:**
- ✅ Server running on port 5000
- ✅ MongoDB connected
- ✅ All users linked to employees
- ✅ 6 API endpoints working

**Website:**
- ✅ Login successful
- ✅ Payroll list displays
- ✅ Green "Xác nhận" button visible
- ✅ Modal opens with employee list
- ✅ Send confirmation succeeds
- ✅ Statistics update in real-time

**Mobile:**
- ✅ APK builds without errors
- ✅ Login successful
- ✅ "Bảng lương" button appears
- ✅ Pending payrolls display
- ✅ Detail shows full breakdown
- ✅ Biometric auth works
- ✅ Confirm/Reject succeeds

**Integration:**
- ✅ Data flows from website to mobile
- ✅ Confirmations from mobile update website
- ✅ Rejection flow works end-to-end
- ✅ Audit trail records all actions

---

## 🎓 THESIS DEMONSTRATION

**Duration:** 5-7 minutes

1. **Introduction (30s):**
   - "Hệ thống xác nhận bảng lương tích hợp web-mobile"
   - Show architecture diagram

2. **Website Demo (2min):**
   - Show payroll list
   - Click "Xác nhận" → Send to employees
   - Show statistics dashboard

3. **Mobile Demo (2min):**
   - Login as employee
   - Navigate to "Bảng lương"
   - Show detail with breakdown
   - Demo biometric authentication
   - Show success confirmation

4. **Website Update (1min):**
   - Refresh confirmation page
   - Show updated "Đã xác nhận" status
   - Point out statistics changed

5. **Rejection Flow (2min):**
   - Mobile: Reject with reason
   - Website: Show rejection → Resolve → Resend
   - Mobile: Show appears again

6. **Technical Highlights (30s):**
   - Security: JWT + Biometric
   - Audit trail: All actions logged
   - Real-time sync between platforms
   - Role-based access control

---

## 📁 PROJECT STRUCTURE

```
HungHutech/
├── HungHutech-backend/          # Node.js + Express + MongoDB
│   ├── controllers/
│   │   └── payrollConfirmation.controller.js  (6 APIs)
│   ├── routes/
│   │   └── payrollConfirmation.routes.js      (Routes)
│   ├── schemas/
│   │   ├── payrollRun.model.js                (Updated schema)
│   │   └── user.model.js                      (nhan_vien_id field)
│   └── scripts/
│       └── linkUserToEmployee.js              (Link users to employees)
│
├── HungHutech-frontend/         # Vue 3 + TypeScript + Element Plus
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PayrollRunList.vue             ("Xác nhận" button)
│   │   │   └── PayrollConfirmation.vue        (Confirmation page)
│   │   ├── services/
│   │   │   └── payrollService.ts              (3 new API methods)
│   │   └── router/
│   │       └── index.ts                       (New route)
│
├── ChamCong/                    # Android (Java)
│   └── app/src/main/java/com/hunghutech/hrm/
│       ├── data/
│       │   ├── api/
│       │   │   ├── ApiClient.java             (getInstance() added)
│       │   │   └── PayrollService.java        (3 API methods)
│       │   └── model/
│       │       ├── PayrollEntry.java
│       │       ├── PayrollListResponse.java   (msg field added)
│       │       ├── ConfirmRequest.java        (4 params)
│       │       └── RejectRequest.java         (3 params)
│       ├── ui/payroll/
│       │   ├── PayrollListActivity.java       (List + filters)
│       │   ├── PayrollDetailActivity.java     (Detail + confirm/reject)
│       │   └── PayrollListAdapter.java        (RecyclerView adapter)
│       └── utils/
│           └── CurrencyHelper.java            (Format currency)
│
└── Documentation/
    ├── TESTING_GUIDE.md                       (Test scenarios)
    ├── BUILD_APK_INSTRUCTIONS.md              (Build guide)
    ├── ANDROID_BUILD_FIXES.md                 (5 errors fixed)
    ├── FIX_404_ERROR.md                       (Troubleshooting 404)
    └── COMPLETE_SETUP_GUIDE.md                (This file)
```

---

## 🎯 FINAL CHECKLIST

### **Before Demo:**

- [ ] Backend running on port 5000
- [ ] Website running on port 8080
- [ ] MongoDB connected
- [ ] Users linked to employees (run script)
- [ ] APK built and installed on phone
- [ ] Test data created (at least 1 payroll run)
- [ ] Confirmations sent to at least 1 employee
- [ ] Phone on same WiFi as PC

### **During Demo:**

- [ ] Show backend logs (console output)
- [ ] Show website UI (responsive design)
- [ ] Show mobile UI (Material Design)
- [ ] Demo biometric auth (fingerprint)
- [ ] Show real-time sync (website refresh)
- [ ] Show audit trail (history)
- [ ] Show error handling (deadline expired)
- [ ] Show rejection flow (employee disagrees)

### **After Demo:**

- [ ] Answer questions about architecture
- [ ] Explain security measures (JWT + biometric)
- [ ] Discuss scalability (MongoDB indexes)
- [ ] Show code quality (TypeScript + validation)

---

**Generated:** 2025-11-27
**Status:** ✅ ALL SYSTEMS READY!
**Version:** 1.0 - Complete Implementation

🎉 **GOOD LUCK WITH YOUR THESIS!** 🎓

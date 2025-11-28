# 🧪 TESTING GUIDE - Payroll Confirmation Feature

**For:** University Thesis Demonstration
**Date:** 2025-11-27

---

## 🎯 Quick Start Testing

### Step 1: Start Backend (Terminal 1)
```bash
cd HungHutech-backend
npm start
```
**Expected:** Server running on http://localhost:5000

### Step 2: Start Website (Terminal 2)
```bash
cd HungHutech-frontend
npm run dev
```
**Expected:** Website on http://localhost:8080

### Step 3: Build Android APK
1. Open Android Studio
2. Open folder: `ChamCong`
3. Click "Sync Project with Gradle Files"
4. Build → Build Bundle(s) / APK(s) → Build APK
5. Install APK on device with fingerprint sensor

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Employee Confirms ✅

**Steps:**
1. **Website (Admin/Manager account):**
   - Navigate to: http://localhost:8080/luong/bang-luong
   - Click "Xác nhận" button on a payroll run
   - Select 1-3 employees from the list
   - Click "Gửi cho nhân viên"
   - **Expected:** Success message, entries show "Chờ xác nhận" status

2. **Android (Employee account):**
   - Login with employee credentials
   - Click "Bảng lương" button on home screen
   - **Expected:** See pending payroll with orange status badge
   - Click on the payroll entry
   - **Expected:** Full salary breakdown displays
   - Scroll down, click "✓ Xác nhận đúng" button
   - **Expected:** Biometric prompt appears
   - Authenticate with fingerprint
   - **Expected:** Success message, status changes to green checkmark

3. **Website (Verify):**
   - Refresh the confirmation page
   - **Expected:** Statistics updated, entry shows "Đã xác nhận" with green badge

### Scenario 2: Employee Rejects & HR Resolves 🔴

**Steps:**
1. **Website:** Send payroll to employee (same as Scenario 1)

2. **Android (Employee):**
   - Open pending payroll detail
   - Click "✗ Không đồng ý" button
   - **Expected:** Dialog appears
   - Enter reason: "Sai số giờ làm thêm OT" (min 10 chars)
   - Click "Gửi"
   - **Expected:** Success message, status changes to red X

3. **Website (Admin/Manager):**
   - Go to confirmation page
   - Filter by "Từ chối" status
   - **Expected:** See rejected entry with reason
   - Click "Xử lý" button
   - Enter solution: "Đã kiểm tra và cập nhật lại số giờ OT"
   - Check "Gửi lại" checkbox
   - Click "Xác nhận xử lý"
   - **Expected:** Entry resets to "Chờ xác nhận" with new deadline (+3 days)

4. **Android (Employee):**
   - Refresh or return to payroll list
   - **Expected:** Payroll appears again with new deadline
   - Open and confirm this time
   - **Expected:** Successful confirmation

### Scenario 3: Deadline Validation ⏰

**Steps:**
1. Website: Send confirmation with default deadline (now + 3 days)
2. **Manually change deadline in database to yesterday:**
   ```javascript
   // In MongoDB:
   db.payroll_runs.updateOne(
     {"entries._id": ObjectId("entry_id")},
     {"$set": {"entries.$.gui_xac_nhan.deadline": new Date("2025-11-20")}}
   )
   ```
3. Android: Try to confirm the overdue payroll
4. **Expected:** Error message "Đã quá hạn xác nhận"

---

## 📊 Test Checklist

### Backend API Tests:
- [ ] POST /api/payroll/runs/:runId/send-confirmations
  - [ ] With valid admin token → Success
  - [ ] With employee token → 403 Forbidden
  - [ ] Without token → 401 Unauthorized
  - [ ] With invalid runId → 404 Not Found

- [ ] GET /api/payroll/entries/my-pending
  - [ ] With employee token → Returns only their entries
  - [ ] Filter by status works
  - [ ] Pagination works

- [ ] POST /api/payroll/entries/:entryId/confirm
  - [ ] With valid biometric signature → Success
  - [ ] Wrong employee tries to confirm → 403
  - [ ] After deadline → Error message
  - [ ] Already confirmed entry → Error

- [ ] POST /api/payroll/entries/:entryId/reject
  - [ ] With reason >= 10 chars → Success
  - [ ] With reason < 10 chars → Validation error
  - [ ] Wrong employee → 403

- [ ] GET /api/payroll/runs/:runId/confirmations
  - [ ] With admin/manager token → Full data with stats
  - [ ] Statistics accuracy verified
  - [ ] Filter by status works

- [ ] PUT /api/payroll/entries/:entryId/resolve-rejection
  - [ ] With gui_lai=true → Entry resets with new deadline
  - [ ] With gui_lai=false → Just marks as resolved
  - [ ] Employee tries to access → 403

### Website UI Tests:
- [ ] PayrollRunList page loads
- [ ] "Xác nhận" button visible on each run
- [ ] PayrollConfirmation page loads with run info
- [ ] Statistics cards display correctly
- [ ] Filter chips work (Tất cả, Chờ xác nhận, etc.)
- [ ] Table selection works (only Chua_gui & Cho_xac_nhan selectable)
- [ ] Send confirmation dialog validates input
- [ ] Resolve rejection dialog validates input (min 10 chars)
- [ ] Real-time stats update after actions
- [ ] Responsive on mobile, tablet, desktop

### Android App Tests:
- [ ] "Bảng lương" button appears on HomeActivity
- [ ] PayrollListActivity loads without crash
- [ ] Filter chips work (Tất cả, Chờ xác nhận, Đã xác nhận, Từ chối)
- [ ] Pull-to-refresh works
- [ ] Status badges show correct colors
- [ ] Deadline shows in red if overdue
- [ ] PayrollDetailActivity displays full breakdown
- [ ] Biometric prompt appears on confirm
- [ ] Reject dialog validates reason >= 10 chars
- [ ] Success/error toasts display properly
- [ ] Navigation back to list works
- [ ] Auto-refresh on resume works

### Integration Tests:
- [ ] Website sends → Android receives
- [ ] Android confirms → Website updates
- [ ] Android rejects → Website shows rejection
- [ ] Website resolves → Android sees resent payroll
- [ ] JWT authentication works end-to-end
- [ ] Role-based authorization enforced
- [ ] Audit trail (lich_su_xac_nhan) records correctly

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend fails to start
**Symptom:** Error on `npm start`
**Solution:**
- Check MongoDB is running
- Verify `.env` file exists with JWT_SECRET
- Run `npm install` first

### Issue 2: Android app crashes on "Bảng lương" click
**Symptom:** App closes immediately
**Solution:**
- Check LogCat for error
- Verify API base URL in `ApiClient.java` is correct
- Ensure backend is running and accessible

### Issue 3: Website shows empty confirmation page
**Symptom:** No data displays
**Solution:**
- Open browser DevTools → Network tab
- Check API call response
- Verify JWT token in localStorage
- Check backend logs for errors

### Issue 4: Biometric authentication fails
**Symptom:** "Không hỗ trợ xác thực vân tay"
**Solution:**
- Test on physical device (not emulator)
- Ensure device has fingerprint enrolled
- Check Android version >= 6.0 (API 23)
- Grant biometric permission in Settings

---

## 📱 Device Requirements

### Android:
- **OS:** Android 6.0 (API 23) or higher
- **Hardware:** Fingerprint sensor
- **Storage:** 50MB free space
- **Internet:** WiFi or mobile data

### Desktop (Website):
- **Browser:** Chrome, Firefox, Edge (latest version)
- **Screen:** 1280x720 minimum
- **Internet:** Stable connection to backend

---

## 🎓 Demo Script for Thesis

**Time:** 5-7 minutes

1. **Introduction (30 sec):**
   - "Hệ thống xác nhận bảng lương tích hợp web và mobile"
   - Show architecture diagram from MobileLuong.md

2. **Website Demo (2 min):**
   - Create payroll run (briefly)
   - Navigate to confirmation page
   - Show statistics dashboard
   - Select employees and send confirmations
   - Show deadline calculation (+3 days)

3. **Android Demo (2 min):**
   - Login as employee
   - Navigate to "Bảng lương"
   - Show pending payroll with status badge
   - Open detail → Show full breakdown
   - Demo biometric authentication
   - Show success confirmation

4. **Website Update (1 min):**
   - Refresh confirmation page
   - Show updated statistics
   - Point out "Đã xác nhận" status

5. **Rejection Flow (2 min):**
   - Android: Reject with reason
   - Website: Show rejection info
   - Website: Resolve and resend
   - Android: Show payroll appears again

6. **Technical Highlights (30 sec):**
   - Security: JWT + Biometric
   - Audit trail: All actions logged
   - Real-time sync between platforms
   - Role-based access control

---

## ✅ Success Criteria

**All tests pass if:**
- ✅ No crashes or errors
- ✅ Data flows correctly between systems
- ✅ Authentication works as expected
- ✅ Authorization enforced properly
- ✅ UI displays correctly
- ✅ Biometric authentication successful
- ✅ Deadline validation works
- ✅ Statistics update accurately

**Ready for thesis demonstration when:**
- ✅ All critical scenarios pass
- ✅ No blocking bugs
- ✅ Demo flow rehearsed
- ✅ Backup plan if internet fails (local MongoDB)

---

**Good luck with your thesis! 🎓**

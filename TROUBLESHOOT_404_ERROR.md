# 🔍 Troubleshooting 404 Error - "Không tìm thấy thông tin nhân viên"

## 📋 Problem Summary

Mobile app shows error when accessing "Bảng lương":
```
Lỗi 404: {"msg":"Không tìm thấy thông tin nhân viên"}
```

---

## ✅ What We Know

1. **Backend is running** ✅ - Port 5000 is active
2. **All 15 users are linked to employees** ✅ - Verified with checkUserEmployeeLinks.js
3. **Attendance APIs work fine** ✅ - Mobile app can check in/out successfully
4. **Only payroll API fails** ❌ - Specifically `/api/payroll/entries/my-pending`

---

## 🔍 Root Cause Analysis

The issue is likely one of these:

### **Scenario 1: User logged in but nhan_vien_id is NULL**

Even though the script says all users are linked, the specific user you're logged in as might have a NULL nhan_vien_id due to:
- Caching issue
- Database not updated properly
- Different database being accessed (local vs Atlas)

### **Scenario 2: JWT Token Contains Old Data**

The JWT token was created BEFORE the user was linked to an employee, so it doesn't have the `nhan_vien_id` in the token payload.

### **Scenario 3: Wrong Database**

The backend might be connecting to a different MongoDB database than where users are linked.

---

## 🛠️ Solution Steps

### **STEP 1: Restart Backend with Enhanced Logging**

1. **Stop current backend** (Ctrl+C in terminal)

2. **Start backend again:**
```bash
cd HungHutech-backend
npm start
```

3. **Watch console logs** - You should see:
```
Successfully connected to MongoDB.
Server running on http://localhost:5000
```

### **STEP 2: Logout and Re-Login on Mobile**

The JWT token might be old. You need to force a fresh login:

1. **Uninstall the mobile app** completely from device
2. **Reinstall the APK**
3. **Login again** - This will generate a NEW JWT token with updated nhan_vien_id

**OR:**

1. Open mobile app
2. Find and click "Logout" (if button exists)
3. Login again with:
   - Email: `an.tran@demo-hutech.vn` (linked to employee NV201)
   - Password: (your password)

### **STEP 3: Try "Bảng lương" Again**

1. Click "Bảng lương" button
2. **Watch backend console logs** - You should see:
```
=== getMyPendingPayrolls ===
userId: 67473a8c24f4aa3e08de85c0
trang_thai: undefined
user found: YES
user.nhan_vien_id: { _id: '692680b41dc5d89ac1d3c5d8', ma_nhan_vien: 'NV201', ... }
user email: an.tran@demo-hutech.vn
nhanVienId: 692680b41dc5d89ac1d3c5d8
```

### **STEP 4: If Still 404, Check Database Connection**

Run this script to verify which database the backend is using:

```bash
cd HungHutech-backend
node scripts/checkUserEmployeeLinks.js
```

**Expected output:**
```
✅ Connected to MongoDB

Found 15 active users:

👤 Username: N/A
   Email: an.tran@demo-hutech.vn
   Role: employee
   ✅ Linked to Employee:
      - ID: 692680b41dc5d89ac1d3c5d8
      - Name: undefined
      - Code: NV201
```

---

## 📝 Test with Different Users

Try logging in with these pre-linked employee accounts:

| Email | Employee Code | Should Work? |
|-------|---------------|--------------|
| `an.tran@demo-hutech.vn` | NV201 | ✅ YES |
| `binh.nguyen@demo-hutech.vn` | NV202 | ✅ YES |
| `chau.le@demo-hutech.vn` | NV203 | ✅ YES |
| `duy.pham@demo-hutech.vn` | NV204 | ✅ YES |
| `employee@company.com` | NV003 | ✅ YES |

**Test Steps:**
1. Logout from mobile app (or reinstall)
2. Login with one of the above emails
3. Click "Bảng lương"
4. Should work without 404 error

---

## 🔎 Advanced Debugging

If the problem persists, check the backend console logs when you click "Bảng lương". You should see:

### **Good Case (Working):**
```
=== getMyPendingPayrolls ===
userId: 67473a8c24f4aa3e08de85c0
trang_thai: undefined
user found: YES
user.nhan_vien_id: [Object with _id, ma_nhan_vien, etc.]
user email: an.tran@demo-hutech.vn
nhanVienId: 692680b41dc5d89ac1d3c5d8
```

### **Bad Case (404 Error):**
```
=== getMyPendingPayrolls ===
userId: 67473a8c24f4aa3e08de85c0
trang_thai: undefined
user found: YES
user.nhan_vien_id: null   <-- THIS IS THE PROBLEM!
user email: some.user@example.com
❌ 404 Error: User has no nhan_vien_id link
```

---

## 🎯 Quick Fix Checklist

- [ ] Stop backend (Ctrl+C)
- [ ] Start backend again (`npm start`)
- [ ] Uninstall mobile app from device
- [ ] Reinstall APK
- [ ] Login with `an.tran@demo-hutech.vn`
- [ ] Click "Bảng lương"
- [ ] Check backend logs for detailed error info
- [ ] If still fails, run `checkUserEmployeeLinks.js` to verify database

---

## 💡 Why This Happens

The JWT token is created at login time with this code:

```javascript
// auth.controller.js:24
function signToken(user) {
  return jwt.sign({
    id: user._id,
    email: user.email,
    role: user.role,
    nhan_vien_id: user.nhan_vien_id || null  // ← Captured at login time!
  }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}
```

If the user logged in BEFORE running `linkUserToEmployee.js`, their JWT token has `nhan_vien_id: null`.

**Solution:** Force a fresh login to get a NEW token with the updated `nhan_vien_id`.

---

## 📊 Verification Script

Created script: `HungHutech-backend/scripts/checkUserEmployeeLinks.js`

**Usage:**
```bash
cd HungHutech-backend
node scripts/checkUserEmployeeLinks.js
```

**What it does:**
- Lists all active users
- Shows their email and role
- Shows if they're linked to an employee
- Shows employee ID, name, and code

---

## 🚀 After Fixing

Once the 404 error is resolved:

1. ✅ You should see the payroll list (might be empty if no confirmations sent yet)
2. ✅ Try sending confirmations from website first
3. ✅ Then refresh mobile app to see pending payrolls

---

## 📞 Still Not Working?

If the error persists after trying all steps above:

1. **Check .env file** - Make sure MONGO_URI is correct
2. **Check database** - Verify you're using the same database for both backend and scripts
3. **Check JWT token** - Decode the token to see what's inside:
   ```javascript
   // In browser console or Node.js
   const token = "your-jwt-token-here";
   console.log(JSON.parse(atob(token.split('.')[1])));
   ```
4. **Share backend console logs** - The enhanced logging will show exactly what's wrong

---

**Generated:** 2025-11-27
**Status:** ⏳ Awaiting backend restart and fresh mobile login
**Next Step:** Restart backend + Reinstall mobile app + Fresh login

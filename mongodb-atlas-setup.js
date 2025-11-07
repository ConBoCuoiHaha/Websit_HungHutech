/**
 * MongoDB Atlas Setup Script
 * Chạy file này để tạo collections và indexes cho HRM System
 *
 * Cách chạy:
 * 1. Cài MongoDB Shell: npm install -g mongosh
 * 2. Chạy: mongosh "mongodb+srv://..." mongodb-atlas-setup.js
 */

// ============================================
// 1. USERS COLLECTION (Authentication)
// ============================================
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'passwordHash', 'role', 'employeeId'],
      properties: {
        username: { bsonType: 'string' },
        passwordHash: { bsonType: 'string' },
        email: { bsonType: 'string' },
        role: { enum: ['admin', 'manager', 'employee'] },
        employeeId: { bsonType: 'objectId' },
        deptId: { bsonType: 'objectId' },
        isActive: { bsonType: 'bool' },
        deviceId: { bsonType: 'string' }, // Device binding
        otpSecret: { bsonType: 'string' }, // OTP 6 số mặc định
        lastLogin: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ employeeId: 1 });
db.users.createIndex({ role: 1, isActive: 1 });

print('✅ Created users collection');

// ============================================
// 2. EMPLOYEES COLLECTION
// ============================================
db.createCollection('employees', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ma_nhan_vien', 'ho_ten', 'deptId'],
      properties: {
        ma_nhan_vien: { bsonType: 'string' },
        ho_dem: { bsonType: 'string' },
        ten: { bsonType: 'string' },
        ho_ten: { bsonType: 'string' },
        email: { bsonType: 'string' },
        dien_thoai: { bsonType: 'string' },
        deptId: { bsonType: 'objectId' },
        positionId: { bsonType: 'objectId' },
        ngay_vao_lam: { bsonType: 'date' },
        trang_thai: { enum: ['Đang làm việc', 'Đã nghỉ việc', 'Tạm nghỉ'] },
        avatar: { bsonType: 'string' }
      }
    }
  }
});

db.employees.createIndex({ ma_nhan_vien: 1 }, { unique: true });
db.employees.createIndex({ email: 1 });
db.employees.createIndex({ deptId: 1, trang_thai: 1 });

print('✅ Created employees collection');

// ============================================
// 3. SITES COLLECTION (Geofence locations)
// ============================================
db.createCollection('sites');

db.sites.createIndex({ location: '2dsphere' }); // Geospatial index

// Insert sample sites
db.sites.insertMany([
  {
    siteId: 'HQ-01',
    name: 'Văn phòng chính - Q1',
    location: {
      type: 'Point',
      coordinates: [106.7009, 10.7756] // [lng, lat] - Saigon Centre
    },
    address: '65 Lê Lợi, Q1, TP.HCM',
    radius: 150, // meters
    isActive: true,
    createdAt: new Date()
  },
  {
    siteId: 'BRANCH-01',
    name: 'Chi nhánh Thủ Đức',
    location: {
      type: 'Point',
      coordinates: [106.7880, 10.8506]
    },
    address: 'KCX Tân Thuận, Q7, TP.HCM',
    radius: 200,
    isActive: true,
    createdAt: new Date()
  }
]);

print('✅ Created sites collection with sample data');

// ============================================
// 4. SHIFTS COLLECTION (Ca làm việc)
// ============================================
db.createCollection('shifts');

db.shifts.createIndex({ shiftId: 1 }, { unique: true });
db.shifts.createIndex({ isActive: 1 });

// Insert sample shifts
db.shifts.insertMany([
  {
    shiftId: 'CA_HANH_CHINH',
    name: 'Ca hành chính',
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    graceMinutes: 5, // Cho phép trễ 5 phút không tính late
    overnight: false,
    workdays: [1, 2, 3, 4, 5], // Thứ 2-6
    isActive: true,
    createdAt: new Date()
  },
  {
    shiftId: 'CA_TOI',
    name: 'Ca tối',
    startTime: '18:00',
    endTime: '02:00', // Qua đêm
    breakStart: '22:00',
    breakEnd: '22:30',
    graceMinutes: 5,
    overnight: true,
    workdays: [1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date()
  }
]);

print('✅ Created shifts collection with sample data');

// ============================================
// 5. SHIFT_ASSIGNMENTS (Phân ca cho nhân viên)
// ============================================
db.createCollection('shift_assignments');

db.shift_assignments.createIndex({ employeeId: 1, date: 1 }, { unique: true });
db.shift_assignments.createIndex({ date: 1, shiftId: 1 });

print('✅ Created shift_assignments collection');

// ============================================
// 6. ATTENDANCE COLLECTION (Log chấm công thô)
// ============================================
db.createCollection('attendance', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'time', 'type', 'method'],
      properties: {
        employeeId: { bsonType: 'objectId' },
        time: { bsonType: 'date' },
        type: { enum: ['check_in', 'check_out'] },
        method: { enum: ['fingerprint', 'qr', 'kiosk', 'web'] },
        siteId: { bsonType: 'string' },
        deviceId: { bsonType: 'string' },
        location: {
          bsonType: 'object',
          properties: {
            type: { enum: ['Point'] },
            coordinates: { bsonType: 'array' } // [lng, lat]
          }
        },
        accuracy: { bsonType: 'double' }, // GPS accuracy in meters
        distance: { bsonType: 'double' }, // Distance to site in meters
        flags: {
          bsonType: 'object',
          properties: {
            isLate: { bsonType: 'bool' },
            lateOver30: { bsonType: 'bool' },
            isMockLocation: { bsonType: 'bool' },
            isAutoCheckout: { bsonType: 'bool' }
          }
        },
        nonce: { bsonType: 'string' }, // Anti-replay
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.attendance.createIndex({ employeeId: 1, time: -1 });
db.attendance.createIndex({ time: 1 });
db.attendance.createIndex({ nonce: 1 }, { expireAfterSeconds: 120 }); // TTL 2 minutes
db.attendance.createIndex({ location: '2dsphere' });

print('✅ Created attendance collection');

// ============================================
// 7. ATTENDANCE_DAILY (Tổng hợp theo ngày)
// ============================================
db.createCollection('attendance_daily', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'date'],
      properties: {
        employeeId: { bsonType: 'objectId' },
        date: { bsonType: 'date' },
        status: {
          enum: ['present', 'absent', 'late', 'late_over_30', 'on_leave', 'holiday', 'weekend']
        },
        checkInTime: { bsonType: 'date' },
        checkOutTime: { bsonType: 'date' },
        lateMinutes: { bsonType: 'int' },
        earlyMinutes: { bsonType: 'int' },
        workMinutes: { bsonType: 'int' },
        overtimeMinutes: { bsonType: 'int' },
        shiftId: { bsonType: 'string' },
        notes: { bsonType: 'string' }
      }
    }
  }
});

db.attendance_daily.createIndex({ employeeId: 1, date: -1 }, { unique: true });
db.attendance_daily.createIndex({ date: 1, status: 1 });
db.attendance_daily.createIndex({ employeeId: 1, status: 1 });

print('✅ Created attendance_daily collection');

// ============================================
// 8. LEAVE_REQUESTS (Yêu cầu nghỉ phép)
// ============================================
db.createCollection('leave_requests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'leaveTypeId', 'fromDate', 'toDate', 'status'],
      properties: {
        employeeId: { bsonType: 'objectId' },
        leaveTypeId: { bsonType: 'objectId' },
        fromDate: { bsonType: 'date' },
        toDate: { bsonType: 'date' },
        partOfDay: { enum: ['full', 'morning', 'afternoon'] },
        days: { bsonType: 'double' },
        reason: { bsonType: 'string' },
        status: { enum: ['pending', 'approved', 'rejected', 'cancelled'] },
        approverId: { bsonType: 'objectId' },
        approvedAt: { bsonType: 'date' },
        rejectionReason: { bsonType: 'string' },
        attachments: { bsonType: 'array' }, // For manager's proof (đơn dấu mộc đỏ)
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.leave_requests.createIndex({ employeeId: 1, fromDate: 1, toDate: 1 });
db.leave_requests.createIndex({ status: 1, createdAt: -1 });
db.leave_requests.createIndex({ approverId: 1, status: 1 });

print('✅ Created leave_requests collection');

// ============================================
// 9. OTP_CODES (OTP 6 số)
// ============================================
db.createCollection('otp_codes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'purpose', 'otpHash', 'expiresAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        purpose: { enum: ['login', 'reset_password', 'change_device'] },
        otpHash: { bsonType: 'string' }, // bcrypt hash
        expiresAt: { bsonType: 'date' },
        attempts: { bsonType: 'int' },
        usedAt: { bsonType: 'date' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.otp_codes.createIndex({ userId: 1, purpose: 1, usedAt: 1 });
db.otp_codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

print('✅ Created otp_codes collection with TTL');

// ============================================
// 10. AUDIT_LOGS (Nhật ký hệ thống)
// ============================================
db.createCollection('audit_logs');

db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
db.audit_logs.createIndex({ action: 1, timestamp: -1 });
db.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

print('✅ Created audit_logs collection');

// ============================================
// SUMMARY
// ============================================
print('\n' + '='.repeat(50));
print('✅ MongoDB Atlas setup completed!');
print('='.repeat(50));
print('\nCollections created:');
print('  1. users (with indexes)');
print('  2. employees (with indexes)');
print('  3. sites (geofence + sample data)');
print('  4. shifts (with sample data)');
print('  5. shift_assignments');
print('  6. attendance (with geospatial index)');
print('  7. attendance_daily');
print('  8. leave_requests');
print('  9. otp_codes (with TTL)');
print('  10. audit_logs (with TTL)');
print('\nNext steps:');
print('  1. Update .env with MongoDB Atlas connection string');
print('  2. Run migration script to copy data from local MongoDB');
print('  3. Start developing Employee API');

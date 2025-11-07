/**
 * Setup MongoDB Atlas Collections & Indexes
 * Chạy script này để tạo collections mới cho Mobile App
 *
 * Cách chạy:
 * node scripts/setup-atlas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function setupAtlas() {
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to Atlas!\n');

    const db = mongoose.connection.db;

    // ============================================
    // 1. SITES COLLECTION (Geofence cho chấm công)
    // ============================================
    console.log('📍 Creating sites collection...');
    const sitesExists = await db.listCollections({ name: 'sites' }).hasNext();

    if (!sitesExists) {
      await db.createCollection('sites');
      await db.collection('sites').createIndex({ location: '2dsphere' });
      await db.collection('sites').createIndex({ siteId: 1 }, { unique: true });

      // Insert sample sites
      await db.collection('sites').insertMany([
        {
          siteId: 'HQ-01',
          name: 'Văn phòng chính - Q1',
          location: {
            type: 'Point',
            coordinates: [106.7009, 10.7756] // [lng, lat] - Landmark 81
          },
          address: '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
          radius: 150,
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
          address: 'KCX Tân Thuận, TP.Thủ Đức, TP.HCM',
          radius: 200,
          isActive: true,
          createdAt: new Date()
        }
      ]);
      console.log('✅ Sites collection created with sample data');
    } else {
      console.log('ℹ️  Sites collection already exists');
    }

    // ============================================
    // 2. SHIFTS COLLECTION (Ca làm việc)
    // ============================================
    console.log('\n⏰ Creating shifts collection...');
    const shiftsExists = await db.listCollections({ name: 'shifts' }).hasNext();

    if (!shiftsExists) {
      await db.createCollection('shifts');
      await db.collection('shifts').createIndex({ shiftId: 1 }, { unique: true });

      await db.collection('shifts').insertMany([
        {
          shiftId: 'CA_HANH_CHINH',
          name: 'Ca hành chính',
          startTime: '08:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          graceMinutes: 5,
          overnight: false,
          workdays: [1, 2, 3, 4, 5], // Thứ 2-6
          isActive: true,
          createdAt: new Date()
        },
        {
          shiftId: 'CA_TOI',
          name: 'Ca tối',
          startTime: '18:00',
          endTime: '02:00',
          breakStart: '22:00',
          breakEnd: '22:30',
          graceMinutes: 5,
          overnight: true,
          workdays: [1, 2, 3, 4, 5, 6],
          isActive: true,
          createdAt: new Date()
        }
      ]);
      console.log('✅ Shifts collection created with sample data');
    } else {
      console.log('ℹ️  Shifts collection already exists');
    }

    // ============================================
    // 3. SHIFT_ASSIGNMENTS
    // ============================================
    console.log('\n📅 Creating shift_assignments collection...');
    const assignExists = await db.listCollections({ name: 'shift_assignments' }).hasNext();

    if (!assignExists) {
      await db.createCollection('shift_assignments');
      await db.collection('shift_assignments').createIndex({ employeeId: 1, date: 1 }, { unique: true });
      await db.collection('shift_assignments').createIndex({ date: 1, shiftId: 1 });
      console.log('✅ Shift_assignments collection created');
    } else {
      console.log('ℹ️  Shift_assignments collection already exists');
    }

    // ============================================
    // 4. ATTENDANCE COLLECTION (Log chấm công thô)
    // ============================================
    console.log('\n👤 Creating attendance collection...');
    const attendanceExists = await db.listCollections({ name: 'attendance' }).hasNext();

    if (!attendanceExists) {
      await db.createCollection('attendance');
      await db.collection('attendance').createIndex({ employeeId: 1, time: -1 });
      await db.collection('attendance').createIndex({ time: 1 });
      await db.collection('attendance').createIndex({ location: '2dsphere' });
      await db.collection('attendance').createIndex({ nonce: 1 }, { expireAfterSeconds: 120 });
      console.log('✅ Attendance collection created with indexes');
    } else {
      console.log('ℹ️  Attendance collection already exists');
    }

    // ============================================
    // 5. ATTENDANCE_DAILY (Tổng hợp theo ngày)
    // ============================================
    console.log('\n📊 Creating attendance_daily collection...');
    const dailyExists = await db.listCollections({ name: 'attendance_daily' }).hasNext();

    if (!dailyExists) {
      await db.createCollection('attendance_daily');
      await db.collection('attendance_daily').createIndex({ employeeId: 1, date: -1 }, { unique: true });
      await db.collection('attendance_daily').createIndex({ date: 1, status: 1 });
      console.log('✅ Attendance_daily collection created');
    } else {
      console.log('ℹ️  Attendance_daily collection already exists');
    }

    // ============================================
    // 6. NONCE (Chống replay attack)
    // ============================================
    console.log('\n🔒 Creating nonce collection...');
    const nonceExists = await db.listCollections({ name: 'nonce' }).hasNext();

    if (!nonceExists) {
      await db.createCollection('nonce');
      await db.collection('nonce').createIndex({ nonce: 1 }, { unique: true });
      await db.collection('nonce').createIndex({ createdAt: 1 }, { expireAfterSeconds: 120 }); // TTL 2 phút
      console.log('✅ Nonce collection created with TTL index');
    } else {
      console.log('ℹ️  Nonce collection already exists');
    }

    // ============================================
    // 7. OTP_CODES (OTP 6 số)
    // ============================================
    console.log('\n🔑 Creating otp_codes collection...');
    const otpExists = await db.listCollections({ name: 'otp_codes' }).hasNext();

    if (!otpExists) {
      await db.createCollection('otp_codes');
      await db.collection('otp_codes').createIndex({ userId: 1, purpose: 1, usedAt: 1 });
      await db.collection('otp_codes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      console.log('✅ OTP_codes collection created with TTL');
    } else {
      console.log('ℹ️  OTP_codes collection already exists');
    }

    // ============================================
    // 8. AUDIT_LOGS
    // ============================================
    console.log('\n📝 Creating audit_logs collection...');
    const auditExists = await db.listCollections({ name: 'audit_logs' }).hasNext();

    if (!auditExists) {
      await db.createCollection('audit_logs');
      await db.collection('audit_logs').createIndex({ userId: 1, timestamp: -1 });
      await db.collection('audit_logs').createIndex({ action: 1, timestamp: -1 });
      await db.collection('audit_logs').createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
      console.log('✅ Audit_logs collection created');
    } else {
      console.log('ℹ️  Audit_logs collection already exists');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ MongoDB Atlas setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\nNew collections created:');
    console.log('  1. sites (geofence locations)');
    console.log('  2. shifts (ca làm việc)');
    console.log('  3. shift_assignments');
    console.log('  4. attendance (log chấm công)');
    console.log('  5. attendance_daily (tổng hợp)');
    console.log('  6. nonce (anti-replay)');
    console.log('  7. otp_codes (OTP 6 số)');
    console.log('  8. audit_logs');
    console.log('\nNext step: Run migration script to copy existing data');
    console.log('  → node scripts/migrate-to-atlas.js\n');

  } catch (error) {
    console.error('❌ Error setting up Atlas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from Atlas');
  }
}

setupAtlas();

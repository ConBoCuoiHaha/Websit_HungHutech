/**
 * Migration Script: Local MongoDB → MongoDB Atlas
 * Copy toàn bộ dữ liệu từ local database sang Atlas
 *
 * Cách chạy:
 * node scripts/migrate-to-atlas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/Hung-qlns';
const ATLAS_URI = process.env.MONGO_URI;

async function migrateToAtlas() {
  let localConn, atlasConn;

  try {
    // Kết nối đến cả 2 databases
    console.log('🔌 Connecting to LOCAL MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to LOCAL\n');

    console.log('🔌 Connecting to ATLAS MongoDB...');
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to ATLAS\n');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    // Danh sách collections cần migrate
    const collectionsToMigrate = [
      'users',
      'nhan_vien',
      'phong_ban',
      'chuc_danh',
      'dia_diem',
      'trang_thai_lao_dong',
      'bac_luong',
      'ca_lam_viec',
      'ngay_le',
      'loai_ngay_nghi',
      'quyen_nghi_phep',
      'yeu_cau_nghi_phep',
      'projects',
      'activities',
      'timesheets',
      'vi_tri_tuyen_dung',
      'ung_vien',
      'ung_tuyen',
      'lich_phong_van',
      'kpi',
      'danh_gia',
      'theo_doi_hieu_suat',
      'yeu_cau_hoan_tra',
      'bai_viet_buzz'
    ];

    console.log('📦 Starting migration...\n');

    let totalMigrated = 0;

    for (const collectionName of collectionsToMigrate) {
      try {
        // Kiểm tra collection có tồn tại trong local không
        const collections = await localDb.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
          console.log(`⏭️  Skipped: ${collectionName} (not found in local)`);
          continue;
        }

        // Lấy data từ local
        const data = await localDb.collection(collectionName).find({}).toArray();

        if (data.length === 0) {
          console.log(`⏭️  Skipped: ${collectionName} (empty)`);
          continue;
        }

        // Xóa data cũ trong Atlas (nếu có)
        await atlasDb.collection(collectionName).deleteMany({});

        // Insert data vào Atlas
        await atlasDb.collection(collectionName).insertMany(data);

        console.log(`✅ Migrated: ${collectionName} (${data.length} documents)`);
        totalMigrated += data.length;

      } catch (error) {
        console.error(`❌ Error migrating ${collectionName}:`, error.message);
      }
    }

    // ============================================
    // Tạo thêm dữ liệu cho users collection (nếu cần)
    // ============================================
    console.log('\n👤 Checking users collection...');
    const usersCount = await atlasDb.collection('users').countDocuments();

    if (usersCount === 0) {
      console.log('⚠️  No users found. Creating default admin user...');

      const bcrypt = require('bcryptjs');
      const defaultPassword = await bcrypt.hash('123456', 10);

      await atlasDb.collection('users').insertOne({
        username: 'admin',
        email: 'admin@company.vn',
        passwordHash: defaultPassword,
        role: 'admin',
        employeeId: null,
        deptId: null,
        isActive: true,
        otpSecret: '123456', // OTP mặc định
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created default admin user (admin@company.vn / 123456)');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log(`\nTotal documents migrated: ${totalMigrated}`);
    console.log('\nNext steps:');
    console.log('  1. Test website connection: npm start');
    console.log('  2. Login with admin@company.vn / 123456');
    console.log('  3. Verify data in Atlas dashboard\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    console.log('👋 Disconnected from databases');
  }
}

migrateToAtlas();

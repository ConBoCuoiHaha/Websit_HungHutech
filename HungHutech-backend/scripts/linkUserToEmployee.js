/**
 * Script to link Users with their corresponding NhanVien (Employee)
 * This fixes the "Không tìm thấy thông tin nhân viên" error in mobile app
 *
 * Run: node scripts/linkUserToEmployee.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../schemas/user.model');
const NhanVien = require('../schemas/nhanVien.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';

async function linkUserToEmployee() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({ active: true });
    console.log(`Found ${users.length} active users\n`);

    let linkedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    for (const user of users) {
      // Skip if already linked
      if (user.nhan_vien_id) {
        console.log(`⏭️  User "${user.username}" already linked to employee ${user.nhan_vien_id}`);
        skippedCount++;
        continue;
      }

      // Try to find employee by username or email
      let nhanVien = null;

      // Method 1: Find by username (assuming ma_nhan_vien matches username)
      nhanVien = await NhanVien.findOne({ ma_nhan_vien: user.username });

      // Method 2: If not found, try by email
      if (!nhanVien && user.email) {
        nhanVien = await NhanVien.findOne({ email: user.email });
      }

      // Method 3: Try lowercase username
      if (!nhanVien) {
        nhanVien = await NhanVien.findOne({
          ma_nhan_vien: { $regex: new RegExp(`^${user.username}$`, 'i') }
        });
      }

      if (nhanVien) {
        // Link user to employee
        user.nhan_vien_id = nhanVien._id;
        await user.save();

        console.log(`✅ Linked user "${user.username}" (${user.email}) → Employee "${nhanVien.ho_ten}" (${nhanVien.ma_nhan_vien})`);
        linkedCount++;
      } else {
        console.log(`❌ No employee found for user "${user.username}" (${user.email})`);
        notFoundCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`✅ Linked: ${linkedCount}`);
    console.log(`⏭️  Already linked: ${skippedCount}`);
    console.log(`❌ Not found: ${notFoundCount}`);
    console.log(`📊 Total: ${users.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkUserToEmployee();

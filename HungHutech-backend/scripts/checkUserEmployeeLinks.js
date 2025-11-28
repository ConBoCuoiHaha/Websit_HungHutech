require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../schemas/user.model');
const NhanVien = require('../schemas/nhanVien.model');

async function checkUserEmployeeLinks() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({ active: true })
      .populate('nhan_vien_id')
      .select('username email role nhan_vien_id');

    console.log(`Found ${users.length} active users:\n`);
    console.log('='.repeat(80));

    for (const user of users) {
      console.log(`\n👤 Username: ${user.username || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);

      if (user.nhan_vien_id) {
        console.log(`   ✅ Linked to Employee:`);
        console.log(`      - ID: ${user.nhan_vien_id._id}`);
        console.log(`      - Name: ${user.nhan_vien_id.ho_ten}`);
        console.log(`      - Code: ${user.nhan_vien_id.ma_nhan_vien}`);
      } else {
        console.log(`   ❌ NOT LINKED to any employee!`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary:`);
    const linkedCount = users.filter(u => u.nhan_vien_id).length;
    const notLinkedCount = users.filter(u => !u.nhan_vien_id).length;
    console.log(`   ✅ Linked: ${linkedCount}`);
    console.log(`   ❌ Not Linked: ${notLinkedCount}`);
    console.log(`   📊 Total: ${users.length}`);

    if (notLinkedCount > 0) {
      console.log('\n⚠️  WARNING: Some users are not linked to employees!');
      console.log('   These users will get "Không tìm thấy thông tin nhân viên" error.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserEmployeeLinks();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../schemas/user.model');
const NhanVien = require('../schemas/nhanVien.model');

async function checkSpecificUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the email you're trying to login with
    const email = process.argv[2];

    if (!email) {
      console.log('❌ Please provide an email as argument');
      console.log('Usage: node checkSpecificUser.js <email>');
      console.log('Example: node checkSpecificUser.js an.tran@demo-hutech.vn');
      process.exit(1);
    }

    console.log(`🔍 Checking user: ${email}\n`);
    console.log('='.repeat(80));

    const user = await User.findOne({ email: email, active: true })
      .populate('nhan_vien_id');

    if (!user) {
      console.log(`\n❌ User NOT FOUND with email: ${email}`);
      console.log('\n📋 Available emails:');
      const allUsers = await User.find({ active: true }).select('email');
      allUsers.forEach(u => console.log(`   - ${u.email}`));
    } else {
      console.log(`\n✅ User FOUND:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);

      if (user.nhan_vien_id) {
        console.log(`\n✅ User IS LINKED to employee:`);
        console.log(`   - Employee ID: ${user.nhan_vien_id._id}`);
        console.log(`   - Employee Code: ${user.nhan_vien_id.ma_nhan_vien}`);
        console.log(`   - Employee Name: ${user.nhan_vien_id.ho_ten || (user.nhan_vien_id.ho_dem + ' ' + user.nhan_vien_id.ten)}`);
        console.log(`\n🎉 THIS USER SHOULD WORK! Login with: ${email}`);
      } else {
        console.log(`\n❌ User is NOT LINKED to any employee!`);
        console.log(`\n🔧 Trying to find matching employee...`);

        // Try to find employee by email
        const employeeByEmail = await NhanVien.findOne({ email: email });
        if (employeeByEmail) {
          console.log(`\n✅ Found matching employee by email:`);
          console.log(`   - Employee ID: ${employeeByEmail._id}`);
          console.log(`   - Employee Code: ${employeeByEmail.ma_nhan_vien}`);
          console.log(`   - Employee Name: ${employeeByEmail.ho_ten || (employeeByEmail.ho_dem + ' ' + employeeByEmail.ten)}`);

          console.log(`\n🔧 Linking user to employee...`);
          user.nhan_vien_id = employeeByEmail._id;
          await user.save();
          console.log(`✅ Successfully linked!`);
          console.log(`\n🎉 NOW TRY AGAIN! Login with: ${email}`);
        } else {
          console.log(`\n❌ No matching employee found with email: ${email}`);
          console.log(`\n📋 Try one of these emails instead:`);
          const employees = await NhanVien.find({ email: { $exists: true, $ne: null } })
            .select('email ma_nhan_vien ho_ten ho_dem ten')
            .limit(10);

          employees.forEach(emp => {
            console.log(`   - ${emp.email} (${emp.ma_nhan_vien} - ${emp.ho_ten || (emp.ho_dem + ' ' + emp.ten)})`);
          });
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSpecificUser();

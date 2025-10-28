require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    console.log('📍 URI:', process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns');

    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';

    await mongoose.connect(MONGO_URI);

    console.log('✅ Kết nối MongoDB thành công!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('📡 Port:', mongoose.connection.port);

    // Liệt kê các collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Các collections hiện có:');
    if (collections.length === 0) {
      console.log('   - Chưa có collection nào (database mới)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('\n✅ Test hoàn tất. Kết nối đã đóng.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    console.error('\n📝 Hướng dẫn khắc phục:');
    console.error('   1. Kiểm tra MongoDB đã được cài đặt và đang chạy');
    console.error('   2. Chạy lệnh: mongod (để khởi động MongoDB)');
    console.error('   3. Kiểm tra file .env có đúng MONGO_URI không');
    console.error('   4. Nếu dùng MongoDB Atlas, kiểm tra username/password và whitelist IP');
    process.exit(1);
  }
}

testConnection();

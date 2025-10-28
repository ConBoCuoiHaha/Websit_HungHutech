// Script để test các API endpoints quan trọng
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Danh sách các API cần test
const apis = [
  { name: 'Đăng nhập', method: 'post', url: '/auth/login', data: { email: 'admin@company.vn', password: '123456' } },
  { name: 'Dashboard Summary', method: 'get', url: '/dashboard/summary', requiresAuth: true },
  { name: 'Nhân viên', method: 'get', url: '/nhanvien', requiresAuth: true },
  { name: 'Phòng ban', method: 'get', url: '/phongban', requiresAuth: true },
  { name: 'Chức danh', method: 'get', url: '/chucdanh', requiresAuth: true },
  { name: 'Địa điểm', method: 'get', url: '/diadiem', requiresAuth: true },
  { name: 'Loại ngày nghỉ', method: 'get', url: '/loaingaynghi', requiresAuth: true },
  { name: 'Bậc lương', method: 'get', url: '/bacluong', requiresAuth: true },
  { name: 'Ngày lễ', method: 'get', url: '/ngay-le', requiresAuth: true },
  { name: 'Users', method: 'get', url: '/users', requiresAuth: true },
  { name: 'Projects', method: 'get', url: '/projects', requiresAuth: true },
  { name: 'Activities', method: 'get', url: '/activities', requiresAuth: true },
];

let token = '';

async function testAPI(api) {
  try {
    const config = {
      method: api.method,
      url: `${BASE_URL}${api.url}`,
      data: api.data,
    };

    if (api.requiresAuth && token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    const response = await axios(config);

    // Lưu token từ login
    if (api.name === 'Đăng nhập' && response.data.token) {
      token = response.data.token;
    }

    console.log(`✅ ${api.name}: OK (${response.status})`);
    if (response.data.data && Array.isArray(response.data.data)) {
      console.log(`   → ${response.data.data.length} records`);
    } else if (response.data.pagination) {
      console.log(`   → ${response.data.pagination.total} total records`);
    }
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${api.name}: FAILED (${error.response.status}) - ${error.response.data.msg || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${api.name}: FAILED - Server not running`);
    } else {
      console.log(`❌ ${api.name}: FAILED - ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Bắt đầu kiểm tra API endpoints...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  let passedTests = 0;
  let failedTests = 0;

  for (const api of apis) {
    const result = await testAPI(api);
    if (result) {
      passedTests++;
    } else {
      failedTests++;
    }
    // Delay nhỏ giữa các requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`   ✅ Thành công: ${passedTests}/${apis.length}`);
  console.log(`   ❌ Thất bại: ${failedTests}/${apis.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests();

const fs = require('fs');

const file = 'C:\\Users\\ADMIN\\Desktop\\HungHutech\\HungHutech_Complete.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

// Function to add bearer auth to all requests except Login
function addAuthToRequests(items, parentName = '') {
  items.forEach(item => {
    if (item.item) {
      // This is a folder, recurse
      addAuthToRequests(item.item, item.name);
    } else if (item.request) {
      // This is a request
      const isLoginRequest = item.name === 'Login' ||
                            item.name.includes('Login') ||
                            item.name.includes('Đăng nhập');

      if (!isLoginRequest) {
        // Add bearer auth
        item.request.auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{token}}',
              type: 'string'
            }
          ]
        };
        console.log('✅ Added auth to:', item.name);
      } else {
        console.log('⏭️  Skipped (Login):', item.name);
      }
    }
  });
}

// Add auth to all requests
console.log('🔧 Processing collection...\n');
addAuthToRequests(collection.item);

// Save
fs.writeFileSync(file, JSON.stringify(collection, null, 2));
console.log('\n✅ Đã thêm Bearer auth vào tất cả requests (trừ Login)');
console.log('📁 File:', file);

# ⚡ Quick Start Guide

Hướng dẫn nhanh để chạy OrangeHRM Backend trong 5 phút!

---

## 🚀 Start trong 5 phút

### Bước 1: Kiểm tra yêu cầu hệ thống ✅

```bash
# Kiểm tra Node.js (cần >= 18.0.0)
node --version

# Kiểm tra npm
npm --version

# Kiểm tra MongoDB
mongod --version
```

**Chưa có?**
- Node.js: https://nodejs.org
- MongoDB: https://www.mongodb.com/try/download/community

---

### Bước 2: Cài đặt dependencies 📦

```bash
cd Hung-backend
npm install
```

⏱️ **Mất khoảng: 1-2 phút**

---

### Bước 3: Setup môi trường ⚙️

File `.env` đã được tạo sẵn! Nếu chưa có:

```bash
# Tạo file .env
cp .env.example .env
```

**File .env mặc định:**
```env
MONGO_URI=mongodb://localhost:27017/Hung-qlns
PORT=5000
JWT_SECRET=Hung-QLNS-2024-Secret-Key-Change-This-In-Production
JWT_EXPIRES_IN=12h
```

✅ **Đã OK! Không cần sửa gì nếu dùng MongoDB local**

---

### Bước 4: Khởi động MongoDB 🗄️

**Windows:**
```bash
# Mở terminal mới và chạy:
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongodb
# Hoặc
brew services start mongodb-community
```

---

### Bước 5: Test kết nối Database 🔌

```bash
npm run test:db
```

**Kết quả mong đợi:**
```
✅ Kết nối MongoDB thành công!
📊 Database: Hung-qlns
```

❌ **Lỗi?** Đảm bảo MongoDB đang chạy!

---

### Bước 6: Tạo dữ liệu mẫu 🌱

```bash
npm run seed
```

**Script này sẽ tạo:**
- 5 nhân viên
- 5 chức danh
- 5 phòng ban
- 3 địa điểm
- 4 trạng thái lao động
- 4 loại ngày nghỉ
- 3 users (admin, manager, employee)

⏱️ **Mất khoảng: 5-10 giây**

**Thông tin đăng nhập:**
| Email | Password | Role |
|-------|----------|------|
| admin@company.com | 123456 | Admin |
| manager@company.com | 123456 | Manager |
| employee@company.com | 123456 | Employee |

---

### Bước 7: Khởi động Server! 🎉

```bash
npm start
```

**Kết quả:**
```
Server is running on port 5000
✅ Successfully connected to MongoDB.
```

---

## ✨ Xong rồi! Server đã sẵn sàng!

### 🌐 Truy cập:

- **API Base**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000

---

## 🧪 Test API ngay!

### 1. Health Check

```bash
curl http://localhost:5000
```

**Response:**
```
OrangeHRM Node.js Backend is running!
```

---

### 2. Đăng nhập

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"123456"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@company.com",
    "role": "admin"
  }
}
```

📝 **Lưu token này!** Bạn sẽ cần nó cho các requests tiếp theo.

---

### 3. Lấy danh sách nhân viên

```bash
curl http://localhost:5000/api/nhanvien \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "items": [...],
  "page": 1,
  "limit": 20,
  "total": 5
}
```

---

### 4. Xem Dashboard

```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "employees": 5,
  "leavePending": 0,
  "claimsPending": 0
}
```

---

## 🎯 Tiếp theo làm gì?

### 📚 Tìm hiểu API

Truy cập Swagger Docs:
```
http://localhost:5000/api/docs
```

### 🧪 Test tất cả endpoints

Xem file: [API_TESTING.md](./API_TESTING.md)

### 🚀 Deploy lên production

Xem file: [DEPLOYMENT.md](./DEPLOYMENT.md)

### 📖 Đọc documentation đầy đủ

Xem file: [README.md](./README.md)

---

## 🆘 Troubleshooting

### Lỗi: Port 5000 đã được sử dụng

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

Hoặc thay đổi PORT trong `.env`:
```env
PORT=3000
```

---

### Lỗi: Không kết nối được MongoDB

**Kiểm tra:**
```bash
# MongoDB có đang chạy?
mongod --version

# Khởi động MongoDB
mongod
```

**Dùng MongoDB Atlas?**

Thay đổi `MONGO_URI` trong `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

---

### Lỗi: JWT token không hợp lệ

**Nguyên nhân:**
- Token đã hết hạn (12h)
- Token không đúng format

**Giải pháp:**
1. Đăng nhập lại để lấy token mới
2. Đảm bảo format: `Authorization: Bearer <token>`

---

### Lỗi: Dependencies không cài được

```bash
# Xóa và cài lại
rm -rf node_modules package-lock.json
npm install
```

---

## 💡 Tips

### 1. Dùng nodemon để auto-reload

```bash
npm start
# Server sẽ tự động restart khi code thay đổi
```

### 2. Xem logs

```bash
# Server logs hiển thị trực tiếp trên terminal
```

### 3. Reset database

```bash
# Chạy lại seed để reset về dữ liệu mẫu
npm run seed
```

### 4. Dùng Postman

- Import Swagger JSON từ http://localhost:5000/api/docs
- Hoặc test trực tiếp trên Swagger UI

### 5. VS Code REST Client

Tạo file `test.http`:

```http
### Đăng nhập
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "123456"
}

### Lấy danh sách nhân viên
GET http://localhost:5000/api/nhanvien
Authorization: Bearer YOUR_TOKEN
```

---

## 📱 Frontend Integration

Backend đã sẵn sàng cho frontend!

**API Base URL:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**Example (Axios):**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = await api.post('/auth/login', {
  email: 'admin@company.com',
  password: '123456'
});

// Get employees
const employees = await api.get('/nhanvien');
```

---

## 🎉 Chúc mừng!

Bạn đã setup thành công OrangeHRM Backend!

**Cần giúp đỡ?**
- 📖 Đọc [README.md](./README.md)
- 🧪 Xem [API_TESTING.md](./API_TESTING.md)
- 🚀 Xem [DEPLOYMENT.md](./DEPLOYMENT.md)
- 📝 Xem [CHANGELOG.md](./CHANGELOG.md)

---

**Happy Coding! 💻✨**

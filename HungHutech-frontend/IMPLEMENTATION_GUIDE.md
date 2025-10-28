# 🚀 Hung Hutech Frontend - Hướng Dẫn Hoàn Thiện

## ✅ Đã Hoàn Thành

### 1. Cấu hình cơ bản
- ✅ Đổi tên thương hiệu thành "Hung Hutech"
- ✅ Cập nhật package.json
- ✅ Cập nhật index.html

### 2. Services Layer
- ✅ `src/services/api.ts` - HTTP client với interceptors
- ✅ `src/services/authService.ts` - Authentication
- ✅ `src/services/nhanVienService.ts` - Nhân viên CRUD
- ✅ `src/services/chucDanhService.ts` - Chức danh CRUD
- ✅ `src/services/phongBanService.ts` - Phòng ban CRUD
- ✅ `src/services/dashboardService.ts` - Dashboard

### 3. Types
- ✅ `src/types/index.ts` - Tất cả TypeScript interfaces

### 4. Dependencies
- ✅ Vue Router 4 đã được cài đặt

---

## 📋 CẦN HOÀN THIỆN

Do giới hạn thời gian, bạn cần tạo các files sau theo cấu trúc:

### 1. Router (`src/router/index.ts`)

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import authService from '@/services/authService';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue')
      },
      {
        path: 'nhan-vien',
        name: 'NhanVien',
        component: () => import('@/pages/NhanVienList.vue')
      },
      {
        path: 'chuc-danh',
        name: 'ChucDanh',
        component: () => import('@/pages/ChucDanhList.vue')
      },
      {
        path: 'phong-ban',
        name: 'PhongBan',
        component: () => import('@/pages/PhongBanList.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated();

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
```

### 2. Main Layout (`src/layouts/MainLayout.vue`)

```vue
<template>
  <div class="main-layout">
    <header class="header">
      <div class="header__left">
        <h1 class="logo">🎓 Hung Hutech</h1>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav__link">Dashboard</router-link>
        <router-link to="/nhan-vien" class="nav__link">Nhân viên</router-link>
        <router-link to="/chuc-danh" class="nav__link">Chức danh</router-link>
        <router-link to="/phong-ban" class="nav__link">Phòng ban</router-link>
      </nav>
      <div class="header__right">
        <span>{{ user?.email }}</span>
        <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
      </div>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';
import { User } from '@/types';

const router = useRouter();
const user = ref<User | null>(null);

onMounted(() => {
  user.value = authService.getUser();
});

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  background: #1f2937;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  margin: 0;
  font-size: 1.5rem;
}
.nav {
  display: flex;
  gap: 1rem;
}
.nav__link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
}
.nav__link:hover,
.nav__link.router-link-active {
  background: #374151;
}
.header__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.btn-logout {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}
.content {
  flex: 1;
  padding: 2rem;
  background: #f3f4f6;
}
</style>
```

### 3. Login Page (`src/pages/Login.vue`)

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <h1>🎓 Hung Hutech</h1>
      <h2>Đăng nhập</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input v-model="password" type="password" required />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';

const router = useRouter();
const email = ref('admin@company.com');
const password = ref('123456');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authService.login({ email: email.value, password: password.value });
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.msg || 'Đăng nhập thất bại';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 400px;
}
.login-card h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}
.login-card h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #666;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
}
button[type="submit"] {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 0.375rem;
}
</style>
```

### 4. Dashboard Page (`src/pages/Dashboard.vue`)

```vue
<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="stats">
      <div class="stat-card">
        <h3>Tổng nhân viên</h3>
        <p class="stat-number">{{ summary?.employees || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>Chờ duyệt nghỉ phép</h3>
        <p class="stat-number">{{ summary?.leavePending || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>Chờ duyệt claims</h3>
        <p class="stat-number">{{ summary?.claimsPending || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import dashboardService from '@/services/dashboardService';
import { DashboardSummary } from '@/types';

const summary = ref<DashboardSummary | null>(null);

onMounted(async () => {
  try {
    summary.value = await dashboardService.getSummary();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 2rem;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}
.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.stat-card h3 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
}
.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}
</style>
```

### 5. Cập nhật `src/main.ts`

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/assets/styles/main.css'; // Nếu có

const app = createApp(App);
app.use(router);
app.mount('#app');
```

### 6. Cập nhật `src/App.vue`

```vue
<template>
  <router-view />
</template>

<script setup lang="ts">
// App component chỉ cần render router-view
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
```

---

## 🏃 Chạy Frontend

```bash
cd Hung-frontend
npm install
npm run serve
```

Truy cập: http://localhost:8080

---

## 🔗 Tích hợp với Backend

Frontend sẽ tự động kết nối với backend tại `http://localhost:5000` (đã cấu hình trong `.env.development`)

---

## 📝 Testing Flow

1. Chạy backend: `cd Hung-backend && npm start`
2. Seed data: `cd Hung-backend && npm run seed`
3. Chạy frontend: `cd Hung-frontend && npm run serve`
4. Login với: `admin@company.com` / `123456`

---

## 🎨 Customization

### Thay đổi Logo
- Sửa file `src/layouts/MainLayout.vue`
- Thay 🎓 bằng logo image của bạn

### Thay đổi màu sắc
- Sửa colors trong các file `.vue`
- Tạo file theme CSS riêng

### Thêm modules mới
1. Tạo service trong `src/services/`
2. Tạo types trong `src/types/`
3. Tạo page trong `src/pages/`
4. Thêm route trong `src/router/index.ts`

---

## ✅ Next Steps

Bạn có thể mở rộng với:
- ✅ Nghỉ phép module
- ✅ Chấm công module
- ✅ Tuyển dụng module
- ✅ Charts & Reports
- ✅ Export Excel/PDF
- ✅ Notifications

---

**Hung Hutech - Hệ thống Quản lý Nhân sự** 🎓

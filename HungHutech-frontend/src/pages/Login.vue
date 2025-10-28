<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="logo">🎓 Hung Hutech</h1>
        <p class="tagline">Hệ thống Quản lý Nhân sự</p>
      </div>

      <h2 class="login-title">Đăng nhập</h2>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@company.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="!loading">🔓 Đăng nhập</span>
          <span v-else>⏳ Đang đăng nhập...</span>
        </button>

        <div v-if="error" class="error-message">⚠️ {{ error }}</div>
      </form>

      <div class="login-footer">
        <p class="hint">💡 <strong>Demo:</strong> admin@company.com / 123456</p>
      </div>
    </div>

    <div class="background-pattern"></div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useRouter} from 'vue-router';
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
    await authService.login({
      email: email.value,
      password: password.value,
    });

    // Redirect to dashboard
    router.push('/');
  } catch (err: any) {
    console.error('Login error:', err);
    error.value =
      err.response?.data?.msg || 'Đăng nhập thất bại. Vui lòng thử lại.';
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
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 35px,
    rgba(255, 255, 255, 0.1) 35px,
    rgba(255, 255, 255, 0.1) 70px
  );
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.login-title {
  text-align: center;
  margin: 0 0 2rem 0;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  padding: 0.875rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
  text-align: center;
}

.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.hint {
  margin: 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.hint strong {
  color: #667eea;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .logo {
    font-size: 2.5rem;
  }

  .login-title {
    font-size: 1.25rem;
  }
}
</style>

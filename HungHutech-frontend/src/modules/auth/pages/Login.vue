<template>
  <LoginLayout
    :login-logo-src="loginLogoSrc"
    :login-banner-src="loginBannerSrc"
  >
    <!-- Login Title -->
    <h5 class="orangehrm-login-title">Đăng nhập</h5>

    <!-- Login Form -->
    <div class="orangehrm-login-form">
      <!-- Error Alert -->
      <div class="orangehrm-login-error">
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
          class="orangehrm-login-alert"
        />

        <!-- Demo Credentials (if enabled) -->
        <div v-if="isDemoMode" class="orangehrm-demo-credentials">
          <p><strong>Username:</strong> Admin</p>
          <p><strong>Password:</strong> admin123</p>
        </div>
      </div>

      <!-- Login Form -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @submit.prevent="handleLogin"
      >
        <!-- Username Field -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="Tên đăng nhập"
            size="large"
            :prefix-icon="User"
            autofocus
          >
            <template #prepend>
              <span class="input-label">Tên đăng nhập</span>
            </template>
          </el-input>
        </el-form-item>

        <!-- Password Field -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Mật khẩu"
            size="large"
            :prefix-icon="Lock"
            show-password
          >
            <template #prepend>
              <span class="input-label">Mật khẩu</span>
            </template>
          </el-input>
        </el-form-item>

        <!-- Submit Button -->
        <el-form-item class="orangehrm-login-action">
          <el-button
            type="primary"
            size="large"
            class="orangehrm-login-button"
            :loading="loading"
            native-type="submit"
            @click="handleLogin"
          >
            Đăng nhập
          </el-button>
        </el-form-item>

        <!-- Forgot Password Link -->
        <div class="orangehrm-login-forgot">
          <span
            class="orangehrm-login-forgot-header"
            @click="navigateToForgotPassword"
          >
            Quên mật khẩu?
          </span>
        </div>
      </el-form>

      <!-- Social Media Login Divider (if enabled) -->
      <el-divider v-if="showSocialAuth" class="orangehrm-login-seperator">
        Hoặc
      </el-divider>
    </div>

    <!-- Footer with Social Media Links -->
    <div class="orangehrm-login-footer">
      <div v-if="showSocialMedia" class="orangehrm-login-footer-sm">
        <a href="https://www.linkedin.com/company/hutech/" target="_blank">
          <el-icon class="orangehrm-sm-icon"><Position /></el-icon>
        </a>
        <a href="https://www.facebook.com/DaiHocCongNgheTPHCM" target="_blank">
          <el-icon class="orangehrm-sm-icon"><ChatDotRound /></el-icon>
        </a>
        <a href="https://www.youtube.com/@HUTECHEDU" target="_blank">
          <el-icon class="orangehrm-sm-icon"><VideoPlay /></el-icon>
        </a>
      </div>
    </div>
  </LoginLayout>
</template>

<script lang="ts" setup>
import {ref, reactive} from 'vue';
import {useRouter} from 'vue-router';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import {
  User,
  Lock,
  Position,
  ChatDotRound,
  VideoPlay,
} from '@element-plus/icons-vue';
import LoginLayout from '../components/LoginLayout.vue';
import {login} from '../services/auth.service';

// Router
const router = useRouter();

// Props
const loginLogoSrc = '/logo.png';
const loginBannerSrc = '/login-banner.png';
const isDemoMode = false;
const showSocialAuth = false;
const showSocialMedia = true;

// Form ref
const loginFormRef = ref<FormInstance>();

// Form data
const loginForm = reactive({
  username: '',
  password: '',
});

// Form validation rules
const loginRules: FormRules = {
  username: [
    {required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur'},
  ],
  password: [
    {required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur'},
  ],
};

// State
const loading = ref(false);
const errorMessage = ref('');

// Methods
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      errorMessage.value = '';

      try {
        const response = await login(loginForm.username, loginForm.password);

        // Store token in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        ElMessage.success('Đăng nhập thành công!');

        // Navigate to dashboard
        router.push('/dashboard');
      } catch (error: any) {
        errorMessage.value =
          error.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.';
        ElMessage.error(errorMessage.value);
      } finally {
        loading.value = false;
      }
    }
  });
};

const navigateToForgotPassword = () => {
  router.push('/auth/forgot-password');
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

.orangehrm-login-title {
  text-align: center;
  font-weight: 800;
  font-size: 24px;
  margin-bottom: $spacing-xl;
  color: $text-dark;
}

.orangehrm-login-form {
  margin: 0 auto;
  width: 100%;
  max-width: 485px;

  @media (max-width: 768px) {
    width: 80%;
  }
}

.orangehrm-login-error {
  margin-bottom: $spacing-lg;
}

.orangehrm-login-alert {
  margin-bottom: $spacing-md;
}

.orangehrm-demo-credentials {
  background-color: $bg-light;
  padding: $spacing-md;
  border-radius: $border-radius;
  margin: $spacing-md 0;

  p {
    margin: 0.5rem 0;
    font-size: 14px;
    color: $text-dark;
  }
}

.input-label {
  display: inline-block;
  min-width: 120px;
  font-weight: 500;
  color: $text-dark;
}

:deep(.el-input-group__prepend) {
  background-color: transparent;
  border: none;
  padding: 0 $spacing-md;
}

:deep(.el-form-item) {
  margin-bottom: $spacing-lg;
}

.orangehrm-login-action {
  margin-top: 2rem;

  :deep(.el-form-item__content) {
    justify-content: center;
  }
}

.orangehrm-login-button {
  width: 100%;
  padding: 1rem 0;
  font-size: 16px;
  font-weight: 600;
  height: auto;
}

.orangehrm-login-forgot {
  display: flex;
  justify-content: center;
  margin-top: $spacing-md;
  font-size: 14px;

  &-header {
    cursor: pointer;
    color: $primary-color;
    transition: color 0.3s;

    &:hover {
      color: $primary-hover;
      text-decoration: underline;
    }
  }
}

.orangehrm-login-seperator {
  margin: $spacing-lg 0;
}

.orangehrm-login-footer {
  margin-top: $spacing-xl;

  &-sm {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $spacing-sm;

    a {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: rgba($primary-color, 0.1);
      transition: all 0.3s;

      &:hover {
        background-color: $primary-color;

        .orangehrm-sm-icon {
          color: $white;
        }
      }
    }

    .orangehrm-sm-icon {
      font-size: 18px;
      color: $primary-color;
      transition: color 0.3s;
    }

    @media (min-width: 768px) {
      position: absolute;
      left: $spacing-lg;
      bottom: $spacing-lg;
    }
  }
}
</style>

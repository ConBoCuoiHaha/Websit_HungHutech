<template>
  <LoginLayout
    :login-logo-src="loginLogoSrc"
    :login-banner-src="loginBannerSrc"
  >
    <!-- Title -->
    <h5 class="orangehrm-login-title">Quên mật khẩu</h5>

    <!-- Forgot Password Form -->
    <div class="orangehrm-login-form">
      <!-- Success Message -->
      <el-alert
        v-if="successMessage"
        :title="successMessage"
        type="success"
        :closable="false"
        show-icon
        class="orangehrm-login-alert"
      />

      <!-- Error Alert -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
        class="orangehrm-login-alert"
      />

      <p class="orangehrm-forgot-description">
        Nhập địa chỉ email của bạn để nhận hướng dẫn đặt lại mật khẩu.
      </p>

      <!-- Form -->
      <el-form
        ref="forgotFormRef"
        :model="forgotForm"
        :rules="forgotRules"
        @submit.prevent="handleSubmit"
      >
        <!-- Email Field -->
        <el-form-item prop="email">
          <el-input
            v-model="forgotForm.email"
            placeholder="Email"
            size="large"
            :prefix-icon="Message"
          >
            <template #prepend>
              <span class="input-label">Email</span>
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
            @click="handleSubmit"
          >
            Gửi yêu cầu
          </el-button>
        </el-form-item>

        <!-- Back to Login Link -->
        <div class="orangehrm-login-forgot">
          <span class="orangehrm-login-forgot-header" @click="navigateToLogin">
            ← Quay lại đăng nhập
          </span>
        </div>
      </el-form>
    </div>
  </LoginLayout>
</template>

<script lang="ts" setup>
import {ref, reactive} from 'vue';
import {useRouter} from 'vue-router';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import {Message} from '@element-plus/icons-vue';
import LoginLayout from '../components/LoginLayout.vue';
import {forgotPassword} from '../services/auth.service';

// Router
const router = useRouter();

// Props
const loginLogoSrc = '/logo.png';
const loginBannerSrc = '/login-banner.png';

// Form ref
const forgotFormRef = ref<FormInstance>();

// Form data
const forgotForm = reactive({
  email: '',
});

// Validate email format
const validateEmail = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('Vui lòng nhập email'));
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('Email không hợp lệ'));
  } else {
    callback();
  }
};

// Form validation rules
const forgotRules: FormRules = {
  email: [{required: true, validator: validateEmail, trigger: 'blur'}],
};

// State
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Methods
const handleSubmit = async () => {
  if (!forgotFormRef.value) return;

  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      errorMessage.value = '';
      successMessage.value = '';

      try {
        const response = await forgotPassword(forgotForm.email);
        successMessage.value =
          response.message ||
          'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.';
        ElMessage.success(successMessage.value);

        // Reset form
        forgotForm.email = '';
        forgotFormRef.value.resetFields();
      } catch (error: any) {
        errorMessage.value =
          error.response?.data?.message ||
          'Có lỗi xảy ra. Vui lòng thử lại sau.';
        ElMessage.error(errorMessage.value);
      } finally {
        loading.value = false;
      }
    }
  });
};

const navigateToLogin = () => {
  router.push('/auth/login');
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

.orangehrm-login-alert {
  margin-bottom: $spacing-lg;
}

.orangehrm-forgot-description {
  text-align: center;
  margin-bottom: $spacing-xl;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.5;
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
</style>

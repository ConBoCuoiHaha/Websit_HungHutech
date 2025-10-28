<template>
  <div class="orangehrm-login-layout">
    <div class="orangehrm-login-layout-blob">
      <div class="orangehrm-login-container">
        <div class="orangehrm-login-slot-wrapper">
          <!-- Left side - Branding -->
          <div class="orangehrm-login-branding">
            <img
              v-if="loginBannerSrc"
              :src="loginBannerSrc"
              alt="login-banner"
              class="orangehrm-login-banner"
            />
          </div>

          <!-- Right side - Login Form -->
          <div class="orangehrm-login-slot">
            <!-- Mobile Logo -->
            <div class="orangehrm-login-logo-mobile">
              <img :src="loginLogoSrc" alt="Hung Hutech" />
            </div>

            <!-- Slot for login form content -->
            <slot></slot>
          </div>
        </div>
      </div>

      <!-- Desktop Logo (top right) -->
      <div class="orangehrm-login-logo">
        <img :src="loginLogoSrc" alt="Hung Hutech" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'LoginLayout',
  props: {
    loginLogoSrc: {
      type: String,
      default: '/logo.png',
    },
    loginBannerSrc: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

.orangehrm-login-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-light;
}

.orangehrm-login-layout-blob {
  width: 100%;
  max-width: 1200px;
  position: relative;
  padding: $spacing-xl;
}

.orangehrm-login-container {
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow;
  overflow: hidden;
}

.orangehrm-login-slot-wrapper {
  display: flex;
  min-height: 500px;
}

// Left side - Branding (40% width)
.orangehrm-login-branding {
  width: 40%;
  background: linear-gradient(
    135deg,
    $primary-gradient-start 0%,
    $primary-gradient-end 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;

  @media (max-width: 768px) {
    display: none;
  }
}

.orangehrm-login-banner {
  max-width: 100%;
  height: auto;
}

// Right side - Login Form (60% width)
.orangehrm-login-slot {
  width: 60%;
  padding: $spacing-xl * 2;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    width: 100%;
    padding: $spacing-lg;
  }
}

// Desktop Logo (top right corner)
.orangehrm-login-logo {
  position: absolute;
  top: $spacing-lg;
  right: $spacing-lg;

  img {
    height: 40px;
    width: auto;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

// Mobile Logo (inside form)
.orangehrm-login-logo-mobile {
  display: none;
  text-align: center;
  margin-bottom: $spacing-xl;

  img {
    height: 50px;
    width: auto;
  }

  @media (max-width: 768px) {
    display: block;
  }
}
</style>

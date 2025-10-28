<template>
  <el-container class="orangehrm-layout">
    <!-- Topbar -->
    <el-header class="orangehrm-topbar">
      <div class="orangehrm-topbar-header">
        <!-- Brand Logo -->
        <div class="orangehrm-topbar-header-logo">
          <span class="orangehrm-logo-emoji">🎓</span>
          <span class="orangehrm-brand">Hung Hutech</span>
        </div>

        <!-- User Info & Actions -->
        <div class="orangehrm-topbar-header-userarea">
          <div class="orangehrm-topbar-header-userarea-name">
            <span>{{ userName }}</span>
          </div>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-avatar :size="32" class="orangehrm-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
                </el-dropdown-item>
                <el-dropdown-item disabled>{{ user?.email }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Đăng xuất
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-container>
      <!-- Sidebar -->
      <el-aside width="240px" class="orangehrm-aside">
        <el-menu
          :default-active="activeMenu"
          class="orangehrm-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>

          <el-menu-item index="/thong-tin-cua-toi">
            <el-icon><User /></el-icon>
            <span>Thông tin của tôi</span>
          </el-menu-item>

          <el-menu-item index="/danh-ba">
            <el-icon><User /></el-icon>
            <span>Danh bạ công ty</span>
          </el-menu-item>

          <el-sub-menu index="pim">
            <template #title>
              <el-icon><User /></el-icon>
              <span>Nhân sự (PIM)</span>
            </template>
            <el-menu-item index="/nhan-vien">Danh sách Nhân viên</el-menu-item>
            <el-menu-item index="/nhan-vien/them">Thêm Nhân viên</el-menu-item>
            <el-menu-item index="/phong-ban">Phòng ban</el-menu-item>
            <el-menu-item index="/chuc-danh">Chức danh</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="leave">
            <template #title>
              <el-icon><Calendar /></el-icon>
              <span>Nghỉ phép</span>
            </template>
            <el-menu-item index="/nghi-phep">Danh sách đơn nghỉ phép</el-menu-item>
            <el-menu-item index="/nghi-phep/so-du">Số dư phép</el-menu-item>
            <el-menu-item index="/nghi-phep/phe-duyet">Phê duyệt đơn nghỉ</el-menu-item>
            <el-menu-item index="/nghi-phep/gan-phep">Gán phép</el-menu-item>
            <el-menu-item index="/nghi-phep/loai">Loại nghỉ phép</el-menu-item>
            <el-menu-item index="/nghi-phep/quyen">Quyền nghỉ phép</el-menu-item>
            <el-menu-item index="/nghi-phep/ngay-le">Ngày lễ</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="time">
            <template #title>
              <el-icon><Clock /></el-icon>
              <span>Thời gian</span>
            </template>
            <el-menu-item index="/timesheet/my-timesheet">Bảng chấm công của tôi</el-menu-item>
            <el-menu-item index="/timesheet/phe-duyet">Phê duyệt timesheet</el-menu-item>
            <el-menu-item index="/cham-cong">Chấm công hàng ngày</el-menu-item>
            <el-menu-item index="/cham-cong/bang-cong">Bảng chấm công</el-menu-item>
            <el-menu-item index="/ca-lam-viec">Ca làm việc</el-menu-item>
            <el-menu-item index="/du-an">Quản lý Dự án</el-menu-item>
            <el-menu-item index="/hoat-dong">Quản lý Hoạt động</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="claims">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>Bồi hoàn</span>
            </template>
            <el-menu-item index="/boi-hoan">Danh sách yêu cầu</el-menu-item>
            <el-menu-item index="/boi-hoan/phe-duyet">Phê duyệt bồi hoàn</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="recruitment">
            <template #title>
              <el-icon><User /></el-icon>
              <span>Tuyển dụng</span>
            </template>
            <el-menu-item index="/tuyen-dung">Vị trí tuyển dụng</el-menu-item>
            <el-menu-item index="/tuyen-dung/ung-vien">Ứng viên</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="performance">
            <template #title>
              <el-icon><Odometer /></el-icon>
              <span>Hiệu suất</span>
            </template>
            <el-menu-item index="/hieu-suat/kpi">Quản lý KPI</el-menu-item>
            <el-menu-item index="/hieu-suat/danh-gia">Đánh giá hiệu suất</el-menu-item>
          </el-sub-menu>

          <!-- Admin menu -->
          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>Quản trị</span>
            </template>
            <el-menu-item index="/admin/nguoi-dung">Người dùng</el-menu-item>
            <el-menu-item index="/admin/dia-diem">Địa điểm</el-menu-item>
            <el-menu-item index="/admin/bac-luong">Bậc lương</el-menu-item>
            <el-menu-item index="/phong-ban">Phòng ban</el-menu-item>
            <el-menu-item index="/chuc-danh">Chức danh</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- Main Content -->
      <el-main class="orangehrm-main">
        <div class="orangehrm-body">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  User,
  SwitchButton,
  Odometer,
  Calendar,
  Clock,
  Tickets,
  Setting,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import {getCurrentUser, logout} from '@/modules/auth/services/auth.service';

const router = useRouter();
const route = useRoute();

const user = ref<any>(null);
const activeMenu = ref('/dashboard');

onMounted(() => {
  user.value = getCurrentUser();
  activeMenu.value = route.path;
});

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  },
);

const userName = computed(() => {
  if (user.value) {
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim() || user.value.username;
  }
  return 'User';
});

const handleMenuSelect = (index: string) => {
  router.push(index);
};

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await logout();
      ElMessage.success('Đăng xuất thành công');
      router.push('/auth/login');
    } catch (error) {
      ElMessage.error('Có lỗi xảy ra khi đăng xuất');
    }
  }
};
</script>

<style lang="scss" scoped>
.orangehrm-layout {
  min-height: 100vh;
  background-color: $bg-light;
}

// Topbar Styles
.orangehrm-topbar {
  height: 60px !important;
  background: linear-gradient(135deg, $primary-gradient-start 0%, $primary-gradient-end 100%);
  padding: 0 $spacing-xl;
  box-shadow: $box-shadow-sm;
}

.orangehrm-topbar-header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-topbar-header-logo {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  color: $white;

  .orangehrm-logo-emoji {
    font-size: 32px;
    line-height: 1;
  }

  .orangehrm-brand {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $white;
  }
}

.orangehrm-topbar-header-userarea {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.orangehrm-topbar-header-userarea-name {
  color: $white;
  font-weight: $font-weight-medium;
  font-size: $font-size-base;
}

.orangehrm-avatar {
  background-color: rgba($white, 0.2);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: rgba($white, 0.3);
  }
}

// Sidebar Styles
.orangehrm-aside {
  background-color: $white;
  border-right: 1px solid $border-color;
  overflow-y: auto;
}

.orangehrm-menu {
  border-right: none;
  padding: $spacing-md 0;

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    font-size: $font-size-base;
    color: $text-primary;

    &:hover {
      background-color: rgba($primary-color, 0.1);
      color: $primary-color;
    }

    &.is-active {
      background-color: rgba($primary-color, 0.15);
      color: $primary-color;
      font-weight: $font-weight-medium;
    }
  }

  :deep(.el-sub-menu__title) {
    height: 48px;
    line-height: 48px;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-primary;

    &:hover {
      background-color: rgba($primary-color, 0.05);
      color: $primary-color;
    }
  }

  :deep(.el-icon) {
    font-size: 18px;
    margin-right: $spacing-sm;
  }
}

// Main Content Styles
.orangehrm-main {
  background-color: $bg-light;
  padding: $spacing-xl;
  min-height: calc(100vh - 60px);
}

.orangehrm-body {
  background-color: $white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-sm;
  padding: $spacing-xl;
  min-height: 600px;
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-aside {
    width: 200px !important;
  }

  .orangehrm-topbar {
    padding: 0 $spacing-md;
  }

  .orangehrm-main {
    padding: $spacing-md;
  }

  .orangehrm-body {
    padding: $spacing-md;
  }

  .orangehrm-topbar-header-logo {
    .orangehrm-brand {
      display: none;
    }
  }
}
</style>

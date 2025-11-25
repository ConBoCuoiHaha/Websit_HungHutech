<template>
  <el-container class="orangehrm-layout">
    <!-- Topbar -->
    <el-header class="orangehrm-topbar">
      <div class="orangehrm-topbar-header">
        <div class="orangehrm-topbar-left">
          <el-button
            class="orangehrm-mobile-menu-btn"
            circle
            plain
            size="small"
            @click="toggleSidebar"
            :aria-label="sidebarOpen ? 'Dong menu' : 'Mo menu'"
          >
            <el-icon><Menu /></el-icon>
          </el-button>

        <!-- Brand Logo -->
        <div class="orangehrm-topbar-header-logo">
          <span class="orangehrm-logo-emoji">🎓</span>
          <span class="orangehrm-brand">Hung Hutech</span>
        </div>

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
      <el-aside
        :width="sidebarOpen ? asideWidth : '0px'"
        class="orangehrm-aside"
        :class="{'is-mobile': isMobile, 'is-open': sidebarOpen, 'is-closed': !sidebarOpen}"
      >
        <el-menu
          :default-active="activeMenu"
          class="orangehrm-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>Tổng quan</span>
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
            <el-menu-item index="/ho-so-nhan-su">Hồ sơ nhân sự</el-menu-item>
            <el-menu-item index="/hop-dong">Hợp đồng lao động</el-menu-item>
            <el-menu-item index="/offboarding">Checklist nghỉ việc</el-menu-item>
            <el-menu-item index="/pim/yeu-cau-cap-nhat"
              >Yêu cầu cập nhật hồ sơ</el-menu-item
            >
          </el-sub-menu>

          <el-sub-menu index="leave">
            <template #title>
              <el-icon><Calendar /></el-icon>
              <span>Nghỉ phép</span>
            </template>
            <el-menu-item index="/nghi-phep"
              >Danh sách đơn nghỉ phép</el-menu-item
            >
            <el-menu-item index="/nghi-phep/so-du">Số dư phép</el-menu-item>
            <el-menu-item index="/nghi-phep/phe-duyet"
              >Phê duyệt đơn nghỉ</el-menu-item
            >
            <el-menu-item index="/nghi-phep/gan-phep">Gán phép</el-menu-item>
            <el-menu-item index="/nghi-phep/loai">Loại nghỉ phép</el-menu-item>
            <el-menu-item index="/nghi-phep/quyen"
              >Quyền nghỉ phép</el-menu-item
            >
            <el-menu-item index="/nghi-phep/ngay-le">Ngày lễ</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="time">
            <template #title>
              <el-icon><Clock /></el-icon>
              <span>Thời gian</span>
            </template>
            <el-menu-item index="/timesheet/my-timesheet"
              >Bảng chấm công của tôi</el-menu-item
            >
            <el-menu-item index="/timesheet/phe-duyet"
              >Phê duyệt timesheet</el-menu-item
            >
            <el-menu-item index="/cham-cong">Chấm công hàng ngày</el-menu-item>
            <el-menu-item index="/cham-cong/bang-cong"
              >Bảng chấm công</el-menu-item
            >
            <el-menu-item index="/ca-lam-viec">Ca làm việc</el-menu-item>
            <el-menu-item index="/du-an">Quản lý Dự án</el-menu-item>
            <el-menu-item index="/hoat-dong">Quản lý Hoạt động</el-menu-item>
            <el-menu-item index="/tang-ca/duyet">Duyệt tăng ca</el-menu-item>
            <el-menu-item index="/luong/bang-luong">Bảng lương</el-menu-item>
            <el-menu-item index="/thoi-gian/rule-engine">Bộ quy tắc Time/OT</el-menu-item>
            <el-menu-item index="/thoi-gian/phan-ca">Phân ca linh hoạt</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="claims">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>Bồi hoàn</span>
            </template>
            <el-menu-item index="/boi-hoan">Danh sách yêu cầu</el-menu-item>
            <el-menu-item index="/boi-hoan/phe-duyet"
              >Phê duyệt bồi hoàn</el-menu-item
            >
          </el-sub-menu>

          <el-menu-item index="/consent-hub">Trung tâm đồng thuận</el-menu-item>

          <el-sub-menu index="recruitment">
            <template #title>
              <el-icon><User /></el-icon>
              <span>Tuyển dụng</span>
            </template>
            <el-menu-item index="/tuyen-dung">Vị trí tuyển dụng</el-menu-item>
            <el-menu-item index="/tuyen-dung/ung-vien">Ứng viên</el-menu-item>
            <el-menu-item index="/tuyen-dung/pipeline">Quy trình ứng viên</el-menu-item>
            <el-menu-item index="/tuyen-dung/candidate-pool">Ngân hàng ứng viên</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="performance">
            <template #title>
              <el-icon><Odometer /></el-icon>
              <span>Hiệu suất</span>
            </template>
            <el-menu-item index="/hieu-suat/kpi">Quản lý KPI</el-menu-item>
            <el-menu-item index="/hieu-suat/danh-gia"
              >Đánh giá hiệu suất</el-menu-item
            >
          </el-sub-menu>

          <el-sub-menu index="reporting">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>Báo cáo</span>
            </template>
            <el-menu-item index="/bao-cao">Báo cáo tuỳ chỉnh</el-menu-item>
            <el-menu-item index="/bao-cao/phap-ly"
              >Báo cáo pháp lý</el-menu-item
            >
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
            <el-menu-item index="/admin/sites"
              >📍 Địa điểm Chấm công</el-menu-item
            >
            <el-menu-item index="/admin/audit-logs"
              >📊 Lịch sử Truy cập</el-menu-item
            >
            <el-menu-item index="/phong-ban">Phòng ban</el-menu-item>
            <el-menu-item index="/chuc-danh">Chức danh</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <div
        v-if="isMobile"
        class="orangehrm-aside-backdrop"
        :class="{'is-visible': sidebarOpen}"
        @click="sidebarOpen = false"
      />

      <!-- Main Content -->
      <el-main class="orangehrm-main">
        <div class="orangehrm-body">
          <router-view />
        </div>
      </el-main>
    </el-container>
    <el-dialog
      v-model="consentDialogVisible"
      width="720px"
      title="Đồng ý xử lý dữ liệu cá nhân"
      :close-on-click-modal="allowConsentClose"
      :close-on-press-escape="allowConsentClose"
      :show-close="allowConsentClose"
      class="consent-dialog-wrapper"
    >
      <div v-loading="consentLoading" class="consent-dialog">
        <el-alert
          type="info"
          show-icon
          title="Minh bạch sử dụng dữ liệu"
          description="Công ty cần sự đồng ý của bạn theo Nghị định 13/2023/NĐ-CP để xử lý dữ liệu cá nhân phục vụ quản lý nhân sự và tính lương."
        />
        <el-skeleton
          v-if="consentLoading && consentItems.length === 0"
          :rows="4"
          animated
        />
        <template v-else>
          <el-empty
            v-if="consentItems.length === 0"
            description="Chưa có mục đích dữ liệu nào được khai báo"
          />
          <div v-else class="consent-dialog-list">
            <el-card
              v-for="item in consentItems"
              :key="item.key"
              :body-style="{padding: '16px'}"
              class="consent-dialog-card"
            >
              <div class="consent-card-head">
                <div>
                  <h4>
                    {{ item.name }}
                    <el-tag
                      v-if="item.required"
                      type="danger"
                      size="small"
                      effect="plain"
                    >
                      Bắt buộc
                    </el-tag>
                  </h4>
                  <p>{{ item.description }}</p>
                </div>
                <div class="consent-card-switch">
                  <el-switch
                    v-model="consentSelections[item.key]"
                    :disabled="item.required && consentSelections[item.key]"
                    inline-prompt
                    active-text="Đồng ý"
                    inactive-text="Từ chối"
                  />
                </div>
              </div>
              <ul class="consent-card-meta">
                <li>
                  <strong>Loại dữ liệu:</strong>
                  <span v-if="item.data_types?.length">
                    {{ item.data_types.join(', ') }}
                  </span>
                  <span v-else>---</span>
                </li>
                <li>
                  <strong>Chia sẻ với:</strong>
                  <span v-if="item.recipients?.length">
                    {{ item.recipients.join(', ') }}
                  </span>
                  <span v-else>---</span>
                </li>
                <li>
                  <strong>Cơ sở pháp lý:</strong>
                  {{ item.legal_basis || '---' }}
                </li>
                <li>
                  <strong>Thời hạn lưu trữ:</strong>
                  {{ item.retention || 'Theo chính sách công ty' }}
                </li>
              </ul>
            </el-card>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button
          v-if="allowConsentClose"
          @click="consentDialogVisible = false"
        >
          Để sau
        </el-button>
        <el-button
          type="primary"
          :disabled="hasMissingRequired"
          :loading="consentSaving"
          @click="handleSaveConsentChoices"
        >
          Lưu lựa chọn
        </el-button>
      </template> </el-dialog
    >\r\n
  </el-container>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted, onUnmounted, watch} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  User,
  SwitchButton,
  Odometer,
  Calendar,
  Clock,
  Tickets,
  Menu,
  Setting,
  Document,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import {getCurrentUser, logout} from '@/modules/auth/services/auth.service';
import consentService from '@/services/consentService';
import {ConsentView} from '@/types';

const router = useRouter();
const route = useRoute();

const user = ref<any>(null);
const activeMenu = ref('/dashboard');
const isMobile = ref(false);
const sidebarOpen = ref(true);
const asideWidth = computed(() => (isMobile.value ? '260px' : '240px'));

const consentDialogVisible = ref(false);
const consentLoading = ref(false);
const consentSaving = ref(false);
const consentItems = ref<ConsentView[]>([]);
const consentSelections = reactive<Record<string, boolean>>({});

const resetConsentSelections = (items: ConsentView[]) => {
  Object.keys(consentSelections).forEach(
    (key) => delete consentSelections[key],
  );
  items.forEach((item) => {
    consentSelections[item.key] = item.status === 'Accepted';
  });
};

const hasMissingRequired = computed(() =>
  consentItems.value.some(
    (item) => item.required && !consentSelections[item.key],
  ),
);

const allowConsentClose = computed(() => !hasMissingRequired.value);

const loadConsentStatus = async () => {
  consentLoading.value = true;
  try {
    const result = await consentService.getMyConsents();
    consentItems.value = result.items;
    resetConsentSelections(result.items);
    if (result.pendingRequired) {
      consentDialogVisible.value = true;
    }
  } catch (err) {
    console.error('loadConsentStatus error', err);
  } finally {
    consentLoading.value = false;
  }
};

const handleConsentEvent = () => {
  loadConsentStatus();
};

const handleResize = () => {
  const mobile = window.innerWidth <= 1024;
  if (mobile !== isMobile.value) {
    sidebarOpen.value = !mobile;
  }
  isMobile.value = mobile;
};

onMounted(() => {
  user.value = getCurrentUser();
  activeMenu.value = route.path;
  loadConsentStatus();
  handleResize();
  window.addEventListener('consent-updated', handleConsentEvent);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('consent-updated', handleConsentEvent);
  window.removeEventListener('resize', handleResize);
});

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
    if (isMobile.value) {
      sidebarOpen.value = false;
    }
  },
);

const userName = computed(() => {
  if (user.value) {
    const fullName = [user.value.firstName || '', user.value.lastName || '']
      .join(' ')
      .trim();
    return fullName || user.value.username;
  }
  return 'User';
});

const handleMenuSelect = (index: string) => {
  router.push(index);
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
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

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const handleSaveConsentChoices = async () => {
  if (hasMissingRequired.value) {
    ElMessage.warning('Vui lòng đồng ý các mục đích bắt buộc');
    return;
  }

  consentSaving.value = true;
  try {
    const payload = consentItems.value.map((item) => ({
      purpose: item.key,
      accepted: consentSelections[item.key],
    }));
    const result = await consentService.saveConsents(payload);
    consentItems.value = result.items;
    resetConsentSelections(result.items);
    consentDialogVisible.value = result.pendingRequired;
    if (!result.pendingRequired) {
      ElMessage.success('Đã cập nhật lựa chọn dữ liệu cá nhân');
    } else {
      ElMessage.warning('Còn mục đích bắt buộc chưa được đồng ý');
    }
  } catch (error: any) {
    console.error('handleSaveConsentChoices error', error);
    ElMessage.error(
      error.response?.data?.msg || 'Không thể cập nhật trạng thái đồng ý',
    );
  } finally {
    consentSaving.value = false;
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
  background: linear-gradient(
    135deg,
    $primary-gradient-start 0%,
    $primary-gradient-end 100%
  );
  padding: 0 $spacing-xl;
  box-shadow: $box-shadow-sm;
}

.orangehrm-topbar-header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-topbar-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
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

.orangehrm-mobile-menu-btn {
  display: inline-flex;
  border: none;
  background-color: rgba($white, 0.18);
  color: $white;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba($white, 0.28);
  }
}

// Sidebar Styles
.orangehrm-aside {
  background-color: $white;
  border-right: 1px solid $border-color;
  overflow-y: auto;
  overscroll-behavior: contain;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  flex-shrink: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease, width 0.3s ease;
}

.orangehrm-aside.is-mobile {
  position: fixed;
  left: 0;
  top: 60px;
  width: 260px !important;
  height: calc(100vh - 60px);
  box-shadow: $box-shadow-lg;
  transform: translateX(-100%);
  z-index: 2001;
}

.orangehrm-aside.is-mobile.is-open {
  transform: translateX(0);
}

.orangehrm-aside.is-closed {
  width: 0 !important;
  border-right: none;
  overflow: hidden;
  transform: translateX(-100%);
}

.orangehrm-aside.is-closed .orangehrm-menu {
  display: none;
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

.orangehrm-aside-backdrop {
  display: none;
}

.consent-dialog-wrapper {
  :deep(.el-dialog__body) {
    padding-top: $spacing-md;
  }
}

.consent-dialog {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.consent-dialog-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.consent-dialog-card {
  .consent-card-head {
    display: flex;
    justify-content: space-between;
    gap: $spacing-lg;
    flex-wrap: wrap;

    h4 {
      margin: 0;
      font-size: $font-size-lg;
    }

    p {
      margin: $spacing-xxs 0 0 0;
      color: $text-secondary;
    }
  }

  .consent-card-switch {
    display: flex;
    align-items: center;
  }

  .consent-card-meta {
    margin: $spacing-md 0 0 0;
    padding-left: $spacing-lg;
    list-style: none;

    li {
      margin-bottom: $spacing-xxs;
      color: $text-secondary;

      strong {
        color: $text-primary;
        margin-right: $spacing-xxs;
      }
    }
  }
}

// Responsive
@media (max-width: 1024px) {
  .orangehrm-mobile-menu-btn {
    display: inline-flex;
  }

  .orangehrm-topbar {
    padding: 0 $spacing-md;
  }

  .orangehrm-aside.is-mobile {
    box-shadow: $box-shadow-lg;
  }

  .orangehrm-aside-backdrop {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    height: calc(100vh - 60px);
    background: rgba(0, 0, 0, 0.35);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    z-index: 2000;
  }

  .orangehrm-aside-backdrop.is-visible {
    opacity: 1;
    visibility: visible;
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



<template>
  <div class="orangehrm-myinfo">
    <!-- Page Header với Avatar và Tên -->
    <el-card class="orangehrm-myinfo-header" shadow="never">
      <div class="orangehrm-myinfo-header-content">
        <div class="orangehrm-myinfo-avatar-section">
          <el-avatar
            :size="120"
            :src="
              employee?.avatar_url
                ? uploadService.getFileUrl(employee.avatar_url)
                : undefined
            "
          >
            <el-icon :size="60"><User /></el-icon>
          </el-avatar>
          <el-upload
            class="orangehrm-avatar-upload"
            action="#"
            :show-file-list="false"
            :before-upload="handleAvatarUpload"
          >
            <el-button size="small" :icon="Camera">Đổi ảnh</el-button>
          </el-upload>
        </div>

        <div class="orangehrm-myinfo-info-section">
          <h1 class="orangehrm-myinfo-name">
            {{ employee?.ho_dem }} {{ employee?.ten }}
          </h1>
          <p class="orangehrm-myinfo-id">Mã NV: {{ employee?.ma_nhan_vien }}</p>
          <div class="orangehrm-myinfo-tags">
            <el-tag
              v-if="employee?.thong_tin_cong_viec?.chuc_danh_id"
              type="primary"
            >
              {{ employee.thong_tin_cong_viec.chuc_danh_id.ten_chuc_danh }}
            </el-tag>
            <el-tag
              v-if="employee?.thong_tin_cong_viec?.phong_ban_id"
              type="success"
            >
              {{ employee.thong_tin_cong_viec.phong_ban_id.ten }}
            </el-tag>
            <el-tag
              v-if="employee?.thong_tin_cong_viec?.trang_thai_lao_dong_id"
              :type="
                getEmploymentStatusType(
                  employee.thong_tin_cong_viec.trang_thai_lao_dong_id.ten,
                )
              "
            >
              {{ employee.thong_tin_cong_viec.trang_thai_lao_dong_id.ten }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-card class="orangehrm-myinfo-tabs" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- Tab Thông tin cá nhân -->
        <el-tab-pane label="Thông tin cá nhân" name="personal">
          <EmployeePersonalInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
            @request-submitted="handleProfileRequestSubmitted"
          />
        </el-tab-pane>

        <!-- Tab Liên hệ -->
        <el-tab-pane label="Thông tin liên hệ" name="contact">
          <EmployeeContactInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
            @request-submitted="handleProfileRequestSubmitted"
          />
        </el-tab-pane>

        <!-- Tab Thong tin BHXH -->
        <el-tab-pane label="Th�ng tin BHXH" name="insurance">
          <EmployeeInsuranceInfo
            :employee="employee"
            :loading="loading"
            readonly
          />
        </el-tab-pane>

        <!-- Tab Tai lieu -->
        <el-tab-pane label="Tai lieu cua toi" name="documents">
          <EmployeeMyDocuments />
        </el-tab-pane>

        <!-- Tab Nghi phep -->
        <el-tab-pane label="Nghi phep cua toi" name="myLeaves">
          <EmployeeMyLeaveRequests />
        </el-tab-pane>

        <el-tab-pane label="Cham cong cua toi" name="myTime">
          <EmployeeDailySummary />
        </el-tab-pane>

        <!-- Tab Tang ca -->
        <el-tab-pane label="Tang ca cua toi" name="myOt">
          <EmployeeMyOvertime />
        </el-tab-pane>

        <!-- Tab Danh gia hieu suat -->
        <el-tab-pane label="Danh gia hieu suat" name="myPerformance">
          <EmployeeMyPerformance />
        </el-tab-pane>

        <!-- Tab Trình độ -->
        <el-tab-pane label="Trình độ" name="qualifications">
          <EmployeeQualifications
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
          />
        </el-tab-pane>

        <!-- Tab Người phụ thuộc -->
        <el-tab-pane label="Người phụ thuộc" name="dependents">
          <EmployeeDependents
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
            @request-submitted="handleProfileRequestSubmitted"
          />
        </el-tab-pane>

        <!-- Tab Kinh nghiệm -->
        <el-tab-pane label="Kinh nghiệm" name="experience">
          <EmployeeExperience
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
          />
        </el-tab-pane>

        <!-- Tab Liên hệ khẩn cấp -->
        <el-tab-pane label="Liên hệ khẩn cấp" name="emergency">
          <EmployeeEmergencyContacts
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
          />
        </el-tab-pane>

        <!-- Tab Xuất nhập cảnh -->
        <el-tab-pane label="Xuất nhập cảnh" name="immigration">
          <EmployeeImmigration
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
          />
        </el-tab-pane>

        <!-- Tab Thành viên tổ chức -->
        <el-tab-pane label="Thành viên tổ chức" name="memberships">
          <EmployeeMemberships
            :employee="employee"
            :loading="loading"
            @reload="loadEmployeeInfo"
          />
        </el-tab-pane>

        <!-- Tab Phiếu lương -->
        <el-tab-pane label="Phiếu lương" name="payslips">
          <div class="payslip-section">
            <el-skeleton v-if="payslipLoading" :rows="4" animated />
            <template v-else>
              <el-empty
                v-if="payslips.length === 0"
                description="Chưa có phiếu lương khả dụng"
              />
              <el-table v-else :data="payslips" border style="width: 100%">
                <el-table-column label="Kỳ lương" min-width="180">
                  <template #default="{row}">
                    <div class="payslip-title">
                      <strong>{{ row.ky_luong }}</strong>
                      <span>{{
                        formatDateRange(row.ngay_bat_dau, row.ngay_ket_thuc)
                      }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Thu nhập" width="140">
                  <template #default="{row}">
                    {{ formatCurrency(row.entry.tong_thu_nhap, row.currency) }}
                  </template>
                </el-table-column>
                <el-table-column label="Khấu trừ" width="140">
                  <template #default="{row}">
                    {{ formatCurrency(row.entry.tong_khau_tru, row.currency) }}
                  </template>
                </el-table-column>
                <el-table-column label="Thực nhận" width="150">
                  <template #default="{row}">
                    <strong>{{
                      formatCurrency(row.entry.luong_thuc_nhan, row.currency)
                    }}</strong>
                  </template>
                </el-table-column>
                <el-table-column label="Trạng thái" width="160">
                  <template #default="{row}">
                    <div class="payslip-status">
                      <el-tag
                        :type="runStatusTag(row.trang_thai_run)"
                        size="small"
                      >
                        {{ runStatusLabel(row.trang_thai_run) }}
                      </el-tag>
                      <el-tag type="info" size="small">
                        {{ entryStatusLabel(row.entry.trang_thai) }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Yeu cau cap nhat" name="profileRequests">
          <div class="profile-requests-tab">
            <div class="profile-requests-header">
              <div class="profile-requests-header-text">
                <h3>Yêu cầu cập nhật hồ sơ</h3>
                <p>Thông tin các yêu cầu thay đổi đang chờ HR xử lý</p>
              </div>
              <el-button
                type="primary"
                size="small"
                :icon="Refresh"
                plain
                :loading="requestLoading"
                @click="loadProfileRequests(true)"
              >
                Làm mới
              </el-button>
            </div>
            <el-skeleton
              v-if="requestLoading && profileRequests.length === 0"
              :rows="4"
              animated
            />
            <template v-else>
              <el-empty
                v-if="profileRequests.length === 0"
                description="Chưa có yêu cầu nào"
              />
              <el-table v-else :data="profileRequests" border stripe>
                <el-table-column label="Loại" min-width="150">
                  <template #default="{row}">
                    {{ requestTypeLabel(row.type) }}
                  </template>
                </el-table-column>
                <el-table-column label="Ngày gửi" min-width="180">
                  <template #default="{row}">
                    {{ formatRequestDate(row.ngay_tao) }}
                  </template>
                </el-table-column>
                <el-table-column label="Trạng thái" width="140">
                  <template #default="{row}">
                    <el-tag :type="requestStatusTag(row.status)" size="small">
                      {{ requestStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="note"
                  label="Ghi chu"
                  min-width="200"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="approver_note"
                  label="Phan hoi tu HR"
                  min-width="200"
                  show-overflow-tooltip
                />
              </el-table>
            </template>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Quyen du lieu" name="consent">
          <ConsentCenter />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {User, Camera, Refresh} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import authService from '@/services/authService';
import nhanVienService from '@/services/nhanVienService';
import uploadService from '@/services/uploadService';
import payrollService from '@/services/payrollService';
import profileRequestService from '@/services/profileRequestService';
import {
  NhanVien,
  PayrollPayslip,
  PayrollRunStatus,
  ProfileRequest,
} from '@/types';

// Import child components
import EmployeePersonalInfo from '@/components/employee/EmployeePersonalInfo.vue';
import EmployeeContactInfo from '@/components/employee/EmployeeContactInfo.vue';
import EmployeeQualifications from '@/components/employee/EmployeeQualifications.vue';
import EmployeeDependents from '@/components/employee/EmployeeDependents.vue';
import EmployeeExperience from '@/components/employee/EmployeeExperience.vue';
import EmployeeEmergencyContacts from '@/components/employee/EmployeeEmergencyContacts.vue';
import EmployeeImmigration from '@/components/employee/EmployeeImmigration.vue';
import EmployeeMemberships from '@/components/employee/EmployeeMemberships.vue';
import EmployeeInsuranceInfo from '@/components/employee/EmployeeInsuranceInfo.vue';
import EmployeeMyDocuments from '@/components/employee/EmployeeMyDocuments.vue';
import EmployeeMyLeaveRequests from '@/components/employee/EmployeeMyLeaveRequests.vue';
import EmployeeMyOvertime from '@/components/employee/EmployeeMyOvertime.vue';
import EmployeeDailySummary from '@/components/employee/EmployeeDailySummary.vue';
import EmployeeMyPerformance from '@/components/employee/EmployeeMyPerformance.vue';
import ConsentCenter from '@/components/privacy/ConsentCenter.vue';

const employee = ref<NhanVien | null>(null);
const loading = ref(false);
const activeTab = ref('personal');
const payslipLoading = ref(false);
const payslips = ref<PayrollPayslip[]>([]);
const hasLoadedPayslips = ref(false);
const profileRequests = ref<ProfileRequest[]>([]);
const requestLoading = ref(false);
const hasLoadedRequests = ref(false);

const loadEmployeeInfo = async () => {
  loading.value = true;
  try {
    // Get current logged-in user
    const user = authService.getUser();

    if (!user?.nhan_vien_id) {
      ElMessage.error('Không tìm thấy thông tin nhân viên của bạn');
      return;
    }

    // Load employee information by employee ID
    employee.value = await nhanVienService.getById(user.nhan_vien_id);
  } catch (err: any) {
    console.error('Error loading employee info:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin cá nhân',
    );
  } finally {
    loading.value = false;
  }
};

const handleTabClick = (tab: any) => {
  if (tab.paneName === 'payslips' && !hasLoadedPayslips.value) {
    loadPayslips();
  }
  if (tab.paneName === 'profileRequests' && !hasLoadedRequests.value) {
    loadProfileRequests();
  }
};

const loadPayslips = async () => {
  payslipLoading.value = true;
  try {
    const data = await payrollService.getMyPayslips();
    payslips.value = data;
    hasLoadedPayslips.value = true;
  } catch (err: any) {
    console.error('Error loading payslips:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải phiếu lương');
  } finally {
    payslipLoading.value = false;
  }
};

const loadProfileRequests = async (force = false) => {
  if (requestLoading.value) return;
  if (!force && hasLoadedRequests.value) return;
  requestLoading.value = true;
  try {
    profileRequests.value = await profileRequestService.getMy();
    hasLoadedRequests.value = true;
  } catch (err: any) {
    console.error('Error loading profile requests:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách yêu cầu',
    );
  } finally {
    requestLoading.value = false;
  }
};

const requestTypeLabel = (type: ProfileRequest['type']) => {
  switch (type) {
    case 'personal':
      return 'Thông tin cá nhân';
    case 'contact':
      return 'Liên hệ & địa chỉ';
    case 'dependents':
      return 'Người phụ thuộc';
    default:
      return type;
  }
};

const requestStatusLabel = (status: ProfileRequest['status']) => {
  if (status === 'Pending') return 'Chờ duyệt';
  if (status === 'Approved') return 'Đã duyệt';
  if (status === 'Rejected') return 'Từ chối';
  return status;
};

const requestStatusTag = (status: ProfileRequest['status']) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  return 'warning';
};

const formatRequestDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleString('vi-VN');
};

const handleProfileRequestSubmitted = () => {
  loadProfileRequests(true);
};

const handleAvatarUpload = async (file: File) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('Chỉ chấp nhận file ảnh JPG, PNG');
    return false;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('Kích thước file không được vượt quá 5MB');
    return false;
  }

  try {
    const user = authService.getUser();
    if (!user?.nhan_vien_id) {
      ElMessage.error('Không tìm thấy thông tin nhân viên');
      return false;
    }

    await uploadService.uploadEmployeePhoto(user.nhan_vien_id, file);
    ElMessage.success('Tải ảnh đại diện thành công');
    await loadEmployeeInfo();
  } catch (err: any) {
    console.error('Error uploading avatar:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải ảnh đại diện');
  }

  return false;
};

const getEmploymentStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Đang làm việc': 'success',
    'Toàn thời gian': 'success',
    'Bán thời gian': 'primary',
    'Thử việc': 'warning',
    'Nghỉ việc': 'info',
    'Tạm nghỉ': 'danger',
    'Thực tập': 'primary',
  };
  return statusMap[status] || 'info';
};

const formatCurrency = (value?: number, currency = 'VND') => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `${(value || 0).toLocaleString('vi-VN')} ${currency}`;
  }
};

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return '---';
  return `${new Date(start).toLocaleDateString('vi-VN')} - ${new Date(
    end,
  ).toLocaleDateString('vi-VN')}`;
};

const runStatusLabel = (status: PayrollRunStatus) => {
  switch (status) {
    case 'Draft':
      return 'Nháp';
    case 'Cho_duyet':
      return 'Chờ duyệt';
    case 'Da_duyet':
      return 'Đã duyệt';
    case 'Da_chi':
      return 'Đã chi';
    default:
      return status;
  }
};

const runStatusTag = (status: PayrollRunStatus) => {
  if (status === 'Da_duyet' || status === 'Da_chi') return 'success';
  if (status === 'Cho_duyet') return 'warning';
  return 'info';
};

const entryStatusLabel = (status: 'Cho_duyet' | 'Da_duyet' | 'Da_chi') => {
  switch (status) {
    case 'Da_duyet':
      return 'Phiếu duyệt';
    case 'Da_chi':
      return 'Đã chi trả';
    default:
      return 'Chờ duyệt';
  }
};

onMounted(() => {
  loadEmployeeInfo();
});
</script>

<style lang="scss" scoped>
.orangehrm-myinfo {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

// MyInfo Header Card
.orangehrm-myinfo-header {
  margin-bottom: $spacing-xl;

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-myinfo-header-content {
  display: flex;
  gap: $spacing-xl;
  align-items: flex-start;
}

.orangehrm-myinfo-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.orangehrm-avatar-upload {
  :deep(.el-upload) {
    width: 100%;
  }
}

.orangehrm-myinfo-info-section {
  flex: 1;
}

.orangehrm-myinfo-name {
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.orangehrm-myinfo-id {
  font-size: $font-size-base;
  color: $text-secondary;
  margin: 0 0 $spacing-md 0;
}

.orangehrm-myinfo-tags {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

// Tabs Card
.orangehrm-myinfo-tabs {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 $spacing-xl;
    background-color: $bg-gray;
  }

  :deep(.el-tabs__content) {
    padding: $spacing-xl;
  }

  :deep(.el-tabs__item) {
    font-weight: $font-weight-medium;
    color: $text-secondary;

    &.is-active {
      color: $primary-color;
    }

    &:hover {
      color: $primary-color;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: $primary-color;
  }
}

.payslip-section {
  min-height: 200px;
}

.payslip-title {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

.payslip-status {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.profile-requests-tab {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.profile-requests-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.profile-requests-header-text {
  h3 {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $text-primary;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-myinfo-header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .orangehrm-myinfo-info-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .orangehrm-myinfo-name {
    font-size: $font-size-xl;
  }
}
</style>

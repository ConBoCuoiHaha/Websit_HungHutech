<template>
  <div class="orangehrm-employee-detail">
    <!-- Page Header với Avatar và Tên -->
    <el-card class="orangehrm-employee-header" shadow="never">
      <div class="orangehrm-employee-header-content">
        <div class="orangehrm-employee-avatar-section">
          <el-avatar :size="120" :src="employee?.avatar_url ? uploadService.getFileUrl(employee.avatar_url) : undefined">
            <el-icon :size="60"><User /></el-icon>
          </el-avatar>
          <el-upload
            v-if="canEdit"
            class="orangehrm-avatar-upload"
            action="#"
            :show-file-list="false"
            :before-upload="handleAvatarUpload"
          >
            <el-button size="small" :icon="Camera">Đổi ảnh</el-button>
          </el-upload>
        </div>

        <div class="orangehrm-employee-info-section">
          <h1 class="orangehrm-employee-name">
            {{ employee?.ho_dem }} {{ employee?.ten }}
          </h1>
          <p class="orangehrm-employee-id">Mã NV: {{ employee?.ma_nhan_vien }}</p>
          <div class="orangehrm-employee-tags">
            <el-tag v-if="employee?.thong_tin_cong_viec?.chuc_danh_id" type="primary">
              {{ employee.thong_tin_cong_viec.chuc_danh_id.ten_chuc_danh }}
            </el-tag>
            <el-tag v-if="employee?.thong_tin_cong_viec?.phong_ban_id" type="success">
              {{ employee.thong_tin_cong_viec.phong_ban_id.ten }}
            </el-tag>
            <el-tag
              v-if="employee?.thong_tin_cong_viec?.trang_thai_lao_dong_id"
              :type="getEmploymentStatusType(employee.thong_tin_cong_viec.trang_thai_lao_dong_id.ten)"
            >
              {{ employee.thong_tin_cong_viec.trang_thai_lao_dong_id.ten }}
            </el-tag>
          </div>
        </div>

        <div class="orangehrm-employee-actions">
          <el-button @click="handleBack" :icon="Back">Quay lại</el-button>
          <el-button v-if="canEdit" type="primary" @click="activeTab = 'personal'" :icon="Edit">
            Chỉnh sửa
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-card class="orangehrm-employee-tabs" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- Tab Thông tin cá nhân -->
        <el-tab-pane label="Thông tin cá nhân" name="personal">
          <EmployeePersonalInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Liên hệ -->
        <el-tab-pane label="Thông tin liên hệ" name="contact">
          <EmployeeContactInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Công việc -->
        <el-tab-pane label="Thông tin công việc" name="job">
          <EmployeeJobInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Lương -->
        <el-tab-pane label="Lương" name="salary">
          <EmployeeSalaryInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Báo cáo -->
        <el-tab-pane label="Báo cáo cho" name="report">
          <EmployeeReportInfo
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Trình độ -->
        <el-tab-pane label="Trình độ" name="qualifications">
          <EmployeeQualifications
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Người phụ thuộc -->
        <el-tab-pane label="Người phụ thuộc" name="dependents">
          <EmployeeDependents
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Kinh nghiệm -->
        <el-tab-pane label="Kinh nghiệm" name="experience">
          <EmployeeExperience
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Liên hệ khẩn cấp -->
        <el-tab-pane label="Liên hệ khẩn cấp" name="emergency">
          <EmployeeEmergencyContacts
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Xuất nhập cảnh -->
        <el-tab-pane label="Xuất nhập cảnh" name="immigration">
          <EmployeeImmigration
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>

        <!-- Tab Thành viên tổ chức -->
        <el-tab-pane label="Thành viên tổ chức" name="memberships">
          <EmployeeMemberships
            :employee="employee"
            :loading="loading"
            @reload="loadEmployee"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {User, Camera, Edit, Back} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import uploadService from '@/services/uploadService';
import {NhanVien} from '@/types';

// Import child components
import EmployeePersonalInfo from '@/components/employee/EmployeePersonalInfo.vue';
import EmployeeContactInfo from '@/components/employee/EmployeeContactInfo.vue';
import EmployeeJobInfo from '@/components/employee/EmployeeJobInfo.vue';
import EmployeeSalaryInfo from '@/components/employee/EmployeeSalaryInfo.vue';
import EmployeeReportInfo from '@/components/employee/EmployeeReportInfo.vue';
import EmployeeQualifications from '@/components/employee/EmployeeQualifications.vue';
import EmployeeDependents from '@/components/employee/EmployeeDependents.vue';
import EmployeeExperience from '@/components/employee/EmployeeExperience.vue';
import EmployeeEmergencyContacts from '@/components/employee/EmployeeEmergencyContacts.vue';
import EmployeeImmigration from '@/components/employee/EmployeeImmigration.vue';
import EmployeeMemberships from '@/components/employee/EmployeeMemberships.vue';

const route = useRoute();
const router = useRouter();

const employee = ref<NhanVien | null>(null);
const loading = ref(false);
const activeTab = ref('personal');

const employeeId = computed(() => route.params.id as string);
const canEdit = computed(() => true); // TODO: Check permissions

const loadEmployee = async () => {
  loading.value = true;
  try {
    employee.value = await nhanVienService.getById(employeeId.value);
  } catch (err: any) {
    console.error('Error loading employee:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin nhân viên',
    );
    router.push('/nhan-vien');
  } finally {
    loading.value = false;
  }
};

const handleTabClick = (tab: any) => {
  console.log('Tab clicked:', tab.paneName);
};

const handleBack = () => {
  router.push('/nhan-vien');
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
    const uploadResult = await uploadService.uploadEmployeePhoto(employeeId.value, file);
    ElMessage.success('Tải ảnh đại diện thành công');

    // Reload employee to get updated avatar
    await loadEmployee();
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

onMounted(() => {
  loadEmployee();
});
</script>

<style lang="scss" scoped>
.orangehrm-employee-detail {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

// Employee Header Card
.orangehrm-employee-header {
  margin-bottom: $spacing-xl;

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-employee-header-content {
  display: flex;
  gap: $spacing-xl;
  align-items: flex-start;
}

.orangehrm-employee-avatar-section {
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

.orangehrm-employee-info-section {
  flex: 1;
}

.orangehrm-employee-name {
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.orangehrm-employee-id {
  font-size: $font-size-base;
  color: $text-secondary;
  margin: 0 0 $spacing-md 0;
}

.orangehrm-employee-tags {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.orangehrm-employee-actions {
  display: flex;
  gap: $spacing-sm;
  flex-direction: column;
}

// Tabs Card
.orangehrm-employee-tabs {
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

// Responsive
@media (max-width: 768px) {
  .orangehrm-employee-header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .orangehrm-employee-info-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .orangehrm-employee-actions {
    width: 100%;
    flex-direction: row;

    .el-button {
      flex: 1;
    }
  }

  .orangehrm-employee-name {
    font-size: $font-size-xl;
  }
}
</style>

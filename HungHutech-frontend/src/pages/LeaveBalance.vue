<template>
  <div class="orangehrm-leave-balance-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Số dư phép</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
      </div>
    </div>

    <!-- Employee Selection -->
    <el-card class="orangehrm-search-card" shadow="never">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="selectedEmployeeId"
            placeholder="Chọn nhân viên"
            filterable
            style="width: 100%"
            @change="loadBalanceData"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="selectedYear"
            placeholder="Chọn năm"
            style="width: 100%"
            @change="loadBalanceData"
          >
            <el-option
              v-for="year in years"
              :key="year"
              :label="`Năm ${year}`"
              :value="year"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Leave Balance Cards -->
    <div v-if="selectedEmployeeId" class="orangehrm-balance-container">
      <el-row :gutter="16" v-loading="loading">
        <el-col
          v-for="balance in balanceList"
          :key="balance.loai_ngay_nghi._id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="orangehrm-balance-card" shadow="hover">
            <div class="orangehrm-balance-header">
              <h3 class="orangehrm-balance-title">
                {{ balance.loai_ngay_nghi.ten }}
              </h3>
              <el-icon :size="24" color="#4A90E2">
                <Calendar />
              </el-icon>
            </div>

            <div class="orangehrm-balance-content">
              <div class="orangehrm-balance-item">
                <span class="orangehrm-balance-label">Được hưởng:</span>
                <span class="orangehrm-balance-value orangehrm-total">
                  {{ balance.so_ngay_duoc_huong }} ngày
                </span>
              </div>

              <div class="orangehrm-balance-item">
                <span class="orangehrm-balance-label">Đã sử dụng:</span>
                <span class="orangehrm-balance-value orangehrm-used">
                  {{ balance.so_ngay_da_su_dung }} ngày
                </span>
              </div>

              <div class="orangehrm-balance-divider"></div>

              <div class="orangehrm-balance-item orangehrm-balance-remaining">
                <span class="orangehrm-balance-label">Còn lại:</span>
                <span class="orangehrm-balance-value orangehrm-available">
                  {{ balance.so_ngay_con_lai }} ngày
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="orangehrm-balance-progress">
                <el-progress
                  :percentage="getUsagePercentage(balance)"
                  :color="getProgressColor(balance)"
                  :stroke-width="8"
                />
              </div>
            </div>

            <div v-if="balance.loai_ngay_nghi.mo_ta" class="orangehrm-balance-footer">
              <el-text size="small" type="info">
                {{ balance.loai_ngay_nghi.mo_ta }}
              </el-text>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Empty State -->
      <el-empty
        v-if="!loading && balanceList.length === 0"
        description="Không có dữ liệu số dư phép"
      >
        <el-button type="primary" @click="loadData">Tải lại</el-button>
      </el-empty>
    </div>

    <!-- No Employee Selected -->
    <el-empty
      v-else
      description="Vui lòng chọn nhân viên để xem số dư phép"
      :image-size="200"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Calendar, Refresh} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import quyenNghiPhepService from '@/services/quyenNghiPhepService';
import nhanVienService from '@/services/nhanVienService';
import {LeaveBalance, NhanVien} from '@/types';

const employees = ref<NhanVien[]>([]);
const balanceList = ref<LeaveBalance[]>([]);
const loading = ref(false);
const selectedEmployeeId = ref('');
const selectedYear = ref(new Date().getFullYear());

// Generate years list (current year and 2 years before/after)
const years = ref<number[]>([]);
for (let i = -2; i <= 2; i++) {
  years.value.push(new Date().getFullYear() + i);
}

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];

    // Auto-select first employee if available
    if (employees.value.length > 0 && !selectedEmployeeId.value) {
      selectedEmployeeId.value = employees.value[0]._id;
      await loadBalanceData();
    }
  } catch (err) {
    console.error('Error loading employees:', err);
    ElMessage.error('Không thể tải danh sách nhân viên');
  }
};

const loadBalanceData = async () => {
  if (!selectedEmployeeId.value) return;

  loading.value = true;
  try {
    const data = await quyenNghiPhepService.getByNhanVienId(
      selectedEmployeeId.value,
      selectedYear.value,
    );
    balanceList.value = data || [];
  } catch (err: any) {
    console.error('Error loading leave balance:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin số dư phép',
    );
    balanceList.value = [];
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  await loadEmployees();
};

const getUsagePercentage = (balance: LeaveBalance): number => {
  if (balance.so_ngay_duoc_huong === 0) return 0;
  const percentage =
    (balance.so_ngay_da_su_dung / balance.so_ngay_duoc_huong) * 100;
  return Math.min(Math.round(percentage), 100);
};

const getProgressColor = (balance: LeaveBalance): string => {
  const percentage = getUsagePercentage(balance);
  if (percentage >= 90) return '#F56C6C';
  if (percentage >= 70) return '#E6A23C';
  return '#67C23A';
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-leave-balance-page {
  width: 100%;
}

// Page Header
.orangehrm-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.orangehrm-page-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-page-actions {
  display: flex;
  gap: $spacing-sm;
}

// Search Card
.orangehrm-search-card {
  margin-bottom: $spacing-xl;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Balance Container
.orangehrm-balance-container {
  margin-top: $spacing-xl;
}

// Balance Card
.orangehrm-balance-card {
  margin-bottom: $spacing-lg;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba($primary-color, 0.15);
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.orangehrm-balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.orangehrm-balance-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-balance-content {
  margin-bottom: $spacing-md;
}

.orangehrm-balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
  padding: $spacing-xs 0;
}

.orangehrm-balance-label {
  color: $text-secondary;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

.orangehrm-balance-value {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;

  &.orangehrm-total {
    color: $primary-color;
  }

  &.orangehrm-used {
    color: #E6A23C;
  }

  &.orangehrm-available {
    color: #67C23A;
    font-size: $font-size-lg;
  }
}

.orangehrm-balance-divider {
  height: 1px;
  background-color: $border-color;
  margin: $spacing-md 0;
}

.orangehrm-balance-remaining {
  padding: $spacing-sm;
  background-color: rgba($primary-color, 0.05);
  border-radius: $border-radius;
  margin-bottom: $spacing-md;
}

.orangehrm-balance-progress {
  margin-top: $spacing-md;
}

.orangehrm-balance-footer {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;

  :deep(.el-text) {
    font-size: $font-size-sm;
    line-height: 1.4;
  }
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .orangehrm-page-actions {
    width: 100%;

    .el-button {
      flex: 1;
    }
  }

  .orangehrm-balance-card {
    &:hover {
      transform: none;
    }
  }
}
</style>

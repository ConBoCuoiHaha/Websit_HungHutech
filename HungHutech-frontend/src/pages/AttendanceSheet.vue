<template>
  <div class="orangehrm-attendance-sheet-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Bảng chấm công</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Download" @click="exportToExcel">
          Xuất Excel
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="Nhân viên">
          <el-select
            v-model="selectedEmployeeId"
            placeholder="Chọn nhân viên"
            filterable
            clearable
            style="width: 300px"
            @change="loadData"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Từ ngày">
          <el-date-picker
            v-model="dateFrom"
            type="date"
            placeholder="Chọn ngày"
            style="width: 180px"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item label="Đến ngày">
          <el-date-picker
            v-model="dateTo"
            type="date"
            placeholder="Chọn ngày"
            style="width: 180px"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadData">Tìm kiếm</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Summary Cards -->
    <el-row
      v-if="selectedEmployeeId && summary"
      :gutter="16"
      class="orangehrm-summary-row"
    >
      <el-col :xs="12" :sm="6">
        <el-card class="orangehrm-stat-card" shadow="hover">
          <el-statistic title="Tổng số ngày" :value="summary.total_days">
            <template #prefix>
              <el-icon color="#4A90E2"><Calendar /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card class="orangehrm-stat-card" shadow="hover">
          <el-statistic title="Ngày đi làm" :value="summary.present_days">
            <template #prefix>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card class="orangehrm-stat-card" shadow="hover">
          <el-statistic title="Ngày vắng" :value="summary.absent_days">
            <template #prefix>
              <el-icon color="#F56C6C"><CircleClose /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card class="orangehrm-stat-card" shadow="hover">
          <el-statistic title="Tổng giờ làm" :value="summary.total_hours">
            <template #prefix>
              <el-icon color="#E6A23C"><Clock /></el-icon>
            </template>
            <template #suffix>giờ</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- Attendance Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="attendanceList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ngay" label="Ngày" width="150">
          <template #default="{row}">
            <strong>{{ formatDate(row.ngay) }}</strong>
            <br />
            <span class="orangehrm-day-name">{{ getDayName(row.ngay) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Giờ vào" width="120">
          <template #default="{row}">
            <div class="orangehrm-time-cell">
              <el-icon color="#67C23A"><VideoPlay /></el-icon>
              <strong>{{ formatTime(row.thoi_gian_vao) }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Giờ ra" width="120">
          <template #default="{row}">
            <div v-if="row.thoi_gian_ra" class="orangehrm-time-cell">
              <el-icon color="#E6A23C"><VideoPause /></el-icon>
              <strong>{{ formatTime(row.thoi_gian_ra) }}</strong>
            </div>
            <span v-else class="orangehrm-empty-time">-</span>
          </template>
        </el-table-column>

        <el-table-column label="Số giờ" width="100">
          <template #default="{row}">
            <el-tag type="info">{{ calculateHours(row) }} giờ</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="120">
          <template #default="{row}">
            <el-tag :type="getStatusType(row)" size="small">
              {{ getStatus(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ghi chú" min-width="200">
          <template #default="{row}">
            <el-tooltip
              v-if="row.ghi_chu && row.ghi_chu.length > 50"
              :content="row.ghi_chu"
              placement="top"
            >
              <span>{{ row.ghi_chu.substring(0, 50) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.ghi_chu || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="150" fixed="right">
          <template #default="{row}">
            <el-button size="small" :icon="Edit" @click="handleEdit(row)">
              Sửa
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="showEditDialog"
      title="Chỉnh sửa bản ghi chấm công"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="140px"
        label-position="left"
      >
        <el-form-item label="Ngày" prop="ngay">
          <el-date-picker
            v-model="editForm.ngay"
            type="date"
            placeholder="Chọn ngày"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            disabled
          />
        </el-form-item>

        <el-form-item label="Giờ vào" prop="thoi_gian_vao" required>
          <el-time-picker
            v-model="editForm.thoi_gian_vao"
            placeholder="Chọn giờ vào"
            style="width: 100%"
            format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="Giờ ra" prop="thoi_gian_ra">
          <el-time-picker
            v-model="editForm.thoi_gian_ra"
            placeholder="Chọn giờ ra"
            style="width: 100%"
            format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="editForm.ghi_chu"
            type="textarea"
            :rows="4"
            placeholder="Nhập ghi chú..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeEditDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleUpdate">
          Cập nhật
        </el-button>
      </template>
    </el-dialog>

    <!-- Empty State -->
    <el-empty
      v-if="!selectedEmployeeId && !loading"
      description="Vui lòng chọn nhân viên để xem bảng chấm công"
      :image-size="200"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {
  Calendar,
  Refresh,
  Download,
  VideoPlay,
  VideoPause,
  Clock,
  CircleCheck,
  CircleClose,
  Edit,
} from '@element-plus/icons-vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import chamCongService from '@/services/chamCongService';
import nhanVienService from '@/services/nhanVienService';
import {ChamCong, NhanVien, AttendanceSummary} from '@/types';

const employees = ref<NhanVien[]>([]);
const attendanceList = ref<ChamCong[]>([]);
const selectedEmployeeId = ref('');
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showEditDialog = ref(false);
const editFormRef = ref<FormInstance>();
const summary = ref<AttendanceSummary | null>(null);

// Default to current month
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const dateFrom = ref(firstDay.toISOString().split('T')[0]);
const dateTo = ref(lastDay.toISOString().split('T')[0]);

const editForm = reactive({
  _id: '',
  ngay: '',
  thoi_gian_vao: null as Date | null,
  thoi_gian_ra: null as Date | null,
  ghi_chu: '',
});

const editFormRules: FormRules = {
  thoi_gian_vao: [
    {required: true, message: 'Vui lòng chọn giờ vào', trigger: 'change'},
  ],
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];
  } catch (err) {
    console.error('Error loading employees:', err);
    ElMessage.error('Không thể tải danh sách nhân viên');
  }
};

const loadData = async () => {
  if (!selectedEmployeeId.value) return;

  loading.value = true;
  error.value = '';

  try {
    const data = await chamCongService.getHistory({
      nhan_vien_id: selectedEmployeeId.value,
      from: dateFrom.value,
      to: dateTo.value,
    });

    attendanceList.value = data || [];

    // Get summary
    summary.value = await chamCongService.getSummary(
      selectedEmployeeId.value,
      dateFrom.value,
      dateTo.value,
    );
  } catch (err: any) {
    console.error('Error loading attendance:', err);
    error.value = err.response?.data?.msg || 'Không thể tải bảng chấm công';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (record: ChamCong) => {
  editForm._id = record._id;
  editForm.ngay = record.ngay;
  editForm.thoi_gian_vao = new Date(record.thoi_gian_vao);
  editForm.thoi_gian_ra = record.thoi_gian_ra
    ? new Date(record.thoi_gian_ra)
    : null;
  editForm.ghi_chu = record.ghi_chu || '';
  showEditDialog.value = true;
};

const handleUpdate = async () => {
  if (!editFormRef.value) return;

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const updateData: any = {
        ghi_chu: editForm.ghi_chu,
      };

      if (editForm.thoi_gian_vao) {
        // Combine date and time
        const date = new Date(editForm.ngay);
        const time = new Date(editForm.thoi_gian_vao);
        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
        updateData.thoi_gian_vao = date.toISOString();
      }

      if (editForm.thoi_gian_ra) {
        const date = new Date(editForm.ngay);
        const time = new Date(editForm.thoi_gian_ra);
        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
        updateData.thoi_gian_ra = date.toISOString();
      }

      await chamCongService.update(editForm._id, updateData);
      ElMessage.success('Cập nhật bản ghi chấm công thành công');
      closeEditDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật bản ghi');
    } finally {
      saving.value = false;
    }
  });
};

const closeEditDialog = () => {
  showEditDialog.value = false;
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
};

const exportToExcel = () => {
  ElMessage.info('Tính năng xuất Excel đang được phát triển');
};

const calculateHours = (record: ChamCong): number => {
  if (!record.thoi_gian_ra) return 0;
  const clockIn = new Date(record.thoi_gian_vao);
  const clockOut = new Date(record.thoi_gian_ra);
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
};

const getStatus = (record: ChamCong): string => {
  const clockIn = new Date(record.thoi_gian_vao);
  const lateThreshold = new Date(clockIn);
  lateThreshold.setHours(8, 30, 0, 0);
  return clockIn > lateThreshold ? 'Đi muộn' : 'Đúng giờ';
};

const getStatusType = (
  record: ChamCong,
): 'success' | 'warning' | 'danger' | 'info' => {
  return getStatus(record) === 'Đi muộn' ? 'warning' : 'success';
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {weekday: 'short'});
};

onMounted(() => {
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-attendance-sheet-page {
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

// Filter Card
.orangehrm-filter-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Summary Row
.orangehrm-summary-row {
  margin-bottom: $spacing-lg;
}

.orangehrm-stat-card {
  :deep(.el-card__body) {
    padding: $spacing-lg;
  }

  :deep(.el-statistic) {
    .el-statistic__head {
      font-size: $font-size-base;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
    }

    .el-statistic__content {
      font-size: $font-size-xxl;
      font-weight: $font-weight-bold;
    }
  }
}

// Table Card
.orangehrm-table-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    font-size: $font-size-base;

    th.el-table__cell {
      background-color: $bg-gray;
      color: $text-primary;
      font-weight: $font-weight-medium;
      text-transform: uppercase;
      font-size: $font-size-sm;
      letter-spacing: 0.5px;
    }

    .el-table__row:hover {
      background-color: rgba($primary-color, 0.05);
    }
  }
}

.orangehrm-day-name {
  color: $text-secondary;
  font-size: $font-size-sm;
}

.orangehrm-time-cell {
  display: flex;
  align-items: center;
  gap: $spacing-xs;

  .el-icon {
    font-size: $font-size-lg;
  }

  strong {
    font-family: 'Courier New', monospace;
  }
}

.orangehrm-empty-time {
  color: $text-secondary;
  font-style: italic;
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

  .orangehrm-summary-row {
    .el-col {
      margin-bottom: $spacing-md;
    }
  }
}
</style>

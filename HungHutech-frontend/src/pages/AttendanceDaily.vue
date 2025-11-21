<template>
  <div class="orangehrm-attendance-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Chấm công hàng ngày</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadTodayAttendance">
          Tải lại
        </el-button>
      </div>
    </div>

    <!-- Today's Date Card -->
    <el-card class="orangehrm-today-card" shadow="hover">
      <div class="orangehrm-today-header">
        <div class="orangehrm-today-info">
          <el-icon :size="32" color="#4A90E2"><Calendar /></el-icon>
          <div class="orangehrm-today-text">
            <h2 class="orangehrm-today-date">{{ todayFormatted }}</h2>
            <p class="orangehrm-today-day">{{ currentDay }}</p>
          </div>
        </div>
        <div class="orangehrm-today-time">
          <div class="orangehrm-clock">{{ currentTime }}</div>
        </div>
      </div>
    </el-card>

    <el-card
      v-if="monthOtAlerts.length"
      class="orangehrm-ot-alert-card"
      shadow="never"
    >
      <template #header>
        <div class="orangehrm-card-header">
          <span>Canh bao tang ca (thang nay)</span>
          <el-tag type="warning">Gioi han {{ monthOtLimit }}h</el-tag>
        </div>
      </template>
      <el-table :data="monthOtAlerts" size="small" border>
        <el-table-column label="Nhan vien" min-width="180">
          <template #default="{row}">
            <div class="orangehrm-ot-employee">
              <strong>{{ row.ho_ten }}</strong>
              <small>{{ row.ma_nhan_vien }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phong_ban" label="Phong ban" min-width="120" />
        <el-table-column label="So gio" width="140">
          <template #default="{row}">
            {{ row.hours.toFixed(2) }}h / {{ row.limit }}h
          </template>
        </el-table-column>
        <el-table-column label="Ti le" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="row.percent >= 100 ? 'danger' : row.percent >= 80 ? 'warning' : 'success'">
              {{ row.percent.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Employee Selection -->
    <el-card class="orangehrm-employee-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="Chọn nhân viên">
          <el-select
            v-model="selectedEmployeeId"
            placeholder="Chọn nhân viên"
            filterable
            style="width: 300px"
            @change="loadTodayAttendance"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Clock In/Out Card -->
    <el-row v-if="selectedEmployeeId" :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card class="orangehrm-clock-card orangehrm-clock-in" shadow="hover">
          <div class="orangehrm-clock-content">
            <el-icon :size="48" color="#67C23A"><Timer /></el-icon>
            <h3>Giờ vào</h3>
            <div
              v-if="todayAttendance?.thoi_gian_vao"
              class="orangehrm-clock-time"
            >
              {{ formatTime(todayAttendance.thoi_gian_vao) }}
            </div>
            <div v-else class="orangehrm-clock-empty">Chưa chấm công</div>

            <el-button
              v-if="!todayAttendance?.thoi_gian_vao"
              type="success"
              size="large"
              :icon="VideoPlay"
              :loading="clockingIn"
              @click="handleClockIn"
            >
              Chấm công vào
            </el-button>
            <el-tag v-else type="success" size="large">Đã chấm công vào</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card
          class="orangehrm-clock-card orangehrm-clock-out"
          shadow="hover"
        >
          <div class="orangehrm-clock-content">
            <el-icon :size="48" color="#E6A23C"><Timer /></el-icon>
            <h3>Giờ ra</h3>
            <div
              v-if="todayAttendance?.thoi_gian_ra"
              class="orangehrm-clock-time"
            >
              {{ formatTime(todayAttendance.thoi_gian_ra) }}
            </div>
            <div v-else class="orangehrm-clock-empty">Chưa chấm công</div>

            <el-button
              v-if="
                todayAttendance?.thoi_gian_vao && !todayAttendance?.thoi_gian_ra
              "
              type="warning"
              size="large"
              :icon="VideoPause"
              :loading="clockingOut"
              @click="handleClockOut"
            >
              Chấm công ra
            </el-button>
            <el-tag
              v-else-if="todayAttendance?.thoi_gian_ra"
              type="warning"
              size="large"
            >
              Đã chấm công ra
            </el-tag>
            <el-tag v-else type="info" size="large">Chưa chấm công vào</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Today's Work Summary -->
    <el-card
      v-if="selectedEmployeeId && todayAttendance"
      class="orangehrm-summary-card"
      shadow="never"
    >
      <template #header>
        <div class="orangehrm-card-header">
          <span>Tổng kết ngày hôm nay</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="12" :sm="6">
          <el-statistic
            title="Giờ vào"
            :value="formatTime(todayAttendance.thoi_gian_vao)"
          >
            <template #prefix>
              <el-icon color="#67C23A"><VideoPlay /></el-icon>
            </template>
          </el-statistic>
        </el-col>

        <el-col :xs="12" :sm="6">
          <el-statistic
            title="Giờ ra"
            :value="
              todayAttendance.thoi_gian_ra
                ? formatTime(todayAttendance.thoi_gian_ra)
                : '-'
            "
          >
            <template #prefix>
              <el-icon color="#E6A23C"><VideoPause /></el-icon>
            </template>
          </el-statistic>
        </el-col>

        <el-col :xs="12" :sm="6">
          <el-statistic title="Số giờ làm" :value="workHours">
            <template #prefix>
              <el-icon color="#4A90E2"><Clock /></el-icon>
            </template>
            <template #suffix>giờ</template>
          </el-statistic>
        </el-col>

        <el-col :xs="12" :sm="6">
          <el-statistic title="Trạng thái" :value="attendanceStatus">
            <template #prefix>
              <el-icon :color="statusColor">
                <CircleCheck v-if="!isLate" />
                <Warning v-else />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <div v-if="todayAttendance.ghi_chu" class="orangehrm-note">
        <strong>Ghi chú:</strong> {{ todayAttendance.ghi_chu }}
      </div>
    </el-card>

    <!-- Recent Attendance History -->
    <el-card
      v-if="selectedEmployeeId"
      class="orangehrm-history-card"
      shadow="never"
    >
      <template #header>
        <div class="orangehrm-card-header">
          <span>Lịch sử chấm công gần đây</span>
          <el-button
            text
            type="primary"
            @click="$router.push('/cham-cong/bang-cong')"
          >
            Xem tất cả
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="recentHistory"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="ngay" label="Ngày" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay) }}
          </template>
        </el-table-column>

        <el-table-column label="Giờ vào" width="120">
          <template #default="{row}">
            <strong>{{ formatTime(row.thoi_gian_vao) }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Giờ ra" width="120">
          <template #default="{row}">
            <strong>{{
              row.thoi_gian_ra ? formatTime(row.thoi_gian_ra) : '-'
            }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Số giờ" width="120">
          <template #default="{row}"> {{ calculateHours(row) }} giờ </template>
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
            {{ row.ghi_chu || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Empty State -->
    <el-empty
      v-if="!selectedEmployeeId"
      description="Vui lòng chọn nhân viên để chấm công"
      :image-size="200"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from 'vue';
import {
  Calendar,
  Refresh,
  Timer,
  VideoPlay,
  VideoPause,
  Clock,
  CircleCheck,
  Warning,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import chamCongService from '@/services/chamCongService';
import nhanVienService from '@/services/nhanVienService';
import overtimeRequestService from '@/services/overtimeRequestService';
import {ChamCong, NhanVien, OvertimeAlertGroups} from '@/types';

const employees = ref<NhanVien[]>([]);
const selectedEmployeeId = ref('');
const todayAttendance = ref<ChamCong | null>(null);
const recentHistory = ref<ChamCong[]>([]);
const loading = ref(false);
const clockingIn = ref(false);
const clockingOut = ref(false);
const currentTime = ref('');
const currentDay = ref('');
let timeInterval: NodeJS.Timeout;
const overtimeAlerts = ref<OvertimeAlertGroups | null>(null);

const monthOtAlerts = computed(() => {
  return overtimeAlerts.value?.month?.items?.slice(0, 5) || [];
});

const monthOtLimit = computed(() => overtimeAlerts.value?.month?.limit || 0);

const todayFormatted = computed(() => {
  const today = new Date();
  return today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const workHours = computed(() => {
  if (!todayAttendance.value) return 0;
  return calculateHours(todayAttendance.value);
});

const isLate = computed(() => {
  if (!todayAttendance.value?.thoi_gian_vao) return false;
  const clockIn = new Date(todayAttendance.value.thoi_gian_vao);
  const lateThreshold = new Date(clockIn);
  lateThreshold.setHours(8, 30, 0, 0);
  return clockIn > lateThreshold;
});

const attendanceStatus = computed(() => {
  return isLate.value ? 'Đi muộn' : 'Đúng giờ';
});

const statusColor = computed(() => {
  return isLate.value ? '#E6A23C' : '#67C23A';
});

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  currentDay.value = now.toLocaleDateString('vi-VN', {weekday: 'long'});
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];

    // Auto-select first employee
    if (employees.value.length > 0 && !selectedEmployeeId.value) {
      selectedEmployeeId.value = employees.value[0]._id;
      await loadTodayAttendance();
    }
  } catch (err) {
    console.error('Error loading employees:', err);
    ElMessage.error('Không thể tải danh sách nhân viên');
  }
};

const loadOvertimeAlerts = async () => {
  try {
    overtimeAlerts.value = await overtimeRequestService.getAlerts();
  } catch (err) {
    console.error('Error loading overtime alerts', err);
  }
};

const loadTodayAttendance = async () => {
  if (!selectedEmployeeId.value) return;

  loading.value = true;
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const history = await chamCongService.getHistory({
      nhan_vien_id: selectedEmployeeId.value,
      from: todayStr,
      to: todayStr,
    });

    // Handle both array and paginated response
    const historyArray = Array.isArray(history)
      ? history
      : (history as any).items || [];
    todayAttendance.value = historyArray.length > 0 ? historyArray[0] : null;

    // Load recent 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentData = await chamCongService.getHistory({
      nhan_vien_id: selectedEmployeeId.value,
      from: fromStr,
      to: todayStr,
    });

    // Handle both array and paginated response
    const dataArray = Array.isArray(recentData)
      ? recentData
      : (recentData as any).items || [];
    recentHistory.value = dataArray.slice(0, 7);
  } catch (err: any) {
    console.error('Error loading attendance:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin chấm công',
    );
  } finally {
    loading.value = false;
  }
};

const handleClockIn = async () => {
  if (!selectedEmployeeId.value) return;

  clockingIn.value = true;
  try {
    await chamCongService.clockIn({
      nhan_vien_id: selectedEmployeeId.value,
    });

    ElMessage.success('Chấm công vào thành công');
    await loadTodayAttendance();
  } catch (err: any) {
    console.error('Error clocking in:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể chấm công vào');
  } finally {
    clockingIn.value = false;
  }
};

const handleClockOut = async () => {
  if (!selectedEmployeeId.value) return;

  clockingOut.value = true;
  try {
    await chamCongService.clockOut({
      nhan_vien_id: selectedEmployeeId.value,
    });

    ElMessage.success('Chấm công ra thành công');
    await loadTodayAttendance();
  } catch (err: any) {
    console.error('Error clocking out:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể chấm công ra');
  } finally {
    clockingOut.value = false;
  }
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
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  loadEmployees();
  loadOvertimeAlerts();
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style lang="scss" scoped>
.orangehrm-attendance-page {
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

// Today Card
.orangehrm-today-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-lg;
}

.orangehrm-today-info {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.orangehrm-today-text {
  h2 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
  }

  p {
    margin: 0;
    font-size: $font-size-base;
    color: $text-secondary;
  }
}

.orangehrm-today-time {
  .orangehrm-clock {
    font-size: 2rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    font-family: 'Courier New', monospace;
  }
}

// Employee Card
.orangehrm-employee-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.orangehrm-ot-alert-card {
  margin-bottom: $spacing-lg;
}

.orangehrm-ot-employee {
  display: flex;
  flex-direction: column;
  gap: 2px;

  small {
    color: $text-secondary;
  }
}

// Clock Cards
.orangehrm-clock-card {
  margin-bottom: $spacing-lg;
  border-left: 4px solid;

  &.orangehrm-clock-in {
    border-left-color: #67c23a;
  }

  &.orangehrm-clock-out {
    border-left-color: #e6a23c;
  }

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-clock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;

  h3 {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $text-primary;
  }

  .orangehrm-clock-time {
    font-size: 2rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    font-family: 'Courier New', monospace;
  }

  .orangehrm-clock-empty {
    font-size: $font-size-lg;
    color: $text-secondary;
    font-style: italic;
  }

  .el-button {
    min-width: 180px;
  }
}

// Summary Card
.orangehrm-summary-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-note {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background-color: $bg-gray;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-secondary;

  strong {
    color: $text-primary;
  }
}

// History Card
.orangehrm-history-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    font-size: $font-size-base;

    th.el-table__cell {
      background-color: $bg-gray;
      color: $text-primary;
      font-weight: $font-weight-medium;
    }
  }
}

.orangehrm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: $font-weight-bold;
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .orangehrm-today-header {
    flex-direction: column;
    text-align: center;
  }

  .orangehrm-today-info {
    flex-direction: column;
  }

  .orangehrm-clock-card {
    margin-bottom: $spacing-md;
  }
}
</style>


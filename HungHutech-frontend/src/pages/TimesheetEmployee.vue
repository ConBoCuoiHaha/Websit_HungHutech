<template>
  <div class="orangehrm-timesheet-employee">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Bảng chấm công của tôi</h2>
          <div class="header-actions">
            <el-date-picker
              v-model="selectedWeek"
              type="week"
              format="[Tuần] ww - YYYY"
              placeholder="Chọn tuần"
              @change="handleWeekChange"
              style="margin-right: 12px"
            />
            <el-button type="primary" @click="handleSave" :loading="saving" :icon="Check">
              Lưu Timesheet
            </el-button>
          </div>
        </div>
      </template>

      <!-- Timesheet Info -->
      <div class="timesheet-info">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">Tuần:</span>
              <span class="value">{{ weekInfo }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">Dự án:</span>
              <el-select v-model="selectedProject" placeholder="Chọn dự án" style="width: 100%">
                <el-option
                  v-for="project in projects"
                  :key="project._id"
                  :label="project.ten"
                  :value="project._id"
                />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">Tổng giờ:</span>
              <span class="value total-hours">{{ totalHours }} giờ</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- Timesheet Table -->
      <el-table
        v-loading="loading"
        :data="timesheetData"
        border
        class="orangehrm-timesheet-table"
        style="margin-top: 20px"
        :summary-method="getSummaries"
        show-summary
      >
        <el-table-column label="Hoạt động" min-width="200" fixed>
          <template #default="scope">
            <el-select
              v-model="scope.row.hoat_dong_id"
              placeholder="Chọn hoạt động"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="activity in activities"
                :key="activity._id"
                :label="activity.ten"
                :value="activity._id"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column
          v-for="day in weekDays"
          :key="day.date"
          :label="day.label"
          width="100"
          align="center"
        >
          <template #default="scope">
            <el-input-number
              v-model="scope.row.days[day.dayIndex]"
              :min="0"
              :max="24"
              :step="0.5"
              :precision="1"
              controls-position="right"
              size="small"
              style="width: 90px"
            />
          </template>
        </el-table-column>

        <el-table-column label="Tổng" width="100" align="center">
          <template #default="scope">
            <el-tag type="info">{{ getRowTotal(scope.row) }}h</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDeleteRow(scope.$index)"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="table-actions">
        <el-button @click="handleAddRow" :icon="Plus">Thêm hoạt động</el-button>
      </div>

      <!-- Status -->
      <div class="timesheet-status" v-if="currentTimesheet">
        <el-alert
          :title="`Trạng thái: ${getStatusText(currentTimesheet.trang_thai)}`"
          :type="getStatusType(currentTimesheet.trang_thai)"
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import {Plus, Check, Delete} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import timesheetService from '@/services/timesheetService';
import projectService from '@/services/projectService';
import activityService from '@/services/activityService';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

const loading = ref(false);
const saving = ref(false);

const selectedWeek = ref(new Date());
const selectedProject = ref('');
const currentTimesheet = ref<any>(null);

const projects = ref<any[]>([]);
const activities = ref<any[]>([]);
const timesheetData = ref<any[]>([]);

const weekDays = computed(() => {
  const start = dayjs(selectedWeek.value).startOf('week');
  return Array.from({length: 7}, (_, i) => {
    const date = start.add(i, 'day');
    return {
      date: date.format('YYYY-MM-DD'),
      label: date.format('dd DD/MM'),
      dayIndex: i,
    };
  });
});

const weekInfo = computed(() => {
  const start = dayjs(selectedWeek.value).startOf('week');
  const end = start.add(6, 'day');
  return `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
});

const totalHours = computed(() => {
  return timesheetData.value.reduce((sum, row) => sum + getRowTotal(row), 0).toFixed(1);
});

const getRowTotal = (row: any) => {
  return row.days.reduce((sum: number, hours: number) => sum + (hours || 0), 0);
};

const getSummaries = (param: any) => {
  const {columns, data} = param;
  const sums: any[] = [];

  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = 'Tổng';
      return;
    }
    if (index === columns.length - 1 || index === columns.length - 2) {
      sums[index] = '';
      return;
    }

    const dayIndex = index - 1;
    const total = data.reduce((sum: number, row: any) => {
      return sum + (row.days[dayIndex] || 0);
    }, 0);
    sums[index] = `${total.toFixed(1)}h`;
  });

  return sums;
};

const loadProjects = async () => {
  try {
    const response = await projectService.getAll({limit: 1000});
    projects.value = response.data || [];
    if (projects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = projects.value[0]._id;
    }
  } catch (err: any) {
    console.error('Error loading projects:', err);
  }
};

const loadActivities = async () => {
  try {
    const response = await activityService.getAll({limit: 1000});
    activities.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading activities:', err);
  }
};

const loadTimesheet = async () => {
  loading.value = true;
  try {
    const start = dayjs(selectedWeek.value).startOf('week');
    const end = start.add(6, 'day');

    const response = await timesheetService.getAll({
      ngay_bat_dau: start.format('YYYY-MM-DD'),
      ngay_ket_thuc: end.format('YYYY-MM-DD'),
      limit: 1,
    });

    if (response.data && response.data.length > 0) {
      currentTimesheet.value = response.data[0];
      timesheetData.value = currentTimesheet.value.chi_tiet_timesheet || [];
    } else {
      currentTimesheet.value = null;
      timesheetData.value = [];
      handleAddRow();
    }
  } catch (err: any) {
    console.error('Error loading timesheet:', err);
    ElMessage.error('Không thể tải timesheet');
  } finally {
    loading.value = false;
  }
};

const handleWeekChange = () => {
  loadTimesheet();
};

const handleAddRow = () => {
  timesheetData.value.push({
    hoat_dong_id: '',
    days: [0, 0, 0, 0, 0, 0, 0],
  });
};

const handleDeleteRow = (index: number) => {
  timesheetData.value.splice(index, 1);
};

const handleSave = async () => {
  if (!selectedProject.value) {
    ElMessage.warning('Vui lòng chọn dự án');
    return;
  }

  if (timesheetData.value.length === 0) {
    ElMessage.warning('Vui lòng thêm ít nhất một hoạt động');
    return;
  }

  saving.value = true;
  try {
    const start = dayjs(selectedWeek.value).startOf('week');
    const end = start.add(6, 'day');

    const data = {
      du_an_id: selectedProject.value,
      ngay_bat_dau: start.format('YYYY-MM-DD'),
      ngay_ket_thuc: end.format('YYYY-MM-DD'),
      chi_tiet_timesheet: timesheetData.value,
      tong_gio: parseFloat(totalHours.value),
      trang_thai: 'Chưa gửi',
    };

    if (currentTimesheet.value) {
      await timesheetService.update(currentTimesheet.value._id, data);
      ElMessage.success('Cập nhật timesheet thành công');
    } else {
      await timesheetService.create(data);
      ElMessage.success('Tạo timesheet thành công');
    }

    loadTimesheet();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu timesheet');
  } finally {
    saving.value = false;
  }
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'Chưa gửi': 'Chưa gửi',
    'Chờ duyệt': 'Chờ duyệt',
    'Đã duyệt': 'Đã duyệt',
    'Từ chối': 'Từ chối',
  };
  return statusMap[status] || status;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    'Chưa gửi': 'info',
    'Chờ duyệt': 'warning',
    'Đã duyệt': 'success',
    'Từ chối': 'error',
  };
  return typeMap[status] || 'info';
};

onMounted(() => {
  loadProjects();
  loadActivities();
  loadTimesheet();
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables.scss";

.orangehrm-timesheet-employee {
  padding: $spacing-xl;
}

.orangehrm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-actions {
    display: flex;
    align-items: center;
  }
}

.orangehrm-card-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.timesheet-info {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $background;
  border-radius: $border-radius;

  .info-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .label {
      font-weight: $font-weight-medium;
      color: $text-secondary;
      min-width: 80px;
    }

    .value {
      &.total-hours {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $primary-color;
      }
    }
  }
}

.orangehrm-timesheet-table {
  width: 100%;

  :deep(.el-table__footer) {
    font-weight: $font-weight-bold;
  }
}

.table-actions {
  margin-top: $spacing-md;
}

.timesheet-status {
  margin-top: $spacing-lg;
}
</style>

<template>
  <div class="orangehrm-timesheet-approval">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Duyệt Bảng Chấm Công</h2>
        </div>
      </template>

      <!-- Filters -->
      <div class="filters-container">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select
              v-model="filters.nhan_vien_id"
              placeholder="Tất cả nhân viên"
              clearable
              filterable
              style="width: 100%"
              @change="handleFilterChange"
            >
              <el-option label="Tất cả nhân viên" value="" />
              <el-option
                v-for="employee in employees"
                :key="employee._id"
                :label="`${employee.ho_dem} ${employee.ten}`"
                :value="employee._id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.week"
              type="week"
              format="[Tuần] ww - YYYY"
              placeholder="Chọn tuần"
              clearable
              style="width: 100%"
              @change="handleFilterChange"
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filters.trang_thai"
              placeholder="Tất cả trạng thái"
              clearable
              style="width: 100%"
              @change="handleFilterChange"
            >
              <el-option label="Tất cả trạng thái" value="" />
              <el-option label="Chờ duyệt" value="Cho duyet" />
              <el-option label="Đã duyệt" value="Da duyet" />
              <el-option label="Từ chối" value="Bi tu choi" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              Tìm kiếm
            </el-button>
            <el-button :icon="Refresh" @click="handleResetFilters">
              Đặt lại
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- Timesheets Table -->
      <el-table
        v-loading="loading"
        :data="timesheets"
        border
        class="orangehrm-timesheet-table"
        style="margin-top: 20px"
        :row-class-name="getRowClassName"
        @row-click="handleRowClick"
      >
        <el-table-column label="Nhân viên" min-width="180" prop="nhan_vien_id">
          <template #default="scope">
            <div class="employee-info">
              <span class="employee-name">
                {{ getEmployeeName(scope.row.nhan_vien_id) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Tuần" width="220" prop="tuan_bat_dau">
          <template #default="scope">
            <div class="week-info">
              <el-icon><Calendar /></el-icon>
              <span style="margin-left: 8px">{{
                formatWeek(scope.row.tuan_bat_dau)
              }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Tổng giờ" width="120" align="center">
          <template #default="scope">
            <el-tag type="info" size="large">
              {{ calculateTotalHours(scope.row.entries) }} giờ
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="Trạng thái"
          width="140"
          align="center"
          prop="trang_thai"
        >
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.trang_thai)">
              {{ getStatusText(scope.row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="160" prop="ngay_tao">
          <template #default="scope">
            {{ formatDate(scope.row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Thao tác"
          width="180"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              :icon="View"
              @click.stop="handleViewDetails(scope.row)"
            >
              Chi tiết
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Timesheet Details Dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      :title="`Chi tiết Timesheet - ${selectedTimesheetEmployee}`"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedTimesheet" class="timesheet-details">
        <!-- Summary Info -->
        <el-descriptions :column="3" border class="timesheet-summary">
          <el-descriptions-item label="Nhân viên">
            {{ getEmployeeName(selectedTimesheet.nhan_vien_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Tuần">
            {{ formatWeek(selectedTimesheet.tuan_bat_dau) }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedTimesheet.trang_thai)">
              {{ getStatusText(selectedTimesheet.trang_thai) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Tổng giờ">
            <strong
              >{{ calculateTotalHours(selectedTimesheet.entries) }} giờ</strong
            >
          </el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">
            {{ formatDate(selectedTimesheet.ngay_tao) }}
          </el-descriptions-item>
          <el-descriptions-item label="Cập nhật lần cuối">
            {{ formatDate(selectedTimesheet.ngay_cap_nhat) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- Timesheet Grid -->
        <div v-if="timesheetGrid.length > 0" class="timesheet-grid">
          <h3 style="margin: 20px 0 10px 0">Bảng chấm công chi tiết</h3>
          <el-table
            :data="timesheetGrid"
            border
            style="width: 100%"
            :summary-method="getTimesheetSummaries"
            show-summary
          >
            <el-table-column label="Dự án / Hoạt động" min-width="200" fixed>
              <template #default="scope">
                <div class="activity-cell">
                  <div class="project-name">{{ scope.row.projectName }}</div>
                  <div class="activity-name">{{ scope.row.activityName }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column
              v-for="day in weekDaysHeaders"
              :key="day.date"
              :label="day.label"
              width="100"
              align="center"
            >
              <template #default="scope">
                <span
                  class="hours-cell"
                  :class="{'has-hours': scope.row.days[day.date] > 0}"
                >
                  {{ scope.row.days[day.date] || '-' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
              label="Tổng"
              width="100"
              align="center"
              fixed="right"
            >
              <template #default="scope">
                <el-tag type="info" size="small">
                  {{ scope.row.total }}h
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Comments from Manager -->
        <div v-if="selectedTimesheet.ghi_chu_quan_ly" class="manager-comment">
          <h4>Ghi chú của quản lý:</h4>
          <el-alert type="info" :closable="false">
            {{ selectedTimesheet.ghi_chu_quan_ly }}
          </el-alert>
        </div>

        <!-- Approval Actions -->
        <div
          v-if="selectedTimesheet.trang_thai === 'Cho duyet'"
          class="approval-actions"
        >
          <el-divider />
          <h4>Duyệt Timesheet</h4>
          <el-form :model="approvalForm" label-width="120px">
            <el-form-item label="Ghi chú">
              <el-input
                v-model="approvalForm.ghi_chu"
                type="textarea"
                :rows="3"
                placeholder="Nhập ghi chú (tùy chọn)"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="success"
                :loading="approving"
                :icon="Check"
                @click="handleApprove"
              >
                Duyệt
              </el-button>
              <el-button
                type="danger"
                :loading="rejecting"
                :icon="Close"
                @click="handleReject"
              >
                Từ chối
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsDialogVisible = false">Đóng</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import {
  Search,
  Refresh,
  View,
  Calendar,
  Check,
  Close,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import timesheetService from '@/services/timesheetService';
import nhanVienService from '@/services/nhanVienService';
import type {Timesheet, NhanVien} from '@/types';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/vi';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale('vi');

// State
const loading = ref(false);
const approving = ref(false);
const rejecting = ref(false);
const detailsDialogVisible = ref(false);

const timesheets = ref<Timesheet[]>([]);
const employees = ref<NhanVien[]>([]);
const selectedTimesheet = ref<Timesheet | null>(null);

const filters = reactive({
  nhan_vien_id: '',
  week: null as Date | null,
  trang_thai: '',
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const approvalForm = reactive({
  ghi_chu: '',
});

// Computed
const selectedTimesheetEmployee = computed(() => {
  if (!selectedTimesheet.value) return '';
  return getEmployeeName(selectedTimesheet.value.nhan_vien_id);
});

const weekDaysHeaders = computed(() => {
  if (!selectedTimesheet.value) return [];
  const start = dayjs(selectedTimesheet.value.tuan_bat_dau).startOf('isoWeek');
  return Array.from({length: 7}, (_, i) => {
    const date = start.add(i, 'day');
    return {
      date: date.format('YYYY-MM-DD'),
      label: date.format('dd DD/MM'),
    };
  });
});

const timesheetGrid = computed(() => {
  if (!selectedTimesheet.value || !selectedTimesheet.value.entries) return [];

  // Group entries by project and activity
  const grouped = new Map<string, any>();

  selectedTimesheet.value.entries.forEach((entry: any) => {
    const projectId =
      typeof entry.project_id === 'object'
        ? entry.project_id._id
        : entry.project_id;
    const activityId =
      typeof entry.activity_id === 'object'
        ? entry.activity_id._id
        : entry.activity_id;
    const key = `${projectId}-${activityId}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        projectName:
          typeof entry.project_id === 'object'
            ? entry.project_id.ten
            : entry.project_id,
        activityName:
          typeof entry.activity_id === 'object'
            ? entry.activity_id.ten
            : entry.activity_id,
        days: {} as Record<string, number>,
        total: 0,
      });
    }

    const item = grouped.get(key);
    const date = dayjs(entry.ngay).format('YYYY-MM-DD');
    item.days[date] = (item.days[date] || 0) + entry.gio;
    item.total += entry.gio;
  });

  return Array.from(grouped.values());
});

// Methods
const loadTimesheets = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.nhan_vien_id) {
      params.nhan_vien_id = filters.nhan_vien_id;
    }

    if (filters.week) {
      const weekStart = dayjs(filters.week).startOf('isoWeek');
      params.tuan_bat_dau = weekStart.format('YYYY-MM-DD');
    }

    if (filters.trang_thai) {
      params.trang_thai = filters.trang_thai;
    }

    const response = await timesheetService.getAll(params);
    timesheets.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading timesheets:', err);
    ElMessage.error('Không thể tải danh sách timesheet');
  } finally {
    loading.value = false;
  }
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading employees:', err);
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadTimesheets();
};

const handleSearch = () => {
  pagination.page = 1;
  loadTimesheets();
};

const handleResetFilters = () => {
  filters.nhan_vien_id = '';
  filters.week = null;
  filters.trang_thai = '';
  pagination.page = 1;
  loadTimesheets();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  loadTimesheets();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadTimesheets();
};

const handleRowClick = (row: Timesheet) => {
  handleViewDetails(row);
};

const handleViewDetails = async (timesheet: Timesheet) => {
  try {
    // Load full timesheet details
    const fullTimesheet = await timesheetService.getById(timesheet._id);
    selectedTimesheet.value = fullTimesheet;
    approvalForm.ghi_chu = '';
    detailsDialogVisible.value = true;
  } catch (err: any) {
    console.error('Error loading timesheet details:', err);
    ElMessage.error('Không thể tải chi tiết timesheet');
  }
};

const handleApprove = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn duyệt timesheet này không?',
      'Xác nhận duyệt',
      {
        confirmButtonText: 'Duyệt',
        cancelButtonText: 'Hủy',
        type: 'success',
      },
    );

    approving.value = true;
    await timesheetService.approve(selectedTimesheet.value!._id, {
      trang_thai: 'Da duyet',
      ghi_chu: approvalForm.ghi_chu,
    });

    ElMessage.success('Đã duyệt timesheet thành công');
    detailsDialogVisible.value = false;
    loadTimesheets();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error approving timesheet:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể duyệt timesheet');
    }
  } finally {
    approving.value = false;
  }
};

const handleReject = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn từ chối timesheet này không?',
      'Xác nhận từ chối',
      {
        confirmButtonText: 'Từ chối',
        cancelButtonText: 'Hủy',
        type: 'error',
      },
    );

    rejecting.value = true;
    await timesheetService.approve(selectedTimesheet.value!._id, {
      trang_thai: 'Bi tu choi',
      ghi_chu: approvalForm.ghi_chu,
    });

    ElMessage.success('Đã từ chối timesheet');
    detailsDialogVisible.value = false;
    loadTimesheets();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error rejecting timesheet:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể từ chối timesheet');
    }
  } finally {
    rejecting.value = false;
  }
};

const calculateTotalHours = (entries: any[]) => {
  if (!entries || entries.length === 0) return 0;
  const total = entries.reduce((sum, entry) => sum + (entry.gio || 0), 0);
  return total.toFixed(1);
};

const getEmployeeName = (employee: any) => {
  if (typeof employee === 'object' && employee !== null) {
    return `${employee.ho_dem} ${employee.ten}`;
  }
  return employee || 'N/A';
};

const formatWeek = (date: string) => {
  const start = dayjs(date).startOf('isoWeek');
  const end = start.add(6, 'day');
  const weekNum = start.isoWeek();
  return `Tuần ${weekNum} (${start.format('DD/MM')} - ${end.format(
    'DD/MM/YYYY',
  )})`;
};

const formatDate = (date?: string) => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'Cho duyet': 'Chờ duyệt',
    'Da duyet': 'Đã duyệt',
    'Bi tu choi': 'Từ chối',
  };
  return statusMap[status] || status;
};

const getStatusType = (status: string): any => {
  const typeMap: Record<string, string> = {
    'Cho duyet': 'warning',
    'Da duyet': 'success',
    'Bi tu choi': 'danger',
  };
  return typeMap[status] || 'info';
};

const getRowClassName = ({row}: {row: Timesheet}) => {
  if (row.trang_thai === 'Cho duyet') return 'row-pending';
  if (row.trang_thai === 'Da duyet') return 'row-approved';
  if (row.trang_thai === 'Bi tu choi') return 'row-rejected';
  return '';
};

const getTimesheetSummaries = (param: any) => {
  const {columns} = param;
  const sums: any[] = [];

  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = 'Tổng';
      return;
    }
    if (index === columns.length - 1) {
      const total = timesheetGrid.value.reduce(
        (sum, row) => sum + row.total,
        0,
      );
      sums[index] = `${total.toFixed(1)}h`;
      return;
    }

    const dayIndex = index - 1;
    if (dayIndex >= 0 && dayIndex < weekDaysHeaders.value.length) {
      const date = weekDaysHeaders.value[dayIndex].date;
      const total = timesheetGrid.value.reduce(
        (sum, row) => sum + (row.days[date] || 0),
        0,
      );
      sums[index] = total > 0 ? `${total.toFixed(1)}h` : '-';
    } else {
      sums[index] = '';
    }
  });

  return sums;
};

// Lifecycle
onMounted(() => {
  loadEmployees();
  loadTimesheets();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-timesheet-approval {
  padding: $spacing-xl;
}

.orangehrm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-card-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.filters-container {
  margin-bottom: $spacing-lg;
}

.orangehrm-timesheet-table {
  width: 100%;

  :deep(.row-pending) {
    background-color: #fef9e7;
  }

  :deep(.row-approved) {
    background-color: #eafaf1;
  }

  :deep(.row-rejected) {
    background-color: #fadbd8;
  }

  :deep(.el-table__row) {
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa !important;
    }
  }
}

.employee-info {
  display: flex;
  align-items: center;

  .employee-name {
    font-weight: $font-weight-medium;
    color: $text-primary;
  }
}

.week-info {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: flex-end;
}

.timesheet-details {
  .timesheet-summary {
    margin-bottom: $spacing-lg;
  }

  .timesheet-grid {
    margin-top: $spacing-lg;

    .activity-cell {
      .project-name {
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: 4px;
      }

      .activity-name {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .hours-cell {
      color: $text-secondary;

      &.has-hours {
        color: $text-primary;
        font-weight: $font-weight-medium;
      }
    }
  }

  .manager-comment {
    margin-top: $spacing-lg;

    h4 {
      margin-bottom: $spacing-sm;
      color: $text-primary;
    }
  }

  .approval-actions {
    margin-top: $spacing-lg;

    h4 {
      margin-bottom: $spacing-md;
      color: $text-primary;
    }
  }
}

:deep(.el-table__footer) {
  font-weight: $font-weight-bold;
}
</style>

<template>
  <div class="time-rule-page">
    <div class="page-header">
      <div>
        <h2>Rule Engine Time/Leave/OT</h2>
        <p>
          Theo dõi trạng thái chấm công - nghỉ phép - tăng ca theo ca làm việc,
          tự động cảnh báo khi sai phạm.
        </p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" @click="handleRefresh">Tải lại</el-button>
        <el-button
          type="primary"
          :loading="recalculating"
          :icon="DataAnalysis"
          @click="handleRecalculate"
        >
          Tính lại
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-form
        :model="filters"
        label-width="140px"
        label-position="left"
        class="filter-form"
      >
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="Khoảng thời gian">
              <el-date-picker
                v-model="filters.dates"
                type="daterange"
                unlink-panels
                start-placeholder="Từ ngày"
                end-placeholder="Đến ngày"
                value-format="YYYY-MM-DD"
                format="DD/MM/YYYY"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :xs="24">
            <el-form-item label="Nhân viên">
              <el-select
                v-model="filters.nhan_vien_id"
                filterable
                clearable
                placeholder="Chọn nhân viên"
              >
                <el-option
                  v-for="nv in employeeOptions"
                  :key="nv._id"
                  :label="`${nv.ma_nhan_vien} - ${nv.ho_dem || ''} ${nv.ten || ''}`"
                  :value="nv._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="6" :xs="24">
            <el-form-item label="Phòng ban">
              <el-select
                v-model="filters.phong_ban_id"
                clearable
                placeholder="Tất cả"
              >
                <el-option
                  v-for="dept in deptOptions"
                  :key="dept._id"
                  :label="dept.ten"
                  :value="dept._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="6" :xs="24">
            <el-form-item label="Trạng thái">
              <el-select
                v-model="filters.trang_thai"
                placeholder="Tất cả"
                clearable
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="6" :xs="24">
            <el-form-item label=" ">
              <el-space>
                <el-button type="primary" :icon="Search" @click="handleSearch">
                  Lọc
                </el-button>
                <el-button @click="handleReset">Xóa lọc</el-button>
              </el-space>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="violation-cards">
      <el-col
        v-for="item in violationDisplay"
        :key="item.status"
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card class="violation-card" shadow="hover">
          <div class="violation-card__header">
            <span>{{ statusLabel(item.status) }}</span>
            <el-tag :type="statusTag(item.status)" effect="dark">
              {{ ((item.count / (pagination.total || 1)) * 100).toFixed(1) }}%
            </el-tag>
          </div>
          <p>{{ item.count }} bản ghi</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div class="table-header">
        <div>
          <h3>Kết quả rule engine</h3>
          <p>
            {{ pagination.total }} dòng - cập nhật lần cuối:
            {{ lastUpdatedLabel }}
          </p>
        </div>
      </div>

      <el-table
        :data="summaries"
        v-loading="loading"
        :empty-text="loading ? 'Đang tải...' : 'Không có dữ liệu'"
      >
        <el-table-column label="Ngày" width="130">
          <template #default="{row}">
            {{ formatDate(row.ngay) }}
          </template>
        </el-table-column>
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div class="employee-cell">
              <strong>
                {{
                  typeof row.nhan_vien_id === 'object'
                    ? `${row.nhan_vien_id?.ho_dem || ''} ${
                        row.nhan_vien_id?.ten || ''
                      }`
                    : row.nhan_vien_id
                }}
              </strong>
              <span>
                {{
                  typeof row.nhan_vien_id === 'object'
                    ? row.nhan_vien_id?.ma_nhan_vien
                    : ''
                }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Ca" min-width="160">
          <template #default="{row}">
            <div class="shift-cell">
              {{ row.shift_snapshot?.ten_ca || '---' }}
              <small>
                {{ row.shift_snapshot?.gio_bat_dau || '--:--' }} -
                {{ row.shift_snapshot?.gio_ket_thuc || '--:--' }}
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Check-in/out" min-width="180">
          <template #default="{row}">
            <div class="time-pair">
              <span>{{ formatTime(row.check_in) }}</span>
              <span>{{ formatTime(row.check_out) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Làm việc" width="110" prop="work_minutes">
          <template #default="{row}">
            {{ formatMinutes(row.work_minutes) }}
          </template>
        </el-table-column>
        <el-table-column label="OT" width="90" prop="ot_hours">
          <template #default="{row}">
            {{ formatHours(row.ot_hours) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="150">
          <template #default="{row}">
            <el-tag :type="statusTag(row.status)">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="Ghi chú" min-width="250" />
      </el-table>

      <div class="table-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import dayjs from 'dayjs';
import {
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import {
  Refresh,
  DataAnalysis,
  Search,
} from '@element-plus/icons-vue';
import timeRuleService from '@/services/timeRuleService';
import nhanVienService from '@/services/nhanVienService';
import phongBanService from '@/services/phongBanService';
import {DailyTimeSummary, NhanVien, PhongBan, TimeRuleViolationStat} from '@/types';

const summaries = ref<DailyTimeSummary[]>([]);
const employeeOptions = ref<NhanVien[]>([]);
const deptOptions = ref<PhongBan[]>([]);
const violations = ref<TimeRuleViolationStat[]>([]);
const loading = ref(false);
const recalculating = ref(false);

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

const filters = reactive<{
  dates: [string, string];
  trang_thai: string;
  nhan_vien_id: string;
  phong_ban_id: string;
}>({
  dates: [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ],
  trang_thai: '',
  nhan_vien_id: '',
  phong_ban_id: '',
});

const statusOptions = [
  {label: 'Tất cả', value: ''},
  {label: 'Đúng giờ', value: 'OnTime'},
  {label: 'Đi trễ', value: 'Late'},
  {label: 'Về sớm', value: 'EarlyOut'},
  {label: 'Đi trễ & Về sớm', value: 'LateEarly'},
  {label: 'Nghỉ phép', value: 'Leave'},
  {label: 'Vắng mặt', value: 'Absent'},
  {label: 'Thiếu check-in', value: 'MissingCheckin'},
  {label: 'Thiếu check-out', value: 'MissingCheckout'},
];

const statusLabel = (status?: DailyTimeSummary['status']) => {
  const option = statusOptions.find((item) => item.value === status);
  return option?.label || status || '---';
};

const statusTag = (status?: DailyTimeSummary['status']) => {
  switch (status) {
    case 'OnTime':
      return 'success';
    case 'Leave':
      return 'info';
    case 'Late':
    case 'LateEarly':
      return 'warning';
    case 'EarlyOut':
      return 'warning';
    case 'MissingCheckin':
    case 'MissingCheckout':
    case 'Absent':
      return 'danger';
    default:
      return 'info';
  }
};

const violationDisplay = computed(() => violations.value.slice(0, 4));

const lastUpdatedLabel = computed(() => {
  if (!summaries.value.length) return '---';
  const latest = summaries.value[0].ngay_cap_nhat || summaries.value[0].ngay;
  return latest ? dayjs(latest).format('DD/MM/YYYY HH:mm') : '---';
});

const formatDate = (value?: string) => {
  if (!value) return '--';
  return dayjs(value).format('DD/MM/YYYY');
};

const formatTime = (value?: string) => {
  if (!value) return '--:--';
  return dayjs(value).format('HH:mm');
};

const formatMinutes = (value?: number) => {
  if (!value) return '0 phút';
  if (value >= 60) {
    return `${(value / 60).toFixed(1)} giờ`;
  }
  return `${value} phút`;
};

const formatHours = (value?: number) => {
  if (!value) return '0h';
  return `${value.toFixed(2)}h`;
};

const buildParams = () => {
  const [from, to] = filters.dates || [];
  return {
    page: pagination.page,
    limit: pagination.limit,
    from,
    to,
    trang_thai: filters.trang_thai || undefined,
    nhan_vien_id: filters.nhan_vien_id || undefined,
    phong_ban_id: filters.phong_ban_id || undefined,
  };
};

const loadSummaries = async () => {
  loading.value = true;
  try {
    const response = await timeRuleService.getDailySummaries(buildParams());
    summaries.value = response.data || [];
    pagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadSummaries error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải dữ liệu rule engine');
  } finally {
    loading.value = false;
  }
};

const loadViolations = async () => {
  try {
    const [from, to] = filters.dates || [];
    violations.value = await timeRuleService.getViolations({from, to});
  } catch (err) {
    console.error('loadViolations error', err);
  }
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 200, page: 1});
    employeeOptions.value = response.data || [];
  } catch (err) {
    employeeOptions.value = [];
  }
};

const loadDepartments = async () => {
  try {
    const response = await phongBanService.getAll({limit: 200});
    deptOptions.value = response.items || response.data || [];
  } catch {
    deptOptions.value = [];
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadSummaries();
  loadViolations();
};

const handleReset = () => {
  filters.dates = [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ];
  filters.trang_thai = '';
  filters.nhan_vien_id = '';
  filters.phong_ban_id = '';
  handleSearch();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadSummaries();
};

const handleRefresh = () => {
  loadSummaries();
  loadViolations();
};

const handleRecalculate = async () => {
  const [from, to] = filters.dates || [];
  if (!from) {
    ElMessage.warning('Vui lòng chọn khoảng thời gian trước khi tính lại');
    return;
  }
  try {
    await ElMessageBox.confirm(
      'Rule engine sẽ tái tính dữ liệu trong khoảng đã chọn. Bạn chắc chắn tiếp tục?',
      'Xác nhận',
      {type: 'warning'},
    );
  } catch {
    return;
  }
  recalculating.value = true;
  try {
    await timeRuleService.recalculate({
      from_date: from,
      to_date: to,
      nhan_vien_ids: filters.nhan_vien_id ? [filters.nhan_vien_id] : undefined,
      phong_ban_id: filters.phong_ban_id || undefined,
    });
    ElMessage.success('Đã gửi yêu cầu tính lại');
    handleRefresh();
  } catch (err: any) {
    console.error('handleRecalculate error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tính lại rule engine');
  } finally {
    recalculating.value = false;
  }
};

onMounted(() => {
  loadEmployees();
  loadDepartments();
  handleRefresh();
});
</script>

<style scoped lang="scss">
.time-rule-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-md;

  h2 {
    margin: 0;
    font-size: $font-size-xl;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.page-actions {
  display: flex;
  gap: $spacing-sm;
}

.filter-form {
  :deep(.el-form-item) {
    margin-bottom: $spacing-sm;
  }
}

.violation-cards {
  .violation-card {
    min-height: 120px;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-xs;

      span {
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
      }
    }

    p {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
    }
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  h3 {
    margin: 0;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

.shift-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  small {
    color: $text-secondary;
  }
}

.time-pair {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-sm;
}
</style>

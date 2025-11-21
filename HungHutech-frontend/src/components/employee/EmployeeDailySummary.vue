<template>
  <div class="employee-daily-summary" v-loading="loading">
    <div class="summary-toolbar">
      <div class="summary-toolbar__info">
        <h3>Chấm công & cảnh báo</h3>
        <p>Hiển thị 14 ngày gần nhất theo rule engine Time/Leave/OT.</p>
      </div>
      <div class="summary-toolbar__filters">
        <el-date-picker
          v-model="filters.dates"
          type="daterange"
          unlink-panels
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          value-format="YYYY-MM-DD"
          format="DD/MM/YYYY"
          size="small"
        />
        <el-select
          v-model="filters.trang_thai"
          placeholder="Tất cả trạng thái"
          clearable
          size="small"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button size="small" type="primary" :icon="Refresh" @click="handleSearch">
          Lọc
        </el-button>
      </div>
    </div>

    <el-table :data="summaries" :empty-text="loading ? 'Đang tải...' : 'Chưa có dữ liệu'">
      <el-table-column label="Ngày" width="130">
        <template #default="{row}">
          {{ formatDate(row.ngay) }}
        </template>
      </el-table-column>
      <el-table-column label="Ca" min-width="160">
        <template #default="{row}">
          <div class="shift-cell">
            <strong>{{ row.shift_snapshot?.ten_ca || '---' }}</strong>
            <span>
              {{ row.shift_snapshot?.gio_bat_dau || '--:--' }} -
              {{ row.shift_snapshot?.gio_ket_thuc || '--:--' }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Check-in/out" min-width="190">
        <template #default="{row}">
          <div class="time-pair">
            <span>{{ formatTime(row.check_in) }}</span>
            <span>{{ formatTime(row.check_out) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="work_minutes" label="Làm việc" width="120">
        <template #default="{row}">
          {{ formatMinutes(row.work_minutes) }}
        </template>
      </el-table-column>
      <el-table-column prop="ot_hours" label="OT" width="90">
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
      <el-table-column prop="notes" label="Ghi chú" min-width="220" show-overflow-tooltip />
    </el-table>

    <div class="summary-pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="pagination.total"
        :current-page="pagination.page"
        :page-size="pagination.limit"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import dayjs from 'dayjs';
import {ElMessage} from 'element-plus';
import {Refresh} from '@element-plus/icons-vue';
import timeRuleService from '@/services/timeRuleService';
import {DailyTimeSummary} from '@/types';

const loading = ref(false);
const summaries = ref<DailyTimeSummary[]>([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const filters = reactive<{
  dates: [string, string];
  trang_thai: '' | DailyTimeSummary['status'];
}>({
  dates: [
    dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ],
  trang_thai: '',
});

const statusOptions = [
  {label: 'Tất cả', value: ''},
  {label: 'Đúng giờ', value: 'OnTime'},
  {label: 'Đi trễ', value: 'Late'},
  {label: 'Về sớm', value: 'EarlyOut'},
  {label: 'Đi trễ & Về sớm', value: 'LateEarly'},
  {label: 'Nghỉ phép', value: 'Leave'},
  {label: 'Vắng/Không chấm', value: 'Absent'},
  {label: 'Thiếu check-in', value: 'MissingCheckin'},
  {label: 'Thiếu check-out', value: 'MissingCheckout'},
];

const statusLabel = (status?: DailyTimeSummary['status']) => {
  const option = statusOptions.find((item) => item.value === status);
  return option?.label || '---';
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

const buildQuery = () => {
  const [from, to] = filters.dates || [];
  return {
    page: pagination.page,
    limit: pagination.limit,
    from,
    to,
    trang_thai: filters.trang_thai || undefined,
  };
};

const loadSummaries = async () => {
  loading.value = true;
  try {
    const response = await timeRuleService.getMySummaries(buildQuery());
    summaries.value = response.data || [];
    pagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadSummaries error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải dữ liệu chấm công');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadSummaries();
};

const handleSearch = () => {
  pagination.page = 1;
  loadSummaries();
};

onMounted(() => {
  loadSummaries();
});
</script>

<style scoped lang="scss">
.employee-daily-summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.summary-toolbar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-md;
  align-items: flex-start;

  &__info {
    h3 {
      margin: 0;
      font-size: $font-size-lg;
    }

    p {
      margin: $spacing-xxs 0 0 0;
      color: $text-secondary;
    }
  }

  &__filters {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    align-items: center;
  }
}

.shift-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-weight: $font-weight-medium;
  }

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

.time-pair {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-sm;
}
</style>

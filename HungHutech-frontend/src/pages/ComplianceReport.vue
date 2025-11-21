<template>
  <div v-loading="loadingDefinitions" class="page-container">
    <div class="page-header">
      <div>
        <h2>Báo cáo pháp lý Nhà nước</h2>
        <p>
          Xuất file đúng mẫu (01/PLI, D02-TS) phục vụ cơ quan LĐTBXH & BHXH.
        </p>
      </div>
      <el-button type="primary" :icon="Refresh" @click="loadDefinitions">
        Làm mới
      </el-button>
    </div>

    <el-card shadow="never" class="reminder-card">
      <div class="reminder-header">
        <div>
          <h3>Báo cáo sắp đến hạn</h3>
          <p>
            Tổng cộng {{ reminderSummary.total }} báo cáo trong {{ reminders.length ? reminders[0].lead_days : 10 }} ngày tới.
            <span v-if="reminderSummary.urgent">({{ reminderSummary.urgent }} cần xử lý gấp)</span>
          </p>
        </div>
        <el-button
          :icon="Refresh"
          size="small"
          :loading="remindersLoading"
          @click="loadReminders"
        >
          Làm mới
        </el-button>
      </div>
      <el-empty
        v-if="!remindersLoading && reminders.length === 0"
        description="Không có báo cáo sắp đến hạn"
        :image-size="90"
      />
      <el-table
        v-else
        :data="reminders"
        v-loading="remindersLoading"
        size="small"
        :border="false"
      >
        <el-table-column prop="report_name" label="Báo cáo" min-width="220" />
        <el-table-column label="Hạn nộp" width="160">
          <template #default="{row}">
            {{ formatReminderDate(row.due_date) }}
          </template>
        </el-table-column>
        <el-table-column label="Còn lại" width="140">
          <template #default="{row}">
            <el-tag :type="row.days_left <= 3 ? 'danger' : 'warning'">
              {{ row.days_left }} ngày
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="150">
          <template #default="{row}">
            <el-tag :type="reminderStatusTag(row)" effect="plain">
              {{ row.pending ? 'Chưa gửi' : 'Đã nhắc' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Lần nhắc cuối" width="180">
          <template #default="{row}">
            {{ formatReminderDate(row.last_sent_at) }}
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="200">
          <template #default="{row}">
            <el-button
              v-if="row.pending"
              type="primary"
              size="small"
              @click="handleMarkReminder(row)"
            >
              Đã nhắc
            </el-button>
            <el-tag v-else type="success" size="small">Đã ghi nhận</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="filter-card">
      <el-form :model="form" label-width="160px" label-position="left">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Loại báo cáo">
              <el-select v-model="form.type" placeholder="Chọn báo cáo">
                <el-option
                  v-for="report in reports"
                  :key="report.id"
                  :label="report.name"
                  :value="report.id"
                >
                  <span>{{ report.name }}</span>
                  <small class="option-desc">{{ report.frequency }}</small>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Khoảng thời gian">
              <el-date-picker
                v-model="form.dates"
                type="daterange"
                unlink-panels
                range-separator="đến"
                start-placeholder="Từ ngày"
                end-placeholder="Đến ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" class="button-group">
            <el-button
              type="primary"
              :icon="Search"
              :loading="loadingPreview"
              @click="handlePreview"
            >
              Xem nhanh
            </el-button>
            <el-button
              type="success"
              :icon="Download"
              :loading="exporting"
              :disabled="!tableData.length"
              @click="handleExport"
            >
              Tải CSV
            </el-button>
          </el-col>
        </el-row>
        <el-divider v-if="showContributionConfig" />
        <div v-if="showContributionConfig" class="contribution-config">
          <h4>Tùy chỉnh tỷ lệ đóng (%)</h4>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <div class="contribution-panel">
                <h5>Người lao động</h5>
                <el-form-item label="BHXH">
                  <el-input-number
                    v-model="form.contributions.bhxh_nv"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="BHYT">
                  <el-input-number
                    v-model="form.contributions.bhyt_nv"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="BHTN">
                  <el-input-number
                    v-model="form.contributions.bhtn_nv"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12">
              <div class="contribution-panel">
                <h5>Doanh nghiệp</h5>
                <el-form-item label="BHXH">
                  <el-input-number
                    v-model="form.contributions.bhxh_dn"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="BHYT">
                  <el-input-number
                    v-model="form.contributions.bhyt_dn"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="BHTN">
                  <el-input-number
                    v-model="form.contributions.bhtn_dn"
                    :min="0"
                    :max="50"
                    :step="0.1"
                    controls-position="right"
                  />
                </el-form-item>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="table-header">
          <div>
            <h3>{{ currentReport?.name || 'Chọn báo cáo để xem dữ liệu' }}</h3>
            <p v-if="currentReport">{{ currentReport.description }}</p>
          </div>
          <el-tag v-if="previewMeta.total !== null" type="info">
            {{ previewMeta.total }} dòng
          </el-tag>
        </div>
      </template>
      <el-empty
        v-if="!tableData.length && !loadingPreview"
        description="Chưa có dữ liệu"
      />
      <el-table
        v-else
        :data="tableData"
        border
        :default-sort="{prop: 'stt', order: 'ascending'}"
        height="520"
      >
        <el-table-column
          v-for="column in currentColumns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :min-width="120"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <el-card shadow="never" class="history-card">
      <template #header>
        <div class="history-header">
          <div>
            <h3>Lịch sử xuất báo cáo</h3>
            <p>Theo dõi thời điểm, bộ lọc và người thực hiện.</p>
          </div>
          <div class="card-filters">
            <el-select
              v-model="historyFilter"
              size="small"
              clearable
              placeholder="Tất cả báo cáo"
              @change="handleHistoryFilter"
            >
              <el-option
                v-for="option in reportOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table
        :data="reportHistory"
        v-loading="historyLoading"
        :empty-text="historyLoading ? 'Đang tải...' : 'Chưa có dữ liệu'"
      >
        <el-table-column label="Thời gian" width="180">
          <template #default="{row}">
            {{ formatExportedAt(row.exported_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="report_name" label="Báo cáo" min-width="220" />
        <el-table-column label="Người thực hiện" min-width="200">
          <template #default="{row}">
            {{ formatRequestedBy(row) }}
          </template>
        </el-table-column>
        <el-table-column label="Khoảng dữ liệu" min-width="200">
          <template #default="{row}">
            {{ formatHistoryRange(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_rows" label="Số dòng" width="120" />
        <el-table-column label="Định dạng" width="120">
          <template #default="{row}">
            <el-tag size="small">{{ row.format?.toUpperCase() || 'CSV' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="historyPagination.total"
          :current-page="historyPagination.page"
          :page-size="historyPagination.limit"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import dayjs from 'dayjs';
import {ElMessage, ElMessageBox} from 'element-plus';
import {Refresh, Search, Download} from '@element-plus/icons-vue';
import complianceReportService, {
  CompliancePreviewResponse,
  ComplianceReportDefinition,
  ComplianceReminder,
  ComplianceReportLog,
} from '@/services/complianceReportService';

const reports = ref<ComplianceReportDefinition[]>([]);
const loadingDefinitions = ref(false);
const loadingPreview = ref(false);
const exporting = ref(false);
const tableData = ref<Record<string, any>[]>([]);
const previewMeta = ref<{total: number | null}>({total: null});
const reminders = ref<ComplianceReminder[]>([]);
const remindersLoading = ref(false);
const reportHistory = ref<ComplianceReportLog[]>([]);
const historyLoading = ref(false);
const historyFilter = ref('');
const historyPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const defaultContributions = {
  bhxh_nv: 8,
  bhxh_dn: 17.5,
  bhyt_nv: 1.5,
  bhyt_dn: 3,
  bhtn_nv: 1,
  bhtn_dn: 1,
};

const form = ref<{
  type: string | null;
  dates: string[];
  contributions: typeof defaultContributions;
}>({
  type: null,
  dates: [],
  contributions: {...defaultContributions},
});

const currentReport = computed(
  () => reports.value.find((item) => item.id === form.value.type) || null,
);

const currentColumns = computed(() => currentReport.value?.fields || []);

const loadDefinitions = async () => {
  loadingDefinitions.value = true;
  try {
    reports.value = await complianceReportService.getDefinitions();
    if (!form.value.type && reports.value.length > 0) {
      form.value.type = reports.value[0].id;
    }
  } catch (err: any) {
    console.error('loadDefinitions', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách báo cáo',
    );
  } finally {
    loadingDefinitions.value = false;
  }
};

watch(
  () => form.value.type,
  (newType) => {
    if (
      (newType === 'D02TS' || newType === 'BHTN') &&
      !form.value.contributions
    ) {
      form.value.contributions = {...defaultContributions};
    }
  },
);

const showContributionConfig = computed(
  () => form.value.type === 'D02TS' || form.value.type === 'BHTN',
);
const reminderSummary = computed(() => ({
  total: reminders.value.length,
  urgent: reminders.value.filter((item) => item.days_left <= 3 && item.pending)
    .length,
}));

const reportOptions = computed(() =>
  reports.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const buildPayload = () => {
  const payload: {
    type: string;
    from_date?: string;
    to_date?: string;
    contributions?: Record<string, number>;
  } = {
    type: form.value.type || '',
  };
  if (form.value.dates?.length === 2) {
    payload.from_date = form.value.dates[0];
    payload.to_date = form.value.dates[1];
  }
  if (form.value.type === 'D02TS' || form.value.type === 'BHTN') {
    payload.contributions = {...form.value.contributions};
  }
  return payload;
};

const handlePreview = async () => {
  if (!form.value.type) {
    ElMessage.warning('Vui lòng chọn loại báo cáo');
    return;
  }

  loadingPreview.value = true;
  try {
    const payload = buildPayload();
    const response: CompliancePreviewResponse =
      await complianceReportService.preview(payload);
    tableData.value = response.data || [];
    previewMeta.value.total = response.meta?.total ?? tableData.value.length;
  } catch (err: any) {
    console.error('handlePreview', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tạo báo cáo');
  } finally {
    loadingPreview.value = false;
  }
};

const loadReminders = async () => {
  remindersLoading.value = true;
  try {
    reminders.value = await complianceReportService.getReminders();
  } catch (err: any) {
    console.error('loadReminders', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải lịch nhắc báo cáo',
    );
  } finally {
    remindersLoading.value = false;
  }
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const response = await complianceReportService.getHistory({
      page: historyPagination.page,
      limit: historyPagination.limit,
      type: historyFilter.value || undefined,
    });
    reportHistory.value = response.data || [];
    historyPagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadHistory', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải lịch sử báo cáo',
    );
  } finally {
    historyLoading.value = false;
  }
};

const handleHistoryFilter = () => {
  historyPagination.page = 1;
  loadHistory();
};

const handleHistoryPageChange = (page: number) => {
  historyPagination.page = page;
  loadHistory();
};

const formatHistoryRange = (log: ComplianceReportLog) => {
  const from = log.params?.from_date
    ? dayjs(log.params.from_date).format('DD/MM/YYYY')
    : '--';
  const to = log.params?.to_date
    ? dayjs(log.params.to_date).format('DD/MM/YYYY')
    : '--';
  if (from === '--' && to === '--') return '--';
  return `${from} - ${to}`;
};

const formatExportedAt = (value?: string) => {
  if (!value) return '--';
  return dayjs(value).format('DD/MM/YYYY HH:mm');
};

const formatRequestedBy = (log: ComplianceReportLog) => {
  const user = log.requested_by;
  if (!user) return '--';
  const name = `${user.ho_dem || ''} ${user.ten || ''}`.trim();
  return name || user.ma_nhan_vien || '--';
};

const handleExport = async () => {
  if (!form.value.type) {
    ElMessage.warning('Vui lòng chọn loại báo cáo');
    return;
  }
  exporting.value = true;
  try {
    const payload = buildPayload();
    const blob = await complianceReportService.exportCsv(payload);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.value.type}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('handleExport', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải file');
  } finally {
    exporting.value = false;
  }
};

const formatReminderDate = (value?: string | null) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const reminderStatusTag = (item: ComplianceReminder) => {
  if (item.pending) return item.days_left <= 3 ? 'danger' : 'warning';
  return 'success';
};

const handleMarkReminder = async (item: ComplianceReminder) => {
  try {
    const {value} = await ElMessageBox.prompt(
      'Nhập ghi chú (tùy chọn) khi đánh dấu đã nhắc hạn',
      'Xác nhận',
      {
        confirmButtonText: 'Đã nhắc',
        cancelButtonText: 'Hủy',
        inputPlaceholder: 'Ghi chú',
        inputValue: '',
      },
    );
    await complianceReportService.markReminder({
      report_id: item.report_id,
      period_key: item.period_key,
      due_date: item.due_date,
      note: value,
    });
    ElMessage.success('Đã ghi nhận nhắc hạn');
    loadReminders();
  } catch (err: any) {
    if (err === 'cancel') return;
    console.error('handleMarkReminder', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể ghi nhận nhắc hạn thủ công',
    );
  }
};

loadDefinitions();
loadReminders();
loadHistory();
</script>

<style scoped lang="scss">
.page-container {
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

.filter-card {
  :deep(.el-form-item) {
    margin-bottom: $spacing-md;
  }
}

.reminder-card {
  :deep(.el-table) {
    font-size: $font-size-sm;
  }
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-sm;

  h3 {
    margin: 0;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.contribution-config {
  margin-top: $spacing-md;

  h4 {
    margin-bottom: $spacing-sm;
  }

  .contribution-panel {
    padding: $spacing-md;
    border: 1px dashed $border-color;
    border-radius: $border-radius-md;

    h5 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-base;
      color: $text-primary;
    }
  }
}

.button-group {
  display: flex;
  gap: $spacing-sm;
}

.card-filters {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-sm;

  h3 {
    margin: 0;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  h3 {
    margin: 0;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.option-desc {
  margin-left: $spacing-xs;
  color: $text-secondary;
}
</style>

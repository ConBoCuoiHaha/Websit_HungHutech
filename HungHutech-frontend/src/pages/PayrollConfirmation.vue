<template>
  <div class="payroll-confirmation-page">
    <div class="page-header">
      <div>
        <h1>Xác nhận bảng lương</h1>
        <p>Gửi bảng lương cho nhân viên xác nhận qua app mobile</p>
      </div>
      <div class="page-actions">
        <el-button :icon="ArrowLeft" @click="goBack">Quay lại</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="loadData">Tải lại</el-button>
        <el-button
          type="primary"
          :icon="DocumentChecked"
          :disabled="selectedEntries.length === 0 || loading"
          @click="showSendDialog = true"
        >
          Gửi cho nhân viên ({{ selectedEntries.length }})
        </el-button>
      </div>
    </div>

    <!-- Run Info -->
    <el-card v-if="run" class="info-card" shadow="never">
      <div class="run-info">
        <div class="run-info__item">
          <span class="label">Kỳ lương:</span>
          <span class="value">{{ run.ky_luong }}</span>
        </div>
        <div class="run-info__item">
          <span class="label">Thời gian:</span>
          <span class="value">{{ formatDateRange(run.ngay_bat_dau, run.ngay_ket_thuc) }}</span>
        </div>
        <div class="run-info__item">
          <span class="label">Loại kỳ:</span>
          <el-tag size="small" type="info">{{ getRunTypeLabel(run.loai_ky) }}</el-tag>
        </div>
        <div class="run-info__item">
          <span class="label">Tổng nhân viên:</span>
          <span class="value">{{ run.tong_so_nhan_vien }} người</span>
        </div>
      </div>
    </el-card>

    <!-- Statistics -->
    <el-row v-if="stats" :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--total">
          <div class="stat-card__icon">📊</div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.da_xac_nhan + stats.tu_choi + stats.cho_xac_nhan + stats.chua_gui }}</div>
            <div class="stat-card__label">Tổng</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--confirmed">
          <div class="stat-card__icon">✓</div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.da_xac_nhan }}</div>
            <div class="stat-card__label">Đã xác nhận</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--pending">
          <div class="stat-card__icon">⏱</div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.cho_xac_nhan }}</div>
            <div class="stat-card__label">Chờ xác nhận</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--rejected">
          <div class="stat-card__icon">✗</div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.tu_choi }}</div>
            <div class="stat-card__label">Từ chối</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filter -->
    <el-card class="filter-card" shadow="never">
      <el-form inline>
        <el-form-item label="Trạng thái">
          <el-select v-model="filter.trang_thai" placeholder="Tất cả" clearable style="width: 200px" @change="loadData">
            <el-option label="Tất cả" value="" />
            <el-option label="Chưa gửi" value="Chua_gui" />
            <el-option label="Chờ xác nhận" value="Cho_xac_nhan" />
            <el-option label="Đã xác nhận" value="Da_xac_nhan" />
            <el-option label="Từ chối" value="Tu_choi" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Entries Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="entries"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" :selectable="isSelectable" />
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{ row }">
            <div v-if="row.nhan_vien_id">
              <div><strong>{{ row.nhan_vien_id.ho_dem }} {{ row.nhan_vien_id.ten }}</strong></div>
              <div class="text-secondary">{{ row.nhan_vien_id.ma_nhan_vien }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Lương thực nhận" min-width="150">
          <template #default="{ row }">
            <strong class="text-success">{{ formatCurrency(row.luong_thuc_nhan) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái xác nhận" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getConfirmStatusType(row.trang_thai_xac_nhan)" size="small">
              {{ getConfirmStatusLabel(row.trang_thai_xac_nhan) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày gửi" width="150">
          <template #default="{ row }">
            <span v-if="row.gui_xac_nhan?.ngay_gui">{{ formatDateTime(row.gui_xac_nhan.ngay_gui) }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Deadline" width="150">
          <template #default="{ row }">
            <span v-if="row.gui_xac_nhan?.deadline" :class="{ 'text-danger': isOverdue(row.gui_xac_nhan.deadline) }">
              {{ formatDate(row.gui_xac_nhan.deadline) }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button v-if="row.trang_thai_xac_nhan === 'Tu_choi'" size="small" type="warning" @click="openResolveDialog(row)">
                Xử lý
              </el-button>
              <el-button size="small" @click="viewDetail(row)">Chi tiết</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog: Send Confirmations -->
    <el-dialog v-model="showSendDialog" title="Gửi xác nhận cho nhân viên" width="600px">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        Bạn đang gửi {{ selectedEntries.length }} bảng lương cho nhân viên xác nhận qua app mobile.
        Deadline xác nhận: 3 ngày kể từ ngày gửi.
      </el-alert>
      <el-form :model="sendForm" label-width="100px">
        <el-form-item label="Ghi chú">
          <el-input v-model="sendForm.ghi_chu" type="textarea" :rows="3" placeholder="Ghi chú cho nhân viên (không bắt buộc)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">Hủy</el-button>
        <el-button type="primary" :loading="sending" @click="handleSendConfirmations">Gửi</el-button>
      </template>
    </el-dialog>

    <!-- Dialog: Resolve Rejection -->
    <el-dialog v-model="showResolveDialog" title="Xử lý từ chối" width="700px" :close-on-click-modal="false">
      <div v-if="currentEntry">
        <el-alert type="error" :closable="false" style="margin-bottom: 16px">
          <strong>Nhân viên: </strong> {{ currentEntry.nhan_vien_id?.ho_dem }} {{ currentEntry.nhan_vien_id?.ten }}<br />
          <strong>Lý do từ chối: </strong> {{ currentEntry.tu_choi?.ly_do }}<br />
          <strong v-if="currentEntry.tu_choi?.ghi_chu">Ghi chú: </strong> {{ currentEntry.tu_choi?.ghi_chu }}
        </el-alert>

        <el-form :model="resolveForm" label-width="150px">
          <el-form-item label="Kết quả xử lý" required>
            <el-input v-model="resolveForm.ket_qua_xu_ly" type="textarea" :rows="3" placeholder="Mô tả cách xử lý khiếu nại này..." />
          </el-form-item>
          <el-form-item label="Gửi lại">
            <el-switch v-model="resolveForm.gui_lai" />
            <span class="text-secondary" style="margin-left: 8px">
              Gửi lại bảng lương sau khi xử lý (deadline mới +3 ngày)
            </span>
          </el-form-item>
          <el-form-item label="Ghi chú thêm">
            <el-input v-model="resolveForm.ghi_chu" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showResolveDialog = false">Hủy</el-button>
        <el-button type="primary" :loading="resolving" @click="handleResolveRejection">Xác nhận xử lý</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ElMessage, ElMessageBox} from 'element-plus';
import {ArrowLeft, Refresh, DocumentChecked} from '@element-plus/icons-vue';
import payrollService from '@/services/payrollService';
import type {PayrollRun, PayrollEntry} from '@/types';

const route = useRoute();
const router = useRouter();
const runId = route.params.id as string;

const loading = ref(false);
const sending = ref(false);
const resolving = ref(false);
const run = ref<PayrollRun | null>(null);
const entries = ref<PayrollEntry[]>([]);
const selectedEntries = ref<PayrollEntry[]>([]);
const stats = ref({
  da_xac_nhan: 0,
  tu_choi: 0,
  cho_xac_nhan: 0,
  chua_gui: 0,
});

const filter = reactive({
  trang_thai: '',
});

const showSendDialog = ref(false);
const sendForm = reactive({
  ghi_chu: '',
});

const showResolveDialog = ref(false);
const currentEntry = ref<PayrollEntry | null>(null);
const resolveForm = reactive({
  ket_qua_xu_ly: '',
  gui_lai: true,
  ghi_chu: '',
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const response = await payrollService.getConfirmations(runId, {
      trang_thai: filter.trang_thai || undefined,
    });
    if (response.success) {
      run.value = response.data.run;
      entries.value = response.data.entries;
      stats.value = response.data.thong_ke;
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || 'Lỗi khi tải dữ liệu');
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(selection: PayrollEntry[]) {
  selectedEntries.value = selection;
}

function isSelectable(row: PayrollEntry) {
  return row.trang_thai_xac_nhan === 'Chua_gui' || row.trang_thai_xac_nhan === 'Cho_xac_nhan';
}

async function handleSendConfirmations() {
  if (!sendForm) return;
  sending.value = true;
  try {
    const entry_ids = selectedEntries.value.map(e => e._id);
    const response = await payrollService.sendConfirmations(runId, {
      entry_ids,
      ghi_chu: sendForm.ghi_chu || undefined,
    });
    if (response.success) {
      ElMessage.success(response.msg);
      showSendDialog.value = false;
      sendForm.ghi_chu = '';
      await loadData();
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || 'Lỗi khi gửi xác nhận');
  } finally {
    sending.value = false;
  }
}

function openResolveDialog(entry: PayrollEntry) {
  currentEntry.value = entry;
  resolveForm.ket_qua_xu_ly = '';
  resolveForm.gui_lai = true;
  resolveForm.ghi_chu = '';
  showResolveDialog.value = true;
}

async function handleResolveRejection() {
  if (!currentEntry.value) return;
  if (!resolveForm.ket_qua_xu_ly || resolveForm.ket_qua_xu_ly.trim().length < 10) {
    ElMessage.warning('Kết quả xử lý phải có ít nhất 10 ký tự');
    return;
  }

  resolving.value = true;
  try {
    const response = await payrollService.resolveRejection(currentEntry.value._id, {
      ket_qua_xu_ly: resolveForm.ket_qua_xu_ly,
      gui_lai: resolveForm.gui_lai,
      ghi_chu: resolveForm.ghi_chu || undefined,
    });
    if (response.success) {
      ElMessage.success(response.msg);
      showResolveDialog.value = false;
      await loadData();
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || 'Lỗi khi xử lý từ chối');
  } finally {
    resolving.value = false;
  }
}

function viewDetail(entry: PayrollEntry) {
  ElMessageBox.alert(
    `Chi tiết bảng lương sẽ hiển thị ở đây. Entry ID: ${entry._id}`,
    'Chi tiết',
    {confirmButtonText: 'Đóng'},
  );
}

function goBack() {
  router.back();
}

function formatCurrency(value: number, currency = 'VND'): string {
  if (!value) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {style: 'currency', currency}).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
}

function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getRunTypeLabel(type: string): string {
  const map: Record<string, string> = {
    Thang: 'Kỳ tháng',
    Tuan: 'Kỳ tuần',
    Tuy_chinh: 'Tùy chỉnh',
  };
  return map[type] || type;
}

function getConfirmStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Chua_gui: 'Chưa gửi',
    Cho_xac_nhan: 'Chờ xác nhận',
    Da_xac_nhan: 'Đã xác nhận',
    Tu_choi: 'Từ chối',
  };
  return map[status] || status;
}

function getConfirmStatusType(status: string): string {
  const map: Record<string, string> = {
    Chua_gui: 'info',
    Cho_xac_nhan: 'warning',
    Da_xac_nhan: 'success',
    Tu_choi: 'danger',
  };
  return map[status] || 'info';
}

function isOverdue(deadlineStr: string): boolean {
  if (!deadlineStr) return false;
  return new Date(deadlineStr) < new Date();
}
</script>

<style scoped lang="scss">
.payroll-confirmation-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #666;
  }
}

.info-card {
  margin-bottom: 16px;
}

.run-info {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;

  &__item {
    .label {
      color: #666;
      margin-right: 8px;
    }
    .value {
      font-weight: 600;
    }
  }
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;

  &__icon {
    font-size: 36px;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
  }

  &__label {
    font-size: 14px;
    color: #666;
  }

  &--confirmed {
    .stat-card__value {
      color: #67c23a;
    }
  }

  &--pending {
    .stat-card__value {
      color: #e6a23c;
    }
  }

  &--rejected {
    .stat-card__value {
      color: #f56c6c;
    }
  }
}

.filter-card,
.table-card {
  margin-bottom: 16px;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}
</style>

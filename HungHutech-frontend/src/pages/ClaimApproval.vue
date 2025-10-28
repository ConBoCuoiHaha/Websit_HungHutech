<template>
  <div class="orangehrm-claim-approval-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Phê duyệt bồi hoàn chi phí</h1>
      <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
    </div>

    <!-- Statistics -->
    <el-row :gutter="20" class="orangehrm-stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--warning">
          <el-statistic title="Chờ phê duyệt" :value="stats.pending">
            <template #suffix>yêu cầu</template>
          </el-statistic>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--success">
          <el-statistic title="Đã phê duyệt" :value="stats.approved">
            <template #suffix>yêu cầu</template>
          </el-statistic>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--danger">
          <el-statistic title="Bị từ chối" :value="stats.rejected">
            <template #suffix>yêu cầu</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Đã nộp" value="Submitted" />
            <el-option label="Đã duyệt" value="Approved" />
            <el-option label="Bị từ chối" value="Rejected" />
            <el-option label="Đã thanh toán" value="Paid" />
          </el-select>
        </el-form-item>

        <el-form-item label="Nhân viên">
          <el-select
            v-model="filters.nhan_vien_id"
            placeholder="Tất cả"
            clearable
            filterable
            style="width: 220px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Claims Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="claimList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="nhan_vien_id" label="Nhân viên" min-width="200">
          <template #default="{ row }">
            <div v-if="typeof row.nhan_vien_id === 'object' && row.nhan_vien_id">
              <strong>{{ row.nhan_vien_id.ma_nhan_vien }}</strong>
              <div class="orangehrm-text-muted">
                {{ row.nhan_vien_id.ho_dem }} {{ row.nhan_vien_id.ten }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tong_tien" label="Tổng tiền" width="150" align="right">
          <template #default="{ row }">
            <strong class="orangehrm-amount">{{ formatCurrency(row.tong_tien) }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="items" label="Số khoản" width="100" align="center">
          <template #default="{ row }">
            {{ row.items?.length || 0 }} khoản
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ getStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{ row }">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="260" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" :icon="View" @click="handleView(row)">
                Xem
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Submitted'"
                size="small"
                type="success"
                :icon="Check"
                @click="handleApprove(row)"
              >
                Duyệt
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Submitted'"
                size="small"
                type="danger"
                :icon="Close"
                @click="handleReject(row)"
              >
                Từ chối
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="orangehrm-pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- View Details Dialog -->
    <el-dialog v-model="showViewDialog" title="Chi tiết yêu cầu bồi hoàn" width="700px">
      <div v-if="selectedClaim" class="orangehrm-claim-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Nhân viên">
            <div v-if="typeof selectedClaim.nhan_vien_id === 'object' && selectedClaim.nhan_vien_id">
              <strong>{{ selectedClaim.nhan_vien_id.ma_nhan_vien }}</strong>
              <div>{{ selectedClaim.nhan_vien_id.ho_dem }} {{ selectedClaim.nhan_vien_id.ten }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedClaim.trang_thai)">
              {{ getStatusText(selectedClaim.trang_thai) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Tổng tiền">
            <strong class="orangehrm-amount">{{ formatCurrency(selectedClaim.tong_tien) }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="Số khoản">
            {{ selectedClaim.items?.length || 0 }} khoản
          </el-descriptions-item>

          <el-descriptions-item label="Ngày tạo">
            {{ formatDate(selectedClaim.ngay_tao) }}
          </el-descriptions-item>

          <el-descriptions-item label="Cập nhật cuối">
            {{ formatDate(selectedClaim.ngay_cap_nhat) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>Chi tiết các khoản chi phí</el-divider>

        <el-table :data="selectedClaim.items" border stripe>
          <el-table-column type="index" label="STT" width="60" />

          <el-table-column prop="ngay" label="Ngày" width="120">
            <template #default="{ row }">
              {{ formatDate(row.ngay) }}
            </template>
          </el-table-column>

          <el-table-column prop="danh_muc" label="Danh mục" width="140">
            <template #default="{ row }">
              {{ row.danh_muc || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="mo_ta" label="Mô tả" min-width="200">
            <template #default="{ row }">
              {{ row.mo_ta || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="so_tien" label="Số tiền" width="140" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.so_tien) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer v-if="selectedClaim && selectedClaim.trang_thai === 'Submitted'">
        <el-button @click="showViewDialog = false">Đóng</el-button>
        <el-button type="success" :icon="Check" @click="handleApproveFromDialog">
          Phê duyệt
        </el-button>
        <el-button type="danger" :icon="Close" @click="handleRejectFromDialog">
          Từ chối
        </el-button>
      </template>
    </el-dialog>

    <!-- Reject Dialog -->
    <el-dialog v-model="showRejectDialog" title="Từ chối yêu cầu bồi hoàn" width="500px">
      <el-form label-position="top">
        <el-form-item label="Lý do từ chối" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="Nhập lý do từ chối..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRejectDialog = false">Hủy</el-button>
        <el-button type="danger" @click="confirmReject" :loading="processing">
          Xác nhận từ chối
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Refresh, View, Check, Close} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import claimService from '@/services/claimService';
import nhanVienService from '@/services/nhanVienService';
import {Claim, NhanVien} from '@/types';

const claimList = ref<Claim[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const processing = ref(false);
const showViewDialog = ref(false);
const showRejectDialog = ref(false);
const selectedClaim = ref<Claim | null>(null);
const rejectReason = ref('');

const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
});

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  trang_thai: 'Submitted',
  nhan_vien_id: '',
});

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.trang_thai) {
      params.trang_thai = filters.trang_thai;
    }

    if (filters.nhan_vien_id) {
      params.nhan_vien_id = filters.nhan_vien_id;
    }

    const response = await claimService.getAll(params);
    claimList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;

    // Load stats
    await loadStats();
  } catch (err: any) {
    console.error('Error loading claims:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách bồi hoàn';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      claimService.getAll({limit: 1, trang_thai: 'Submitted'}),
      claimService.getAll({limit: 1, trang_thai: 'Approved'}),
      claimService.getAll({limit: 1, trang_thai: 'Rejected'}),
    ]);

    stats.pending = pending.pagination?.total || 0;
    stats.approved = approved.pagination?.total || 0;
    stats.rejected = rejected.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading stats:', err);
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
  pagination.currentPage = 1;
  loadData();
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
  loadData();
};

const handleView = (item: Claim) => {
  selectedClaim.value = item;
  showViewDialog.value = true;
};

const handleApprove = async (item: Claim) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn phê duyệt yêu cầu bồi hoàn này với số tiền ${formatCurrency(item.tong_tien)}?`,
      'Xác nhận phê duyệt',
      {
        confirmButtonText: 'Phê duyệt',
        cancelButtonText: 'Hủy',
        type: 'success',
      },
    );

    await claimService.updateStatus(item._id, 'Approved');
    ElMessage.success('Phê duyệt yêu cầu bồi hoàn thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error approving claim:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể phê duyệt yêu cầu');
    }
  }
};

const handleApproveFromDialog = async () => {
  if (selectedClaim.value) {
    await handleApprove(selectedClaim.value);
    showViewDialog.value = false;
  }
};

const handleReject = (item: Claim) => {
  selectedClaim.value = item;
  rejectReason.value = '';
  showRejectDialog.value = true;
};

const handleRejectFromDialog = () => {
  showViewDialog.value = false;
  if (selectedClaim.value) {
    rejectReason.value = '';
    showRejectDialog.value = true;
  }
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('Vui lòng nhập lý do từ chối');
    return;
  }

  if (!selectedClaim.value) return;

  processing.value = true;
  try {
    await claimService.updateStatus(selectedClaim.value._id, 'Rejected', rejectReason.value);
    ElMessage.success('Từ chối yêu cầu bồi hoàn thành công');
    showRejectDialog.value = false;
    await loadData();
  } catch (err: any) {
    console.error('Error rejecting claim:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể từ chối yêu cầu');
  } finally {
    processing.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getStatusType = (status: string): string => {
  const types: Record<string, string> = {
    Submitted: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Paid: 'info',
  };
  return types[status] || 'info';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    Submitted: 'Đã nộp',
    Approved: 'Đã duyệt',
    Rejected: 'Bị từ chối',
    Paid: 'Đã thanh toán',
  };
  return texts[status] || status;
};

onMounted(() => {
  loadData();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-claim-approval-page {
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

// Stats Row
.orangehrm-stats-row {
  margin-bottom: $spacing-xl;
}

.orangehrm-stat-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  &--warning {
    border-left: 4px solid $warning-color;
  }

  &--success {
    border-left: 4px solid $success-color;
  }

  &--danger {
    border-left: 4px solid $danger-color;
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Filter Card
.orangehrm-filter-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-md;
  }

  :deep(.el-form--inline .el-form-item) {
    margin-right: $spacing-lg;
    margin-bottom: 0;
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

.orangehrm-text-muted {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.orangehrm-amount {
  color: $primary-color;
  font-weight: $font-weight-medium;
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

// Claim Details
.orangehrm-claim-details {
  :deep(.el-descriptions__label) {
    font-weight: $font-weight-medium;
  }

  :deep(.el-table) {
    margin-top: $spacing-md;
  }
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .orangehrm-stats-row {
    margin-bottom: $spacing-lg;
  }

  .orangehrm-filter-card {
    :deep(.el-form--inline) {
      display: block;

      .el-form-item {
        display: block;
        margin-right: 0;
        margin-bottom: $spacing-md;
      }
    }
  }

  .orangehrm-pagination {
    justify-content: center;
    padding: $spacing-md;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>

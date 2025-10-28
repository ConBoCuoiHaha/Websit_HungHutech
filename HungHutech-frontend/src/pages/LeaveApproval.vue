<template>
  <div class="orangehrm-leave-approval-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Phê duyệt đơn nghỉ phép</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-search-card" shadow="never">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterStatus"
            placeholder="Lọc theo trạng thái"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Chờ duyệt" value="Cho duyet" />
            <el-option label="Đã duyệt" value="Da duyet" />
            <el-option label="Bị từ chối" value="Bi tu choi" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-date-picker
            v-model="filterDateFrom"
            type="date"
            placeholder="Từ ngày"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-date-picker
            v-model="filterDateTo"
            type="date"
            placeholder="Đến ngày"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- Pending Approval Summary -->
    <el-row :gutter="16" class="orangehrm-summary-row">
      <el-col :xs="24" :sm="8">
        <el-card class="orangehrm-summary-card orangehrm-pending" shadow="hover">
          <el-statistic title="Chờ duyệt" :value="pendingCount">
            <template #prefix>
              <el-icon color="#E6A23C"><Clock /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="orangehrm-summary-card orangehrm-approved" shadow="hover">
          <el-statistic title="Đã duyệt" :value="approvedCount">
            <template #prefix>
              <el-icon color="#67C23A"><Check /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="orangehrm-summary-card orangehrm-rejected" shadow="hover">
          <el-statistic title="Bị từ chối" :value="rejectedCount">
            <template #prefix>
              <el-icon color="#F56C6C"><Close /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- Leave Requests Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="leaveList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column prop="nhan_vien_id" label="Nhân viên" min-width="180">
          <template #default="{ row }">
            <div class="orangehrm-employee-info">
              <strong>{{ getEmployeeName(row.nhan_vien_id) }}</strong>
              <span class="orangehrm-employee-code">
                {{ getEmployeeCode(row.nhan_vien_id) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Loại nghỉ phép" min-width="140">
          <template #default="{ row }">
            <el-tag type="info" size="small">
              {{ getLeaveTypeName(row.loai_ngay_nghi_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thời gian nghỉ" min-width="200">
          <template #default="{ row }">
            <div class="orangehrm-leave-period">
              <div>
                <el-icon><Calendar /></el-icon>
                {{ formatDate(row.ngay_bat_dau) }} - {{ formatDate(row.ngay_ket_thuc) }}
              </div>
              <span class="orangehrm-leave-days">
                ({{ row.so_ngay }} ngày)
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Lý do" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.ly_do && row.ly_do.length > 50"
              :content="row.ly_do"
              placement="top"
            >
              <span class="orangehrm-leave-reason">
                {{ row.ly_do.substring(0, 50) }}...
              </span>
            </el-tooltip>
            <span v-else class="orangehrm-leave-reason">
              {{ row.ly_do || '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" min-width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ getStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" min-width="120">
          <template #default="{ row }">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{ row }">
            <el-space v-if="row.trang_thai === 'Cho duyet'">
              <el-button
                size="small"
                type="success"
                :icon="Check"
                @click="handleApprove(row)"
              >
                Duyệt
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Close"
                @click="handleReject(row)"
              >
                Từ chối
              </el-button>
            </el-space>
            <el-space v-else>
              <el-button
                size="small"
                :icon="View"
                @click="handleView(row)"
              >
                Xem
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

    <!-- Approve/Reject Dialog -->
    <el-dialog
      v-model="showActionDialog"
      :title="actionType === 'approve' ? 'Phê duyệt đơn nghỉ phép' : 'Từ chối đơn nghỉ phép'"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedLeave" class="orangehrm-action-dialog">
        <el-descriptions :column="1" border class="orangehrm-leave-info">
          <el-descriptions-item label="Nhân viên">
            <strong>{{ getEmployeeName(selectedLeave.nhan_vien_id) }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="Loại nghỉ phép">
            {{ getLeaveTypeName(selectedLeave.loai_ngay_nghi_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Thời gian">
            {{ formatDate(selectedLeave.ngay_bat_dau) }} -
            {{ formatDate(selectedLeave.ngay_ket_thuc) }}
            ({{ selectedLeave.so_ngay }} ngày)
          </el-descriptions-item>
          <el-descriptions-item label="Lý do">
            {{ selectedLeave.ly_do || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form
          ref="actionFormRef"
          :model="actionForm"
          :rules="actionFormRules"
          label-width="140px"
          label-position="left"
          class="orangehrm-action-form"
        >
          <el-form-item label="Ghi chú" prop="ghi_chu_quan_ly">
            <el-input
              v-model="actionForm.ghi_chu_quan_ly"
              type="textarea"
              :rows="4"
              :placeholder="
                actionType === 'approve'
                  ? 'Nhập ghi chú phê duyệt (nếu có)...'
                  : 'Nhập lý do từ chối...'
              "
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="closeActionDialog">Hủy</el-button>
        <el-button
          :type="actionType === 'approve' ? 'success' : 'danger'"
          @click="handleSubmitAction"
          :loading="saving"
        >
          {{ actionType === 'approve' ? 'Phê duyệt' : 'Từ chối' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Detail Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      title="Chi tiết đơn nghỉ phép"
      width="600px"
    >
      <div v-if="selectedLeave" class="orangehrm-leave-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Nhân viên">
            <strong>{{ getEmployeeName(selectedLeave.nhan_vien_id) }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="Loại nghỉ phép">
            <el-tag type="info">
              {{ getLeaveTypeName(selectedLeave.loai_ngay_nghi_id) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Thời gian nghỉ">
            {{ formatDate(selectedLeave.ngay_bat_dau) }} -
            {{ formatDate(selectedLeave.ngay_ket_thuc) }}
            <br />
            <strong>{{ selectedLeave.so_ngay }} ngày</strong>
          </el-descriptions-item>
          <el-descriptions-item label="Lý do">
            {{ selectedLeave.ly_do || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedLeave.trang_thai)">
              {{ getStatusText(selectedLeave.trang_thai) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedLeave.nguoi_duyet_id"
            label="Người duyệt"
          >
            {{ getEmployeeName(selectedLeave.nguoi_duyet_id) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedLeave.ghi_chu_quan_ly"
            label="Ghi chú quản lý"
          >
            {{ selectedLeave.ghi_chu_quan_ly }}
          </el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">
            {{ formatDateTime(selectedLeave.ngay_tao) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">Đóng</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {
  Calendar,
  Refresh,
  Check,
  Close,
  View,
  Clock,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import yeuCauNghiPhepService from '@/services/yeuCauNghiPhepService';
import loaiNgayNghiService from '@/services/loaiNgayNghiService';
import nhanVienService from '@/services/nhanVienService';
import {YeuCauNghiPhep, LoaiNgayNghi, NhanVien} from '@/types';

const leaveList = ref<YeuCauNghiPhep[]>([]);
const leaveTypes = ref<LoaiNgayNghi[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showActionDialog = ref(false);
const showDetailDialog = ref(false);
const selectedLeave = ref<YeuCauNghiPhep | null>(null);
const actionType = ref<'approve' | 'reject'>('approve');
const actionFormRef = ref<FormInstance>();

const filterStatus = ref('Cho duyet');
const filterDateFrom = ref('');
const filterDateTo = ref('');

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const statistics = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
});

const actionForm = reactive({
  ghi_chu_quan_ly: '',
});

const actionFormRules: FormRules = {
  ghi_chu_quan_ly: [
    {
      required: true,
      message: 'Vui lòng nhập lý do từ chối',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (actionType.value === 'reject' && !value) {
          callback(new Error('Vui lòng nhập lý do từ chối'));
        } else {
          callback();
        }
      },
    },
  ],
};

// Computed statistics
const pendingCount = computed(() => statistics.pending);
const approvedCount = computed(() => statistics.approved);
const rejectedCount = computed(() => statistics.rejected);

const loadStatistics = async () => {
  try {
    // Load count for each status
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      yeuCauNghiPhepService.getAll({ trang_thai: 'Cho duyet', limit: 1 }),
      yeuCauNghiPhepService.getAll({ trang_thai: 'Da duyet', limit: 1 }),
      yeuCauNghiPhepService.getAll({ trang_thai: 'Bi tu choi', limit: 1 }),
    ]);

    statistics.pending = pendingRes.pagination?.total || 0;
    statistics.approved = approvedRes.pagination?.total || 0;
    statistics.rejected = rejectedRes.pagination?.total || 0;
  } catch (err) {
    console.error('Error loading statistics:', err);
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await yeuCauNghiPhepService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
      trang_thai: filterStatus.value || undefined,
      from: filterDateFrom.value || undefined,
      to: filterDateTo.value || undefined,
    });

    leaveList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;

    // Load statistics after successful data load
    await loadStatistics();
  } catch (err: any) {
    console.error('Error loading leave requests:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách đơn nghỉ phép';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const loadLeaveTypes = async () => {
  try {
    const response = await loaiNgayNghiService.getAll({limit: 100});
    leaveTypes.value = response.data || [];
  } catch (err) {
    console.error('Error loading leave types:', err);
  }
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];
  } catch (err) {
    console.error('Error loading employees:', err);
  }
};

const handleSearch = () => {
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

const handleApprove = (leave: YeuCauNghiPhep) => {
  selectedLeave.value = leave;
  actionType.value = 'approve';
  actionForm.ghi_chu_quan_ly = '';
  showActionDialog.value = true;
};

const handleReject = (leave: YeuCauNghiPhep) => {
  selectedLeave.value = leave;
  actionType.value = 'reject';
  actionForm.ghi_chu_quan_ly = '';
  showActionDialog.value = true;
};

const handleView = (leave: YeuCauNghiPhep) => {
  selectedLeave.value = leave;
  showDetailDialog.value = true;
};

const handleSubmitAction = async () => {
  if (!selectedLeave.value) return;

  // Only validate if rejecting
  if (actionType.value === 'reject' && actionFormRef.value) {
    const valid = await actionFormRef.value.validate();
    if (!valid) return;
  }

  saving.value = true;
  try {
    const status = actionType.value === 'approve' ? 'Da duyet' : 'Bi tu choi';
    await yeuCauNghiPhepService.updateStatus(selectedLeave.value._id, {
      trang_thai: status,
      ghi_chu_quan_ly: actionForm.ghi_chu_quan_ly || undefined,
    });

    ElMessage.success(
      actionType.value === 'approve'
        ? 'Phê duyệt đơn nghỉ phép thành công'
        : 'Từ chối đơn nghỉ phép thành công',
    );
    closeActionDialog();
    await loadData();
  } catch (err: any) {
    console.error('Error updating leave status:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể cập nhật trạng thái đơn nghỉ phép',
    );
  } finally {
    saving.value = false;
  }
};

const closeActionDialog = () => {
  showActionDialog.value = false;
  selectedLeave.value = null;
  actionForm.ghi_chu_quan_ly = '';
  if (actionFormRef.value) {
    actionFormRef.value.resetFields();
  }
};

const getEmployeeName = (nhanVien: any): string => {
  if (typeof nhanVien === 'object' && nhanVien) {
    return `${nhanVien.ho_dem} ${nhanVien.ten}`;
  }
  const emp = employees.value.find((e) => e._id === nhanVien);
  return emp ? `${emp.ho_dem} ${emp.ten}` : '-';
};

const getEmployeeCode = (nhanVien: any): string => {
  if (typeof nhanVien === 'object' && nhanVien) {
    return nhanVien.ma_nhan_vien;
  }
  const emp = employees.value.find((e) => e._id === nhanVien);
  return emp ? emp.ma_nhan_vien : '-';
};

const getLeaveTypeName = (loaiNgayNghi: any): string => {
  if (typeof loaiNgayNghi === 'object' && loaiNgayNghi) {
    return loaiNgayNghi.ten;
  }
  const type = leaveTypes.value.find((t) => t._id === loaiNgayNghi);
  return type ? type.ten : '-';
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Cho duyet': 'Chờ duyệt',
    'Da duyet': 'Đã duyệt',
    'Bi tu choi': 'Bị từ chối',
    'Da huy': 'Đã hủy',
  };
  return statusMap[status] || status;
};

const getStatusType = (status: string): 'warning' | 'success' | 'danger' | 'info' => {
  const typeMap: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    'Cho duyet': 'warning',
    'Da duyet': 'success',
    'Bi tu choi': 'danger',
    'Da huy': 'info',
  };
  return typeMap[status] || 'info';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN');
};

onMounted(() => {
  loadData();
  loadLeaveTypes();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-leave-approval-page {
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
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Summary Row
.orangehrm-summary-row {
  margin-bottom: $spacing-lg;
}

.orangehrm-summary-card {
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

  &.orangehrm-pending {
    border-left: 4px solid #E6A23C;
  }

  &.orangehrm-approved {
    border-left: 4px solid #67C23A;
  }

  &.orangehrm-rejected {
    border-left: 4px solid #F56C6C;
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

// Employee Info Display
.orangehrm-employee-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs / 2;

  strong {
    color: $text-primary;
    font-weight: $font-weight-medium;
  }
}

.orangehrm-employee-code {
  color: $text-secondary;
  font-size: $font-size-sm;
}

// Leave Period Display
.orangehrm-leave-period {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs / 2;

  .el-icon {
    margin-right: $spacing-xs / 2;
    color: $primary-color;
  }
}

.orangehrm-leave-days {
  color: $text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.orangehrm-leave-reason {
  color: $text-secondary;
  font-size: $font-size-sm;
}

// Action Dialog
.orangehrm-action-dialog {
  .orangehrm-leave-info {
    margin-bottom: $spacing-lg;
  }

  .orangehrm-action-form {
    margin-top: $spacing-lg;
  }
}

// Leave Detail
.orangehrm-leave-detail {
  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: $font-weight-medium;
      width: 150px;
    }
  }
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
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

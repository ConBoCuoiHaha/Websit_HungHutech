<template>
  <div class="orangehrm-leave-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Danh sách đơn nghỉ phép</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="showApplyDialog = true" :icon="Plus">
          Đăng ký nghỉ phép
        </el-button>
      </div>
    </div>

    <!-- Search & Filters -->
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
            <el-option label="Tất cả trạng thái" value="" />
            <el-option label="Chờ duyệt" value="Cho duyet" />
            <el-option label="Đã duyệt" value="Da duyet" />
            <el-option label="Bị từ chối" value="Bi tu choi" />
            <el-option label="Đã hủy" value="Da huy" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterLeaveType"
            placeholder="Loại nghỉ phép"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả loại" value="" />
            <el-option
              v-for="type in leaveTypes"
              :key="type._id"
              :label="type.ten"
              :value="type._id"
            />
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
            <span class="orangehrm-leave-reason">
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
            <el-space>
              <el-button
                size="small"
                :icon="View"
                @click="handleView(row)"
              >
                Xem
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Cho duyet'"
                size="small"
                type="warning"
                :icon="Close"
                @click="handleCancel(row._id)"
              >
                Hủy
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

    <!-- Apply Leave Dialog -->
    <el-dialog
      v-model="showApplyDialog"
      title="Đăng ký nghỉ phép"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="applyFormRef"
        :model="applyForm"
        :rules="applyFormRules"
        label-width="140px"
        label-position="left"
      >
        <el-form-item label="Nhân viên" prop="nhan_vien_id" required>
          <el-select
            v-model="applyForm.nhan_vien_id"
            placeholder="Chọn nhân viên"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Loại nghỉ phép" prop="loai_ngay_nghi_id" required>
          <el-select
            v-model="applyForm.loai_ngay_nghi_id"
            placeholder="Chọn loại nghỉ phép"
            style="width: 100%"
          >
            <el-option
              v-for="type in leaveTypes"
              :key="type._id"
              :label="type.ten"
              :value="type._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Từ ngày" prop="ngay_bat_dau" required>
          <el-date-picker
            v-model="applyForm.ngay_bat_dau"
            type="date"
            placeholder="Chọn ngày bắt đầu"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="calculateLeaveDays"
          />
        </el-form-item>

        <el-form-item label="Đến ngày" prop="ngay_ket_thuc" required>
          <el-date-picker
            v-model="applyForm.ngay_ket_thuc"
            type="date"
            placeholder="Chọn ngày kết thúc"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledEndDate"
            @change="calculateLeaveDays"
          />
        </el-form-item>

        <el-form-item label="Số ngày nghỉ" prop="so_ngay" required>
          <el-input-number
            v-model="applyForm.so_ngay"
            :min="0.5"
            :step="0.5"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Lý do" prop="ly_do">
          <el-input
            v-model="applyForm.ly_do"
            type="textarea"
            :rows="4"
            placeholder="Nhập lý do nghỉ phép..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeApplyDialog">Hủy</el-button>
        <el-button type="primary" @click="handleApply" :loading="saving">
          Đăng ký
        </el-button>
      </template>
    </el-dialog>

    <!-- View Leave Detail Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      title="Chi tiết đơn nghỉ phép"
      width="600px"
    >
      <div v-if="selectedLeave" class="orangehrm-leave-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Nhân viên">
            <strong>{{ getEmployeeName(selectedLeave.nhan_vien_id) }}</strong>
            <br />
            <span class="orangehrm-text-secondary">
              {{ getEmployeeCode(selectedLeave.nhan_vien_id) }}
            </span>
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

          <el-descriptions-item
            v-if="selectedLeave.ngay_cap_nhat"
            label="Cập nhật lần cuối"
          >
            {{ formatDateTime(selectedLeave.ngay_cap_nhat) }}
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
import {ref, reactive, onMounted} from 'vue';
import {
  Calendar,
  Refresh,
  Plus,
  View,
  Close,
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
const showApplyDialog = ref(false);
const showDetailDialog = ref(false);
const selectedLeave = ref<YeuCauNghiPhep | null>(null);
const applyFormRef = ref<FormInstance>();

const filterStatus = ref('');
const filterLeaveType = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const applyForm = reactive({
  nhan_vien_id: '',
  loai_ngay_nghi_id: '',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  so_ngay: 1,
  ly_do: '',
});

const applyFormRules: FormRules = {
  nhan_vien_id: [
    {required: true, message: 'Vui lòng chọn nhân viên', trigger: 'change'},
  ],
  loai_ngay_nghi_id: [
    {required: true, message: 'Vui lòng chọn loại nghỉ phép', trigger: 'change'},
  ],
  ngay_bat_dau: [
    {required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change'},
  ],
  ngay_ket_thuc: [
    {required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change'},
  ],
  so_ngay: [
    {required: true, message: 'Vui lòng nhập số ngày nghỉ', trigger: 'blur'},
  ],
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

const calculateLeaveDays = () => {
  if (applyForm.ngay_bat_dau && applyForm.ngay_ket_thuc) {
    const start = new Date(applyForm.ngay_bat_dau);
    const end = new Date(applyForm.ngay_ket_thuc);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    applyForm.so_ngay = diffDays;
  }
};

const disabledEndDate = (time: Date) => {
  if (!applyForm.ngay_bat_dau) return false;
  const startDate = new Date(applyForm.ngay_bat_dau);
  return time.getTime() < startDate.getTime();
};

const handleApply = async () => {
  if (!applyFormRef.value) return;

  await applyFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      await yeuCauNghiPhepService.create(applyForm);
      ElMessage.success('Đăng ký nghỉ phép thành công');
      closeApplyDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error applying leave:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể đăng ký nghỉ phép',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleView = (leave: YeuCauNghiPhep) => {
  selectedLeave.value = leave;
  showDetailDialog.value = true;
};

const handleCancel = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn hủy đơn nghỉ phép này?',
      'Xác nhận hủy',
      {
        confirmButtonText: 'Hủy đơn',
        cancelButtonText: 'Quay lại',
        type: 'warning',
      },
    );

    await yeuCauNghiPhepService.cancel(id);
    ElMessage.success('Hủy đơn nghỉ phép thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error cancelling leave:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể hủy đơn nghỉ phép',
      );
    }
  }
};

const closeApplyDialog = () => {
  showApplyDialog.value = false;
  resetApplyForm();
};

const resetApplyForm = () => {
  if (applyFormRef.value) {
    applyFormRef.value.resetFields();
  }
  applyForm.nhan_vien_id = '';
  applyForm.loai_ngay_nghi_id = '';
  applyForm.ngay_bat_dau = '';
  applyForm.ngay_ket_thuc = '';
  applyForm.so_ngay = 1;
  applyForm.ly_do = '';
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
.orangehrm-leave-page {
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

// Leave Detail
.orangehrm-leave-detail {
  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: $font-weight-medium;
      width: 150px;
    }
  }
}

.orangehrm-text-secondary {
  color: $text-secondary;
  font-size: $font-size-sm;
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

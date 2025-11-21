<template>
  <div class="orangehrm-leave-assign-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Gán Quyền Nghỉ Phép</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadRecentAssignments"
          >Tải lại</el-button
        >
      </div>
    </div>

    <!-- Assignment Form Card -->
    <el-card class="orangehrm-form-card" shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <el-icon :size="20"><UserFilled /></el-icon>
          <span>Gán quyền nghỉ phép cho nhân viên</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="180px"
        label-position="left"
        @submit.prevent="handleSubmit"
      >
        <el-row :gutter="24">
          <el-col :xs="24" :md="12">
            <el-form-item label="Nhân viên" prop="nhan_vien_id" required>
              <el-select
                v-model="form.nhan_vien_id"
                placeholder="Tìm kiếm nhân viên..."
                filterable
                remote
                reserve-keyword
                :remote-method="searchEmployees"
                :loading="searchingEmployees"
                style="width: 100%"
                clearable
                @change="handleEmployeeChange"
              >
                <el-option
                  v-for="emp in filteredEmployees"
                  :key="emp._id"
                  :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
                  :value="emp._id"
                >
                  <div class="orangehrm-employee-option">
                    <span class="orangehrm-employee-name"
                      >{{ emp.ho_dem }} {{ emp.ten }}</span
                    >
                    <span class="orangehrm-employee-code">{{
                      emp.ma_nhan_vien
                    }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item
              label="Loại nghỉ phép"
              prop="loai_ngay_nghi_id"
              required
            >
              <el-select
                v-model="form.loai_ngay_nghi_id"
                placeholder="Chọn loại nghỉ phép"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="type in leaveTypes"
                  :key="type._id"
                  :label="type.ten"
                  :value="type._id"
                >
                  <div class="orangehrm-leave-type-option">
                    <span>{{ type.ten }}</span>
                    <span v-if="type.mo_ta" class="orangehrm-leave-type-desc">{{
                      type.mo_ta
                    }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24" :md="12">
            <el-form-item label="Năm" prop="nam" required>
              <el-select
                v-model="form.nam"
                placeholder="Chọn năm"
                style="width: 100%"
              >
                <el-option
                  v-for="year in years"
                  :key="year"
                  :label="`Năm ${year}`"
                  :value="year"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item
              label="Số ngày được gán"
              prop="so_ngay_duoc_huong"
              required
            >
              <el-input-number
                v-model="form.so_ngay_duoc_huong"
                :min="0"
                :max="365"
                :step="0.5"
                :precision="1"
                style="width: 100%"
                placeholder="Nhập số ngày"
                controls-position="right"
              />
              <div class="orangehrm-field-hint">
                Nhập số ngày nghỉ phép được hưởng (có thể nhập số lẻ: 0.5,
                1.5,...)
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24">
            <el-form-item label="Ghi chú" prop="ghi_chu">
              <el-input
                v-model="form.ghi_chu"
                type="textarea"
                :rows="4"
                placeholder="Nhập ghi chú về việc gán quyền nghỉ phép này (tùy chọn)..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Current Balance Info (if employee selected) -->
        <el-alert
          v-if="form.nhan_vien_id && currentBalance !== null"
          type="info"
          :closable="false"
          class="orangehrm-balance-alert"
        >
          <template #title>
            <div class="orangehrm-balance-info">
              <el-icon><InfoFilled /></el-icon>
              <span>
                Nhân viên này hiện có <strong>{{ currentBalance }}</strong> ngày
                nghỉ phép cho năm {{ form.nam }}
              </span>
            </div>
          </template>
        </el-alert>

        <el-form-item class="orangehrm-form-actions">
          <el-button :disabled="saving" @click="handleReset">Đặt lại</el-button>
          <el-button
            type="primary"
            :loading="saving"
            :icon="Check"
            @click="handleSubmit"
          >
            {{ saving ? 'Đang gán...' : 'Gán quyền nghỉ phép' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Recent Assignments Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <el-icon :size="20"><Document /></el-icon>
          <span>Các lần gán gần đây</span>
        </div>
      </template>

      <el-table
        v-loading="loadingAssignments"
        :data="recentAssignments"
        style="width: 100%"
        stripe
        :empty-text="assignmentsError || 'Chưa có lần gán nào'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div class="orangehrm-employee-info">
              <strong>{{ getEmployeeName(row.nhan_vien_id) }}</strong>
              <span class="orangehrm-employee-code">
                {{ getEmployeeCode(row.nhan_vien_id) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Loại nghỉ phép" width="160">
          <template #default="{row}">
            <el-tag type="info" size="small">
              {{ getLeaveTypeName(row.loai_ngay_nghi_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Năm" width="100" align="center">
          <template #default="{row}">
            <strong>{{ row.nam }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Số ngày gán" width="130" align="center">
          <template #default="{row}">
            <el-tag type="primary">{{ row.so_ngay_duoc_huong }} ngày</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Đã sử dụng" width="130" align="center">
          <template #default="{row}">
            <el-tag type="warning">{{ row.so_ngay_da_su_dung }} ngày</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Còn lại" width="130" align="center">
          <template #default="{row}">
            <el-tag type="success">
              {{ (row.so_ngay_duoc_huong - row.so_ngay_da_su_dung).toFixed(1) }}
              ngày
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ghi chú" min-width="200">
          <template #default="{row}">
            <el-tooltip
              v-if="row.ghi_chu && row.ghi_chu.length > 50"
              :content="row.ghi_chu"
              placement="top"
            >
              <span class="orangehrm-note-text">
                {{ row.ghi_chu.substring(0, 50) }}...
              </span>
            </el-tooltip>
            <span v-else class="orangehrm-note-text">
              {{ row.ghi_chu || '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="140">
          <template #default="{row}">
            {{ formatDateTime(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="160" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="Edit" @click="handleEdit(row)">
                Sửa
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDelete(row._id)"
              >
                Xóa
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
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed, watch} from 'vue';
import {
  Refresh,
  Check,
  Edit,
  Delete,
  UserFilled,
  Document,
  InfoFilled,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import quyenNghiPhepService from '@/services/quyenNghiPhepService';
import loaiNgayNghiService from '@/services/loaiNgayNghiService';
import nhanVienService from '@/services/nhanVienService';
import {QuyenNghiPhep, LoaiNgayNghi, NhanVien} from '@/types';

// Data refs
const leaveTypes = ref<LoaiNgayNghi[]>([]);
const employees = ref<NhanVien[]>([]);
const filteredEmployees = ref<NhanVien[]>([]);
const recentAssignments = ref<QuyenNghiPhep[]>([]);
const formRef = ref<FormInstance>();

// Loading states
const searchingEmployees = ref(false);
const saving = ref(false);
const loadingAssignments = ref(false);
const assignmentsError = ref('');

// Current balance for selected employee
const currentBalance = ref<number | null>(null);

// Edit state
const editingId = ref('');

// Years array
const currentYear = new Date().getFullYear();
const years = ref<number[]>([]);
for (let i = -1; i <= 3; i++) {
  years.value.push(currentYear + i);
}

// Pagination
const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

// Form data
const form = reactive({
  nhan_vien_id: '',
  loai_ngay_nghi_id: '',
  nam: currentYear,
  so_ngay_duoc_huong: 12,
  ghi_chu: '',
});

// Form validation rules
const formRules: FormRules = {
  nhan_vien_id: [
    {required: true, message: 'Vui lòng chọn nhân viên', trigger: 'change'},
  ],
  loai_ngay_nghi_id: [
    {
      required: true,
      message: 'Vui lòng chọn loại nghỉ phép',
      trigger: 'change',
    },
  ],
  nam: [{required: true, message: 'Vui lòng chọn năm', trigger: 'change'}],
  so_ngay_duoc_huong: [
    {required: true, message: 'Vui lòng nhập số ngày', trigger: 'blur'},
    {
      type: 'number',
      min: 0,
      max: 365,
      message: 'Số ngày phải từ 0 đến 365',
      trigger: 'blur',
    },
  ],
};

// Load leave types
const loadLeaveTypes = async () => {
  try {
    const response = await loaiNgayNghiService.getAll({limit: 100});
    leaveTypes.value = response.data || [];
  } catch (err) {
    console.error('Error loading leave types:', err);
    ElMessage.error('Không thể tải danh sách loại nghỉ phép');
  }
};

// Load all employees initially
const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];
    filteredEmployees.value = response.data || [];
  } catch (err) {
    console.error('Error loading employees:', err);
    ElMessage.error('Không thể tải danh sách nhân viên');
  }
};

// Search employees (remote method for autocomplete)
const searchEmployees = async (query: string) => {
  if (!query) {
    filteredEmployees.value = employees.value;
    return;
  }

  searchingEmployees.value = true;
  try {
    // Filter locally for better performance
    const lowerQuery = query.toLowerCase();
    filteredEmployees.value = employees.value.filter((emp) => {
      const fullName = `${emp.ho_dem} ${emp.ten}`.toLowerCase();
      const code = emp.ma_nhan_vien.toLowerCase();
      return fullName.includes(lowerQuery) || code.includes(lowerQuery);
    });
  } finally {
    searchingEmployees.value = false;
  }
};

// Load current balance when employee or year changes
const loadCurrentBalance = async () => {
  if (!form.nhan_vien_id || !form.loai_ngay_nghi_id || !form.nam) {
    currentBalance.value = null;
    return;
  }

  try {
    const response = await quyenNghiPhepService.getAll({
      nhan_vien_id: form.nhan_vien_id,
      loai_ngay_nghi_id: form.loai_ngay_nghi_id,
      nam: form.nam,
      limit: 1,
    });

    if (response.data && response.data.length > 0) {
      const existing = response.data[0];
      currentBalance.value = existing.so_ngay_duoc_huong;

      // If editing existing record
      if (existing._id) {
        editingId.value = existing._id;
      }
    } else {
      currentBalance.value = 0;
      editingId.value = '';
    }
  } catch (err) {
    console.error('Error loading current balance:', err);
    currentBalance.value = null;
  }
};

// Watch for employee and year changes
watch(
  () => [form.nhan_vien_id, form.loai_ngay_nghi_id, form.nam],
  () => {
    loadCurrentBalance();
  },
);

// Handle employee selection change
const handleEmployeeChange = (value: string) => {
  if (value) {
    loadCurrentBalance();
  } else {
    currentBalance.value = null;
  }
};

// Load recent assignments
const loadRecentAssignments = async () => {
  loadingAssignments.value = true;
  assignmentsError.value = '';

  try {
    const response = await quyenNghiPhepService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
      nam: currentYear,
    });

    recentAssignments.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading recent assignments:', err);
    assignmentsError.value =
      err.response?.data?.msg || 'Không thể tải danh sách gán gần đây';
    ElMessage.error(assignmentsError.value);
  } finally {
    loadingAssignments.value = false;
  }
};

// Handle form submit
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      if (editingId.value) {
        // Update existing entitlement
        await quyenNghiPhepService.update(editingId.value, {
          so_ngay_duoc_huong: form.so_ngay_duoc_huong,
          ghi_chu: form.ghi_chu,
        });
        ElMessage.success('Cập nhật quyền nghỉ phép thành công');
      } else {
        // Create new entitlement
        await quyenNghiPhepService.create({
          nhan_vien_id: form.nhan_vien_id,
          loai_ngay_nghi_id: form.loai_ngay_nghi_id,
          nam: form.nam,
          so_ngay_duoc_huong: form.so_ngay_duoc_huong,
          so_ngay_da_su_dung: 0,
          ghi_chu: form.ghi_chu,
        });
        ElMessage.success('Gán quyền nghỉ phép thành công');
      }

      // Reset form and reload data
      handleReset();
      await loadRecentAssignments();
    } catch (err: any) {
      console.error('Error saving entitlement:', err);
      const errorMsg =
        err.response?.data?.msg || 'Không thể gán quyền nghỉ phép';
      ElMessage.error(errorMsg);
    } finally {
      saving.value = false;
    }
  });
};

// Handle reset form
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.nhan_vien_id = '';
  form.loai_ngay_nghi_id = '';
  form.nam = currentYear;
  form.so_ngay_duoc_huong = 12;
  form.ghi_chu = '';
  currentBalance.value = null;
  editingId.value = '';
};

// Handle edit
const handleEdit = (item: QuyenNghiPhep) => {
  editingId.value = item._id;
  form.nhan_vien_id =
    typeof item.nhan_vien_id === 'string'
      ? item.nhan_vien_id
      : item.nhan_vien_id._id;
  form.loai_ngay_nghi_id =
    typeof item.loai_ngay_nghi_id === 'string'
      ? item.loai_ngay_nghi_id
      : item.loai_ngay_nghi_id._id;
  form.nam = item.nam;
  form.so_ngay_duoc_huong = item.so_ngay_duoc_huong;
  form.ghi_chu = item.ghi_chu || '';

  // Scroll to form
  window.scrollTo({top: 0, behavior: 'smooth'});

  ElMessage.info(
    'Đang chỉnh sửa quyền nghỉ phép. Vui lòng cập nhật và lưu lại.',
  );
};

// Handle delete
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa quyền nghỉ phép này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await quyenNghiPhepService.delete(id);
    ElMessage.success('Xóa quyền nghỉ phép thành công');
    await loadRecentAssignments();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting entitlement:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa quyền nghỉ phép',
      );
    }
  }
};

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadRecentAssignments();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
  loadRecentAssignments();
};

// Helper functions
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

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Initialize data on mount
onMounted(() => {
  loadLeaveTypes();
  loadEmployees();
  loadRecentAssignments();
});
</script>

<style lang="scss" scoped>
.orangehrm-leave-assign-page {
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

// Card Header
.orangehrm-card-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: $font-weight-medium;
  font-size: $font-size-base;
}

// Form Card
.orangehrm-form-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

// Field Hint
.orangehrm-field-hint {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.4;
}

// Employee Option in Select
.orangehrm-employee-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-employee-name {
  font-weight: $font-weight-medium;
  color: $text-primary;
}

.orangehrm-employee-code {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-left: $spacing-sm;
}

// Leave Type Option
.orangehrm-leave-type-option {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs / 2;
}

.orangehrm-leave-type-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// Balance Alert
.orangehrm-balance-alert {
  margin-top: $spacing-lg;
  margin-bottom: $spacing-md;
}

.orangehrm-balance-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-size-base;

  strong {
    color: $primary-color;
    font-weight: $font-weight-bold;
  }
}

// Form Actions
.orangehrm-form-actions {
  margin-top: $spacing-xl;
  margin-bottom: 0;

  :deep(.el-form-item__content) {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
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

// Employee Info in Table
.orangehrm-employee-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs / 2;

  strong {
    color: $text-primary;
    font-weight: $font-weight-medium;
  }

  .orangehrm-employee-code {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

// Note Text
.orangehrm-note-text {
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

  .orangehrm-form-card {
    :deep(.el-card__body) {
      padding: $spacing-lg;
    }
  }

  .orangehrm-form-actions {
    :deep(.el-form-item__content) {
      flex-direction: column-reverse;

      .el-button {
        width: 100%;
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

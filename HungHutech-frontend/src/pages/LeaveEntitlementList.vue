<template>
  <div class="orangehrm-entitlement-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quyền nghỉ phép</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm quyền nghỉ phép
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="Nhân viên">
          <el-select
            v-model="filterEmployeeId"
            placeholder="Chọn nhân viên"
            filterable
            clearable
            style="width: 300px"
            @change="loadData"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Năm">
          <el-select
            v-model="filterYear"
            placeholder="Chọn năm"
            style="width: 150px"
            @change="loadData"
          >
            <el-option
              v-for="year in years"
              :key="year"
              :label="`Năm ${year}`"
              :value="year"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Entitlements Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="entitlementList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
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

        <el-table-column label="Loại nghỉ phép" width="180">
          <template #default="{row}">
            <el-tag type="info" size="small">
              {{ getLeaveTypeName(row.loai_ngay_nghi_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Năm" width="100">
          <template #default="{row}">
            <strong>{{ row.nam }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Được hưởng" width="130">
          <template #default="{row}">
            <el-tag type="primary">{{ row.so_ngay_duoc_huong }} ngày</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Đã dùng" width="130">
          <template #default="{row}">
            <el-tag type="warning">{{ row.so_ngay_da_su_dung }} ngày</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Còn lại" width="130">
          <template #default="{row}">
            <el-tag type="success">
              {{ row.so_ngay_duoc_huong - row.so_ngay_da_su_dung }} ngày
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ghi chú" min-width="200">
          <template #default="{row}">
            {{ row.ghi_chu || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="200" fixed="right">
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
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="
        editingId ? 'Chỉnh sửa quyền nghỉ phép' : 'Thêm quyền nghỉ phép mới'
      "
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-form-item label="Nhân viên" prop="nhan_vien_id" required>
          <el-select
            v-model="form.nhan_vien_id"
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
            v-model="form.loai_ngay_nghi_id"
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

        <el-form-item
          label="Số ngày được hưởng"
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
          />
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Nhập ghi chú..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? 'Cập nhật' : 'Thêm mới' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Refresh, Plus, Edit, Delete} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import quyenNghiPhepService from '@/services/quyenNghiPhepService';
import loaiNgayNghiService from '@/services/loaiNgayNghiService';
import nhanVienService from '@/services/nhanVienService';
import {QuyenNghiPhep, LoaiNgayNghi, NhanVien} from '@/types';

const entitlementList = ref<QuyenNghiPhep[]>([]);
const leaveTypes = ref<LoaiNgayNghi[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();

const filterEmployeeId = ref('');
const filterYear = ref(new Date().getFullYear());

// Generate years list
const years = ref<number[]>([]);
for (let i = -2; i <= 2; i++) {
  years.value.push(new Date().getFullYear() + i);
}

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const form = reactive({
  nhan_vien_id: '',
  loai_ngay_nghi_id: '',
  nam: new Date().getFullYear(),
  so_ngay_duoc_huong: 12,
  ghi_chu: '',
});

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
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await quyenNghiPhepService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
      nhan_vien_id: filterEmployeeId.value || undefined,
      nam: filterYear.value,
    });

    entitlementList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading entitlements:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách quyền nghỉ phép';
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

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
  loadData();
};

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
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      if (editingId.value) {
        await quyenNghiPhepService.update(editingId.value, form);
        ElMessage.success('Cập nhật quyền nghỉ phép thành công');
      } else {
        await quyenNghiPhepService.create(form);
        ElMessage.success('Thêm quyền nghỉ phép thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving entitlement:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu quyền nghỉ phép',
      );
    } finally {
      saving.value = false;
    }
  });
};

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
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting entitlement:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa quyền nghỉ phép',
      );
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.nhan_vien_id = '';
  form.loai_ngay_nghi_id = '';
  form.nam = new Date().getFullYear();
  form.so_ngay_duoc_huong = 12;
  form.ghi_chu = '';
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

onMounted(() => {
  loadData();
  loadLeaveTypes();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-entitlement-page {
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

// Filter Card
.orangehrm-filter-card {
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

// Employee Info
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

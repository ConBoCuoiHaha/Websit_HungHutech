<template>
  <div class="orangehrm-department-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Phòng ban</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm phòng ban
        </el-button>
      </div>
    </div>

    <!-- Departments Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="phongBanList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column prop="ten" label="Tên phòng ban" min-width="250">
          <template #default="{row}">
            <strong class="orangehrm-department-name">{{ row.ten }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="350">
          <template #default="{row}">
            {{ row.mo_ta || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Quản lý" min-width="200">
          <template #default="{row}">
            <span v-if="row.quan_ly_id">
              {{ row.quan_ly_id.ho_dem }} {{ row.quan_ly_id.ten }}
            </span>
            <span v-else class="orangehrm-text-muted">Chưa có</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="150" fixed="right">
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
    </el-card>

    <!-- Create/Edit Department Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="Tên phòng ban" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Ví dụ: Phòng Nhân sự" />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về phòng ban này..."
          />
        </el-form-item>

        <el-form-item label="Quản lý" prop="quan_ly_id">
          <el-select
            v-model="form.quan_ly_id"
            placeholder="Chọn quản lý phòng ban"
            filterable
            clearable
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
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          Lưu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Refresh, Plus, Edit, Delete} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import phongBanService from '@/services/phongBanService';
import nhanVienService from '@/services/nhanVienService';
import {PhongBan, NhanVien} from '@/types';

const phongBanList = ref<PhongBan[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<string>('');

const form = reactive({
  ten: '',
  mo_ta: '',
  quan_ly_id: '',
});

const formRules: FormRules = {
  ten: [
    {required: true, message: 'Vui lòng nhập tên phòng ban', trigger: 'blur'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await phongBanService.getAll({limit: 1000});
    phongBanList.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading departments:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách phòng ban';
    ElMessage.error(error.value);
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

const handleEdit = (item: PhongBan) => {
  editingId.value = item._id;
  form.ten = item.ten;
  form.mo_ta = item.mo_ta || '';
  form.quan_ly_id =
    typeof item.quan_ly_id === 'string'
      ? item.quan_ly_id
      : item.quan_ly_id?._id || '';
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      if (editingId.value) {
        await phongBanService.update(editingId.value, form);
        ElMessage.success('Cập nhật phòng ban thành công');
      } else {
        await phongBanService.create(form);
        ElMessage.success('Thêm phòng ban thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving department:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu phòng ban');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa phòng ban này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await phongBanService.delete(id);
    ElMessage.success('Xóa phòng ban thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting department:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa phòng ban');
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  resetForm();
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.ten = '';
  form.mo_ta = '';
  form.quan_ly_id = '';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

onMounted(() => {
  loadData();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-department-page {
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

// Department Display
.orangehrm-department-name {
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.orangehrm-text-muted {
  color: $text-disabled;
  font-style: italic;
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
}
</style>

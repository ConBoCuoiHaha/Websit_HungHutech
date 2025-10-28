<template>
  <div class="orangehrm-jobtitle-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Chức danh công việc</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
          Thêm chức danh
        </el-button>
      </div>
    </div>

    <!-- Job Titles Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="chucDanhList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column prop="ten_chuc_danh" label="Tên chức danh" min-width="250">
          <template #default="{ row }">
            <strong class="orangehrm-jobtitle-name">{{ row.ten_chuc_danh }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="350">
          <template #default="{ row }">
            {{ row.mo_ta || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{ row }">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="150" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
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

    <!-- Create/Edit Job Title Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa chức danh' : 'Thêm chức danh mới'"
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
        <el-form-item label="Tên chức danh" prop="ten_chuc_danh" required>
          <el-input
            v-model="form.ten_chuc_danh"
            placeholder="Ví dụ: Nhân viên kinh doanh"
          />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về chức danh này..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
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
import chucDanhService from '@/services/chucDanhService';
import {ChucDanh} from '@/types';

const chucDanhList = ref<ChucDanh[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<string>('');

const form = reactive({
  ten_chuc_danh: '',
  mo_ta: '',
});

const formRules: FormRules = {
  ten_chuc_danh: [
    {required: true, message: 'Vui lòng nhập tên chức danh', trigger: 'blur'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await chucDanhService.getAll();
    chucDanhList.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading job titles:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách chức danh';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (item: ChucDanh) => {
  editingId.value = item._id;
  form.ten_chuc_danh = item.ten_chuc_danh;
  form.mo_ta = item.mo_ta || '';
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      if (editingId.value) {
        await chucDanhService.update(editingId.value, form);
        ElMessage.success('Cập nhật chức danh thành công');
      } else {
        await chucDanhService.create(form);
        ElMessage.success('Thêm chức danh thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving job title:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu chức danh',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa chức danh này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await chucDanhService.delete(id);
    ElMessage.success('Xóa chức danh thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting job title:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa chức danh',
      );
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
  form.ten_chuc_danh = '';
  form.mo_ta = '';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-jobtitle-page {
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

// Job Title Display
.orangehrm-jobtitle-name {
  color: $text-primary;
  font-weight: $font-weight-medium;
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

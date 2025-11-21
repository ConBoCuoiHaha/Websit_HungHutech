<template>
  <div class="orangehrm-leavetype-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Loại nghỉ phép</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm loại nghỉ phép
        </el-button>
      </div>
    </div>

    <!-- Leave Types Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="leaveTypeList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ten" label="Tên loại nghỉ phép" min-width="250">
          <template #default="{row}">
            <strong class="orangehrm-leavetype-name">{{ row.ten }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="300">
          <template #default="{row}">
            {{ row.mo_ta || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="120">
          <template #default="{row}">
            <el-tag :type="row.da_xoa ? 'danger' : 'success'" size="small">
              {{ row.da_xoa ? 'Đã xóa' : 'Đang dùng' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="Edit" @click="handleEdit(row)">
                Sửa
              </el-button>
              <el-button
                v-if="!row.da_xoa"
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
        editingId ? 'Chỉnh sửa loại nghỉ phép' : 'Thêm loại nghỉ phép mới'
      "
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
        label-position="left"
      >
        <el-form-item label="Tên loại nghỉ phép" prop="ten" required>
          <el-input
            v-model="form.ten"
            placeholder="Nhập tên loại nghỉ phép..."
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Nhập mô tả..."
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
import loaiNgayNghiService from '@/services/loaiNgayNghiService';
import {LoaiNgayNghi} from '@/types';

const leaveTypeList = ref<LoaiNgayNghi[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const form = reactive({
  ten: '',
  mo_ta: '',
});

const formRules: FormRules = {
  ten: [
    {
      required: true,
      message: 'Vui lòng nhập tên loại nghỉ phép',
      trigger: 'blur',
    },
    {min: 2, max: 100, message: 'Tên phải từ 2-100 ký tự', trigger: 'blur'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await loaiNgayNghiService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
    });

    leaveTypeList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading leave types:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách loại nghỉ phép';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
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

const handleEdit = (item: LoaiNgayNghi) => {
  editingId.value = item._id;
  form.ten = item.ten;
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
        await loaiNgayNghiService.update(editingId.value, form);
        ElMessage.success('Cập nhật loại nghỉ phép thành công');
      } else {
        await loaiNgayNghiService.create(form);
        ElMessage.success('Thêm loại nghỉ phép thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving leave type:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu loại nghỉ phép',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa loại nghỉ phép này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await loaiNgayNghiService.delete(id);
    ElMessage.success('Xóa loại nghỉ phép thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting leave type:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa loại nghỉ phép',
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
  form.ten = '';
  form.mo_ta = '';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-leavetype-page {
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

.orangehrm-leavetype-name {
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

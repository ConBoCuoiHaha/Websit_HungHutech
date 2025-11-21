<template>
  <div class="orangehrm-kpi-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quản lý KPI</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm KPI
        </el-button>
      </div>
    </div>

    <!-- KPI Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="kpiList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ten" label="Tên KPI" min-width="250">
          <template #default="{row}">
            <strong>{{ row.ten }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="300">
          <template #default="{row}">
            <div class="orangehrm-text-truncate">{{ row.mo_ta || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column
          prop="trong_so"
          label="Trọng số (%)"
          width="130"
          align="center"
        >
          <template #default="{row}">
            <el-tag>{{ row.trong_so }}%</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="120">
          <template #default="{row}">
            <el-tag :type="row.kich_hoat ? 'success' : 'info'" size="small">
              {{ row.kich_hoat ? 'Kích hoạt' : 'Tạm dừng' }}
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
              <el-button size="small" :icon="Edit" @click="handleEdit(row)"
                >Sửa</el-button
              >
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
      :title="editingId ? 'Chỉnh sửa KPI' : 'Thêm KPI mới'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="Tên KPI" prop="ten" required>
          <el-input
            v-model="form.ten"
            placeholder="Nhập tên KPI..."
            maxlength="200"
          />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Nhập mô tả KPI..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="Trọng số (%)" prop="trong_so" required>
          <el-input-number
            v-model="form.trong_so"
            :min="0"
            :max="100"
            :precision="0"
            style="width: 100%"
          />
          <div class="orangehrm-form-hint">
            Trọng số từ 0 đến 100%. Tổng trọng số các KPI nên bằng 100%.
          </div>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="kich_hoat" required>
          <el-switch
            v-model="form.kich_hoat"
            active-text="Kích hoạt"
            inactive-text="Tạm dừng"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Refresh, Plus, Edit, Delete} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import kpiService from '@/services/kpiService';
import {KPI} from '@/types';

const kpiList = ref<KPI[]>([]);
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
  trong_so: 0,
  kich_hoat: true,
});

const formRules: FormRules = {
  ten: [{required: true, message: 'Vui lòng nhập tên KPI', trigger: 'blur'}],
  trong_so: [
    {required: true, message: 'Vui lòng nhập trọng số', trigger: 'blur'},
    {
      type: 'number',
      min: 0,
      max: 100,
      message: 'Trọng số phải từ 0 đến 100',
      trigger: 'blur',
    },
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    const response = await kpiService.getAll(params);
    kpiList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading KPIs:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách KPI';
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

const handleEdit = (item: KPI) => {
  editingId.value = item._id;
  form.ten = item.ten;
  form.mo_ta = item.mo_ta || '';
  form.trong_so = item.trong_so;
  form.kich_hoat = item.kich_hoat;
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data = {
        ten: form.ten,
        mo_ta: form.mo_ta,
        trong_so: form.trong_so,
        kich_hoat: form.kich_hoat,
      };

      if (editingId.value) {
        await kpiService.update(editingId.value, data);
        ElMessage.success('Cập nhật KPI thành công');
      } else {
        await kpiService.create(data);
        ElMessage.success('Tạo KPI thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving KPI:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu KPI');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa KPI này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await kpiService.delete(id);
    ElMessage.success('Xóa KPI thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting KPI:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa KPI');
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
  form.trong_so = 0;
  form.kich_hoat = true;
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
.orangehrm-kpi-page {
  width: 100%;
}

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

.orangehrm-text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.orangehrm-form-hint {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

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

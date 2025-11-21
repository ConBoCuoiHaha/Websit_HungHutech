<template>
  <div class="orangehrm-holiday-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quản lý Ngày lễ</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm ngày lễ
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" class="orangehrm-filter-form">
        <el-form-item label="Năm">
          <el-select
            v-model="filters.year"
            placeholder="Chọn năm"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.status"
            placeholder="Chọn trạng thái"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Kích hoạt" value="Kích hoạt" />
            <el-option label="Không kích hoạt" value="Không kích hoạt" />
          </el-select>
        </el-form-item>

        <el-form-item label="Khu vực">
          <el-select
            v-model="filters.khu_vuc"
            placeholder="Chọn khu vực"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Toàn quốc" value="Toàn quốc" />
            <el-option label="Miền Bắc" value="Miền Bắc" />
            <el-option label="Miền Nam" value="Miền Nam" />
            <el-option label="Miền Trung" value="Miền Trung" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button :icon="RefreshLeft" @click="resetFilters">
            Đặt lại
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Holidays Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="holidayList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ten_ngay_le" label="Tên ngày lễ" min-width="250">
          <template #default="{row}">
            <strong class="orangehrm-holiday-name">{{
              row.ten_ngay_le
            }}</strong>
            <div v-if="row.mo_ta" class="orangehrm-holiday-desc">
              {{ row.mo_ta }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Ngày" width="150">
          <template #default="{row}">
            <div class="orangehrm-date-cell">
              <el-icon style="margin-right: 5px"><Calendar /></el-icon>
              {{ formatDate(row.ngay) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="khu_vuc" label="Khu vực" width="140">
          <template #default="{row}">
            <el-tag :type="getRegionTagType(row.khu_vuc)" size="small">
              {{ row.khu_vuc }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Lặp lại hàng năm" width="170" align="center">
          <template #default="{row}">
            <el-tag
              :type="row.lap_lai_hang_nam ? 'success' : 'info'"
              size="small"
            >
              {{ row.lap_lai_hang_nam ? 'Có' : 'Không' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{row}">
            <el-tag
              :type="row.trang_thai === 'Kích hoạt' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.trang_thai }}
            </el-tag>
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
      :title="editingId ? 'Chỉnh sửa ngày lễ' : 'Thêm ngày lễ mới'"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="160px"
        label-position="left"
      >
        <el-form-item label="Tên ngày lễ" prop="ten_ngay_le" required>
          <el-input
            v-model="form.ten_ngay_le"
            placeholder="Vd: Tết Nguyên Đán, Quốc Khánh..."
            maxlength="200"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày" prop="ngay" required>
              <el-date-picker
                v-model="form.ngay"
                type="date"
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Khu vực" prop="khu_vuc" required>
              <el-select
                v-model="form.khu_vuc"
                placeholder="Chọn khu vực"
                style="width: 100%"
              >
                <el-option label="Toàn quốc" value="Toàn quốc" />
                <el-option label="Miền Bắc" value="Miền Bắc" />
                <el-option label="Miền Nam" value="Miền Nam" />
                <el-option label="Miền Trung" value="Miền Trung" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Trạng thái" prop="trang_thai" required>
              <el-select
                v-model="form.trang_thai"
                placeholder="Chọn trạng thái"
                style="width: 100%"
              >
                <el-option label="Kích hoạt" value="Kích hoạt" />
                <el-option label="Không kích hoạt" value="Không kích hoạt" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Lặp lại hàng năm">
              <el-checkbox v-model="form.lap_lai_hang_nam" size="large">
                Áp dụng cho mọi năm
              </el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Nhập mô tả chi tiết về ngày lễ..."
            maxlength="500"
            show-word-limit
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
import {ref, reactive, onMounted, computed} from 'vue';
import {
  Refresh,
  Plus,
  Edit,
  Delete,
  Calendar,
  RefreshLeft,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import ngayLeService from '@/services/ngayLeService';
import {NgayLe} from '@/types';

const holidayList = ref<NgayLe[]>([]);
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

const filters = reactive({
  year: new Date().getFullYear(),
  status: '',
  khu_vuc: '',
});

const form = reactive({
  ten_ngay_le: '',
  ngay: '',
  lap_lai_hang_nam: false,
  mo_ta: '',
  khu_vuc: 'Toàn quốc',
  trang_thai: 'Kích hoạt',
});

const formRules: FormRules = {
  ten_ngay_le: [
    {required: true, message: 'Vui lòng nhập tên ngày lễ', trigger: 'blur'},
    {min: 2, max: 200, message: 'Tên phải từ 2-200 ký tự', trigger: 'blur'},
  ],
  ngay: [{required: true, message: 'Vui lòng chọn ngày', trigger: 'change'}],
  khu_vuc: [
    {required: true, message: 'Vui lòng chọn khu vực', trigger: 'change'},
  ],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

// Generate year options (current year ± 5 years)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
});

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    // Add filters to params
    if (filters.year) {
      params.year = filters.year;
    }
    if (filters.status) {
      params.trang_thai = filters.status;
    }
    if (filters.khu_vuc) {
      params.khu_vuc = filters.khu_vuc;
    }

    const response = await ngayLeService.getAll(params);

    holidayList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading holidays:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách ngày lễ';
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

const handleFilterChange = () => {
  pagination.currentPage = 1;
  loadData();
};

const resetFilters = () => {
  filters.year = new Date().getFullYear();
  filters.status = '';
  filters.khu_vuc = '';
  pagination.currentPage = 1;
  loadData();
};

const handleEdit = (item: NgayLe) => {
  editingId.value = item._id;
  form.ten_ngay_le = item.ten_ngay_le;
  form.ngay = item.ngay;
  form.lap_lai_hang_nam = item.lap_lai_hang_nam || false;
  form.mo_ta = item.mo_ta || '';
  form.khu_vuc = item.khu_vuc;
  form.trang_thai = item.trang_thai;
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data = {
        ten_ngay_le: form.ten_ngay_le,
        ngay: form.ngay,
        lap_lai_hang_nam: form.lap_lai_hang_nam,
        mo_ta: form.mo_ta,
        khu_vuc: form.khu_vuc,
        trang_thai: form.trang_thai,
      };

      if (editingId.value) {
        await ngayLeService.update(editingId.value, data);
        ElMessage.success('Cập nhật ngày lễ thành công');
      } else {
        await ngayLeService.create(data);
        ElMessage.success('Thêm ngày lễ thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving holiday:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu ngày lễ');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa ngày lễ này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await ngayLeService.delete(id);
    ElMessage.success('Xóa ngày lễ thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting holiday:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa ngày lễ');
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.ten_ngay_le = '';
  form.ngay = '';
  form.lap_lai_hang_nam = false;
  form.mo_ta = '';
  form.khu_vuc = 'Toàn quốc';
  form.trang_thai = 'Kích hoạt';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getRegionTagType = (region: string): string => {
  const tagTypes: Record<string, string> = {
    'Toàn quốc': '',
    'Miền Bắc': 'primary',
    'Miền Nam': 'success',
    'Miền Trung': 'warning',
  };
  return tagTypes[region] || 'info';
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-holiday-page {
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

.orangehrm-filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .el-form-item {
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

.orangehrm-holiday-name {
  color: $primary-color;
  font-weight: $font-weight-medium;
  font-size: $font-size-base;
  display: block;
  margin-bottom: 4px;
}

.orangehrm-holiday-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: 4px;
  line-height: 1.4;
}

.orangehrm-date-cell {
  display: flex;
  align-items: center;
  font-weight: $font-weight-medium;
  color: $text-primary;
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

// Dialog customization
:deep(.el-dialog) {
  .el-dialog__header {
    background-color: $bg-gray;
    padding: $spacing-lg;
    margin-bottom: 0;

    .el-dialog__title {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }
  }

  .el-dialog__body {
    padding: $spacing-xl;
  }

  .el-dialog__footer {
    padding: $spacing-lg $spacing-xl;
    border-top: 1px solid $border-color;
  }
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

  .orangehrm-filter-form {
    flex-direction: column;

    .el-form-item {
      width: 100%;

      .el-select,
      .el-input {
        width: 100% !important;
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

  :deep(.el-dialog) {
    width: 95% !important;
  }
}
</style>

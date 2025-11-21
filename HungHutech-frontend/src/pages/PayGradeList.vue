<template>
  <div class="orangehrm-paygrade-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Bậc lương</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm bậc lương
        </el-button>
      </div>
    </div>

    <!-- Pay Grades Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="bacLuongList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column
          prop="ten_bac_luong"
          label="Tên bậc lương"
          min-width="200"
        >
          <template #default="{row}">
            <strong class="orangehrm-paygrade-name">{{
              row.ten_bac_luong
            }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Mức lương tối thiểu" width="180" align="right">
          <template #default="{row}">
            <span class="orangehrm-salary-amount">
              {{ formatCurrency(row.muc_luong_toi_thieu, row.don_vi_tien_te) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Mức lương tối đa" width="180" align="right">
          <template #default="{row}">
            <span class="orangehrm-salary-amount">
              {{ formatCurrency(row.muc_luong_toi_da, row.don_vi_tien_te) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Đơn vị tiền tệ" width="130" align="center">
          <template #default="{row}">
            <el-tag
              :type="row.don_vi_tien_te === 'VND' ? 'success' : 'primary'"
              size="small"
            >
              {{ row.don_vi_tien_te }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="ghi_chu" label="Ghi chú" min-width="250">
          <template #default="{row}">
            {{ row.ghi_chu || '-' }}
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

    <!-- Create/Edit Pay Grade Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa bậc lương' : 'Thêm bậc lương mới'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-form-item label="Tên bậc lương" prop="ten_bac_luong" required>
          <el-input
            v-model="form.ten_bac_luong"
            placeholder="Ví dụ: Bậc 1, Junior, Senior..."
          />
        </el-form-item>

        <el-form-item label="Đơn vị tiền tệ" prop="don_vi_tien_te" required>
          <el-radio-group v-model="form.don_vi_tien_te">
            <el-radio-button value="VND">VND</el-radio-button>
            <el-radio-button value="USD">USD</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Mức lương tối thiểu" prop="muc_luong_toi_thieu">
          <el-input
            v-model.number="form.muc_luong_toi_thieu"
            type="number"
            :placeholder="
              form.don_vi_tien_te === 'VND' ? 'Ví dụ: 10000000' : 'Ví dụ: 1000'
            "
            :min="0"
          >
            <template #append>{{ form.don_vi_tien_te }}</template>
          </el-input>
          <div
            v-if="form.muc_luong_toi_thieu"
            class="orangehrm-formatted-amount"
          >
            {{ formatCurrency(form.muc_luong_toi_thieu, form.don_vi_tien_te) }}
          </div>
        </el-form-item>

        <el-form-item label="Mức lương tối đa" prop="muc_luong_toi_da">
          <el-input
            v-model.number="form.muc_luong_toi_da"
            type="number"
            :placeholder="
              form.don_vi_tien_te === 'VND' ? 'Ví dụ: 20000000' : 'Ví dụ: 2000'
            "
            :min="0"
          >
            <template #append>{{ form.don_vi_tien_te }}</template>
          </el-input>
          <div v-if="form.muc_luong_toi_da" class="orangehrm-formatted-amount">
            {{ formatCurrency(form.muc_luong_toi_da, form.don_vi_tien_te) }}
          </div>
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú về bậc lương này..."
          />
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
import bacLuongService from '@/services/bacLuongService';
import {BacLuong} from '@/types';

const bacLuongList = ref<BacLuong[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<string>('');

const form = reactive({
  ten_bac_luong: '',
  muc_luong_toi_thieu: null as number | null,
  muc_luong_toi_da: null as number | null,
  don_vi_tien_te: 'VND',
  ghi_chu: '',
});

const formRules: FormRules = {
  ten_bac_luong: [
    {required: true, message: 'Vui lòng nhập tên bậc lương', trigger: 'blur'},
  ],
  don_vi_tien_te: [
    {
      required: true,
      message: 'Vui lòng chọn đơn vị tiền tệ',
      trigger: 'change',
    },
  ],
  muc_luong_toi_thieu: [
    {
      validator: (rule, value, callback) => {
        if (value !== null && value !== undefined && value < 0) {
          callback(new Error('Mức lương không được âm'));
        } else if (
          value !== null &&
          value !== undefined &&
          form.muc_luong_toi_da !== null &&
          form.muc_luong_toi_da !== undefined &&
          value > form.muc_luong_toi_da
        ) {
          callback(
            new Error(
              'Mức lương tối thiểu không được lớn hơn mức lương tối đa',
            ),
          );
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  muc_luong_toi_da: [
    {
      validator: (rule, value, callback) => {
        if (value !== null && value !== undefined && value < 0) {
          callback(new Error('Mức lương không được âm'));
        } else if (
          value !== null &&
          value !== undefined &&
          form.muc_luong_toi_thieu !== null &&
          form.muc_luong_toi_thieu !== undefined &&
          value < form.muc_luong_toi_thieu
        ) {
          callback(
            new Error(
              'Mức lương tối đa không được nhỏ hơn mức lương tối thiểu',
            ),
          );
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await bacLuongService.getAll();
    bacLuongList.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading pay grades:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách bậc lương';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (item: BacLuong) => {
  editingId.value = item._id;
  form.ten_bac_luong = item.ten_bac_luong;
  form.muc_luong_toi_thieu = item.muc_luong_toi_thieu
    ? parseFloat(item.muc_luong_toi_thieu.toString())
    : null;
  form.muc_luong_toi_da = item.muc_luong_toi_da
    ? parseFloat(item.muc_luong_toi_da.toString())
    : null;
  form.don_vi_tien_te = item.don_vi_tien_te || 'VND';
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
        await bacLuongService.update(editingId.value, form);
        ElMessage.success('Cập nhật bậc lương thành công');
      } else {
        await bacLuongService.create(form);
        ElMessage.success('Thêm bậc lương thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving pay grade:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu bậc lương');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa bậc lương này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await bacLuongService.delete(id);
    ElMessage.success('Xóa bậc lương thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting pay grade:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa bậc lương');
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
  form.ten_bac_luong = '';
  form.muc_luong_toi_thieu = null;
  form.muc_luong_toi_da = null;
  form.don_vi_tien_te = 'VND';
  form.ghi_chu = '';
};

const formatCurrency = (amount: any, currency = 'VND') => {
  if (amount === null || amount === undefined) return '-';

  // Convert Decimal128 to number if needed
  let numAmount: number;
  if (typeof amount === 'object' && amount.$numberDecimal) {
    numAmount = parseFloat(amount.$numberDecimal);
  } else {
    numAmount = parseFloat(amount.toString());
  }

  if (isNaN(numAmount)) return '-';

  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  }
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
.orangehrm-paygrade-page {
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

// Pay Grade Display
.orangehrm-paygrade-name {
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.orangehrm-salary-amount {
  font-family: 'Roboto Mono', monospace;
  font-weight: $font-weight-medium;
  color: $success-color;
}

// Form Helpers
.orangehrm-formatted-amount {
  margin-top: 4px;
  font-size: $font-size-sm;
  color: $text-secondary;
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

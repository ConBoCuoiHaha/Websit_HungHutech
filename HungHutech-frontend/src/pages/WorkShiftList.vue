<template>
  <div class="orangehrm-workshift-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Ca làm việc</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
          Thêm ca làm việc
        </el-button>
      </div>
    </div>

    <!-- Work Shifts Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="caLamViecList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column prop="ten_ca" label="Tên ca" min-width="200">
          <template #default="{ row }">
            <strong class="orangehrm-shift-name">{{ row.ten_ca }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Thời gian" min-width="250">
          <template #default="{ row }">
            <div class="time-display">
              <el-icon><Clock /></el-icon>
              <span>{{ row.gio_bat_dau }} - {{ row.gio_ket_thuc }}</span>
              <el-tag size="small" type="info">
                {{ calculateWorkHours(row.gio_bat_dau, row.gio_ket_thuc, row.thoi_gian_nghi) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Thời gian nghỉ" width="150">
          <template #default="{ row }">
            {{ row.thoi_gian_nghi || 0 }} phút
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="250">
          <template #default="{ row }">
            {{ row.mo_ta || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{ row }">
            <el-tag :type="row.trang_thai === 'Kích hoạt' ? 'success' : 'info'">
              {{ row.trang_thai }}
            </el-tag>
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

    <!-- Create/Edit Work Shift Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc mới'"
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
        <el-form-item label="Tên ca" prop="ten_ca" required>
          <el-input
            v-model="form.ten_ca"
            placeholder="Ví dụ: Ca sáng, Ca chiều, Ca đêm"
          />
        </el-form-item>

        <el-form-item label="Giờ bắt đầu" prop="gio_bat_dau" required>
          <el-time-picker
            v-model="form.gio_bat_dau"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="Chọn giờ bắt đầu"
            style="width: 100%"
            @change="validateTimes"
          />
        </el-form-item>

        <el-form-item label="Giờ kết thúc" prop="gio_ket_thuc" required>
          <el-time-picker
            v-model="form.gio_ket_thuc"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="Chọn giờ kết thúc"
            style="width: 100%"
            @change="validateTimes"
          />
        </el-form-item>

        <el-form-item label="Thời gian nghỉ" prop="thoi_gian_nghi">
          <el-input-number
            v-model="form.thoi_gian_nghi"
            :min="0"
            :max="480"
            placeholder="0"
            style="width: 100%"
          />
          <span class="form-hint">Đơn vị: phút</span>
        </el-form-item>

        <el-form-item label="Tổng giờ làm việc">
          <el-tag type="success" size="large">
            {{ calculateWorkHours(form.gio_bat_dau, form.gio_ket_thuc, form.thoi_gian_nghi) }}
          </el-tag>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="trang_thai">
          <el-radio-group v-model="form.trang_thai">
            <el-radio label="Kích hoạt">Kích hoạt</el-radio>
            <el-radio label="Không kích hoạt">Không kích hoạt</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về ca làm việc này..."
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
import { ref, reactive, onMounted } from 'vue';
import { Refresh, Plus, Edit, Delete, Clock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import caLamViecService, { CaLamViec } from '@/services/caLamViecService';

const caLamViecList = ref<CaLamViec[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<string>('');

const form = reactive({
  ten_ca: '',
  gio_bat_dau: '',
  gio_ket_thuc: '',
  thoi_gian_nghi: 0,
  mo_ta: '',
  trang_thai: 'Kích hoạt' as 'Kích hoạt' | 'Không kích hoạt',
});

// Custom validator for end time
const validateEndTime = (rule: any, value: any, callback: any) => {
  if (!form.gio_bat_dau || !form.gio_ket_thuc) {
    callback();
    return;
  }

  const [startHour, startMin] = form.gio_bat_dau.split(':').map(Number);
  const [endHour, endMin] = form.gio_ket_thuc.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    callback(new Error('Giờ kết thúc phải sau giờ bắt đầu'));
  } else {
    callback();
  }
};

const formRules: FormRules = {
  ten_ca: [
    { required: true, message: 'Vui lòng nhập tên ca làm việc', trigger: 'blur' },
  ],
  gio_bat_dau: [
    { required: true, message: 'Vui lòng chọn giờ bắt đầu', trigger: 'change' },
  ],
  gio_ket_thuc: [
    { required: true, message: 'Vui lòng chọn giờ kết thúc', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' },
  ],
  thoi_gian_nghi: [
    { type: 'number', min: 0, message: 'Thời gian nghỉ phải lớn hơn hoặc bằng 0', trigger: 'blur' },
  ],
};

const calculateWorkHours = (startTime: string, endTime: string, breakTime: number = 0): string => {
  if (!startTime || !endTime) return '-';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) return '-';

  const totalMinutes = endMinutes - startMinutes - (breakTime || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${minutes} phút`;
};

const validateTimes = () => {
  if (formRef.value && form.gio_bat_dau && form.gio_ket_thuc) {
    formRef.value.validateField('gio_ket_thuc');
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await caLamViecService.getAll();
    caLamViecList.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading work shifts:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách ca làm việc';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (item: CaLamViec) => {
  editingId.value = item._id;
  form.ten_ca = item.ten_ca;
  form.gio_bat_dau = item.gio_bat_dau;
  form.gio_ket_thuc = item.gio_ket_thuc;
  form.thoi_gian_nghi = item.thoi_gian_nghi || 0;
  form.mo_ta = item.mo_ta || '';
  form.trang_thai = item.trang_thai;
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      if (editingId.value) {
        await caLamViecService.update(editingId.value, form);
        ElMessage.success('Cập nhật ca làm việc thành công');
      } else {
        await caLamViecService.create(form);
        ElMessage.success('Thêm ca làm việc thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving work shift:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu ca làm việc',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa ca làm việc này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await caLamViecService.delete(id);
    ElMessage.success('Xóa ca làm việc thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting work shift:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa ca làm việc',
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
  form.ten_ca = '';
  form.gio_bat_dau = '';
  form.gio_ket_thuc = '';
  form.thoi_gian_nghi = 0;
  form.mo_ta = '';
  form.trang_thai = 'Kích hoạt';
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
.orangehrm-workshift-page {
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

// Shift Display
.orangehrm-shift-name {
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: $primary-color;
  }

  span {
    font-weight: $font-weight-medium;
  }
}

// Form
.form-hint {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-left: 8px;
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

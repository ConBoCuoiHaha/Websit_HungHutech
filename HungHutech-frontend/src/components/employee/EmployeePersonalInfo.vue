<template>
  <div v-loading="loading" class="orangehrm-personal-info">
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="180px"
      label-position="left"
    >
      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Thông tin cá nhân</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Họ đệm" prop="ho_dem">
              <el-input v-model="form.ho_dem" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tên" prop="ten">
              <el-input v-model="form.ten" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Biệt danh" prop="biet_danh">
              <el-input v-model="form.biet_danh" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Mã nhân viên" prop="ma_nhan_vien">
              <el-input v-model="form.ma_nhan_vien" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày sinh" prop="ngay_sinh">
              <el-date-picker
                v-model="form.ngay_sinh"
                type="date"
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled="!isEditing"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Giới tính" prop="gioi_tinh">
              <el-select
                v-model="form.gioi_tinh"
                placeholder="Chọn giới tính"
                :disabled="!isEditing"
                style="width: 100%"
              >
                <el-option label="Nam" value="Nam" />
                <el-option label="Nữ" value="Nữ" />
                <el-option label="Khác" value="Khác" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tình trạng hôn nhân" prop="tinh_trang_hon_nhan">
              <el-select
                v-model="form.tinh_trang_hon_nhan"
                placeholder="Chọn tình trạng"
                :disabled="!isEditing"
                style="width: 100%"
              >
                <el-option label="Độc thân" value="Độc thân" />
                <el-option label="Đã kết hôn" value="Đã kết hôn" />
                <el-option label="Ly hôn" value="Ly hôn" />
                <el-option label="Góa" value="Góa" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Quốc tịch" prop="quoc_tich">
              <el-input v-model="form.quoc_tich" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Giấy tờ tùy thân</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Số CMND/CCCD" prop="so_cmnd">
              <el-input v-model="form.so_cmnd" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ngày cấp" prop="ngay_cap_cmnd">
              <el-date-picker
                v-model="form.ngay_cap_cmnd"
                type="date"
                placeholder="Chọn ngày cấp"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled="!isEditing"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nơi cấp" prop="noi_cap_cmnd">
              <el-input v-model="form.noi_cap_cmnd" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số hộ chiếu" prop="so_ho_chieu">
              <el-input v-model="form.so_ho_chieu" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-actions">
        <el-button v-if="!isEditing" type="primary" @click="isEditing = true" :icon="Edit">
          Chỉnh sửa
        </el-button>
        <template v-else>
          <el-button @click="handleCancel">Hủy</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            Lưu thay đổi
          </el-button>
        </template>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, watch} from 'vue';
import {Edit} from '@element-plus/icons-vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const formRef = ref<FormInstance>();
const isEditing = ref(false);
const saving = ref(false);

const form = reactive({
  ho_dem: '',
  ten: '',
  biet_danh: '',
  ma_nhan_vien: '',
  ngay_sinh: '',
  gioi_tinh: '',
  tinh_trang_hon_nhan: '',
  quoc_tich: 'Việt Nam',
  so_cmnd: '',
  ngay_cap_cmnd: '',
  noi_cap_cmnd: '',
  so_ho_chieu: '',
});

const formRules: FormRules = {
  ho_dem: [{required: true, message: 'Vui lòng nhập họ đệm', trigger: 'blur'}],
  ten: [{required: true, message: 'Vui lòng nhập tên', trigger: 'blur'}],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      form.ho_dem = newEmployee.ho_dem || '';
      form.ten = newEmployee.ten || '';
      form.biet_danh = newEmployee.biet_danh || '';
      form.ma_nhan_vien = newEmployee.ma_nhan_vien || '';
      form.ngay_sinh = newEmployee.ngay_sinh || '';
      form.gioi_tinh = newEmployee.gioi_tinh || '';
      form.tinh_trang_hon_nhan = newEmployee.tinh_trang_hon_nhan || '';
      form.quoc_tich = newEmployee.quoc_tich || 'Việt Nam';
      // Map nested thong_tin_ca_nhan fields
      form.so_cmnd = newEmployee.thong_tin_ca_nhan?.cmnd_cccd || '';
      // @ts-ignore
      form.ngay_cap_cmnd = (newEmployee.thong_tin_ca_nhan as any)?.ngay_cap_cmnd || '';
      // @ts-ignore
      form.noi_cap_cmnd = (newEmployee.thong_tin_ca_nhan as any)?.noi_cap_cmnd || '';
      // @ts-ignore
      form.so_ho_chieu = (newEmployee.thong_tin_ca_nhan as any)?.so_ho_chieu || '';
    }
  },
  {immediate: true},
);

const handleSave = async () => {
  if (!formRef.value || !props.employee) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      await nhanVienService.update(props.employee._id, {
        ho_dem: form.ho_dem,
        ten: form.ten,
        biet_danh: form.biet_danh,
        ngay_sinh: form.ngay_sinh,
        gioi_tinh: form.gioi_tinh,
        tinh_trang_hon_nhan: form.tinh_trang_hon_nhan,
        quoc_tich: form.quoc_tich,
        // Gui ca truong phang (giu tuong thich) va nested
        so_cmnd: form.so_cmnd,
        thong_tin_ca_nhan: {
          cmnd_cccd: form.so_cmnd,
          // @ts-ignore
          ngay_cap_cmnd: form.ngay_cap_cmnd,
          // @ts-ignore
          noi_cap_cmnd: form.noi_cap_cmnd,
          // @ts-ignore
          so_ho_chieu: form.so_ho_chieu,
        },
      });
      ElMessage.success('Cập nhật thông tin cá nhân thành công');
      isEditing.value = false;
      emit('reload');
    } catch (err: any) {
      console.error('Error updating personal info:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể cập nhật thông tin',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleCancel = () => {
  isEditing.value = false;
  if (props.employee) {
    form.ho_dem = props.employee.ho_dem || '';
    form.ten = props.employee.ten || '';
    form.biet_danh = props.employee.biet_danh || '';
    form.ngay_sinh = props.employee.ngay_sinh || '';
    form.gioi_tinh = props.employee.gioi_tinh || '';
    form.tinh_trang_hon_nhan = props.employee.tinh_trang_hon_nhan || '';
    form.quoc_tich = props.employee.quoc_tich || 'Việt Nam';
    form.so_cmnd = props.employee.so_cmnd || '';
    form.ngay_cap_cmnd = props.employee.ngay_cap_cmnd || '';
    form.noi_cap_cmnd = props.employee.noi_cap_cmnd || '';
    form.so_ho_chieu = props.employee.so_ho_chieu || '';
  }
};
</script>

<style lang="scss" scoped>
.orangehrm-personal-info {
  min-height: 400px;
}

.orangehrm-form-section {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-xl;
  border-bottom: 1px solid $border-color;

  &:last-of-type {
    border-bottom: none;
  }
}

.orangehrm-section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
}

.orangehrm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 1px solid $border-color;
}

:deep(.el-form-item) {
  margin-bottom: $spacing-lg;
}

:deep(.el-form-item__label) {
  font-weight: $font-weight-medium;
  color: $text-secondary;
}
</style>

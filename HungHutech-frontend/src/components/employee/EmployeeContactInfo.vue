<template>
  <div v-loading="loading" class="orangehrm-contact-info">
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="180px"
      label-position="left"
    >
      <!-- Address Section -->
      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Địa chỉ</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Đường 1" prop="dia_chi.duong_so_1">
              <el-input v-model="form.dia_chi.duong_so_1" :disabled="!isEditing" placeholder="Số nhà, tên đường" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Đường 2" prop="dia_chi.duong_so_2">
              <el-input v-model="form.dia_chi.duong_so_2" :disabled="!isEditing" placeholder="Số nhà, tên đường (tiếp)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Thành phố" prop="dia_chi.thanh_pho">
              <el-input v-model="form.dia_chi.thanh_pho" :disabled="!isEditing" placeholder="TP.HCM" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tỉnh/Thành" prop="dia_chi.tinh_thanh">
              <el-input v-model="form.dia_chi.tinh_thanh" :disabled="!isEditing" placeholder="Hồ Chí Minh" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Mã bưu điện" prop="dia_chi.ma_buu_dien">
              <el-input v-model="form.dia_chi.ma_buu_dien" :disabled="!isEditing" placeholder="700000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Quốc gia" prop="dia_chi.quoc_gia">
              <el-input v-model="form.dia_chi.quoc_gia" :disabled="!isEditing" placeholder="Việt Nam" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Phone Section -->
      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Điện thoại</h3>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Điện thoại nhà" prop="lien_he.dien_thoai_nha">
              <el-input v-model="form.lien_he.dien_thoai_nha" :disabled="!isEditing" placeholder="028-12345678" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Di động" prop="lien_he.di_dong">
              <el-input v-model="form.lien_he.di_dong" :disabled="!isEditing" placeholder="0901234567" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Điện thoại công việc" prop="lien_he.dien_thoai_cong_viec">
              <el-input v-model="form.lien_he.dien_thoai_cong_viec" :disabled="!isEditing" placeholder="028-87654321" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Email Section -->
      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Email</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Email công việc" prop="lien_he.email_cong_viec">
              <el-input v-model="form.lien_he.email_cong_viec" :disabled="!isEditing" type="email" placeholder="name@company.com" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email khác" prop="lien_he.email_khac">
              <el-input v-model="form.lien_he.email_khac" :disabled="!isEditing" type="email" placeholder="name@personal.com" />
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
  dia_chi: {
    duong_so_1: '',
    duong_so_2: '',
    thanh_pho: '',
    tinh_thanh: '',
    ma_buu_dien: '',
    quoc_gia: 'Việt Nam',
  },
  lien_he: {
    dien_thoai_nha: '',
    di_dong: '',
    dien_thoai_cong_viec: '',
    email_cong_viec: '',
    email_khac: '',
  },
});

const formRules: FormRules = {
  'lien_he.email_cong_viec': [
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
  'lien_he.email_khac': [
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      if (newEmployee.dia_chi) {
        form.dia_chi = {
          duong_so_1: newEmployee.dia_chi.duong_so_1 || '',
          duong_so_2: newEmployee.dia_chi.duong_so_2 || '',
          thanh_pho: newEmployee.dia_chi.thanh_pho || '',
          tinh_thanh: newEmployee.dia_chi.tinh_thanh || '',
          ma_buu_dien: newEmployee.dia_chi.ma_buu_dien || '',
          quoc_gia: newEmployee.dia_chi.quoc_gia || 'Việt Nam',
        };
      }
      if (newEmployee.lien_he) {
        form.lien_he = {
          dien_thoai_nha: newEmployee.lien_he.dien_thoai_nha || '',
          di_dong: newEmployee.lien_he.di_dong || '',
          dien_thoai_cong_viec: newEmployee.lien_he.dien_thoai_cong_viec || '',
          email_cong_viec: newEmployee.lien_he.email_cong_viec || '',
          email_khac: newEmployee.lien_he.email_khac || '',
        };
      }
    }
  },
  {immediate: true, deep: true},
);

const handleSave = async () => {
  if (!props.employee) return;
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;
    await nhanVienService.update(props.employee._id, form);
    ElMessage.success('Cập nhật thông tin liên hệ thành công');
    isEditing.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật thông tin');
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  isEditing.value = false;
  if (props.employee) {
    if (props.employee.dia_chi) {
      form.dia_chi = {...props.employee.dia_chi};
    }
    if (props.employee.lien_he) {
      form.lien_he = {...props.employee.lien_he};
    }
  }
};
</script>

<style lang="scss" scoped>
@import './employee-form-styles.scss';
</style>

<template>
  <div v-loading="loading" class="orangehrm-job-info">
    <el-form
      ref="formRef"
      :model="form"
      label-width="180px"
      label-position="left"
    >
      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Thông tin công việc</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày vào làm" prop="ngay_vao_lam">
              <el-date-picker
                v-model="form.thong_tin_cong_viec.ngay_vao_lam"
                type="date"
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled="!isEditing"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Chức danh" prop="chuc_danh_id">
              <el-select
                v-model="form.thong_tin_cong_viec.chuc_danh_id"
                placeholder="Chọn chức danh"
                :disabled="!isEditing"
                style="width: 100%"
              >
                <el-option
                  v-for="item in jobTitles"
                  :key="item._id"
                  :label="item.ten_chuc_danh"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Phòng ban" prop="phong_ban_id">
              <el-select
                v-model="form.thong_tin_cong_viec.phong_ban_id"
                placeholder="Chọn phòng ban"
                :disabled="!isEditing"
                style="width: 100%"
              >
                <el-option
                  v-for="item in departments"
                  :key="item._id"
                  :label="item.ten"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="Trạng thái lao động"
              prop="trang_thai_lao_dong_id"
            >
              <el-select
                v-model="form.thong_tin_cong_viec.trang_thai_lao_dong_id"
                placeholder="Chọn trạng thái"
                :disabled="!isEditing"
                style="width: 100%"
              >
                <el-option
                  v-for="item in employmentStatuses"
                  :key="item._id"
                  :label="item.ten"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-actions">
        <el-button
          v-if="!isEditing"
          type="primary"
          :icon="Edit"
          @click="isEditing = true"
        >
          Chỉnh sửa
        </el-button>
        <template v-else>
          <el-button @click="handleCancel">Hủy</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            Lưu thay đổi
          </el-button>
        </template>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, watch, onMounted} from 'vue';
import {Edit} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import chucDanhService from '@/services/chucDanhService';
import phongBanService from '@/services/phongBanService';
import trangThaiLaoDongService from '@/services/trangThaiLaoDongService';
import {NhanVien} from '@/types';

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const isEditing = ref(false);
const saving = ref(false);
const jobTitles = ref<any[]>([]);
const departments = ref<any[]>([]);
const employmentStatuses = ref<any[]>([]);

const form = reactive({
  thong_tin_cong_viec: {
    ngay_vao_lam: '',
    chuc_danh_id: '',
    phong_ban_id: '',
    trang_thai_lao_dong_id: '',
  },
});

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee?.thong_tin_cong_viec) {
      form.thong_tin_cong_viec = {
        ngay_vao_lam: newEmployee.thong_tin_cong_viec.ngay_vao_lam || '',
        chuc_danh_id:
          (newEmployee.thong_tin_cong_viec.chuc_danh_id as any)?._id || '',
        phong_ban_id:
          (newEmployee.thong_tin_cong_viec.phong_ban_id as any)?._id || '',
        trang_thai_lao_dong_id:
          (newEmployee.thong_tin_cong_viec.trang_thai_lao_dong_id as any)
            ?._id || '',
      };
    }
  },
  {immediate: true, deep: true},
);

const loadDropdownData = async () => {
  try {
    const [jobTitlesRes, departmentsRes, statusesRes] = await Promise.all([
      chucDanhService.getAll({limit: 1000}),
      phongBanService.getAll({limit: 1000}),
      trangThaiLaoDongService.getAll({limit: 1000}),
    ]);
    jobTitles.value = jobTitlesRes.data || [];
    departments.value = departmentsRes.data || [];
    employmentStatuses.value = statusesRes.data || [];
  } catch (err) {
    console.error('Error loading dropdown data:', err);
    jobTitles.value = [];
    departments.value = [];
    employmentStatuses.value = [];
  }
};

const handleSave = async () => {
  if (!props.employee) return;

  saving.value = true;
  try {
    await nhanVienService.update(props.employee._id, form);
    ElMessage.success('Cập nhật thông tin công việc thành công');
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
  if (props.employee?.thong_tin_cong_viec) {
    form.thong_tin_cong_viec = {...props.employee.thong_tin_cong_viec} as any;
  }
};

onMounted(() => {
  loadDropdownData();
});
</script>

<style lang="scss" scoped>
@import './employee-form-styles.scss';
</style>

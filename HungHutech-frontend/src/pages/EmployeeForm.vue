<template>
  <el-card class="orangehrm-form-card" shadow="never">
    <template #header>
      <div class="orangehrm-card-header">
        <h2 class="orangehrm-card-title">
          {{ isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới' }}
        </h2>
      </div>
    </template>

    <el-form
      ref="formRef"
      v-loading="loading"
      :model="form"
      :rules="formRules"
      label-width="150px"
      label-position="left"
    >
      <!-- Personal Information Section -->
      <div class="form-section">
        <h3 class="section-title">Thông tin cá nhân</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Họ và tên đệm" prop="ho_dem" required>
              <el-input v-model="form.ho_dem" placeholder="Nguyễn Văn" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tên" prop="ten" required>
              <el-input v-model="form.ten" placeholder="An" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Mã nhân viên" prop="ma_nhan_vien">
              <el-input v-model="form.ma_nhan_vien" placeholder="NV001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email" required>
              <el-input
                v-model="form.email"
                type="email"
                placeholder="nguyenvanan@company.com"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Số điện thoại" prop="so_dien_thoai">
              <el-input v-model="form.so_dien_thoai" placeholder="0901234567" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ngày sinh" prop="ngay_sinh">
              <el-date-picker
                v-model="form.ngay_sinh"
                type="date"
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Giới tính" prop="gioi_tinh">
              <el-radio-group v-model="form.gioi_tinh">
                <el-radio label="Nam">Nam</el-radio>
                <el-radio label="Nữ">Nữ</el-radio>
                <el-radio label="Khác">Khác</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Quốc tịch" prop="quoc_tich">
              <el-input v-model="form.quoc_tich" placeholder="Việt Nam" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ" prop="dia_chi">
          <el-input
            v-model="form.dia_chi"
            type="textarea"
            :rows="3"
            placeholder="Địa chỉ liên hệ"
          />
        </el-form-item>
      </div>

      <!-- Employment Information Section -->
      <div class="form-section">
        <h3 class="section-title">Thông tin công việc</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Phòng ban" prop="phong_ban_id" required>
              <el-select
                v-model="form.phong_ban_id"
                placeholder="Chọn phòng ban"
                style="width: 100%"
              >
                <el-option
                  v-for="dept in departments"
                  :key="dept._id"
                  :label="dept.ten"
                  :value="dept._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Chức danh" prop="chuc_danh_id" required>
              <el-select
                v-model="form.chuc_danh_id"
                placeholder="Chọn chức danh"
                style="width: 100%"
              >
                <el-option
                  v-for="title in jobTitles"
                  :key="title._id"
                  :label="title.ten_chuc_danh"
                  :value="title._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="Ngày bắt đầu"
              prop="ngay_bat_dau_lam_viec"
              required
            >
              <el-date-picker
                v-model="form.ngay_bat_dau_lam_viec"
                type="date"
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="Trạng thái"
              prop="trang_thai_lao_dong_id"
              required
            >
              <el-select
                v-model="form.trang_thai_lao_dong_id"
                placeholder="Chọn trạng thái"
                style="width: 100%"
              >
                <el-option
                  v-for="status in employmentStatuses"
                  :key="status._id"
                  :label="status.ten"
                  :value="status._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Loại hợp đồng" prop="loai_hop_dong">
              <el-select
                v-model="form.loai_hop_dong"
                placeholder="Chọn loại hợp đồng"
                style="width: 100%"
              >
                <el-option label="Thử việc" value="Thử việc" />
                <el-option label="Chính thức" value="Chính thức" />
                <el-option label="Theo hợp đồng" value="Theo hợp đồng" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Quản lý trực tiếp" prop="quan_ly_truc_tiep_id">
              <el-select
                v-model="form.quan_ly_truc_tiep_id"
                placeholder="Chọn quản lý"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="emp in supervisors"
                  :key="emp._id"
                  :label="`${emp.ho_dem} ${emp.ten}`"
                  :value="emp._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Bank Information Section -->
      <div class="form-section">
        <h3 class="section-title">Thông tin ngân hàng</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tên ngân hàng" prop="ngan_hang">
              <el-input v-model="form.ngan_hang" placeholder="Vietcombank" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số tài khoản" prop="so_tai_khoan_ngan_hang">
              <el-input
                v-model="form.so_tai_khoan_ngan_hang"
                placeholder="1234567890"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Action Buttons -->
      <div class="orangehrm-form-actions">
        <el-button @click="handleCancel">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? 'Cập nhật' : 'Thêm nhân viên' }}
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import phongBanService from '@/services/phongBanService';
import chucDanhService from '@/services/chucDanhService';
import trangThaiLaoDongService from '@/services/trangThaiLaoDongService';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();

const loading = ref(false);
const saving = ref(false);
const departments = ref<any[]>([]);
const jobTitles = ref<any[]>([]);
const employmentStatuses = ref<any[]>([]);
const supervisors = ref<any[]>([]);

const employeeId = computed(() => route.params.id as string);
const isEdit = computed(() => route.name === 'EmployeeEdit');

const form = reactive({
  ho_dem: '',
  ten: '',
  ma_nhan_vien: '',
  email: '',
  so_dien_thoai: '',
  ngay_sinh: '',
  gioi_tinh: 'Nam',
  quoc_tich: 'Việt Nam',
  dia_chi: '',
  phong_ban_id: '',
  chuc_danh_id: '',
  trang_thai_lao_dong_id: '',
  ngay_bat_dau_lam_viec: '',
  loai_hop_dong: '',
  quan_ly_truc_tiep_id: '',
  ngan_hang: '',
  so_tai_khoan_ngan_hang: '',
});

const formRules: FormRules = {
  ho_dem: [
    {required: true, message: 'Vui lòng nhập họ và tên đệm', trigger: 'blur'},
  ],
  ten: [{required: true, message: 'Vui lòng nhập tên', trigger: 'blur'}],
  email: [
    {required: true, message: 'Vui lòng nhập email', trigger: 'blur'},
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
  phong_ban_id: [
    {required: true, message: 'Vui lòng chọn phòng ban', trigger: 'change'},
  ],
  chuc_danh_id: [
    {required: true, message: 'Vui lòng chọn chức danh', trigger: 'change'},
  ],
  trang_thai_lao_dong_id: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
  ngay_bat_dau_lam_viec: [
    {required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change'},
  ],
};

const loadFormData = async () => {
  loading.value = true;
  try {
    // Load dropdown data in parallel
    const [deptRes, titleRes, statusRes, empRes] = await Promise.all([
      phongBanService.getAll({limit: 1000}),
      chucDanhService.getAll({limit: 1000}),
      trangThaiLaoDongService.getAll({limit: 1000}),
      nhanVienService.getAll({limit: 1000}),
    ]);

    departments.value = deptRes.data || [];
    jobTitles.value = titleRes.data || [];
    employmentStatuses.value = statusRes.data || [];
    supervisors.value = empRes.data || [];

    // If editing, load employee data
    if (isEdit.value) {
      const employee = await nhanVienService.getById(employeeId.value);
      Object.assign(form, {
        ho_dem: employee.ho_dem || '',
        ten: employee.ten || '',
        ma_nhan_vien: employee.ma_nhan_vien || '',
        email: employee.email || '',
        so_dien_thoai: employee.so_dien_thoai || '',
        ngay_sinh: employee.ngay_sinh?.split('T')[0] || '',
        gioi_tinh: employee.gioi_tinh || 'Nam',
        quoc_tich: employee.quoc_tich || 'Việt Nam',
        dia_chi: employee.dia_chi || '',
        phong_ban_id: employee.phong_ban_id?._id || employee.phong_ban_id || '',
        chuc_danh_id: employee.chuc_danh_id?._id || employee.chuc_danh_id || '',
        trang_thai_lao_dong_id:
          employee.trang_thai_lao_dong_id?._id ||
          employee.trang_thai_lao_dong_id ||
          '',
        ngay_bat_dau_lam_viec:
          employee.ngay_bat_dau_lam_viec?.split('T')[0] || '',
        loai_hop_dong: employee.loai_hop_dong || '',
        quan_ly_truc_tiep_id:
          employee.quan_ly_truc_tiep_id?._id ||
          employee.quan_ly_truc_tiep_id ||
          '',
        ngan_hang: employee.ngan_hang || '',
        so_tai_khoan_ngan_hang: employee.so_tai_khoan_ngan_hang || '',
      });
    }
  } catch (err: any) {
    console.error('Error loading form data:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải dữ liệu form');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    if (isEdit.value) {
      await nhanVienService.update(employeeId.value, form);
      ElMessage.success('Cập nhật nhân viên thành công');
    } else {
      await nhanVienService.create(form);
      ElMessage.success('Thêm nhân viên mới thành công');
    }

    router.push('/nhan-vien');
  } catch (err: any) {
    console.error('Error saving employee:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu thông tin nhân viên',
    );
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  router.push('/nhan-vien');
};

onMounted(() => {
  loadFormData();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-form-card {
  max-width: 1200px;
  margin: 0 auto;

  :deep(.el-card__header) {
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $border-color;
  }

  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

.orangehrm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-card-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.form-section {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $background;
  border-radius: $border-radius;

  .section-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
    margin: 0 0 $spacing-lg 0;
    padding-bottom: $spacing-md;
    border-bottom: 2px solid $primary-color;
  }
}

.orangehrm-form-actions {
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
}
</style>

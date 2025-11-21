<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? 'Cập nhật lịch phỏng vấn' : 'Tạo lịch phỏng vấn'"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="160px"
      label-position="left"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="Ứng viên" prop="ung_vien_id">
            <el-select
              v-model="formData.ung_vien_id"
              filterable
              remote
              reserve-keyword
              placeholder="Chọn ứng viên"
              :remote-method="searchCandidates"
              :loading="loadingCandidates"
              style="width: 100%"
            >
              <el-option
                v-for="item in candidateOptions"
                :key="item._id"
                :label="`${item.ho_ten} (${item.email})`"
                :value="item._id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="Vị trí tuyển dụng" prop="vi_tri_tuyen_dung_id">
            <el-select
              v-model="formData.vi_tri_tuyen_dung_id"
              filterable
              remote
              reserve-keyword
              placeholder="Chọn vị trí tuyển dụng"
              :remote-method="searchVacancies"
              :loading="loadingVacancies"
              style="width: 100%"
            >
              <el-option
                v-for="item in vacancyOptions"
                :key="item._id"
                :label="item.tieu_de"
                :value="item._id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Loại phỏng vấn" prop="loai_phong_van">
            <el-select
              v-model="formData.loai_phong_van"
              placeholder="Chọn loại"
              style="width: 100%"
            >
              <el-option label="Sơ tuyển" value="Sơ tuyển" />
              <el-option
                label="Phỏng vấn chuyên môn"
                value="Phỏng vấn chuyên môn"
              />
              <el-option label="Phỏng vấn quản lý" value="Phỏng vấn quản lý" />
              <el-option
                label="Phỏng vấn cuối cùng"
                value="Phỏng vấn cuối cùng"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Hình thức" prop="hinh_thuc">
            <el-select
              v-model="formData.hinh_thuc"
              placeholder="Chọn hình thức"
              style="width: 100%"
            >
              <el-option label="Trực tiếp" value="Trực tiếp" />
              <el-option label="Trực tuyến" value="Trực tuyến" />
              <el-option label="Điện thoại" value="Điện thoại" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Ngày phỏng vấn" prop="ngay_gio_date">
            <el-date-picker
              v-model="formData.ngay_gio_date"
              type="date"
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Giờ phỏng vấn" prop="ngay_gio_time">
            <el-time-picker
              v-model="formData.ngay_gio_time"
              placeholder="Chọn giờ"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="Địa điểm" prop="dia_diem">
            <el-input
              v-model="formData.dia_diem"
              placeholder="Nhập địa điểm phỏng vấn"
              type="textarea"
              :rows="2"
            />
          </el-form-item>
        </el-col>

        <el-col v-if="formData.hinh_thuc === 'Trực tuyến'" :span="24">
          <el-form-item label="Link phỏng vấn" prop="link_phong_van">
            <el-input
              v-model="formData.link_phong_van"
              placeholder="https://meet.google.com/xxx hoặc https://zoom.us/j/xxx"
              type="url"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="Người phỏng vấn" prop="nguoi_phong_van">
            <div class="interviewer-list">
              <div
                v-for="(interviewer, index) in formData.nguoi_phong_van"
                :key="index"
                class="interviewer-item"
              >
                <el-select
                  v-model="interviewer.nhan_vien_id"
                  filterable
                  remote
                  reserve-keyword
                  placeholder="Chọn nhân viên"
                  :remote-method="searchEmployees"
                  :loading="loadingEmployees"
                  style="flex: 1"
                >
                  <el-option
                    v-for="emp in employeeOptions"
                    :key="emp._id"
                    :label="`${emp.ho_dem} ${emp.ten}`"
                    :value="emp._id"
                  />
                </el-select>
                <el-input
                  v-model="interviewer.vai_tro"
                  placeholder="Vai trò (VD: Interviewer, Technical Lead...)"
                  style="flex: 1"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="removeInterviewer(index)"
                />
              </div>
              <el-button
                type="primary"
                :icon="Plus"
                plain
                style="width: 100%"
                @click="addInterviewer"
              >
                Thêm người phỏng vấn
              </el-button>
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="Ghi chú" prop="ghi_chu">
            <el-input
              v-model="formData.ghi_chu"
              type="textarea"
              :rows="3"
              placeholder="Nhập ghi chú cho lịch phỏng vấn..."
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? 'Cập nhật' : 'Tạo mới' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, reactive, watch, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {Plus, Delete} from '@element-plus/icons-vue';
import type {FormInstance, FormRules} from 'element-plus';
import type {Interview, Candidate, Vacancy, NhanVien} from '@/types';
import interviewService from '@/services/interviewService';
import candidateService from '@/services/candidateService';
import vacancyService from '@/services/vacancyService';
import nhanVienService from '@/services/nhanVienService';

// Props & Emits
interface Props {
  modelValue: boolean;
  interview?: Interview | null;
}

const props = withDefaults(defineProps<Props>(), {
  interview: null,
});

const emit = defineEmits(['update:modelValue', 'success']);

// State
const formRef = ref<FormInstance>();
const submitting = ref(false);
const loadingCandidates = ref(false);
const loadingVacancies = ref(false);
const loadingEmployees = ref(false);
const candidateOptions = ref<Candidate[]>([]);
const vacancyOptions = ref<Vacancy[]>([]);
const employeeOptions = ref<NhanVien[]>([]);

// Form data
const formData = reactive({
  ung_vien_id: '',
  vi_tri_tuyen_dung_id: '',
  loai_phong_van: '',
  hinh_thuc: 'Trực tiếp',
  ngay_gio_date: '',
  ngay_gio_time: '',
  dia_diem: '',
  link_phong_van: '',
  nguoi_phong_van: [] as Array<{nhan_vien_id: string; vai_tro?: string}>,
  ghi_chu: '',
});

// Validation rules
const rules = reactive<FormRules>({
  ung_vien_id: [
    {required: true, message: 'Vui lòng chọn ứng viên', trigger: 'change'},
  ],
  vi_tri_tuyen_dung_id: [
    {
      required: true,
      message: 'Vui lòng chọn vị trí tuyển dụng',
      trigger: 'change',
    },
  ],
  loai_phong_van: [
    {
      required: true,
      message: 'Vui lòng chọn loại phỏng vấn',
      trigger: 'change',
    },
  ],
  hinh_thuc: [
    {required: true, message: 'Vui lòng chọn hình thức', trigger: 'change'},
  ],
  ngay_gio_date: [
    {
      required: true,
      message: 'Vui lòng chọn ngày phỏng vấn',
      trigger: 'change',
    },
  ],
  ngay_gio_time: [
    {required: true, message: 'Vui lòng chọn giờ phỏng vấn', trigger: 'change'},
  ],
});

// Computed
const isEdit = computed(() => !!props.interview);

// Search methods
const searchCandidates = async (query: string) => {
  if (query) {
    loadingCandidates.value = true;
    try {
      const response = await candidateService.getAll({q: query, limit: 50});
      candidateOptions.value = response.items;
    } catch (err) {
      console.error('Error searching candidates:', err);
    } finally {
      loadingCandidates.value = false;
    }
  }
};

const searchVacancies = async (query: string) => {
  if (query) {
    loadingVacancies.value = true;
    try {
      const response = await vacancyService.getAll({q: query, limit: 50});
      vacancyOptions.value = response.items;
    } catch (err) {
      console.error('Error searching vacancies:', err);
    } finally {
      loadingVacancies.value = false;
    }
  }
};

const searchEmployees = async (query: string) => {
  if (query) {
    loadingEmployees.value = true;
    try {
      const response = await nhanVienService.getAll({q: query, limit: 50});
      employeeOptions.value = response.items;
    } catch (err) {
      console.error('Error searching employees:', err);
    } finally {
      loadingEmployees.value = false;
    }
  }
};

// Interviewer management
const addInterviewer = () => {
  formData.nguoi_phong_van.push({nhan_vien_id: '', vai_tro: ''});
};

const removeInterviewer = (index: number) => {
  formData.nguoi_phong_van.splice(index, 1);
};

// Form handlers
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // Combine date and time
    const ngay_gio = `${formData.ngay_gio_date}T${formData.ngay_gio_time}:00`;

    const submitData: Partial<Interview> = {
      ung_vien_id: formData.ung_vien_id,
      vi_tri_tuyen_dung_id: formData.vi_tri_tuyen_dung_id,
      loai_phong_van: formData.loai_phong_van as any,
      hinh_thuc: formData.hinh_thuc as any,
      ngay_gio,
      dia_diem: formData.dia_diem,
      link_phong_van: formData.link_phong_van,
      nguoi_phong_van: formData.nguoi_phong_van.filter((i) => i.nhan_vien_id),
      ghi_chu: formData.ghi_chu,
    };

    submitting.value = true;

    if (isEdit.value && props.interview) {
      await interviewService.update(props.interview._id, submitData);
      ElMessage.success('Cập nhật lịch phỏng vấn thành công');
    } else {
      await interviewService.create(submitData);
      ElMessage.success('Tạo lịch phỏng vấn thành công');
    }

    emit('success');
    handleClose();
  } catch (err: any) {
    if (err.response?.data?.msg) {
      ElMessage.error(err.response.data.msg);
    }
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
  Object.assign(formData, {
    ung_vien_id: '',
    vi_tri_tuyen_dung_id: '',
    loai_phong_van: '',
    hinh_thuc: 'Trực tiếp',
    ngay_gio_date: '',
    ngay_gio_time: '',
    dia_diem: '',
    link_phong_van: '',
    nguoi_phong_van: [],
    ghi_chu: '',
  });
  emit('update:modelValue', false);
};

// Watch for interview prop changes
watch(
  () => props.interview,
  (newVal) => {
    if (newVal) {
      const ngayGio = new Date(newVal.ngay_gio);
      const date = ngayGio.toISOString().split('T')[0];
      const time = ngayGio.toTimeString().slice(0, 5);

      Object.assign(formData, {
        ung_vien_id:
          typeof newVal.ung_vien_id === 'object'
            ? newVal.ung_vien_id._id
            : newVal.ung_vien_id,
        vi_tri_tuyen_dung_id:
          typeof newVal.vi_tri_tuyen_dung_id === 'object'
            ? newVal.vi_tri_tuyen_dung_id._id
            : newVal.vi_tri_tuyen_dung_id,
        loai_phong_van: newVal.loai_phong_van,
        hinh_thuc: newVal.hinh_thuc || 'Trực tiếp',
        ngay_gio_date: date,
        ngay_gio_time: time,
        dia_diem: newVal.dia_diem || '',
        link_phong_van: newVal.link_phong_van || '',
        nguoi_phong_van: newVal.nguoi_phong_van
          ? newVal.nguoi_phong_van.map((i) => ({
              nhan_vien_id:
                typeof i.nhan_vien_id === 'object'
                  ? i.nhan_vien_id._id
                  : i.nhan_vien_id,
              vai_tro: i.vai_tro || '',
            }))
          : [],
        ghi_chu: newVal.ghi_chu || '',
      });

      // Populate options
      if (typeof newVal.ung_vien_id === 'object') {
        candidateOptions.value = [newVal.ung_vien_id];
      }
      if (typeof newVal.vi_tri_tuyen_dung_id === 'object') {
        vacancyOptions.value = [newVal.vi_tri_tuyen_dung_id];
      }
    }
  },
  {immediate: true},
);
</script>

<style scoped lang="scss">
.interviewer-list {
  width: 100%;

  .interviewer-item {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }
}
</style>

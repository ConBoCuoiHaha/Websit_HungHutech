<template>
  <el-dialog
    :model-value="modelValue"
    title="Nhập kết quả phỏng vấn"
    width="900px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div v-if="interview" class="interview-result-form">
      <!-- Thông tin ứng viên -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>Thông tin phỏng vấn</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Ứng viên">
            {{ getCandidateName(interview.ung_vien_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Vị trí">
            {{ getVacancyTitle(interview.vi_tri_tuyen_dung_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Loại phỏng vấn">
            {{ interview.loai_phong_van }}
          </el-descriptions-item>
          <el-descriptions-item label="Ngày giờ">
            {{ formatDateTime(interview.ngay_gio) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Form kết quả -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="180px"
        label-position="left"
        style="margin-top: 20px"
      >
        <el-form-item label="Quyết định" prop="quyet_dinh">
          <el-radio-group v-model="formData.quyet_dinh" size="large">
            <el-radio-button value="Đậu">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              Đậu
            </el-radio-button>
            <el-radio-button value="Trượt">
              <el-icon color="#f56c6c"><CircleClose /></el-icon>
              Trượt
            </el-radio-button>
            <el-radio-button value="Chưa quyết định">
              <el-icon color="#e6a23c"><Warning /></el-icon>
              Chưa quyết định
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Điểm số" prop="diem_so">
          <div class="rating-container">
            <el-rate
              v-model="formData.diem_so"
              :max="10"
              show-score
              score-template="{value} điểm"
              size="large"
            />
          </div>
        </el-form-item>

        <el-form-item label="Đánh giá tổng quan" prop="danh_gia_tong_quan">
          <el-input
            v-model="formData.danh_gia_tong_quan"
            type="textarea"
            :rows="4"
            placeholder="Nhập đánh giá tổng quan về ứng viên..."
          />
        </el-form-item>

        <el-form-item label="Điểm mạnh" prop="diem_manh">
          <div class="tags-input-container">
            <el-tag
              v-for="(tag, index) in formData.diem_manh"
              :key="index"
              closable
              type="success"
              class="tag-item"
              @close="removeStrength(index)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisibleStrength"
              ref="inputStrengthRef"
              v-model="inputStrengthValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirmStrength"
              @blur="handleInputConfirmStrength"
            />
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              :icon="Plus"
              @click="showInputStrength"
            >
              Thêm điểm mạnh
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="Điểm yếu" prop="diem_yeu">
          <div class="tags-input-container">
            <el-tag
              v-for="(tag, index) in formData.diem_yeu"
              :key="index"
              closable
              type="warning"
              class="tag-item"
              @close="removeWeakness(index)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisibleWeakness"
              ref="inputWeaknessRef"
              v-model="inputWeaknessValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirmWeakness"
              @blur="handleInputConfirmWeakness"
            />
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              :icon="Plus"
              @click="showInputWeakness"
            >
              Thêm điểm yếu
            </el-button>
          </div>
        </el-form-item>

        <!-- Ý kiến người phỏng vấn -->
        <el-divider content-position="left"
          >Ý kiến từng người phỏng vấn</el-divider
        >

        <div
          v-for="(opinion, index) in formData.y_kien_nguoi_phong_van"
          :key="index"
          class="opinion-item"
        >
          <el-card shadow="never" class="opinion-card">
            <template #header>
              <div class="opinion-header">
                <span>
                  <el-icon><User /></el-icon>
                  {{ getInterviewerName(opinion.nhan_vien_id) }}
                </span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  @click="removeOpinion(index)"
                />
              </div>
            </template>

            <el-form-item label="Điểm đánh giá" :label-width="120">
              <el-rate
                v-model="opinion.diem"
                :max="10"
                show-score
                score-template="{value} điểm"
              />
            </el-form-item>

            <el-form-item label="Ý kiến" :label-width="120">
              <el-input
                v-model="opinion.y_kien"
                type="textarea"
                :rows="3"
                placeholder="Nhập ý kiến đánh giá..."
              />
            </el-form-item>
          </el-card>
        </div>

        <el-button
          type="primary"
          plain
          :icon="Plus"
          style="width: 100%; margin-top: 10px"
          @click="addOpinion"
        >
          Thêm ý kiến người phỏng vấn
        </el-button>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        Lưu kết quả
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, reactive, watch, nextTick} from 'vue';
import {ElMessage} from 'element-plus';
import {
  Plus,
  Delete,
  User,
  CircleCheck,
  CircleClose,
  Warning,
} from '@element-plus/icons-vue';
import type {FormInstance, FormRules} from 'element-plus';
import type {
  Interview,
  Candidate,
  Vacancy,
  NhanVien,
  InterviewerOpinion,
} from '@/types';
import interviewService from '@/services/interviewService';
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
const inputStrengthRef = ref();
const inputWeaknessRef = ref();
const inputVisibleStrength = ref(false);
const inputVisibleWeakness = ref(false);
const inputStrengthValue = ref('');
const inputWeaknessValue = ref('');
const employeeOptions = ref<NhanVien[]>([]);

// Form data
const formData = reactive({
  danh_gia_tong_quan: '',
  diem_so: 0,
  diem_manh: [] as string[],
  diem_yeu: [] as string[],
  quyet_dinh: 'Chưa quyết định' as 'Đậu' | 'Trượt' | 'Chưa quyết định',
  y_kien_nguoi_phong_van: [] as Array<{
    nhan_vien_id: string;
    y_kien?: string;
    diem?: number;
  }>,
});

// Validation rules
const rules = reactive<FormRules>({
  quyet_dinh: [
    {required: true, message: 'Vui lòng chọn quyết định', trigger: 'change'},
  ],
});

// Tags input handlers
const showInputStrength = () => {
  inputVisibleStrength.value = true;
  nextTick(() => {
    inputStrengthRef.value?.focus();
  });
};

const handleInputConfirmStrength = () => {
  if (inputStrengthValue.value) {
    formData.diem_manh.push(inputStrengthValue.value);
  }
  inputVisibleStrength.value = false;
  inputStrengthValue.value = '';
};

const removeStrength = (index: number) => {
  formData.diem_manh.splice(index, 1);
};

const showInputWeakness = () => {
  inputVisibleWeakness.value = true;
  nextTick(() => {
    inputWeaknessRef.value?.focus();
  });
};

const handleInputConfirmWeakness = () => {
  if (inputWeaknessValue.value) {
    formData.diem_yeu.push(inputWeaknessValue.value);
  }
  inputVisibleWeakness.value = false;
  inputWeaknessValue.value = '';
};

const removeWeakness = (index: number) => {
  formData.diem_yeu.splice(index, 1);
};

// Opinion management
const addOpinion = () => {
  formData.y_kien_nguoi_phong_van.push({
    nhan_vien_id: '',
    y_kien: '',
    diem: 0,
  });
};

const removeOpinion = (index: number) => {
  formData.y_kien_nguoi_phong_van.splice(index, 1);
};

// Form handlers
const handleSubmit = async () => {
  if (!formRef.value || !props.interview) return;

  try {
    await formRef.value.validate();

    const ket_qua_phong_van = {
      danh_gia_tong_quan: formData.danh_gia_tong_quan,
      diem_so: formData.diem_so,
      diem_manh: formData.diem_manh,
      diem_yeu: formData.diem_yeu,
      quyet_dinh: formData.quyet_dinh,
      y_kien_nguoi_phong_van: formData.y_kien_nguoi_phong_van.filter(
        (o) => o.nhan_vien_id,
      ),
    };

    submitting.value = true;
    await interviewService.updateResult(props.interview._id, ket_qua_phong_van);
    ElMessage.success('Lưu kết quả phỏng vấn thành công');
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
    danh_gia_tong_quan: '',
    diem_so: 0,
    diem_manh: [],
    diem_yeu: [],
    quyet_dinh: 'Chưa quyết định',
    y_kien_nguoi_phong_van: [],
  });
  emit('update:modelValue', false);
};

// Helper functions
const getCandidateName = (candidate: string | Candidate) => {
  if (typeof candidate === 'object' && candidate) {
    return candidate.ho_ten;
  }
  return '-';
};

const getVacancyTitle = (vacancy: string | Vacancy) => {
  if (typeof vacancy === 'object' && vacancy) {
    return vacancy.tieu_de;
  }
  return '-';
};

const getInterviewerName = (id: string) => {
  const employee = employeeOptions.value.find((e) => e._id === id);
  if (employee) {
    return `${employee.ho_dem} ${employee.ten}`;
  }
  return 'Chọn người phỏng vấn';
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN');
};

// Watch for interview prop changes
watch(
  () => props.interview,
  async (newVal) => {
    if (newVal) {
      // Load existing result if available
      if (newVal.ket_qua_phong_van) {
        Object.assign(formData, {
          danh_gia_tong_quan: newVal.ket_qua_phong_van.danh_gia_tong_quan || '',
          diem_so: newVal.ket_qua_phong_van.diem_so || 0,
          diem_manh: newVal.ket_qua_phong_van.diem_manh || [],
          diem_yeu: newVal.ket_qua_phong_van.diem_yeu || [],
          quyet_dinh: newVal.ket_qua_phong_van.quyet_dinh || 'Chưa quyết định',
          y_kien_nguoi_phong_van:
            newVal.ket_qua_phong_van.y_kien_nguoi_phong_van?.map((o) => ({
              nhan_vien_id:
                typeof o.nhan_vien_id === 'object'
                  ? o.nhan_vien_id._id
                  : o.nhan_vien_id,
              y_kien: o.y_kien || '',
              diem: o.diem || 0,
            })) || [],
        });
      } else {
        // Initialize with interviewers from the interview
        if (newVal.nguoi_phong_van && newVal.nguoi_phong_van.length > 0) {
          formData.y_kien_nguoi_phong_van = newVal.nguoi_phong_van.map((i) => ({
            nhan_vien_id:
              typeof i.nhan_vien_id === 'object'
                ? i.nhan_vien_id._id
                : i.nhan_vien_id,
            y_kien: '',
            diem: 0,
          }));
        }
      }

      // Load employee options
      try {
        const response = await nhanVienService.getAll({limit: 1000});
        employeeOptions.value = response.items;
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    }
  },
  {immediate: true},
);
</script>

<style scoped lang="scss">
@import '@/assets/styles/_variables.scss';

.interview-result-form {
  .info-card {
    border: 1px solid #e4e7ed;

    .card-header {
      font-weight: 600;
      color: $primary-color;
    }
  }

  .rating-container {
    display: flex;
    align-items: center;
  }

  .tags-input-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .tag-item {
      margin: 0;
    }

    .tag-input {
      width: 200px;
    }

    .button-new-tag {
      height: 28px;
    }
  }

  .opinion-item {
    margin-bottom: 15px;

    .opinion-card {
      border: 1px solid #e4e7ed;

      .opinion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;

        span {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      :deep(.el-card__body) {
        padding-top: 0;
      }

      :deep(.el-form-item) {
        margin-bottom: 15px;
      }
    }
  }
}

:deep(.el-radio-button) {
  margin-right: 10px;

  .el-radio-button__inner {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 12px 20px;
  }
}

:deep(.el-rate) {
  .el-rate__icon {
    font-size: 24px;
  }
}
</style>

<template>
  <div v-loading="loading" class="orangehrm-experience">
    <div class="orangehrm-form-section">
      <div class="section-header">
        <h3 class="orangehrm-section-title">Kinh nghiệm làm việc</h3>
        <el-button
          v-if="!isEditing"
          type="primary"
          :icon="Plus"
          size="small"
          @click="handleAdd"
        >
          Thêm kinh nghiệm
        </el-button>
      </div>

      <!-- Experience Table -->
      <el-table
        v-if="experiences.length > 0"
        :data="experiences"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="cong_ty" label="Công ty" min-width="150" />
        <el-table-column prop="chuc_danh" label="Chức danh" min-width="120" />
        <el-table-column label="Từ ngày" min-width="110">
          <template #default="scope">
            {{ formatDate(scope.row.ngay_bat_dau) }}
          </template>
        </el-table-column>
        <el-table-column label="Đến ngày" min-width="110">
          <template #default="scope">
            {{ formatDate(scope.row.ngay_ket_thuc) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="mo_ta"
          label="Mô tả"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="Thao tác" width="150" align="center">
          <template #default="scope">
            <el-button
              size="small"
              :icon="Edit"
              @click="handleEdit(scope.$index)"
            >
              Sửa
            </el-button>
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(scope.$index)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else
        description="Chưa có kinh nghiệm làm việc"
        :image-size="100"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        editIndex === -1
          ? 'Thêm kinh nghiệm làm việc'
          : 'Chỉnh sửa kinh nghiệm làm việc'
      "
      width="700px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Công ty" prop="cong_ty" required>
              <el-input v-model="form.cong_ty" placeholder="Tên công ty" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Chức danh" prop="chuc_danh" required>
              <el-input
                v-model="form.chuc_danh"
                placeholder="Vị trí công việc"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Từ ngày" prop="ngay_bat_dau" required>
              <el-date-picker
                v-model="form.ngay_bat_dau"
                type="date"
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Đến ngày" prop="ngay_ket_thuc">
              <el-date-picker
                v-model="form.ngay_ket_thuc"
                type="date"
                placeholder="Chọn ngày (để trống nếu vẫn làm)"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Mô tả công việc" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về công việc, trách nhiệm, thành tích..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editIndex === -1 ? 'Thêm' : 'Cập nhật' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, watch} from 'vue';
import {Plus, Edit, Delete} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';
import dayjs from 'dayjs';

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
const dialogVisible = ref(false);
const editIndex = ref(-1);

const experiences = ref<any[]>([]);

const form = reactive({
  cong_ty: '',
  chuc_danh: '',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  mo_ta: '',
});

const formRules: FormRules = {
  cong_ty: [
    {required: true, message: 'Vui lòng nhập tên công ty', trigger: 'blur'},
  ],
  chuc_danh: [
    {required: true, message: 'Vui lòng nhập chức danh', trigger: 'blur'},
  ],
  ngay_bat_dau: [
    {required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee?.kinh_nghiem_lam_viec) {
      experiences.value = [...newEmployee.kinh_nghiem_lam_viec];
    } else {
      experiences.value = [];
    }
  },
  {immediate: true, deep: true},
);

const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'Hiện tại';
  return dayjs(date).format('DD/MM/YYYY');
};

const handleAdd = () => {
  editIndex.value = -1;
  form.cong_ty = '';
  form.chuc_danh = '';
  form.ngay_bat_dau = '';
  form.ngay_ket_thuc = '';
  form.mo_ta = '';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const exp = experiences.value[index];
  form.cong_ty = exp.cong_ty || '';
  form.chuc_danh = exp.chuc_danh || '';
  form.ngay_bat_dau = exp.ngay_bat_dau
    ? dayjs(exp.ngay_bat_dau).format('YYYY-MM-DD')
    : '';
  form.ngay_ket_thuc = exp.ngay_ket_thuc
    ? dayjs(exp.ngay_ket_thuc).format('YYYY-MM-DD')
    : '';
  form.mo_ta = exp.mo_ta || '';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa kinh nghiệm làm việc này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedExperiences = [...experiences.value];
    updatedExperiences.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      kinh_nghiem_lam_viec: updatedExperiences,
    });
    ElMessage.success('Xóa kinh nghiệm làm việc thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa kinh nghiệm');
    }
  } finally {
    saving.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  if (!props.employee) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const updatedExperiences = [...experiences.value];

    if (editIndex.value === -1) {
      // Add new
      updatedExperiences.push({...form});
    } else {
      // Update existing
      updatedExperiences[editIndex.value] = {...form};
    }

    await nhanVienService.update(props.employee._id, {
      kinh_nghiem_lam_viec: updatedExperiences,
    });

    ElMessage.success(
      editIndex.value === -1
        ? 'Thêm kinh nghiệm thành công'
        : 'Cập nhật kinh nghiệm thành công',
    );
    dialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu thông tin');
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import './employee-form-styles.scss';

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.orangehrm-table {
  margin-top: 20px;
}
</style>

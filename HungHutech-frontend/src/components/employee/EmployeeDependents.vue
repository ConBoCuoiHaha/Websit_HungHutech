<template>
  <div v-loading="loading" class="orangehrm-dependents">
    <div class="orangehrm-form-section">
      <div class="section-header">
        <h3 class="orangehrm-section-title">Người phụ thuộc</h3>
        <el-button
          v-if="!isEditing"
          type="primary"
          :icon="Plus"
          size="small"
          @click="handleAdd"
        >
          Thêm người phụ thuộc
        </el-button>
      </div>

      <!-- Dependents Table -->
      <el-table
        v-if="dependents.length > 0"
        :data="dependents"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="ten" label="Họ và tên" min-width="150" />
        <el-table-column
          prop="moi_quan_he"
          label="Mối quan hệ"
          min-width="120"
        />
        <el-table-column label="Ngày sinh" min-width="120">
          <template #default="scope">
            {{ formatDate(scope.row.ngay_sinh) }}
          </template>
        </el-table-column>
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
        description="Chưa có người phụ thuộc"
        :image-size="100"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        editIndex === -1 ? 'Thêm người phụ thuộc' : 'Chỉnh sửa người phụ thuộc'
      "
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Họ và tên" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Nguyễn Văn A" />
        </el-form-item>

        <el-form-item label="Mối quan hệ" prop="moi_quan_he" required>
          <el-select
            v-model="form.moi_quan_he"
            placeholder="Chọn mối quan hệ"
            style="width: 100%"
          >
            <el-option label="Con" value="Con" />
            <el-option label="Vợ" value="Vợ" />
            <el-option label="Chồng" value="Chồng" />
            <el-option label="Cha" value="Cha" />
            <el-option label="Mẹ" value="Mẹ" />
            <el-option label="Anh/Chị/Em" value="Anh/Chị/Em" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

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
import profileRequestService from '@/services/profileRequestService';
import {NhanVien} from '@/types';
import dayjs from 'dayjs';

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'request-submitted', payload?: {type: string; requestId?: string}): void;
}>();

const formRef = ref<FormInstance>();
const isEditing = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editIndex = ref(-1);

const dependents = ref<any[]>([]);

const form = reactive({
  ten: '',
  moi_quan_he: '',
  ngay_sinh: '',
});

const formRules: FormRules = {
  ten: [{required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur'}],
  moi_quan_he: [
    {required: true, message: 'Vui lòng chọn mối quan hệ', trigger: 'change'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee?.nguoi_phu_thuoc) {
      dependents.value = [...newEmployee.nguoi_phu_thuoc];
    } else {
      dependents.value = [];
    }
  },
  {immediate: true, deep: true},
);

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

const handleAdd = () => {
  editIndex.value = -1;
  form.ten = '';
  form.moi_quan_he = '';
  form.ngay_sinh = '';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const dep = dependents.value[index];
  form.ten = dep.ten || '';
  form.moi_quan_he = dep.moi_quan_he || '';
  form.ngay_sinh = dep.ngay_sinh
    ? dayjs(dep.ngay_sinh).format('YYYY-MM-DD')
    : '';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Ban co chac chan muon xoa nguoi phu thuoc nay?',
      'Xac nhan xoa',
      {
        confirmButtonText: 'Xoa',
        cancelButtonText: 'Huy',
        type: 'warning',
      },
    );

    saving.value = true;
    const request = await profileRequestService.create({
      type: 'dependents',
      payload: {
        action: 'delete',
        index,
      },
    });
    ElMessage.success(
      'Đã gửi yêu cầu xóa người phụ thuộc, vui lòng chờ HR phê duyệt',
    );
    emit('request-submitted', {type: 'dependents', requestId: request?._id});
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể gửi yêu cầu xóa người phụ thuộc',
      );
    }
  } finally {
    saving.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value || !props.employee) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    const payload: any = {
      action: editIndex.value === -1 ? 'add' : 'update',
      dependent: {...form},
    };
    if (payload.action === 'update') {
      payload.index = editIndex.value;
    }

    const request = await profileRequestService.create({
      type: 'dependents',
      payload,
    });
    ElMessage.success(
      editIndex.value === -1
        ? 'Da gui yeu cau them nguoi phu thuoc, vui long cho HR phe duyet'
        : 'Da gui yeu cau cap nhat nguoi phu thuoc, vui long cho HR phe duyet',
    );
    dialogVisible.value = false;
    emit('request-submitted', {type: 'dependents', requestId: request?._id});
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể gửi yêu cầu');
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

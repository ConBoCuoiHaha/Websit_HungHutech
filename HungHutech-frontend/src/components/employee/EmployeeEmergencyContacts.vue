<template>
  <div v-loading="loading" class="orangehrm-emergency-contacts">
    <div class="section-header">
      <h3 class="orangehrm-section-title">Liên hệ khẩn cấp</h3>
      <el-button type="primary" @click="handleAdd" :icon="Plus" size="small">
        Thêm liên hệ
      </el-button>
    </div>

    <el-table
      v-if="contacts.length > 0"
      :data="contacts"
      border
      class="orangehrm-table"
    >
      <el-table-column prop="ten" label="Họ tên" min-width="180" />
      <el-table-column prop="moi_quan_he" label="Mối quan hệ" width="150">
        <template #default="scope">
          <el-tag>{{ scope.row.moi_quan_he }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="dien_thoai_nha" label="ĐT nhà" width="130" />
      <el-table-column prop="di_dong" label="Di động" width="130" />
      <el-table-column prop="dien_thoai_cong_viec" label="ĐT công việc" width="130" />
      <el-table-column label="Thao tác" width="150" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.$index)" :icon="Edit">
            Sửa
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index)" :icon="Delete">
            Xóa
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="Chưa có thông tin liên hệ khẩn cấp" :image-size="100" />

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editIndex === -1 ? 'Thêm liên hệ khẩn cấp' : 'Chỉnh sửa liên hệ khẩn cấp'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Họ tên" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Họ và tên người liên hệ" />
        </el-form-item>

        <el-form-item label="Mối quan hệ" prop="moi_quan_he" required>
          <el-select v-model="form.moi_quan_he" placeholder="Chọn mối quan hệ" style="width: 100%">
            <el-option label="Cha" value="Cha" />
            <el-option label="Mẹ" value="Mẹ" />
            <el-option label="Vợ/Chồng" value="Vợ/Chồng" />
            <el-option label="Con" value="Con" />
            <el-option label="Anh/Chị/Em" value="Anh/Chị/Em" />
            <el-option label="Bạn" value="Bạn" />
            <el-option label="Người thân" value="Người thân" />
            <el-option label="Đồng nghiệp" value="Đồng nghiệp" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-form-item label="ĐT nhà" prop="dien_thoai_nha">
          <el-input v-model="form.dien_thoai_nha" placeholder="Số điện thoại nhà" />
        </el-form-item>

        <el-form-item label="Di động" prop="di_dong" required>
          <el-input v-model="form.di_dong" placeholder="Số điện thoại di động" />
        </el-form-item>

        <el-form-item label="ĐT công việc" prop="dien_thoai_cong_viec">
          <el-input v-model="form.dien_thoai_cong_viec" placeholder="Số điện thoại công việc" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
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

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const editIndex = ref(-1);
const saving = ref(false);
const contacts = ref<any[]>([]);

const form = reactive({
  ten: '',
  moi_quan_he: '',
  dien_thoai_nha: '',
  di_dong: '',
  dien_thoai_cong_viec: '',
});

const formRules: FormRules = {
  ten: [{required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur'}],
  moi_quan_he: [{required: true, message: 'Vui lòng chọn mối quan hệ', trigger: 'change'}],
  di_dong: [{required: true, message: 'Vui lòng nhập số di động', trigger: 'blur'}],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      contacts.value = [...(newEmployee.lien_he_khan_cap || [])];
    } else {
      contacts.value = [];
    }
  },
  {immediate: true, deep: true},
);

const handleAdd = () => {
  editIndex.value = -1;
  form.ten = '';
  form.moi_quan_he = '';
  form.dien_thoai_nha = '';
  form.di_dong = '';
  form.dien_thoai_cong_viec = '';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const contact = contacts.value[index];
  form.ten = contact.ten || '';
  form.moi_quan_he = contact.moi_quan_he || '';
  form.dien_thoai_nha = contact.dien_thoai_nha || '';
  form.di_dong = contact.di_dong || '';
  form.dien_thoai_cong_viec = contact.dien_thoai_cong_viec || '';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin liên hệ này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    );

    const updatedContacts = [...contacts.value];
    updatedContacts.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      lien_he_khan_cap: updatedContacts,
    });
    ElMessage.success('Xóa liên hệ khẩn cấp thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa liên hệ khẩn cấp');
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

    const updatedContacts = [...contacts.value];

    if (editIndex.value === -1) {
      updatedContacts.push({...form});
    } else {
      updatedContacts[editIndex.value] = {...form};
    }

    await nhanVienService.update(props.employee._id, {
      lien_he_khan_cap: updatedContacts,
    });

    ElMessage.success(
      editIndex.value === -1 ? 'Thêm liên hệ khẩn cấp thành công' : 'Cập nhật liên hệ khẩn cấp thành công'
    );
    dialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu liên hệ khẩn cấp');
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
  margin-bottom: 20px;
}

.orangehrm-section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-table {
  margin-top: 20px;
}
</style>

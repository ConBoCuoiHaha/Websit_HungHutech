<template>
  <div v-loading="loading" class="orangehrm-memberships">
    <div class="section-header">
      <h3 class="orangehrm-section-title">Thành viên tổ chức/Hội</h3>
      <el-button type="primary" @click="handleAdd" :icon="Plus" size="small">
        Thêm thành viên
      </el-button>
    </div>

    <el-table
      v-if="memberships.length > 0"
      :data="memberships"
      border
      class="orangehrm-table"
    >
      <el-table-column prop="to_chuc" label="Tổ chức/Hội" min-width="200" />
      <el-table-column prop="loai_thanh_vien" label="Loại thành viên" width="150">
        <template #default="scope">
          <el-tag>{{ scope.row.loai_thanh_vien }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ma_thanh_vien" label="Mã thành viên" width="130" />
      <el-table-column label="Thời gian" min-width="180">
        <template #default="scope">
          {{ formatDate(scope.row.ngay_bat_dau) }} - {{ scope.row.ngay_ket_thuc ? formatDate(scope.row.ngay_ket_thuc) : 'Hiện tại' }}
        </template>
      </el-table-column>
      <el-table-column label="Phí thành viên" width="150" align="right">
        <template #default="scope">
          {{ formatCurrency(scope.row.phi_thanh_vien, scope.row.don_vi_tien_te) }}
        </template>
      </el-table-column>
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

    <el-empty v-else description="Chưa có thông tin thành viên tổ chức" :image-size="100" />

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editIndex === -1 ? 'Thêm thành viên' : 'Chỉnh sửa thành viên'"
      width="650px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
      >
        <el-form-item label="Tổ chức/Hội" prop="to_chuc" required>
          <el-input v-model="form.to_chuc" placeholder="Tên tổ chức, hội, hiệp hội" />
        </el-form-item>

        <el-form-item label="Loại thành viên" prop="loai_thanh_vien" required>
          <el-select v-model="form.loai_thanh_vien" placeholder="Chọn loại thành viên" style="width: 100%">
            <el-option label="Thành viên" value="Thành viên" />
            <el-option label="Hội viên" value="Hội viên" />
            <el-option label="Cộng tác viên" value="Cộng tác viên" />
            <el-option label="Thành viên danh dự" value="Thành viên danh dự" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-form-item label="Mã thành viên" prop="ma_thanh_vien">
          <el-input v-model="form.ma_thanh_vien" placeholder="Mã số thành viên" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày bắt đầu" prop="ngay_bat_dau">
              <el-date-picker
                v-model="form.ngay_bat_dau"
                type="date"
                placeholder="Ngày gia nhập"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ngày kết thúc" prop="ngay_ket_thuc">
              <el-date-picker
                v-model="form.ngay_ket_thuc"
                type="date"
                placeholder="Ngày kết thúc"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Phí thành viên" prop="phi_thanh_vien">
              <el-input-number
                v-model="form.phi_thanh_vien"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Đơn vị tiền tệ" prop="don_vi_tien_te">
              <el-select v-model="form.don_vi_tien_te" placeholder="Chọn loại tiền" style="width: 100%">
                <el-option label="VND" value="VND" />
                <el-option label="USD" value="USD" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
import dayjs from 'dayjs';

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
const memberships = ref<any[]>([]);

const form = reactive({
  to_chuc: '',
  loai_thanh_vien: '',
  ma_thanh_vien: '',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  phi_thanh_vien: 0,
  don_vi_tien_te: 'VND',
});

const formRules: FormRules = {
  to_chuc: [{required: true, message: 'Vui lòng nhập tên tổ chức', trigger: 'blur'}],
  loai_thanh_vien: [{required: true, message: 'Vui lòng chọn loại thành viên', trigger: 'change'}],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      memberships.value = [...(newEmployee.thanh_vien_to_chuc || [])];
    } else {
      memberships.value = [];
    }
  },
  {immediate: true, deep: true},
);

const handleAdd = () => {
  editIndex.value = -1;
  form.to_chuc = '';
  form.loai_thanh_vien = '';
  form.ma_thanh_vien = '';
  form.ngay_bat_dau = '';
  form.ngay_ket_thuc = '';
  form.phi_thanh_vien = 0;
  form.don_vi_tien_te = 'VND';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const membership = memberships.value[index];
  form.to_chuc = membership.to_chuc || '';
  form.loai_thanh_vien = membership.loai_thanh_vien || '';
  form.ma_thanh_vien = membership.ma_thanh_vien || '';
  form.ngay_bat_dau = membership.ngay_bat_dau || '';
  form.ngay_ket_thuc = membership.ngay_ket_thuc || '';
  form.phi_thanh_vien = Number(membership.phi_thanh_vien?.$numberDecimal || membership.phi_thanh_vien || 0);
  form.don_vi_tien_te = membership.don_vi_tien_te || 'VND';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin thành viên này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    );

    const updatedMemberships = [...memberships.value];
    updatedMemberships.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      thanh_vien_to_chuc: updatedMemberships,
    });
    ElMessage.success('Xóa thành viên tổ chức thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa thành viên tổ chức');
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

    const updatedMemberships = [...memberships.value];

    if (editIndex.value === -1) {
      updatedMemberships.push({...form});
    } else {
      updatedMemberships[editIndex.value] = {...form};
    }

    await nhanVienService.update(props.employee._id, {
      thanh_vien_to_chuc: updatedMemberships,
    });

    ElMessage.success(
      editIndex.value === -1 ? 'Thêm thành viên tổ chức thành công' : 'Cập nhật thành viên tổ chức thành công'
    );
    dialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu thành viên tổ chức');
  } finally {
    saving.value = false;
  }
};

const formatDate = (date: any) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

const formatCurrency = (amount: any, currency: string) => {
  const num = Number(amount?.$numberDecimal || amount || 0);
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
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

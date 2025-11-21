<template>
  <div v-loading="loading" class="orangehrm-salary-info">
    <div class="orangehrm-form-section">
      <div class="section-header">
        <h3 class="orangehrm-section-title">Thông tin lương</h3>
        <el-button
          v-if="!isEditing"
          type="primary"
          :icon="Plus"
          size="small"
          @click="handleAdd"
        >
          Thêm lương
        </el-button>
      </div>

      <!-- Salary Table -->
      <el-table
        v-if="salaries.length > 0"
        :data="salaries"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="ten_luong" label="Loại lương" min-width="150" />
        <el-table-column label="Số tiền" min-width="150" align="right">
          <template #default="scope">
            {{ formatCurrency(scope.row.so_tien, scope.row.don_vi_tien_te) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="ky_tra_luong"
          label="Kỳ trả lương"
          min-width="120"
        />
        <el-table-column
          prop="ghi_chu"
          label="Ghi chú"
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
        description="Chưa có thông tin lương"
        :image-size="100"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        editIndex === -1 ? 'Thêm thông tin lương' : 'Chỉnh sửa thông tin lương'
      "
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Loại lương" prop="ten_luong" required>
          <el-select
            v-model="form.ten_luong"
            placeholder="Chọn loại lương"
            style="width: 100%"
          >
            <el-option label="Lương cơ bản" value="Lương cơ bản" />
            <el-option label="Phụ cấp ăn trưa" value="Phụ cấp ăn trưa" />
            <el-option label="Phụ cấp xăng xe" value="Phụ cấp xăng xe" />
            <el-option label="Phụ cấp điện thoại" value="Phụ cấp điện thoại" />
            <el-option label="Phụ cấp nhà ở" value="Phụ cấp nhà ở" />
            <el-option label="Thưởng hiệu suất" value="Thưởng hiệu suất" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="Số tiền" prop="so_tien" required>
              <el-input-number
                v-model="form.so_tien"
                :min="0"
                :step="100000"
                :precision="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Đơn vị" prop="don_vi_tien_te" required>
              <el-select v-model="form.don_vi_tien_te" style="width: 100%">
                <el-option label="VND" value="VND" />
                <el-option label="USD" value="USD" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Kỳ trả lương" prop="ky_tra_luong" required>
          <el-select
            v-model="form.ky_tra_luong"
            placeholder="Chọn kỳ trả lương"
            style="width: 100%"
          >
            <el-option label="Hàng tháng" value="Hàng tháng" />
            <el-option label="Hàng quý" value="Hàng quý" />
            <el-option label="Hàng năm" value="Hàng năm" />
            <el-option label="Một lần" value="Một lần" />
          </el-select>
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú về khoản lương này"
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

const salaries = ref<any[]>([]);

const form = reactive({
  ten_luong: '',
  so_tien: 0,
  don_vi_tien_te: 'VND',
  ky_tra_luong: 'Hàng tháng',
  ghi_chu: '',
});

const formRules: FormRules = {
  ten_luong: [
    {required: true, message: 'Vui lòng chọn loại lương', trigger: 'change'},
  ],
  so_tien: [
    {required: true, message: 'Vui lòng nhập số tiền', trigger: 'blur'},
  ],
  don_vi_tien_te: [
    {
      required: true,
      message: 'Vui lòng chọn đơn vị tiền tệ',
      trigger: 'change',
    },
  ],
  ky_tra_luong: [
    {required: true, message: 'Vui lòng chọn kỳ trả lương', trigger: 'change'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee?.luong) {
      salaries.value = [...newEmployee.luong];
    } else {
      salaries.value = [];
    }
  },
  {immediate: true, deep: true},
);

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

const handleAdd = () => {
  editIndex.value = -1;
  form.ten_luong = '';
  form.so_tien = 0;
  form.don_vi_tien_te = 'VND';
  form.ky_tra_luong = 'Hàng tháng';
  form.ghi_chu = '';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const salary = salaries.value[index];
  form.ten_luong = salary.ten_luong || '';
  form.so_tien = Number(salary.so_tien?.$numberDecimal || salary.so_tien || 0);
  form.don_vi_tien_te = salary.don_vi_tien_te || 'VND';
  form.ky_tra_luong = salary.ky_tra_luong || 'Hàng tháng';
  form.ghi_chu = salary.ghi_chu || '';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin lương này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedSalaries = [...salaries.value];
    updatedSalaries.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      luong: updatedSalaries,
    });
    ElMessage.success('Xóa thông tin lương thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa thông tin lương',
      );
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

    const updatedSalaries = [...salaries.value];

    if (editIndex.value === -1) {
      // Add new
      updatedSalaries.push({...form});
    } else {
      // Update existing
      updatedSalaries[editIndex.value] = {...form};
    }

    await nhanVienService.update(props.employee._id, {
      luong: updatedSalaries,
    });

    ElMessage.success(
      editIndex.value === -1
        ? 'Thêm thông tin lương thành công'
        : 'Cập nhật thông tin lương thành công',
    );
    dialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu thông tin lương');
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

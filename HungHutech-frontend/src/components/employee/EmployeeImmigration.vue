<template>
  <div v-loading="loading" class="orangehrm-immigration">
    <div class="section-header">
      <h3 class="orangehrm-section-title">Thông tin xuất nhập cảnh</h3>
      <el-button type="primary" :icon="Plus" size="small" @click="handleAdd">
        Thêm giấy tờ
      </el-button>
    </div>

    <el-table
      v-if="documents.length > 0"
      :data="documents"
      border
      class="orangehrm-table"
    >
      <el-table-column
        prop="loai_giay_to"
        label="Loại giấy tờ"
        min-width="150"
      />
      <el-table-column prop="so_giay_to" label="Số giấy tờ" min-width="150" />
      <el-table-column label="Ngày cấp" width="120">
        <template #default="scope">
          {{ formatDate(scope.row.ngay_cap) }}
        </template>
      </el-table-column>
      <el-table-column label="Ngày hết hạn" width="120">
        <template #default="scope">
          {{ formatDate(scope.row.ngay_het_han) }}
        </template>
      </el-table-column>
      <el-table-column prop="quoc_gia_cap" label="Quốc gia cấp" width="130" />
      <el-table-column label="Trạng thái" width="130">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.trang_thai)">{{
            scope.row.trang_thai
          }}</el-tag>
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
      description="Chưa có thông tin xuất nhập cảnh"
      :image-size="100"
    />

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editIndex === -1 ? 'Thêm giấy tờ' : 'Chỉnh sửa giấy tờ'"
      width="650px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
      >
        <el-form-item label="Loại giấy tờ" prop="loai_giay_to" required>
          <el-select
            v-model="form.loai_giay_to"
            placeholder="Chọn loại giấy tờ"
            style="width: 100%"
          >
            <el-option label="Hộ chiếu" value="Hộ chiếu" />
            <el-option label="Visa" value="Visa" />
            <el-option label="Thẻ xanh (Green Card)" value="Thẻ xanh" />
            <el-option label="Giấy phép lao động" value="Giấy phép lao động" />
            <el-option label="Giấy phép cư trú" value="Giấy phép cư trú" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-form-item label="Số giấy tờ" prop="so_giay_to" required>
          <el-input
            v-model="form.so_giay_to"
            placeholder="Số hộ chiếu/visa/giấy phép"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày cấp" prop="ngay_cap">
              <el-date-picker
                v-model="form.ngay_cap"
                type="date"
                placeholder="Chọn ngày cấp"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ngày hết hạn" prop="ngay_het_han">
              <el-date-picker
                v-model="form.ngay_het_han"
                type="date"
                placeholder="Chọn ngày hết hạn"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Quốc gia cấp" prop="quoc_gia_cap">
          <el-input
            v-model="form.quoc_gia_cap"
            placeholder="Ví dụ: Việt Nam, USA, Singapore"
          />
        </el-form-item>

        <el-form-item label="Trạng thái" prop="trang_thai" required>
          <el-select
            v-model="form.trang_thai"
            placeholder="Chọn trạng thái"
            style="width: 100%"
          >
            <el-option label="Còn hiệu lực" value="Còn hiệu lực" />
            <el-option label="Hết hạn" value="Hết hạn" />
            <el-option label="Đang xử lý" value="Đang xử lý" />
          </el-select>
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú thêm"
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

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const editIndex = ref(-1);
const saving = ref(false);
const documents = ref<any[]>([]);

const form = reactive({
  loai_giay_to: '',
  so_giay_to: '',
  ngay_cap: '',
  ngay_het_han: '',
  quoc_gia_cap: '',
  trang_thai: '',
  ghi_chu: '',
});

const formRules: FormRules = {
  loai_giay_to: [
    {required: true, message: 'Vui lòng chọn loại giấy tờ', trigger: 'change'},
  ],
  so_giay_to: [
    {required: true, message: 'Vui lòng nhập số giấy tờ', trigger: 'blur'},
  ],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      documents.value = [...(newEmployee.xuat_nhap_canh || [])];
    } else {
      documents.value = [];
    }
  },
  {immediate: true, deep: true},
);

const handleAdd = () => {
  editIndex.value = -1;
  form.loai_giay_to = '';
  form.so_giay_to = '';
  form.ngay_cap = '';
  form.ngay_het_han = '';
  form.quoc_gia_cap = 'Việt Nam';
  form.trang_thai = '';
  form.ghi_chu = '';
  dialogVisible.value = true;
};

const handleEdit = (index: number) => {
  editIndex.value = index;
  const doc = documents.value[index];
  form.loai_giay_to = doc.loai_giay_to || '';
  form.so_giay_to = doc.so_giay_to || '';
  form.ngay_cap = doc.ngay_cap || '';
  form.ngay_het_han = doc.ngay_het_han || '';
  form.quoc_gia_cap = doc.quoc_gia_cap || '';
  form.trang_thai = doc.trang_thai || '';
  form.ghi_chu = doc.ghi_chu || '';
  dialogVisible.value = true;
};

const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa giấy tờ này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedDocs = [...documents.value];
    updatedDocs.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      xuat_nhap_canh: updatedDocs,
    });
    ElMessage.success('Xóa giấy tờ thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa giấy tờ');
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

    const updatedDocs = [...documents.value];

    if (editIndex.value === -1) {
      updatedDocs.push({...form});
    } else {
      updatedDocs[editIndex.value] = {...form};
    }

    await nhanVienService.update(props.employee._id, {
      xuat_nhap_canh: updatedDocs,
    });

    ElMessage.success(
      editIndex.value === -1
        ? 'Thêm giấy tờ thành công'
        : 'Cập nhật giấy tờ thành công',
    );
    dialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu giấy tờ');
  } finally {
    saving.value = false;
  }
};

const formatDate = (date: any) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    'Còn hiệu lực': 'success',
    'Hết hạn': 'danger',
    'Đang xử lý': 'warning',
  };
  return typeMap[status] || '';
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

<template>
  <div class="doc-page">
    <div class="page-header">
      <div>
        <h1>Hồ sơ nhân sự</h1>
        <p>
          Quản lý tài liệu theo từng ngăn hồ sơ (Lao động, BHXH, Nội bộ, Pháp
          lý).
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog"
        >Tải tài liệu</el-button
      >
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form inline>
        <el-form-item label="Nhân viên">
          <el-select
            v-model="filters.nhan_vien_id"
            filterable
            placeholder="Tất cả"
            style="width: 220px"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngăn hồ sơ">
          <el-select
            v-model="filters.folder"
            placeholder="Tất cả"
            style="width: 200px"
          >
            <el-option
              v-for="option in folderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Từ khóa">
          <el-input
            v-model="filters.q"
            placeholder="Tên tài liệu..."
            clearable
            :prefix-icon="Search"
            @keyup.enter.native="applyFilters"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">Lọc</el-button>
          <el-button @click="resetFilters">Xóa lọc</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="documents"
        :empty-text="loading ? 'Đang tải...' : 'Chưa có tài liệu'"
        stripe
      >
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div class="emp-info">
              <strong>{{ row.nhan_vien_id?.ma_nhan_vien }}</strong>
              <span>{{ formatEmployee(row.nhan_vien_id) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="tieu_de" label="Tên tài liệu" min-width="220" />
        <el-table-column label="Ngăn hồ sơ" width="160">
          <template #default="{row}">
            <el-tag type="info">{{ folderLabel(row.folder) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Hiệu lực" min-width="200">
          <template #default="{row}">
            <span v-if="row.ngay_hieu_luc">
              {{ formatDate(row.ngay_hieu_luc) }} -
              {{
                row.ngay_het_han
                  ? formatDate(row.ngay_het_han)
                  : 'Không xác định'
              }}
            </span>
            <span v-else>---</span>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="180" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="View" @click="preview(row)"
                >Xem</el-button
              >
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDelete(row._id)"
              >
                Xóa
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          layout="total, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDialog" title="Tải tài liệu" width="520px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Nhân viên" prop="nhan_vien_id">
          <el-select
            v-model="form.nhan_vien_id"
            filterable
            placeholder="Chọn nhân viên"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngăn hồ sơ" prop="folder">
          <el-select v-model="form.folder" placeholder="Chọn ngăn">
            <el-option
              v-for="option in folderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Tiêu đề" prop="tieu_de">
          <el-input
            v-model="form.tieu_de"
            placeholder="VD: Hợp đồng thử việc"
          />
        </el-form-item>
        <el-form-item label="Đường dẫn file" prop="file_url">
          <el-input
            v-model="form.file_url"
            placeholder="URL tài liệu hoặc đường dẫn upload"
          />
        </el-form-item>
        <el-form-item label="Hiệu lực">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="Đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Mô tả">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            rows="3"
            placeholder="Ghi chú thêm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate"
          >Lưu tài liệu</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import {Plus, Search, View, Delete} from '@element-plus/icons-vue';
import employeeDocumentService, {
  type EmployeeDocument,
  type DocumentFolder,
} from '@/services/employeeDocumentService';
import nhanVienService from '@/services/nhanVienService';
import type {NhanVien, PaginatedResponse} from '@/types';

const folderOptions: Array<{label: string; value: DocumentFolder}> = [
  {label: 'Hồ sơ lao động', value: 'ho_so_lao_dong'},
  {label: 'Hồ sơ BHXH', value: 'ho_so_bhxh'},
  {label: 'Hồ sơ nội bộ', value: 'ho_so_noi_bo'},
  {label: 'Hồ sơ pháp lý', value: 'ho_so_phap_ly'},
];

const filters = reactive({
  nhan_vien_id: '',
  folder: '',
  q: '',
});

const documents = ref<EmployeeDocument[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const saving = ref(false);
const pagination = reactive({page: 1, limit: 10, total: 0});
const showDialog = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  nhan_vien_id: '',
  folder: '' as DocumentFolder | '',
  tieu_de: '',
  file_url: '',
  mo_ta: '',
  dateRange: [] as string[] | [],
});

const formRules: FormRules = {
  nhan_vien_id: [
    {required: true, message: 'Chọn nhân viên', trigger: 'change'},
  ],
  folder: [{required: true, message: 'Chọn ngăn hồ sơ', trigger: 'change'}],
  tieu_de: [{required: true, message: 'Nhập tiêu đề', trigger: 'blur'}],
  file_url: [
    {required: true, message: 'Nhập đường dẫn tài liệu', trigger: 'blur'},
  ],
};

const loadEmployees = async () => {
  const res = await nhanVienService.getAll({page: 1, limit: 200});
  employees.value = res.data || [];
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      q: filters.q || undefined,
      nhan_vien_id: filters.nhan_vien_id || undefined,
      folder: filters.folder || undefined,
    };
    const res: PaginatedResponse<EmployeeDocument> =
      await employeeDocumentService.getAll(params);
    documents.value = res.data || [];
    pagination.total = res.pagination?.total || 0;
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tải tài liệu');
  } finally {
    loading.value = false;
  }
};

const formatEmployee = (employee?: NhanVien | string) => {
  if (!employee || typeof employee === 'string') return '';
  return `${employee.ho_dem || ''} ${employee.ten || ''}`.trim();
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
};

const folderLabel = (folder: string) => {
  return folderOptions.find((opt) => opt.value === folder)?.label || folder;
};

const applyFilters = () => {
  pagination.page = 1;
  loadDocuments();
};

const resetFilters = () => {
  filters.q = '';
  filters.folder = '';
  filters.nhan_vien_id = '';
  applyFilters();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadDocuments();
};

const openDialog = () => {
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  form.nhan_vien_id = '';
  form.folder = '';
  form.tieu_de = '';
  form.file_url = '';
  form.mo_ta = '';
  form.dateRange = [];
};

const handleCreate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await employeeDocumentService.create({
        nhan_vien_id: form.nhan_vien_id,
        folder: form.folder || 'ho_so_lao_dong',
        tieu_de: form.tieu_de,
        file_url: form.file_url,
        mo_ta: form.mo_ta,
        ngay_hieu_luc: form.dateRange[0],
        ngay_het_han: form.dateRange[1],
      });
      ElMessage.success('Đã thêm tài liệu');
      closeDialog();
      loadDocuments();
    } catch (err: any) {
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu tài liệu');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('Xóa tài liệu này?', 'Xác nhận', {
      type: 'warning',
    });
    await employeeDocumentService.delete(id);
    ElMessage.success('Đã xóa tài liệu');
    loadDocuments();
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(err.response?.data?.msg || 'Không thể xóa tài liệu');
  }
};

const preview = (doc: EmployeeDocument) => {
  if (doc.file_url) {
    window.open(doc.file_url, '_blank');
  }
};

onMounted(() => {
  loadEmployees();
  loadDocuments();
});
</script>

<style scoped lang="scss">
.doc-page {
  width: 100%;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;

  h1 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
  }

  p {
    margin: $spacing-xs 0 0;
    color: $text-secondary;
  }
}
.filter-card {
  margin-bottom: $spacing-lg;
}
.emp-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-md;
}
</style>

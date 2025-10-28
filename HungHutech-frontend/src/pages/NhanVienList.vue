<template>
  <div class="orangehrm-employee-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Danh sách Nhân viên</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
          Thêm nhân viên
        </el-button>
      </div>
    </div>

    <!-- Search & Filters -->
    <el-card class="orangehrm-search-card" shadow="never">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="Tìm kiếm theo tên, mã nhân viên..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="filterChucDanh"
            placeholder="Lọc theo chức danh"
            clearable
            style="width: 100%"
          >
            <el-option label="Tất cả chức danh" value="" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="filterPhongBan"
            placeholder="Lọc theo phòng ban"
            clearable
            style="width: 100%"
          >
            <el-option label="Tất cả phòng ban" value="" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Employee Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="nhanVienList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column label="Ảnh" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar_url ? uploadService.getFileUrl(row.avatar_url) : undefined">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="ma_nhan_vien" label="Mã NV" min-width="120">
          <template #default="{ row }">
            <strong class="orangehrm-employee-id">{{ row.ma_nhan_vien }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Họ và tên" min-width="200">
          <template #default="{ row }">
            <div class="orangehrm-employee-name">
              <span class="orangehrm-name-primary">
                {{ row.ho_dem }} {{ row.ten }}
              </span>
              <span v-if="row.biet_danh" class="orangehrm-name-nickname">
                ({{ row.biet_danh }})
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Email" min-width="200">
          <template #default="{ row }">
            {{ row.lien_he?.email_cong_viec || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Số điện thoại" min-width="150">
          <template #default="{ row }">
            {{ row.lien_he?.di_dong || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Chức danh" min-width="150">
          <template #default="{ row }">
            {{
              row.thong_tin_cong_viec?.chuc_danh_id?.ten_chuc_danh ||
              '-'
            }}
          </template>
        </el-table-column>

        <el-table-column label="Phòng ban" min-width="150">
          <template #default="{ row }">
            {{
              row.thong_tin_cong_viec?.phong_ban_id?.ten ||
              '-'
            }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button
                size="small"
                :icon="View"
                @click="handleView(row._id)"
              >
                Xem
              </el-button>
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

      <!-- Pagination -->
      <div class="orangehrm-pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create Employee Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="Thêm nhân viên mới"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
        label-position="left"
      >
        <el-divider content-position="left">Thông tin cơ bản</el-divider>

        <el-form-item label="Mã nhân viên" prop="ma_nhan_vien" required>
          <el-input
            v-model="form.ma_nhan_vien"
            placeholder="Nhập mã nhân viên"
          />
        </el-form-item>

        <el-form-item label="Họ đệm" prop="ho_dem" required>
          <el-input v-model="form.ho_dem" placeholder="Nhập họ đệm" />
        </el-form-item>

        <el-form-item label="Tên" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Nhập tên" />
        </el-form-item>

        <el-form-item label="Biệt danh" prop="biet_danh">
          <el-input v-model="form.biet_danh" placeholder="Nhập biệt danh (nếu có)" />
        </el-form-item>

        <el-divider content-position="left">Thông tin liên hệ</el-divider>

        <el-form-item label="Email công việc" prop="lien_he.email_cong_viec">
          <el-input
            v-model="form.lien_he.email_cong_viec"
            type="email"
            placeholder="email@congty.com"
          />
        </el-form-item>

        <el-form-item label="Số điện thoại" prop="lien_he.di_dong">
          <el-input
            v-model="form.lien_he.di_dong"
            placeholder="Nhập số điện thoại"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" @click="handleCreate" :loading="saving">
          Lưu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {
  Search,
  Refresh,
  Plus,
  View,
  Delete,
  User,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import uploadService from '@/services/uploadService';
import {NhanVien} from '@/types';

const router = useRouter();

const nhanVienList = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const createFormRef = ref<FormInstance>();

const searchQuery = ref('');
const filterChucDanh = ref('');
const filterPhongBan = ref('');

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const form = reactive({
  ma_nhan_vien: '',
  ho_dem: '',
  ten: '',
  biet_danh: '',
  lien_he: {
    email_cong_viec: '',
    di_dong: '',
  },
});

const formRules: FormRules = {
  ma_nhan_vien: [
    {required: true, message: 'Vui lòng nhập mã nhân viên', trigger: 'blur'},
  ],
  ho_dem: [
    {required: true, message: 'Vui lòng nhập họ đệm', trigger: 'blur'},
  ],
  ten: [
    {required: true, message: 'Vui lòng nhập tên', trigger: 'blur'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await nhanVienService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
      q: searchQuery.value,
    });

    nhanVienList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading employees:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách nhân viên';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadData();
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
  loadData();
};

const handleCreate = async () => {
  if (!createFormRef.value) return;

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      await nhanVienService.create(form);
      ElMessage.success('Thêm nhân viên thành công');
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error creating employee:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể tạo nhân viên',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleView = (id: string) => {
  router.push(`/nhan-vien/${id}`);
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa nhân viên này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await nhanVienService.delete(id);
    ElMessage.success('Xóa nhân viên thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting employee:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa nhân viên',
      );
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  resetForm();
};

const resetForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
  form.ma_nhan_vien = '';
  form.ho_dem = '';
  form.ten = '';
  form.biet_danh = '';
  form.lien_he.email_cong_viec = '';
  form.lien_he.di_dong = '';
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-employee-page {
  width: 100%;
}

// Page Header
.orangehrm-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.orangehrm-page-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-page-actions {
  display: flex;
  gap: $spacing-sm;
}

// Search Card
.orangehrm-search-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Table Card
.orangehrm-table-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    font-size: $font-size-base;

    th.el-table__cell {
      background-color: $bg-gray;
      color: $text-primary;
      font-weight: $font-weight-medium;
      text-transform: uppercase;
      font-size: $font-size-sm;
      letter-spacing: 0.5px;
    }

    .el-table__row:hover {
      background-color: rgba($primary-color, 0.05);
    }
  }
}

// Employee Display
.orangehrm-employee-id {
  color: $primary-color;
  font-weight: $font-weight-medium;
}

.orangehrm-employee-name {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs / 2;
}

.orangehrm-name-primary {
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.orangehrm-name-nickname {
  color: $text-secondary;
  font-size: $font-size-sm;
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

// Responsive
@media (max-width: 768px) {
  .orangehrm-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .orangehrm-page-actions {
    width: 100%;

    .el-button {
      flex: 1;
    }
  }

  .orangehrm-pagination {
    justify-content: center;
    padding: $spacing-md;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>

<template>
  <div class="orangehrm-location-list">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Quản lý Địa điểm</h2>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            Thêm Địa điểm
          </el-button>
        </div>
      </template>

      <!-- Search -->
      <div class="orangehrm-filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="Tìm kiếm địa điểm..."
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              Tìm kiếm
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- Locations Table -->
      <el-table
        v-loading="loading"
        :data="locationList"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="ten" label="Tên địa điểm" min-width="200" />
        <el-table-column prop="thanh_pho" label="Thành phố" min-width="150" />
        <el-table-column prop="quoc_gia" label="Quốc gia" min-width="120" />
        <el-table-column
          prop="so_dien_thoai"
          label="Số điện thoại"
          min-width="130"
        />
        <el-table-column label="Số nhân viên" width="120" align="center">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.so_nhan_vien || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="180" align="center">
          <template #default="scope">
            <el-button size="small" :icon="Edit" @click="handleEdit(scope.row)">
              Sửa
            </el-button>
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(scope.row)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="orangehrm-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'"
      width="700px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Tên địa điểm" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Tên văn phòng, chi nhánh" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Thành phố" prop="thanh_pho">
              <el-input v-model="form.thanh_pho" placeholder="TP.HCM" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Quốc gia" prop="quoc_gia">
              <el-input v-model="form.quoc_gia" placeholder="Việt Nam" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ" prop="dia_chi">
          <el-input
            v-model="form.dia_chi"
            type="textarea"
            :rows="2"
            placeholder="Địa chỉ chi tiết"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Mã bưu điện" prop="ma_buu_dien">
              <el-input v-model="form.ma_buu_dien" placeholder="700000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số điện thoại" prop="so_dien_thoai">
              <el-input
                v-model="form.so_dien_thoai"
                placeholder="028-12345678"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input
                v-model="form.email"
                type="email"
                placeholder="office@company.com"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Fax" prop="fax">
              <el-input v-model="form.fax" placeholder="028-87654321" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Thông tin bổ sung về địa điểm"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editMode ? 'Cập nhật' : 'Thêm mới' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Plus, Edit, Delete, Search} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import diaDiemService from '@/services/diaDiemService';

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);

const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const locationList = ref<any[]>([]);

const form = reactive({
  ten: '',
  thanh_pho: '',
  quoc_gia: 'Việt Nam',
  dia_chi: '',
  ma_buu_dien: '',
  so_dien_thoai: '',
  email: '',
  fax: '',
  ghi_chu: '',
  _id: '',
});

const formRules: FormRules = {
  ten: [
    {required: true, message: 'Vui lòng nhập tên địa điểm', trigger: 'blur'},
  ],
  email: [{type: 'email', message: 'Email không hợp lệ', trigger: 'blur'}],
};

const loadLocations = async () => {
  loading.value = true;
  try {
    const response = await diaDiemService.getAll({
      page: currentPage.value,
      limit: pageSize.value,
      q: searchQuery.value,
    });
    locationList.value = response.data || [];
    total.value = response.total || 0;
  } catch (err: any) {
    console.error('Error loading locations:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách địa điểm',
    );
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  editMode.value = false;
  form.ten = '';
  form.thanh_pho = '';
  form.quoc_gia = 'Việt Nam';
  form.dia_chi = '';
  form.ma_buu_dien = '';
  form.so_dien_thoai = '';
  form.email = '';
  form.fax = '';
  form.ghi_chu = '';
  form._id = '';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  editMode.value = true;
  form.ten = row.ten || '';
  form.thanh_pho = row.thanh_pho || '';
  form.quoc_gia = row.quoc_gia || 'Việt Nam';
  form.dia_chi = row.dia_chi || '';
  form.ma_buu_dien = row.ma_buu_dien || '';
  form.so_dien_thoai = row.so_dien_thoai || '';
  form.email = row.email || '';
  form.fax = row.fax || '';
  form.ghi_chu = row.ghi_chu || '';
  form._id = row._id;
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa địa điểm "${row.ten}"?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await diaDiemService.delete(row._id);
    ElMessage.success('Xóa địa điểm thành công');
    loadLocations();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa địa điểm');
    }
  }
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const data = {
      ten: form.ten,
      thanh_pho: form.thanh_pho,
      quoc_gia: form.quoc_gia,
      dia_chi: form.dia_chi,
      ma_buu_dien: form.ma_buu_dien,
      so_dien_thoai: form.so_dien_thoai,
      email: form.email,
      fax: form.fax,
      ghi_chu: form.ghi_chu,
    };

    if (editMode.value) {
      await diaDiemService.update(form._id, data);
      ElMessage.success('Cập nhật địa điểm thành công');
    } else {
      await diaDiemService.create(data);
      ElMessage.success('Thêm địa điểm mới thành công');
    }

    dialogVisible.value = false;
    loadLocations();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu địa điểm');
  } finally {
    saving.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadLocations();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadLocations();
};

const handleCurrentChange = () => {
  loadLocations();
};

onMounted(() => {
  loadLocations();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-location-list {
  padding: $spacing-xl;
}

.orangehrm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orangehrm-card-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-filter-section {
  margin-top: $spacing-lg;
}

.orangehrm-table {
  width: 100%;
}

.orangehrm-pagination {
  margin-top: $spacing-xl;
  display: flex;
  justify-content: flex-end;
}
</style>

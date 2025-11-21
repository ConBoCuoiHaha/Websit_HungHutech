<template>
  <div class="orangehrm-project-list">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Quản lý Dự án</h2>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            Thêm Dự án
          </el-button>
        </div>
      </template>

      <!-- Search and Filter -->
      <div class="orangehrm-filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="Tìm kiếm dự án..."
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

      <!-- Projects Table -->
      <el-table
        v-loading="loading"
        :data="projectList"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="ten" label="Tên dự án" min-width="200" />
        <el-table-column prop="khach_hang" label="Khách hàng" min-width="150" />
        <el-table-column
          prop="mo_ta"
          label="Mô tả"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column label="Trạng thái" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.trang_thai)">
              {{ scope.row.trang_thai }}
            </el-tag>
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
      :title="editMode ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Tên dự án" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Nhập tên dự án" />
        </el-form-item>

        <el-form-item label="Khách hàng" prop="khach_hang">
          <el-input v-model="form.khach_hang" placeholder="Tên khách hàng" />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về dự án"
          />
        </el-form-item>

        <el-form-item label="Trạng thái" prop="trang_thai" required>
          <el-select
            v-model="form.trang_thai"
            placeholder="Chọn trạng thái"
            style="width: 100%"
          >
            <el-option label="Đang hoạt động" value="Đang hoạt động" />
            <el-option label="Hoàn thành" value="Hoàn thành" />
            <el-option label="Tạm dừng" value="Tạm dừng" />
            <el-option label="Hủy" value="Hủy" />
          </el-select>
        </el-form-item>

        <el-form-item label="Quản lý dự án" prop="quan_ly_du_an_id">
          <el-select
            v-model="form.quan_ly_du_an_id"
            placeholder="Chọn quản lý dự án"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
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
import projectService from '@/services/projectService';
import nhanVienService from '@/services/nhanVienService';

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);

const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const projectList = ref<any[]>([]);
const employees = ref<any[]>([]);

const form = reactive({
  ten: '',
  khach_hang: '',
  mo_ta: '',
  trang_thai: 'Hoạt động',
  quan_ly_du_an_id: '',
  _id: '',
});

const formRules: FormRules = {
  ten: [{required: true, message: 'Vui lòng nhập tên dự án', trigger: 'blur'}],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

const loadProjects = async () => {
  loading.value = true;
  try {
    const response = await projectService.getAll({
      page: currentPage.value,
      limit: pageSize.value,
      q: searchQuery.value,
    });
    projectList.value = response.data || [];
    total.value = response.total || 0;
  } catch (err: any) {
    console.error('Error loading projects:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải danh sách dự án');
  } finally {
    loading.value = false;
  }
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 1000});
    employees.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading employees:', err);
  }
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'Hoạt động': 'success',
    'Đang hoạt động': 'success',
    'Hoàn thành': 'info',
    'Tạm dừng': 'warning',
    Hủy: 'danger',
  };
  return statusMap[status] || 'info';
};

const handleAdd = () => {
  editMode.value = false;
  form.ten = '';
  form.khach_hang = '';
  form.mo_ta = '';
  form.trang_thai = 'Hoạt động';
  form.quan_ly_du_an_id = '';
  form._id = '';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  editMode.value = true;
  form.ten = row.ten || '';
  form.khach_hang = row.khach_hang || '';
  form.mo_ta = row.mo_ta || '';
  form.trang_thai = row.trang_thai || 'Hoạt động';
  form.quan_ly_du_an_id =
    row.quan_ly_du_an_id?._id || row.quan_ly_du_an_id || '';
  form._id = row._id;
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa dự án "${row.ten}"?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await projectService.delete(row._id);
    ElMessage.success('Xóa dự án thành công');
    loadProjects();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa dự án');
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
      khach_hang: form.khach_hang,
      mo_ta: form.mo_ta,
      trang_thai: form.trang_thai,
      quan_ly_du_an_id: form.quan_ly_du_an_id || undefined,
    };

    if (editMode.value) {
      await projectService.update(form._id, data);
      ElMessage.success('Cập nhật dự án thành công');
    } else {
      await projectService.create(data);
      ElMessage.success('Thêm dự án mới thành công');
    }

    dialogVisible.value = false;
    loadProjects();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu dự án');
  } finally {
    saving.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadProjects();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadProjects();
};

const handleCurrentChange = () => {
  loadProjects();
};

onMounted(() => {
  loadProjects();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-project-list {
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

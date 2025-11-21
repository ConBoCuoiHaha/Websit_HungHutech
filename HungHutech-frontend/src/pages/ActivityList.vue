<template>
  <div class="orangehrm-activity-list">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Quản lý Hoạt động</h2>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            Thêm Hoạt động
          </el-button>
        </div>
      </template>

      <!-- Filter -->
      <div class="orangehrm-filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-select
              v-model="filterProject"
              placeholder="Lọc theo dự án"
              clearable
              filterable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option
                v-for="project in projects"
                :key="project._id"
                :label="project.ten_du_an"
                :value="project._id"
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="Tìm kiếm hoạt động..."
              :prefix-icon="Search"
              clearable
              @clear="handleFilter"
              @keyup.enter="handleFilter"
            />
          </el-col>
        </el-row>
      </div>

      <!-- Activities Table -->
      <el-table
        v-loading="loading"
        :data="activityList"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column label="Dự án" min-width="150">
          <template #default="scope">
            {{ scope.row.project_id?.ten || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="ten" label="Tên hoạt động" min-width="200" />
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
      :title="editMode ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động mới'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Dự án" prop="project_id" required>
          <el-select
            v-model="form.project_id"
            placeholder="Chọn dự án"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="project in projects"
              :key="project._id"
              :label="project.ten"
              :value="project._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Tên hoạt động" prop="ten" required>
          <el-input v-model="form.ten" placeholder="Nhập tên hoạt động" />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="4"
            placeholder="Mô tả chi tiết về hoạt động"
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
import activityService from '@/services/activityService';
import projectService from '@/services/projectService';

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);

const searchQuery = ref('');
const filterProject = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const activityList = ref<any[]>([]);
const projects = ref<any[]>([]);

const form = reactive({
  project_id: '',
  ten: '',
  mo_ta: '',
  trang_thai: 'Đang hoạt động',
  _id: '',
});

const formRules: FormRules = {
  project_id: [
    {required: true, message: 'Vui lòng chọn dự án', trigger: 'change'},
  ],
  ten: [
    {required: true, message: 'Vui lòng nhập tên hoạt động', trigger: 'blur'},
  ],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

const loadActivities = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      q: searchQuery.value,
    };

    if (filterProject.value) {
      params.project_id = filterProject.value;
    }

    const response = await activityService.getAll(params);
    activityList.value = response.data || [];
    total.value = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading activities:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách hoạt động',
    );
  } finally {
    loading.value = false;
  }
};

const loadProjects = async () => {
  try {
    const response = await projectService.getAll({limit: 1000});
    projects.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading projects:', err);
  }
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'Đang hoạt động': 'success',
    'Hoàn thành': 'info',
    'Tạm dừng': 'warning',
  };
  return statusMap[status] || 'info';
};

const handleAdd = () => {
  editMode.value = false;
  form.project_id = '';
  form.ten = '';
  form.mo_ta = '';
  form.trang_thai = 'Đang hoạt động';
  form._id = '';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  editMode.value = true;
  form.project_id = row.project_id?._id || row.project_id || '';
  form.ten = row.ten || '';
  form.mo_ta = row.mo_ta || '';
  form.trang_thai = row.trang_thai || 'Đang hoạt động';
  form._id = row._id;
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hoạt động "${row.ten}"?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await activityService.delete(row._id);
    ElMessage.success('Xóa hoạt động thành công');
    loadActivities();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa hoạt động');
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
      project_id: form.project_id,
      ten: form.ten,
      mo_ta: form.mo_ta,
      trang_thai: form.trang_thai,
    };

    if (editMode.value) {
      await activityService.update(form._id, data);
      ElMessage.success('Cập nhật hoạt động thành công');
    } else {
      await activityService.create(data);
      ElMessage.success('Thêm hoạt động mới thành công');
    }

    dialogVisible.value = false;
    loadActivities();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu hoạt động');
  } finally {
    saving.value = false;
  }
};

const handleFilter = () => {
  currentPage.value = 1;
  loadActivities();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadActivities();
};

const handleCurrentChange = () => {
  loadActivities();
};

onMounted(() => {
  loadActivities();
  loadProjects();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-activity-list {
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

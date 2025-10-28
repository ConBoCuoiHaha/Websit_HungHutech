<template>
  <div class="orangehrm-user-list">
    <el-card shadow="never">
      <template #header>
        <div class="orangehrm-card-header">
          <h2 class="orangehrm-card-title">Quản lý Người dùng</h2>
          <el-button type="primary" @click="handleAdd" :icon="Plus">
            Thêm Người dùng
          </el-button>
        </div>
      </template>

      <!-- Search and Filter -->
      <div class="orangehrm-filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="Tìm kiếm người dùng..."
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filterRole"
              placeholder="Lọc theo vai trò"
              clearable
              @change="handleSearch"
              style="width: 100%"
            >
              <el-option label="Admin" value="admin" />
              <el-option label="Quản lý" value="manager" />
              <el-option label="Nhân viên" value="employee" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleSearch" :icon="Search">
              Tìm kiếm
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- Users Table -->
      <el-table
        v-loading="loading"
        :data="userList"
        border
        class="orangehrm-table"
        style="margin-top: 20px"
      >
        <el-table-column prop="email" label="Email" min-width="200" />
        <el-table-column label="Nhân viên liên kết" min-width="180">
          <template #default="scope">
            <span v-if="scope.row.nhan_vien_id">
              {{ scope.row.nhan_vien_id.ho_dem }} {{ scope.row.nhan_vien_id.ten }}
            </span>
            <el-tag v-else type="info" size="small">Chưa liên kết</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Vai trò" width="120">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)">
              {{ getRoleLabel(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.active ? 'success' : 'danger'">
              {{ scope.row.active ? 'Hoạt động' : 'Khóa' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="200" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)" :icon="Edit">
              Sửa
            </el-button>
            <el-button
              size="small"
              :type="scope.row.active ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.active ? 'Khóa' : 'Mở' }}
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
      :title="editMode ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="Email" prop="email" required>
          <el-input v-model="form.email" type="email" placeholder="user@company.com" :disabled="editMode" />
        </el-form-item>

        <el-form-item label="Vai trò" prop="role" required>
          <el-select v-model="form.role" placeholder="Chọn vai trò" style="width: 100%">
            <el-option label="Admin" value="admin" />
            <el-option label="Quản lý" value="manager" />
            <el-option label="Nhân viên" value="employee" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="!editMode" label="Mật khẩu" prop="password" required>
          <el-input v-model="form.password" type="password" placeholder="Mật khẩu" show-password />
        </el-form-item>

        <el-form-item v-if="!editMode" label="Xác nhận MK" prop="confirmPassword" required>
          <el-input v-model="form.confirmPassword" type="password" placeholder="Nhập lại mật khẩu" show-password />
        </el-form-item>

        <el-form-item label="Nhân viên" prop="nhan_vien_id">
          <el-select
            v-model="form.nhan_vien_id"
            placeholder="Liên kết với nhân viên"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ho_dem} ${emp.ten} (${emp.ma_nhan_vien})`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="active">
          <el-switch v-model="form.active" active-text="Hoạt động" inactive-text="Khóa" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ editMode ? 'Cập nhật' : 'Thêm mới' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Plus, Edit, Search} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import userService from '@/services/userService';
import nhanVienService from '@/services/nhanVienService';

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);

const searchQuery = ref('');
const filterRole = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const userList = ref<any[]>([]);
const employees = ref<any[]>([]);

const form = reactive({
  email: '',
  role: 'employee',
  password: '',
  confirmPassword: '',
  nhan_vien_id: '',
  active: true,
  _id: '',
});

const validatePassword = (rule: any, value: any, callback: any) => {
  if (!editMode.value && !value) {
    callback(new Error('Vui lòng nhập mật khẩu'));
  } else if (!editMode.value && value.length < 6) {
    callback(new Error('Mật khẩu phải có ít nhất 6 ký tự'));
  } else {
    callback();
  }
};

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (!editMode.value && !value) {
    callback(new Error('Vui lòng xác nhận mật khẩu'));
  } else if (!editMode.value && value !== form.password) {
    callback(new Error('Mật khẩu không khớp'));
  } else {
    callback();
  }
};

const formRules: FormRules = {
  email: [
    {required: true, message: 'Vui lòng nhập email', trigger: 'blur'},
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
  role: [{required: true, message: 'Vui lòng chọn vai trò', trigger: 'change'}],
  password: [{validator: validatePassword, trigger: 'blur'}],
  confirmPassword: [{validator: validateConfirmPassword, trigger: 'blur'}],
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      q: searchQuery.value,
    };

    if (filterRole.value) {
      params.role = filterRole.value;
    }

    const response = await userService.getAll(params);
    userList.value = response.data || [];
    total.value = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading users:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải danh sách người dùng');
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

const getRoleType = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'danger',
    manager: 'warning',
    employee: 'info',
  };
  return roleMap[role] || 'info';
};

const getRoleLabel = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    manager: 'Quản lý',
    employee: 'Nhân viên',
  };
  return roleMap[role] || role;
};

const handleAdd = () => {
  editMode.value = false;
  form.email = '';
  form.role = 'employee';
  form.password = '';
  form.confirmPassword = '';
  form.nhan_vien_id = '';
  form.active = true;
  form._id = '';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  editMode.value = true;
  form.email = row.email || '';
  form.role = row.role || 'employee';
  form.nhan_vien_id = row.nhan_vien_id?._id || row.nhan_vien_id || '';
  form.active = row.active !== undefined ? row.active : true;
  form._id = row._id;
  dialogVisible.value = true;
};

const handleToggleStatus = async (row: any) => {
  try {
    const employeeName = row.nhan_vien_id ? `${row.nhan_vien_id.ho_dem} ${row.nhan_vien_id.ten}` : row.email;
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn ${row.active ? 'khóa' : 'mở khóa'} người dùng "${employeeName}"?`,
      'Xác nhận',
      {
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    );

    await userService.update(row._id, {active: !row.active});
    ElMessage.success(`${row.active ? 'Khóa' : 'Mở khóa'} người dùng thành công`);
    loadUsers();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật trạng thái');
    }
  }
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const data: any = {
      email: form.email,
      role: form.role,
      nhan_vien_id: form.nhan_vien_id || undefined,
      active: form.active,
    };

    if (!editMode.value) {
      data.password = form.password;
    }

    if (editMode.value) {
      await userService.update(form._id, data);
      ElMessage.success('Cập nhật người dùng thành công');
    } else {
      await userService.create(data);
      ElMessage.success('Thêm người dùng mới thành công');
    }

    dialogVisible.value = false;
    loadUsers();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lưu người dùng');
  } finally {
    saving.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadUsers();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadUsers();
};

const handleCurrentChange = () => {
  loadUsers();
};

onMounted(() => {
  loadUsers();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables.scss";

.orangehrm-user-list {
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

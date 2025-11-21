<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Offboarding - Quản lý nghỉ việc</h2>
        <p>Theo dõi quy trình bàn giao và checklist khi nhân viên rời công ty.</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Tạo yêu cầu
      </el-button>
    </div>

    <el-card shadow="never" class="mb-lg">
      <el-form :inline="true" :model="filters">
        <el-form-item label="Trạng thái">
          <el-select v-model="filters.status" placeholder="Tất cả" @change="loadData">
            <el-option label="Tất cả" value="" />
            <el-option label="Chờ xử lý" value="Pending" />
            <el-option label="Đang thực hiện" value="InProgress" />
            <el-option label="Hoàn thành" value="Completed" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="offboardingItems" v-loading="loading" border @row-click="handleRowClick">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{ row }">
            <div>
              <strong>{{ getEmployeeName(row.nhan_vien_id) }}</strong>
              <div class="sub">Mã NV: {{ getEmployeeCode(row.nhan_vien_id) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Ngày làm việc cuối" width="160">
          <template #default="{ row }">
            {{ formatDate(row.last_working_day) }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="Lý do" min-width="200" show-overflow-tooltip />
        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="drawerVisible" size="50%" :title="drawerTitle">
      <div v-if="selectedRequest">
        <el-descriptions :column="1" border class="mb-lg">
          <el-descriptions-item label="Nhân viên">
            {{ getEmployeeName(selectedRequest.nhan_vien_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Mã nhân viên">
            {{ getEmployeeCode(selectedRequest.nhan_vien_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Ngày làm việc cuối">
            {{ formatDate(selectedRequest.last_working_day) }}
          </el-descriptions-item>
          <el-descriptions-item label="Lý do">
            {{ selectedRequest.reason || '---' }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="statusTag(selectedRequest.status)">
              {{ statusLabel(selectedRequest.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="task-actions">
          <el-select v-model="selectedStatus" placeholder="Cập nhật trạng thái" size="small">
            <el-option label="Chờ xử lý" value="Pending" />
            <el-option label="Đang thực hiện" value="InProgress" />
            <el-option label="Hoàn thành" value="Completed" />
          </el-select>
          <el-button type="primary" size="small" @click="handleUpdateStatus" :disabled="!selectedStatus">
            Cập nhật
          </el-button>
        </div>

        <h3>Checklist tác vụ</h3>
        <el-table :data="selectedRequest.tasks" border>
          <el-table-column label="Tác vụ" min-width="220" prop="name" />
          <el-table-column label="Bộ phận" min-width="160" prop="department" />
          <el-table-column label="Hạn hoàn thành" width="150">
            <template #default="{ row }">
              {{ formatDate(row.due_date) }}
            </template>
          </el-table-column>
          <el-table-column label="Trạng thái" width="150">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Ghi chú" min-width="200">
            <template #default="{ row }">
              <el-input
                v-model="row.tempNote"
                type="textarea"
                :rows="2"
                :placeholder="row.note || 'Nhập ghi chú'"
                :disabled="taskSaving"
              />
              <div class="task-buttons">
                <el-button
                  size="small"
                  @click="updateTask(row, 'Pending')"
                  :disabled="taskSaving"
                >Pending</el-button>
                <el-button
                  size="small"
                  type="warning"
                  @click="updateTask(row, 'InProgress')"
                  :disabled="taskSaving"
                >Đang thực hiện</el-button>
                <el-button
                  size="small"
                  type="success"
                  @click="updateTask(row, 'Completed')"
                  :disabled="taskSaving"
                >Hoàn thành</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <el-dialog v-model="createDialogVisible" title="Tạo yêu cầu nghỉ việc" width="500px">
      <el-form :model="createForm" label-width="160px">
        <el-form-item label="Nhân viên">
          <el-select
            v-model="createForm.nhan_vien_id"
            filterable
            placeholder="Chọn nhân viên"
            :loading="employeesLoading"
          >
            <el-option
              v-for="nv in employeeOptions"
              :key="nv._id"
              :label="`${nv.ma_nhan_vien} - ${nv.ho_dem} ${nv.ten}`"
              :value="nv._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngày làm việc cuối">
          <el-date-picker
            v-model="createForm.last_working_day"
            type="date"
            placeholder="Chọn ngày"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Lý do">
          <el-input
            v-model="createForm.reason"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú cho HR"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          Tạo yêu cầu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {Plus} from '@element-plus/icons-vue';
import offboardingService, {OffboardingRequest, OffboardingTask} from '@/services/offboardingService';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';

const loading = ref(false);
const offboardingItems = ref<OffboardingRequest[]>([]);
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive({status: ''});

const drawerVisible = ref(false);
const selectedRequest = ref<OffboardingRequest | null>(null);
const selectedStatus = ref('');
const taskSaving = ref(false);

const createDialogVisible = ref(false);
const createForm = reactive({nhan_vien_id: '', last_working_day: '', reason: ''});
const creating = ref(false);
const employeeOptions = ref<NhanVien[]>([]);
const employeesLoading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const response = await offboardingService.getAll({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
    });
    offboardingItems.value = response.items;
    pagination.total = response.total;
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tải danh sách');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const getEmployeeName = (value: any) => {
  if (value && typeof value === 'object') {
    return `${value.ho_dem || ''} ${value.ten || ''}`.trim();
  }
  return '---';
};

const getEmployeeCode = (value: any) => {
  if (value && typeof value === 'object') {
    return value.ma_nhan_vien || '';
  }
  return '';
};

const formatDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const statusTag = (status: string) => {
  if (status === 'Completed') return 'success';
  if (status === 'InProgress') return 'warning';
  return 'info';
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'Chờ xử lý';
    case 'InProgress':
      return 'Đang thực hiện';
    case 'Completed':
      return 'Đã hoàn tất';
    default:
      return status;
  }
};

const handleRowClick = (row: OffboardingRequest) => {
  selectedRequest.value = {...row, tasks: row.tasks.map((task) => ({...task, tempNote: task.note}))} as any;
  drawerVisible.value = true;
  selectedStatus.value = '';
};

const drawerTitle = computed(() => {
  if (!selectedRequest.value) return '';
  return `Checklist - ${getEmployeeName(selectedRequest.value.nhan_vien_id)}`;
});

const handleUpdateStatus = async () => {
  if (!selectedRequest.value || !selectedStatus.value) return;
  try {
    const updated = await offboardingService.updateStatus(selectedRequest.value._id, selectedStatus.value as any);
    selectedRequest.value = {...updated, tasks: updated.tasks.map((task) => ({...task, tempNote: task.note}))} as any;
    loadData();
    ElMessage.success('Đã cập nhật trạng thái');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không cập nhật được trạng thái');
  }
};

const updateTask = async (task: any, status: OffboardingTask['status']) => {
  if (!selectedRequest.value) return;
  taskSaving.value = true;
  try {
    const updated = await offboardingService.updateTask(selectedRequest.value._id, task._id, {
      status,
      note: task.tempNote,
    });
    selectedRequest.value = {...updated, tasks: updated.tasks.map((item) => ({...item, tempNote: item.note}))} as any;
    loadData();
    ElMessage.success('Đã cập nhật tác vụ');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật tác vụ');
  } finally {
    taskSaving.value = false;
  }
};

const openCreateDialog = async () => {
  createDialogVisible.value = true;
  if (employeeOptions.value.length === 0) {
    employeesLoading.value = true;
    try {
      const response = await nhanVienService.getAll({ page: 1, limit: 200 });
      employeeOptions.value = response.items;
    } catch (err: any) {
      ElMessage.error('Không thể tải danh sách nhân viên');
    } finally {
      employeesLoading.value = false;
    }
  }
};

const handleCreate = async () => {
  if (!createForm.nhan_vien_id) {
    ElMessage.warning('Vui lòng chọn nhân viên');
    return;
  }
  creating.value = true;
  try {
    await offboardingService.create(createForm);
    ElMessage.success('Đã tạo yêu cầu offboarding');
    createDialogVisible.value = false;
    createForm.nhan_vien_id = '';
    createForm.last_working_day = '';
    createForm.reason = '';
    loadData();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tạo yêu cầu');
  } finally {
    creating.value = false;
  }
};

loadData();
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-md;

  h2 {
    margin: 0;
    font-size: $font-size-xl;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.mb-lg {
  margin-bottom: $spacing-lg;
}

.sub {
  color: $text-secondary;
  font-size: $font-size-sm;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-md;
}

.task-actions {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  margin-bottom: $spacing-md;
}

.task-buttons {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}
</style>

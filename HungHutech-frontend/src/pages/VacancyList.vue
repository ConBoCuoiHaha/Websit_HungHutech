<template>
  <div class="orangehrm-vacancy-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quản lý vị trí tuyển dụng</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm vị trí tuyển dụng
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filters.q"
            placeholder="Tìm theo tiêu đề..."
            clearable
            style="width: 300px"
            @keyup.enter="handleFilterChange"
            @clear="handleFilterChange"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option label="Đang mở" value="Mo" />
            <el-option label="Đã đóng" value="Dong" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilterChange">
            Tìm kiếm
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>    <!-- Vacancy Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="vacancyList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="tieu_de" label="Tiêu đề" min-width="250">
          <template #default="{row}">
            <strong>{{ row.tieu_de }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="mo_ta" label="Mô tả" min-width="300">
          <template #default="{row}">
            <div class="orangehrm-text-truncate">{{ row.mo_ta || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column
          prop="hiring_manager_id"
          label="Hiring Manager"
          width="200"
        >
          <template #default="{row}">
            <div
              v-if="
                typeof row.hiring_manager_id === 'object' &&
                row.hiring_manager_id
              "
            >
              {{ row.hiring_manager_id.ho_dem }} {{ row.hiring_manager_id.ten }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="dia_diem_id" label="Địa điểm" width="150">
          <template #default="{row}">
            <div v-if="typeof row.dia_diem_id === 'object' && row.dia_diem_id">
              {{ row.dia_diem_id.ten }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="120">
          <template #default="{row}">
            <el-tag
              :type="row.trang_thai === 'Mo' ? 'success' : 'info'"
              size="small"
            >
              {{ row.trang_thai === 'Mo' ? 'Đang mở' : 'Đã đóng' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Kênh đã đăng" min-width="220">
          <template #default="{row}">
            <el-space wrap>
              <el-tag
                v-for="channel in row.channels || []"
                :key="channel.channel_key"
                :type="channelStatusTag(channel.trang_thai)"
                size="small"
              >
                {{ channel.channel_name }} ({{ channelStatusText(channel.trang_thai) }})
              </el-tag>
              <span v-if="!row.channels || !row.channels.length">-</span>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="280" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button
                size="small"
                :icon="View"
                @click="
                  $router.push(`/tuyen-dung/ung-vien?vacancy_id=${row._id}`)
                "
              >
                Ứng viên
              </el-button>
              <el-button size="small" :icon="Edit" @click="handleEdit(row)"
                >Sửa</el-button
              >
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDelete(row._id)"
              >
                Xóa
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Share"
                @click="openPublishDialog(row)"
              >
                Đăng đa kênh
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

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="
        editingId ? 'Chỉnh sửa vị trí tuyển dụng' : 'Thêm vị trí tuyển dụng mới'
      "
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-form-item label="Tiêu đề" prop="tieu_de" required>
          <el-input
            v-model="form.tieu_de"
            placeholder="Nhập tiêu đề vị trí tuyển dụng..."
            maxlength="200"
          />
        </el-form-item>

        <el-form-item label="Mô tả" prop="mo_ta">
          <el-input
            v-model="form.mo_ta"
            type="textarea"
            :rows="5"
            placeholder="Nhập mô tả công việc..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="Hiring Manager" prop="hiring_manager_id" required>
          <el-select
            v-model="form.hiring_manager_id"
            placeholder="Chọn hiring manager..."
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Địa điểm" prop="dia_diem_id">
          <el-select
            v-model="form.dia_diem_id"
            placeholder="Chọn địa điểm..."
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="loc in locations"
              :key="loc._id"
              :label="loc.ten"
              :value="loc._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="trang_thai" required>
          <el-radio-group v-model="form.trang_thai">
            <el-radio value="Mo">Đang mở</el-radio>
            <el-radio value="Dong">Đã đóng</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </template>
    </el-dialog>
  
    <el-dialog
      v-model="publishDialogVisible"
      title="Đăng tin đa kênh"
      width="500px"
      @close="handlePublishDialogClose"
    >
      <div v-if="selectedVacancy">
        <p><strong>Vị trí:</strong> {{ selectedVacancy.tieu_de }}</p>
        <el-checkbox-group v-model="selectedChannels">
          <el-checkbox
            v-for="channel in availableChannels"
            :key="channel.key"
            :label="channel.key"
          >
            {{ channel.name }}
          </el-checkbox>
        </el-checkbox-group>
        <div class="channel-hint">
          <el-tag
            v-for="channel in selectedVacancy.channels || []"
            :key="channel.channel_key"
            :type="channelStatusTag(channel.trang_thai)"
            size="small"
          >
            {{ channel.channel_name }} ({{ channelStatusText(channel.trang_thai) }})
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="publishDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="publishing" @click="submitPublish">
          Đăng tin
        </el-button>
      </template>
    </el-dialog>
</div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  View,
  Share,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import vacancyService from '@/services/vacancyService';
import nhanVienService from '@/services/nhanVienService';
import diaDiemService from '@/services/diaDiemService';
import jobBoardService, {
  JobBoardChannel,
} from '@/services/jobBoardService';
import {Vacancy, NhanVien, DiaDiem} from '@/types';

const vacancyList = ref<Vacancy[]>([]);
const employees = ref<NhanVien[]>([]);
const locations = ref<DiaDiem[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();
const publishDialogVisible = ref(false);
const availableChannels = ref<JobBoardChannel[]>([]);
const selectedChannels = ref<string[]>([]);
const selectedVacancy = ref<Vacancy | null>(null);
const publishing = ref(false);
const skillPresets = [
  'JavaScript',
  'Node.js',
  'Vue.js',
  'React',
  'SQL',
  'HR Operations',
  'Communication',
];

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  q: '',
  trang_thai: '',
});

const form = reactive({
  tieu_de: '',
  mo_ta: '',
  yeu_cau: '',
  so_luong: 1,
  muc_luong: '',
  ky_nang: [] as string[],
  han_nop: '',
  hiring_manager_id: '',
  dia_diem_id: '',
  trang_thai: 'Mo',
});

const formRules: FormRules = {
  tieu_de: [
    {required: true, message: 'Vui lòng nhập tiêu đề', trigger: 'blur'},
  ],
  hiring_manager_id: [
    {
      required: true,
      message: 'Vui lòng chọn hiring manager',
      trigger: 'change',
    },
  ],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.q) params.q = filters.q;
    if (filters.trang_thai) params.trang_thai = filters.trang_thai;

    const response = await vacancyService.getAll(params);
    vacancyList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading vacancies:', err);
    error.value =
      err.response?.data?.msg || 'Không thể tải danh sách vị trí tuyển dụng';
    ElMessage.error(error.value);
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

const loadLocations = async () => {
  try {
    const response = await diaDiemService.getAll({limit: 1000});
    locations.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading locations:', err);
  }
};

const handleFilterChange = () => {
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

const handleEdit = (item: Vacancy) => {
  editingId.value = item._id;
  form.tieu_de = item.tieu_de;
  form.mo_ta = item.mo_ta || '';
  form.hiring_manager_id =
    typeof item.hiring_manager_id === 'object'
      ? item.hiring_manager_id._id
      : item.hiring_manager_id;
  form.dia_diem_id = item.dia_diem_id
    ? typeof item.dia_diem_id === 'object'
      ? item.dia_diem_id._id
      : item.dia_diem_id
    : '';
  form.trang_thai = item.trang_thai;
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data: any = {
        tieu_de: form.tieu_de,
        mo_ta: form.mo_ta,
        hiring_manager_id: form.hiring_manager_id,
        trang_thai: form.trang_thai,
      };

      if (form.dia_diem_id) {
        data.dia_diem_id = form.dia_diem_id;
      }

      if (editingId.value) {
        await vacancyService.update(editingId.value, data);
        ElMessage.success('Cập nhật vị trí tuyển dụng thành công');
      } else {
        await vacancyService.create(data);
        ElMessage.success('Tạo vị trí tuyển dụng thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving vacancy:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu vị trí tuyển dụng',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa vị trí tuyển dụng này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await vacancyService.delete(id);
    ElMessage.success('Xóa vị trí tuyển dụng thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting vacancy:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa vị trí tuyển dụng',
      );
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.tieu_de = '';
  form.mo_ta = '';
  form.hiring_manager_id = '';
  form.dia_diem_id = '';
  form.trang_thai = 'Mo';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const channelStatusTag = (status?: string) => {
  switch (status) {
    case 'Thanh cong':
      return 'success';
    case 'That bai':
      return 'danger';
    case 'Dang dang':
      return 'warning';
    default:
      return 'info';
  }
};

const channelStatusText = (status?: string) => {
  switch (status) {
    case 'Thanh cong':
      return 'Thành công';
    case 'That bai':
      return 'Thất bại';
    case 'Dang dang':
      return 'Đang đăng';
    default:
      return status || '-';
  }
};

const openPublishDialog = async (vacancy: Vacancy) => {
  selectedVacancy.value = vacancy;
  publishDialogVisible.value = true;
  selectedChannels.value = [];
  try {
    availableChannels.value = await jobBoardService.getChannels();
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách kênh đăng tin',
    );
  }
};

const handlePublishDialogClose = () => {
  publishDialogVisible.value = false;
  selectedVacancy.value = null;
  selectedChannels.value = [];
};

const submitPublish = async () => {
  if (!selectedVacancy.value) return;
  if (!selectedChannels.value.length) {
    ElMessage.warning('Vui lòng chọn ít nhất 1 kênh đăng tin');
    return;
  }
  publishing.value = true;
  try {
    await jobBoardService.publishVacancy(selectedVacancy.value._id, {
      channels: selectedChannels.value,
    });
    ElMessage.success('Đã đăng tin lên các kênh đã chọn');
    handlePublishDialogClose();
    loadData();
  } catch (err: any) {
    console.error('submitPublish error', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể đăng tin đa kênh',
    );
  } finally {
    publishing.value = false;
  }
};


onMounted(() => {
  loadData();
  loadEmployees();
  loadLocations();
});
</script>

<style lang="scss" scoped>
.orangehrm-vacancy-page {
  width: 100%;
}

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

.orangehrm-filter-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-md;
  }

  :deep(.el-form--inline .el-form-item) {
    margin-right: $spacing-lg;
    margin-bottom: 0;
  }
}

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

.orangehrm-text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.channel-hint {
  margin-top: $spacing-sm;
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

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

  .orangehrm-filter-card {
    :deep(.el-form--inline) {
      display: block;

      .el-form-item {
        display: block;
        margin-right: 0;
        margin-bottom: $spacing-md;
      }
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





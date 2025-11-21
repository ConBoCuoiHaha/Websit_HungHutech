<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Yêu cầu cập nhật hồ sơ</h2>
        <p>Theo dõi và phê duyệt các yêu cầu thay đổi thông tin nhân viên</p>
      </div>
      <el-button
        type="primary"
        :icon="Refresh"
        :loading="loading"
        @click="loadRequests(true)"
      >
        Làm mới
      </el-button>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" label-position="top" @submit.prevent>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="Trạng thái">
              <el-select
                v-model="filters.status"
                placeholder="Tất cả"
                @change="handleFilterChange"
              >
                <el-option label="Tất cả" value="" />
                <el-option label="Chờ duyệt" value="Pending" />
                <el-option label="Đã duyệt" value="Approved" />
                <el-option label="Từ chối" value="Rejected" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="Loại yêu cầu">
              <el-select
                v-model="filters.type"
                placeholder="Tất cả"
                @change="handleFilterChange"
              >
                <el-option label="Tất cả" value="" />
                <el-option label="Thông tin cá nhân" value="personal" />
                <el-option label="Liên hệ & địa chỉ" value="contact" />
                <el-option label="Người phụ thuộc" value="dependents" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
            <el-form-item label="Từ khóa">
              <el-input
                v-model="filters.keyword"
                placeholder="Tìm theo ghi chú"
                clearable
                @keyup.enter="handleFilterChange"
                @clear="handleFilterChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="requests"
        border
        style="width: 100%"
        empty-text="Chưa có yêu cầu"
      >
        <el-table-column label="Nhân viên" min-width="220">
          <template #default="{row}">
            <div class="employee-cell">
              <strong>{{ getEmployeeName(row) }}</strong>
              <span class="employee-id">{{ getEmployeeCode(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Loại yêu cầu" min-width="180">
          <template #default="{row}">
            {{ requestTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="Ngày gửi" min-width="180">
          <template #default="{row}">
            {{ formatRequestDate(row.ngay_tao) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{row}">
            <el-tag :type="requestStatusTag(row.status)" size="small">
              {{ requestStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="note"
          label="Ghi chú"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="approver_note"
          label="Phản hồi từ HR"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="Thao tác" width="220" align="center">
          <template #default="{row}">
            <el-space>
              <el-button
                v-if="row.status === 'Pending'"
                type="success"
                size="small"
                :loading="updatingId === row._id"
                @click="handleUpdateStatus(row, 'Approved')"
              >
                Phê duyệt
              </el-button>
              <el-button
                v-if="row.status === 'Pending'"
                type="danger"
                size="small"
                :loading="updatingId === row._id"
                @click="handleUpdateStatus(row, 'Rejected')"
              >
                Từ chối
              </el-button>
              <span v-else class="action-placeholder">Đã xử lý</span>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {Refresh} from '@element-plus/icons-vue';
import profileRequestService, {
  ProfileRequestListParams,
} from '@/services/profileRequestService';
import {ProfileRequest} from '@/types';

const requests = ref<ProfileRequest[]>([]);
const loading = ref(false);
const updatingId = ref<string | null>(null);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  status: 'Pending' as '' | 'Pending' | 'Approved' | 'Rejected',
  type: '' as '' | 'personal' | 'contact' | 'dependents',
  keyword: '',
});

const loadRequests = async (force = false) => {
  if (loading.value) return;
  if (force) {
    pagination.page = 1;
  }
  loading.value = true;
  try {
    const params: ProfileRequestListParams = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.keyword) params.q = filters.keyword;

    const result = await profileRequestService.list(params);
    requests.value = result.items;
    pagination.total = result.total;
  } catch (err: any) {
    console.error('Error loading profile requests:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải yêu cầu');
  } finally {
    loading.value = false;
  }
};

const requestTypeLabel = (type: ProfileRequest['type']) => {
  switch (type) {
    case 'personal':
      return 'Thong tin ca nhan';
    case 'contact':
      return 'Liên hệ & địa chỉ';
    case 'dependents':
      return 'Người phụ thuộc';
    default:
      return type;
  }
};

const requestStatusLabel = (status: ProfileRequest['status']) => {
  if (status === 'Pending') return 'Chờ duyệt';
  if (status === 'Approved') return 'Đã duyệt';
  if (status === 'Rejected') return 'Từ chối';
  return status;
};

const requestStatusTag = (status: ProfileRequest['status']) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  return 'warning';
};

const formatRequestDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleString('vi-VN');
};

const getEmployeeName = (request: ProfileRequest) => {
  const employee: any = request.nhan_vien_id;
  if (employee && typeof employee === 'object') {
    return `${employee.ho_dem || ''} ${employee.ten || ''}`.trim() || '---';
  }
  return '---';
};

const getEmployeeCode = (request: ProfileRequest) => {
  const employee: any = request.nhan_vien_id;
  if (employee && typeof employee === 'object') {
    return employee.ma_nhan_vien || '';
  }
  return '';
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  loadRequests();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadRequests();
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadRequests();
};

const handleUpdateStatus = async (
  request: ProfileRequest,
  status: 'Approved' | 'Rejected',
) => {
  try {
    const actionLabel = status === 'Approved' ? 'Phe duyet' : 'Tu choi';
    const {value} = await ElMessageBox.prompt(
      'Nhap ghi chu gui nhan vien (tuy chon)',
      actionLabel,
      {
        confirmButtonText: actionLabel,
        cancelButtonText: 'Huy',
        inputPlaceholder: 'Ghi chu',
        inputValue: '',
      },
    );

    updatingId.value = request._id;
    await profileRequestService.updateStatus(request._id, {
      status,
      approver_note: value,
    });
    ElMessage.success(
      status === 'Approved' ? 'Da phe duyet yeu cau' : 'Da tu choi yeu cau',
    );
    loadRequests();
  } catch (err: any) {
    if (err === 'cancel') return;
    console.error('Error updating request status:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật trạng thái');
  } finally {
    updatingId.value = null;
  }
};

onMounted(() => {
  loadRequests();
});
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
    font-weight: $font-weight-bold;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.filter-card {
  :deep(.el-form-item) {
    margin-bottom: $spacing-md;
  }
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .employee-id {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.action-placeholder {
  color: $text-secondary;
  font-size: $font-size-sm;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
}
</style>

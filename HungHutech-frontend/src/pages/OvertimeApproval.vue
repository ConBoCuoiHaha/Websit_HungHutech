<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Duyệt yêu cầu tăng ca</h2>
        <p>Theo dõi hạn mức và phê duyệt các đề nghị OT</p>
      </div>
      <el-button :icon="Refresh" type="primary" :loading="loading" @click="loadData(true)">
        Làm mới
      </el-button>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" label-position="top" @submit.prevent>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="Trạng thái">
              <el-select v-model="filters.trang_thai" placeholder="Tất cả" @change="handleFilter">
                <el-option label="Tất cả" value="" />
                <el-option label="Chờ duyệt" value="Cho duyet" />
                <el-option label="Đã duyệt" value="Da duyet" />
                <el-option label="Bị từ chối" value="Bi tu choi" />
                <el-option label="Đã hủy" value="Da huy" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="Khoảng thời gian">
              <el-date-picker
                v-model="filters.range"
                type="daterange"
                unlink-panels
                range-separator="Đến"
                start-placeholder="Từ ngày"
                end-placeholder="Đến ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                @change="handleFilter"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="Nhân viên">
              <el-input
                v-model="filters.q"
                placeholder="Tìm mã NV/ghi chú"
                clearable
                @keyup.enter="handleFilter"
                @clear="handleFilter"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table
        :data="requests"
        border
        v-loading="loading"
        empty-text="Chưa có yêu cầu"
      >
        <el-table-column label="Nhân viên" min-width="220">
          <template #default="{row}">
            <div class="employee-cell">
              <strong>{{ employeeName(row) }}</strong>
              <small>{{ row.nhan_vien_id?.ma_nhan_vien }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Ngày" width="140">
          <template #default="{row}">
            {{ formatDate(row.ngay) }}
          </template>
        </el-table-column>
        <el-table-column label="Thời gian" min-width="180">
          <template #default="{row}">
            {{ range(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="so_gio" label="Số giờ" width="100">
          <template #default="{row}">
            {{ row.so_gio?.toFixed(2) }}h
          </template>
        </el-table-column>
        <el-table-column label="Loại" width="150">
          <template #default="{row}">
            {{ typeLabel(row.loai_ngay) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{row}">
            <el-tag :type="statusTag(row.trang_thai)">
              {{ statusLabel(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="220" align="center">
          <template #default="{row}">
            <el-space>
              <el-button
                v-if="row.trang_thai === 'Cho duyet'"
                type="success"
                size="small"
                :loading="updatingId === row._id"
                @click="handleStatus(row, 'Da duyet')"
              >
                Phê duyệt
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Cho duyet'"
                type="danger"
                size="small"
                :loading="updatingId === row._id"
                @click="handleStatus(row, 'Bi tu choi')"
              >
                Từ chối
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {Refresh} from '@element-plus/icons-vue';
import overtimeRequestService, {
  OvertimeRequest,
} from '@/services/overtimeRequestService';

const requests = ref<OvertimeRequest[]>([]);
const loading = ref(false);
const updatingId = ref('');
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive<{trang_thai: string; range: string[]; q: string}>({
  trang_thai: '',
  range: [],
  q: '',
});

const loadData = async (reset = false) => {
  if (reset) pagination.page = 1;
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      trang_thai: filters.trang_thai || undefined,
      q: filters.q || undefined,
    };
    if (filters.range?.length === 2) {
      params.from = filters.range[0];
      params.to = filters.range[1];
    }
    const response = await overtimeRequestService.getAll(params);
    requests.value = response.data;
    pagination.total = response.pagination.total;
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải yêu cầu tăng ca',
    );
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  pagination.page = 1;
  loadData();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  loadData();
};

const employeeName = (row: OvertimeRequest) => {
  const emp: any = row.nhan_vien_id;
  if (emp && typeof emp === 'object') {
    return `${emp.ho_dem || ''} ${emp.ten || ''}`.trim();
  }
  return '---';
};

const statusLabel = (status: OvertimeRequest['trang_thai']) => {
  switch (status) {
    case 'Da duyet':
      return 'Đã duyệt';
    case 'Bi tu choi':
      return 'Bị từ chối';
    case 'Da huy':
      return 'Đã hủy';
    default:
      return 'Chờ duyệt';
  }
};

const statusTag = (status: OvertimeRequest['trang_thai']) => {
  if (status === 'Da duyet') return 'success';
  if (status === 'Bi tu choi') return 'danger';
  if (status === 'Da huy') return 'info';
  return 'warning';
};

const typeLabel = (type?: string) => {
  if (!type) return 'Ngày thường';
  switch (type) {
    case 'holiday':
      return 'Lễ/Tết';
    case 'holiday_night':
      return 'Lễ/Tết đêm';
    case 'weekend':
      return 'Ngày nghỉ';
    case 'weekend_night':
      return 'Ngày nghỉ đêm';
    case 'weekday_night':
      return 'Ngày thường đêm';
    default:
      return 'Ngày thường';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const range = (row: OvertimeRequest) => {
  const start = row.thoi_gian_bat_dau
    ? new Date(row.thoi_gian_bat_dau).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';
  const end = row.thoi_gian_ket_thuc
    ? new Date(row.thoi_gian_ket_thuc).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';
  return `${start} - ${end}`;
};

const handleStatus = async (
  row: OvertimeRequest,
  status: 'Da duyet' | 'Bi tu choi',
) => {
  try {
    const actionLabel = status === 'Da duyet' ? 'Phê duyệt' : 'Từ chối';
    const {value} = await ElMessageBox.prompt(
      'Nhập ghi chú gửi nhân viên (tùy chọn)',
      actionLabel,
      {
        confirmButtonText: actionLabel,
        cancelButtonText: 'Hủy',
        inputPlaceholder: 'Ghi chú',
      },
    );
    updatingId.value = row._id;
    await overtimeRequestService.updateStatus(row._id, {
      trang_thai: status,
      ghi_chu_quan_ly: value,
    });
    ElMessage.success(
      status === 'Da duyet'
        ? 'Đã phê duyệt yêu cầu tăng ca'
        : 'Đã từ chối yêu cầu',
    );
    loadData();
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(
      err.response?.data?.msg || 'Không thể cập nhật trạng thái',
    );
  } finally {
    updatingId.value = '';
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

.filter-card {
  :deep(.el-form-item) {
    margin-bottom: $spacing-md;
  }
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  small {
    color: $text-secondary;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
}
</style>

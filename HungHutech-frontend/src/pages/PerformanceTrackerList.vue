<template>
  <div class="orangehrm-tracker-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Theo dõi hiệu suất</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="handleCreate" :icon="Plus">
          Tạo tracker mới
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="20" class="orangehrm-stats-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #ecf5ff">
              <el-icon :size="24" color="#409eff"><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.tong_tracker }}</div>
              <div class="stats-label">Tổng tracker</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #fdf6ec">
              <el-icon :size="24" color="#e6a23c"><Clock /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.dang_theo_doi }}</div>
              <div class="stats-label">Đang theo dõi</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #f0f9ff">
              <el-icon :size="24" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.da_hoan_thanh }}</div>
              <div class="stats-label">Đã hoàn thành</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #fef0f0">
              <el-icon :size="24" color="#f56c6c"><Star /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">
                {{ statistics.diem_trung_binh !== null ? statistics.diem_trung_binh.toFixed(1) : '-' }}
              </div>
              <div class="stats-label">Điểm TB</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="handleFilterChange">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filters.q"
            placeholder="Tìm theo tên tracker..."
            clearable
            :prefix-icon="Search"
            style="width: 250px"
            @clear="handleFilterChange"
          />
        </el-form-item>

        <el-form-item label="Nhân viên">
          <el-select
            v-model="filters.nhan_vien_id"
            placeholder="Tất cả"
            clearable
            filterable
            style="width: 250px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Người đánh giá">
          <el-select
            v-model="filters.nguoi_danh_gia_id"
            placeholder="Tất cả"
            clearable
            filterable
            style="width: 250px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Nháp" value="Nháp" />
            <el-option label="Đang theo dõi" value="Đang theo dõi" />
            <el-option label="Đã hoàn thành" value="Đã hoàn thành" />
            <el-option label="Đã hủy" value="Đã hủy" />
          </el-select>
        </el-form-item>

        <el-form-item label="Kỳ đánh giá">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 280px"
            @change="handleDateRangeChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleFilterChange" :icon="Search">
            Tìm kiếm
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Tracker Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="trackerList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ten_tracker" label="Tên tracker" min-width="220" fixed>
          <template #default="{ row }">
            <div class="tracker-name">
              <strong>{{ row.ten_tracker }}</strong>
              <div v-if="row.ghi_chu" class="orangehrm-text-muted">
                {{ truncateText(row.ghi_chu, 50) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="nhan_vien_id" label="Nhân viên" min-width="180">
          <template #default="{ row }">
            <div v-if="typeof row.nhan_vien_id === 'object' && row.nhan_vien_id">
              <strong>{{ row.nhan_vien_id.ma_nhan_vien }}</strong>
              <div class="orangehrm-text-muted">
                {{ row.nhan_vien_id.ho_dem }} {{ row.nhan_vien_id.ten }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="nguoi_danh_gia_id" label="Người đánh giá" min-width="180">
          <template #default="{ row }">
            <div v-if="typeof row.nguoi_danh_gia_id === 'object' && row.nguoi_danh_gia_id">
              {{ row.nguoi_danh_gia_id.ho_dem }} {{ row.nguoi_danh_gia_id.ten }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kỳ đánh giá" width="200">
          <template #default="{ row }">
            <div v-if="row.ky_danh_gia">
              {{ formatDate(row.ky_danh_gia.tu_ngay) }} -
              {{ formatDate(row.ky_danh_gia.den_ngay) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Tiến độ" width="180">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.tien_do_tong || 0"
                :color="getProgressColor(row.tien_do_tong || 0)"
              />
              <span class="progress-text">{{ row.tien_do_tong || 0 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="diem_trung_binh" label="Điểm TB" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.diem_trung_binh" :type="getScoreType(row.diem_trung_binh)" size="large">
              {{ row.diem_trung_binh.toFixed(1) }}
            </el-tag>
            <span v-else class="orangehrm-text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ row.trang_thai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Mục tiêu" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.muc_tieu?.length || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" :icon="View" @click="handleView(row)">Xem</el-button>
              <el-button
                v-if="row.trang_thai !== 'Đã hoàn thành' && row.trang_thai !== 'Đã hủy'"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                Sửa
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Nháp'"
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
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  View,
  Document,
  Clock,
  CircleCheck,
  Star,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import performanceTrackerService from '@/services/performanceTrackerService';
import nhanVienService from '@/services/nhanVienService';
import {PerformanceTracker, NhanVien, PerformanceTrackerStatistics} from '@/types';

const router = useRouter();
const trackerList = ref<PerformanceTracker[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const dateRange = ref<[string, string] | null>(null);

const statistics = ref<PerformanceTrackerStatistics>({
  tong_tracker: 0,
  dang_theo_doi: 0,
  da_hoan_thanh: 0,
  diem_trung_binh: null,
});

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  q: '',
  nhan_vien_id: '',
  nguoi_danh_gia_id: '',
  trang_thai: '',
  tu_ngay: '',
  den_ngay: '',
});

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.q) params.q = filters.q;
    if (filters.nhan_vien_id) params.nhan_vien_id = filters.nhan_vien_id;
    if (filters.nguoi_danh_gia_id) params.nguoi_danh_gia_id = filters.nguoi_danh_gia_id;
    if (filters.trang_thai) params.trang_thai = filters.trang_thai;
    if (filters.tu_ngay) params.tu_ngay = filters.tu_ngay;
    if (filters.den_ngay) params.den_ngay = filters.den_ngay;

    const response = await performanceTrackerService.getAll(params);
    trackerList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading trackers:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách tracker';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    const params: any = {};
    if (filters.nhan_vien_id) params.nhan_vien_id = filters.nhan_vien_id;
    if (filters.nguoi_danh_gia_id) params.nguoi_danh_gia_id = filters.nguoi_danh_gia_id;
    if (filters.tu_ngay) params.tu_ngay = filters.tu_ngay;
    if (filters.den_ngay) params.den_ngay = filters.den_ngay;

    const stats = await performanceTrackerService.getStatistics(params);
    statistics.value = stats;
  } catch (err: any) {
    console.error('Error loading statistics:', err);
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

const handleFilterChange = () => {
  pagination.currentPage = 1;
  loadData();
  loadStatistics();
};

const handleDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    filters.tu_ngay = value[0];
    filters.den_ngay = value[1];
  } else {
    filters.tu_ngay = '';
    filters.den_ngay = '';
  }
  handleFilterChange();
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

const handleCreate = () => {
  router.push({name: 'performance-tracker-form'});
};

const handleView = (item: PerformanceTracker) => {
  router.push({name: 'performance-tracker-form', params: {id: item._id}, query: {mode: 'view'}});
};

const handleEdit = (item: PerformanceTracker) => {
  router.push({name: 'performance-tracker-form', params: {id: item._id}});
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('Bạn có chắc chắn muốn xóa tracker này?', 'Xác nhận xóa', {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning',
    });

    await performanceTrackerService.delete(id);
    ElMessage.success('Xóa tracker thành công');
    await loadData();
    await loadStatistics();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting tracker:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa tracker');
    }
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getStatusType = (status: string): string => {
  const types: Record<string, string> = {
    'Nháp': 'info',
    'Đang theo dõi': 'warning',
    'Đã hoàn thành': 'success',
    'Đã hủy': 'danger',
  };
  return types[status] || 'info';
};

const getScoreType = (score: number): string => {
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return '#67c23a';
  if (percentage >= 50) return '#e6a23c';
  return '#f56c6c';
};

onMounted(() => {
  loadData();
  loadEmployees();
  loadStatistics();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-tracker-page {
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

.orangehrm-stats-cards {
  margin-bottom: $spacing-lg;

  .stats-card {
    margin-bottom: $spacing-md;

    :deep(.el-card__body) {
      padding: $spacing-lg;
    }
  }

  .stats-content {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .stats-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stats-info {
    flex: 1;
  }

  .stats-value {
    font-size: $font-size-xxl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    line-height: 1.2;
  }

  .stats-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: $spacing-xs;
  }
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

.tracker-name {
  strong {
    display: block;
    margin-bottom: 4px;
  }
}

.orangehrm-text-muted {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .el-progress {
    flex: 1;
  }

  .progress-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    white-space: nowrap;
    min-width: 40px;
    text-align: right;
  }
}

.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
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

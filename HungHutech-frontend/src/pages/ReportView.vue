<template>
  <div class="report-view-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="handleBack">Quay lại</el-button>
        <div class="report-info">
          <h1 class="page-title">
            {{ reportConfig?.ten_bao_cao || 'Báo cáo' }}
          </h1>
          <el-tag
            v-if="reportConfig"
            :type="getReportTypeTagType(reportConfig.loai_bao_cao)"
          >
            {{ getReportTypeLabel(reportConfig.loai_bao_cao) }}
          </el-tag>
        </div>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" :loading="loading" @click="handleRefresh">
          Tải lại
        </el-button>
        <el-button :icon="Printer" @click="handlePrint"> In báo cáo </el-button>
        <el-button type="success" :icon="Download" @click="handleExport">
          Xuất CSV
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="Tìm kiếm trong kết quả..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-text type="info">
            Tổng số bản ghi: {{ pagination.total }}
          </el-text>
        </el-col>
      </el-row>

      <!-- Applied Criteria -->
      <div
        v-if="reportConfig && reportConfig.tieu_chi.length > 0"
        class="applied-criteria"
      >
        <el-divider content-position="left">Tiêu chí đã áp dụng</el-divider>
        <div class="criteria-tags">
          <el-tag
            v-for="(criteria, index) in reportConfig.tieu_chi"
            :key="index"
            type="info"
            size="large"
          >
            {{ getFieldLabel(criteria.truong) }} {{ criteria.dieu_kien }}
            {{ criteria.gia_tri }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- Report Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="filteredData"
        style="width: 100%"
        stripe
        border
        :empty-text="error || 'Không có dữ liệu'"
        :default-sort="defaultSort"
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-for="col in displayColumns"
          :key="col"
          :prop="col"
          :label="getFieldLabel(col)"
          min-width="150"
          sortable="custom"
        >
          <template #default="{row}">
            {{ formatCellValue(getNestedValue(row, col)) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100, 200]"
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
import {ref, reactive, computed, onMounted} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  ArrowLeft,
  Refresh,
  Printer,
  Download,
  Search,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import reportService from '@/services/reportService';
import {Report} from '@/types';

const router = useRouter();
const route = useRoute();

const reportConfig = ref<Report | null>(null);
const reportData = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');

const pagination = reactive({
  currentPage: 1,
  limit: 20,
  total: 0,
});

const defaultSort = computed(() => {
  if (reportConfig.value?.sap_xep?.truong) {
    return {
      prop: reportConfig.value.sap_xep.truong,
      order:
        reportConfig.value.sap_xep.thu_tu === 'desc'
          ? 'descending'
          : 'ascending',
    };
  }
  return undefined;
});

const displayColumns = computed(() => {
  if (!reportConfig.value) return [];
  return reportConfig.value.cot_hien_thi || [];
});

const filteredData = computed(() => {
  if (!searchQuery.value) return reportData.value;

  const query = searchQuery.value.toLowerCase();
  return reportData.value.filter((row) => {
    return Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(query);
    });
  });
});

// Field configurations for each report type (same as ReportBuilder)
const fieldConfigs: Record<string, Array<{label: string; value: string}>> = {
  'Nhan vien': [
    {label: 'Mã nhân viên', value: 'ma_nhan_vien'},
    {label: 'Họ đệm', value: 'ho_dem'},
    {label: 'Tên', value: 'ten'},
    {label: 'Email', value: 'lien_he.email_cong_viec'},
    {label: 'Ngày sinh', value: 'ngay_sinh'},
    {label: 'Giới tính', value: 'gioi_tinh'},
    {label: 'Phòng ban', value: 'thong_tin_cong_viec.phong_ban_id'},
    {label: 'Chức danh', value: 'thong_tin_cong_viec.chuc_danh_id'},
    {label: 'Ngày vào làm', value: 'thong_tin_cong_viec.ngay_vao_lam'},
    {
      label: 'Trạng thái lao động',
      value: 'thong_tin_cong_viec.trang_thai_lao_dong_id',
    },
  ],
  'Cham cong': [
    {label: 'Nhân viên', value: 'nhan_vien_id'},
    {label: 'Ngày', value: 'ngay'},
    {label: 'Thời gian vào', value: 'thoi_gian_vao'},
    {label: 'Thời gian ra', value: 'thoi_gian_ra'},
    {label: 'Ghi chú', value: 'ghi_chu'},
  ],
  'Nghi phep': [
    {label: 'Nhân viên', value: 'nhan_vien_id'},
    {label: 'Loại ngày nghỉ', value: 'loai_ngay_nghi_id'},
    {label: 'Ngày bắt đầu', value: 'ngay_bat_dau'},
    {label: 'Ngày kết thúc', value: 'ngay_ket_thuc'},
    {label: 'Số ngày', value: 'so_ngay'},
    {label: 'Trạng thái', value: 'trang_thai'},
    {label: 'Lý do', value: 'ly_do'},
  ],
  'Boi hoan': [
    {label: 'Nhân viên', value: 'nhan_vien_id'},
    {label: 'Trạng thái', value: 'trang_thai'},
    {label: 'Tổng tiền', value: 'tong_tien'},
    {label: 'Ngày tạo', value: 'ngay_tao'},
  ],
  Luong: [
    {label: 'Nhân viên', value: 'nhan_vien_id'},
    {label: 'Tháng', value: 'thang'},
    {label: 'Lương cơ bản', value: 'luong_co_ban'},
    {label: 'Phụ cấp', value: 'phu_cap'},
    {label: 'Thưởng', value: 'thuong'},
    {label: 'Khấu trừ', value: 'khau_tru'},
    {label: 'Thực lãnh', value: 'thuc_lanh'},
  ],
  'Hieu suat': [
    {label: 'Nhân viên', value: 'nhan_vien_id'},
    {label: 'Người đánh giá', value: 'nguoi_danh_gia_id'},
    {label: 'Từ ngày', value: 'tu_ngay'},
    {label: 'Đến ngày', value: 'den_ngay'},
    {label: 'Điểm tổng', value: 'diem_tong'},
    {label: 'Trạng thái', value: 'trang_thai'},
  ],
};

const loadReportConfig = async () => {
  try {
    reportConfig.value = await reportService.getById(route.params.id as string);
  } catch (err: any) {
    console.error('Error loading report config:', err);
    ElMessage.error('Không thể tải cấu hình báo cáo');
    router.push('/bao-cao');
  }
};

const loadReportData = async () => {
  if (!reportConfig.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await reportService.generate({
      loai_bao_cao: reportConfig.value.loai_bao_cao,
      tieu_chi: reportConfig.value.tieu_chi,
      cot_hien_thi: reportConfig.value.cot_hien_thi,
      sap_xep: reportConfig.value.sap_xep,
      page: pagination.currentPage,
      limit: pagination.limit,
    });

    reportData.value = response.data;
    pagination.total = response.pagination?.total;
  } catch (err: any) {
    console.error('Error loading report data:', err);
    error.value = err.response?.data?.msg || 'Không thể tải dữ liệu báo cáo';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push('/bao-cao');
};

const handleRefresh = () => {
  loadReportData();
};

const handlePrint = () => {
  window.print();
};

const handleExport = () => {
  if (!reportConfig.value) return;
  ElMessage.info('Đang xuất báo cáo...');
  reportService.downloadExport(reportConfig.value._id);
  ElMessage.success('Xuất báo cáo thành công');
};

const handleSearch = () => {
  // Search is handled by computed property filteredData
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadReportData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
  loadReportData();
};

const handleSortChange = ({prop, order}: any) => {
  if (!reportConfig.value) return;

  // Update sort config
  if (order) {
    reportConfig.value.sap_xep = {
      truong: prop,
      thu_tu: order === 'descending' ? 'desc' : 'asc',
    };
  } else {
    reportConfig.value.sap_xep = {truong: '', thu_tu: 'asc'};
  }

  // Reload data with new sort
  loadReportData();
};

const getFieldLabel = (field: string): string => {
  if (!reportConfig.value) return field;

  const fields = fieldConfigs[reportConfig.value.loai_bao_cao] || [];
  const found = fields.find((f) => f.value === field);
  return found ? found.label : field;
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
};

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    if (value.ten) return value.ten;
    if (value.ten_chuc_danh) return value.ten_chuc_danh;
    if (value.ho_dem && value.ten) return `${value.ho_dem} ${value.ten}`;
    if (value.$numberDecimal) return value.$numberDecimal;
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'number') return value.toLocaleString('vi-VN');
  // Format dates
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleDateString('vi-VN');
  }
  return String(value);
};

const getReportTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'Nhan vien': 'Nhân viên',
    'Cham cong': 'Chấm công',
    'Nghi phep': 'Nghỉ phép',
    'Boi hoan': 'Bồi hoàn',
    Luong: 'Lương',
    'Hieu suat': 'Hiệu suất',
  };
  return labels[type] || type;
};

const getReportTypeTagType = (type: string): string => {
  const types: Record<string, string> = {
    'Nhan vien': 'primary',
    'Cham cong': 'success',
    'Nghi phep': 'warning',
    'Boi hoan': 'danger',
    Luong: 'info',
    'Hieu suat': '',
  };
  return types[type] || '';
};

onMounted(async () => {
  await loadReportConfig();
  await loadReportData();
});
</script>

<style lang="scss" scoped>
.report-view-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.report-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.applied-criteria {
  margin-top: 16px;
}

.criteria-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.table-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    font-size: 14px;

    th.el-table__cell {
      background-color: #f5f7fa;
      color: #303133;
      font-weight: 500;
    }

    .el-table__row:hover {
      background-color: rgba(64, 158, 255, 0.05);
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

// Print styles
@media print {
  .page-header,
  .filter-card,
  .pagination {
    display: none !important;
  }

  .table-card {
    box-shadow: none !important;
    border: none !important;
  }

  :deep(.el-table) {
    font-size: 12px;

    .el-table__row:hover {
      background-color: transparent !important;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .report-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-actions {
    width: 100%;
    flex-wrap: wrap;

    .el-button {
      flex: 1;
    }
  }

  .pagination {
    justify-content: center;
    padding: 16px;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>

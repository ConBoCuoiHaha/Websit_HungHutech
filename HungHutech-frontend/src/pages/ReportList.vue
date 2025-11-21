<template>
  <div class="report-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Quản lý Báo cáo</h1>
      <div class="page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="handleCreateNew">
          Tạo báo cáo mới
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="Tìm kiếm theo tên báo cáo..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="filterLoaiBaoCao"
            placeholder="Lọc theo loại báo cáo"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả loại" value="" />
            <el-option label="Nhân viên" value="Nhan vien" />
            <el-option label="Chấm công" value="Cham cong" />
            <el-option label="Nghỉ phép" value="Nghi phep" />
            <el-option label="Bồi hoàn" value="Boi hoan" />
            <el-option label="Lương" value="Luong" />
            <el-option label="Hiệu suất" value="Hieu suat" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Reports Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="reportList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có báo cáo nào'"
      >
        <el-table-column prop="ten_bao_cao" label="Tên báo cáo" min-width="200">
          <template #default="{row}">
            <strong class="report-name">{{ row.ten_bao_cao }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="Loại báo cáo" min-width="150">
          <template #default="{row}">
            <el-tag :type="getReportTypeTagType(row.loai_bao_cao)">
              {{ getReportTypeLabel(row.loai_bao_cao) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Số tiêu chí" width="120" align="center">
          <template #default="{row}">
            {{ row.tieu_chi?.length || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="Số cột" width="100" align="center">
          <template #default="{row}">
            {{ row.cot_hien_thi?.length || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="Người tạo" min-width="150">
          <template #default="{row}">
            {{ getUserEmail(row.nguoi_tao_id) }}
          </template>
        </el-table-column>

        <el-table-column label="Ngày cập nhật" min-width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_cap_nhat) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="280" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button
                size="small"
                :icon="View"
                @click="handleGenerate(row._id)"
              >
                Xem
              </el-button>
              <el-button
                size="small"
                type="primary"
                :icon="Edit"
                @click="handleEdit(row._id)"
              >
                Sửa
              </el-button>
              <el-button
                size="small"
                type="success"
                :icon="Download"
                @click="handleExport(row._id)"
              >
                Xuất
              </el-button>
              <el-button
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
      <div class="pagination">
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
  View,
  Edit,
  Delete,
  Download,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import reportService from '@/services/reportService';
import {Report, User} from '@/types';

const router = useRouter();

const reportList = ref<Report[]>([]);
const loading = ref(false);
const error = ref('');

const searchQuery = ref('');
const filterLoaiBaoCao = ref('');

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await reportService.getAll({
      page: pagination.currentPage,
      limit: pagination.limit,
      q: searchQuery.value,
      loai_bao_cao: filterLoaiBaoCao.value || undefined,
    });

    reportList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading reports:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách báo cáo';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
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

const handleCreateNew = () => {
  router.push('/bao-cao/tao-moi');
};

const handleGenerate = (id: string) => {
  router.push(`/bao-cao/xem/${id}`);
};

const handleEdit = (id: string) => {
  router.push(`/bao-cao/chinh-sua/${id}`);
};

const handleExport = async (id: string) => {
  try {
    ElMessage.info('Đang xuất báo cáo...');
    reportService.downloadExport(id);
    ElMessage.success('Xuất báo cáo thành công');
  } catch (err: any) {
    console.error('Error exporting report:', err);
    ElMessage.error('Không thể xuất báo cáo');
  }
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa báo cáo này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await reportService.delete(id);
    ElMessage.success('Xóa báo cáo thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting report:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa báo cáo');
    }
  }
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

const getUserEmail = (user: string | User | undefined): string => {
  if (!user) return '-';
  if (typeof user === 'string') return user;
  return user.email || '-';
};

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('vi-VN');
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.report-list-page {
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

.report-name {
  color: #409eff;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-actions {
    width: 100%;

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

<template>
  <div class="consent-hub-page">
    <div class="page-header">
      <div>
        <h2>Consent Hub</h2>
        <p>Theo dõi tình trạng đồng ý dữ liệu cá nhân theo Nghị định 13.</p>
      </div>
      <el-button :icon="Refresh" @click="handleRefresh">Làm mới</el-button>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>Tổng quan</h3>
          <small>{{ overviewTotal }} nhân viên đã cập nhật consent</small>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col
          v-for="item in overview"
          :key="item.key"
          :xs="24"
          :sm="12"
          :md="8"
        >
          <el-card class="overview-card" :body-style="{padding: '16px'}">
            <div class="overview-card__title">
              <strong>{{ item.name }}</strong>
              <el-tag v-if="item.required" size="small" type="danger">
                Bắt buộc
              </el-tag>
            </div>
            <div class="overview-card__stats">
              <div>
                <span>Đồng ý</span>
                <strong>{{ item.accepted }}</strong>
              </div>
              <div>
                <span>Từ chối</span>
                <strong>{{ item.withdrawn }}</strong>
              </div>
              <div>
                <span>Chưa phản hồi</span>
                <strong>{{ item.pending }}</strong>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>Danh sách nhân viên & trạng thái đồng ý</h3>
          <div class="card-filters">
            <el-select
              v-model="filters.phong_ban_id"
              placeholder="Phòng ban"
              clearable
              size="small"
            >
              <el-option
                v-for="dept in deptOptions"
                :key="dept._id"
                :label="dept.ten"
                :value="dept._id"
              />
            </el-select>
            <el-input
              v-model="filters.q"
              placeholder="Tìm theo mã hoặc tên"
              size="small"
              clearable
            />
            <el-button size="small" :icon="Search" @click="handleSearch">
              Lọc
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="rows"
        v-loading="loading"
        :empty-text="loading ? 'Đang tải...' : 'Chưa có dữ liệu'"
      >
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div class="employee-cell">
              <strong>{{ fullName(row.nhan_vien) }}</strong>
              <span>{{ row.nhan_vien.ma_nhan_vien }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Phòng ban" min-width="160">
          <template #default="{row}">
            {{ row.phong_ban?.ten || '--' }}
          </template>
        </el-table-column>
        <el-table-column
          v-for="purpose in overview"
          :key="purpose.key"
          :label="purpose.name"
          min-width="160"
        >
          <template #default="{row}">
            <el-tag
              size="small"
              :type="statusTag(getStatus(row, purpose.key))"
            >
              {{ statusLabel(getStatus(row, purpose.key)) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
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
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {Refresh, Search} from '@element-plus/icons-vue';
import consentService from '@/services/consentService';
import phongBanService from '@/services/phongBanService';
import {
  ConsentOverviewItem,
  ConsentAdminRow,
  PhongBan,
  ConsentStatus,
} from '@/types';

const overview = ref<ConsentOverviewItem[]>([]);
const rows = ref<ConsentAdminRow[]>([]);
const deptOptions = ref<PhongBan[]>([]);
const loading = ref(false);
const filters = reactive({
  phong_ban_id: '',
  q: '',
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const overviewTotal = computed(() => {
  if (!overview.value.length) return 0;
  return (
    overview.value.reduce((sum, item) => sum + item.accepted + item.pending + item.withdrawn, 0) /
    overview.value.length
  );
});

const statusLabel = (status?: ConsentStatus | 'Pending') => {
  switch (status) {
    case 'Accepted':
      return 'Đồng ý';
    case 'Withdrawn':
      return 'Đã rút';
    case 'Pending':
    default:
      return 'Chưa phản hồi';
  }
};

const statusTag = (status?: string) => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Withdrawn':
      return 'danger';
    default:
      return 'info';
  }
};

const fullName = (nv: ConsentAdminRow['nhan_vien']) =>
  `${nv.ho_dem || ''} ${nv.ten || ''}`.trim();

const getStatus = (row: ConsentAdminRow, purposeKey: string) => {
  const record = row.purposes.find((item) => item.key === purposeKey);
  return record?.status || 'Pending';
};

const loadOverview = async () => {
  try {
    overview.value = await consentService.getOverview();
  } catch (err: any) {
    console.error('loadOverview error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải tổng quan consent');
  }
};

const loadDepartments = async () => {
  try {
    const response = await phongBanService.getAll({limit: 200});
    deptOptions.value = response.data || [];
  } catch {
    deptOptions.value = [];
  }
};

const loadTracking = async () => {
  loading.value = true;
  try {
    const response = await consentService.getTracking({
      page: pagination.page,
      limit: pagination.limit,
      phong_ban_id: filters.phong_ban_id || undefined,
      q: filters.q || undefined,
    });
    rows.value = response.data || [];
    pagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadTracking error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải danh sách consent');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadTracking();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadTracking();
};

const handleRefresh = () => {
  loadOverview();
  loadTracking();
};

onMounted(() => {
  loadDepartments();
  handleRefresh();
});
</script>

<style scoped lang="scss">
.consent-hub-page {
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
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-sm;

  h3 {
    margin: 0;
  }

  small {
    color: $text-secondary;
  }
}

.overview-card {
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__stats {
    display: flex;
    justify-content: space-between;

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;

      span {
        color: $text-secondary;
        font-size: $font-size-sm;
      }

      strong {
        font-size: $font-size-lg;
      }
    }
  }
}

.card-filters {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-sm;
}
</style>

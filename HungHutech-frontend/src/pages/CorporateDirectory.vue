<template>
  <div class="orangehrm-directory-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Danh bạ công ty</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
      </div>
    </div>

    <!-- Search & Advanced Filters -->
    <el-card class="orangehrm-search-card" shadow="never">
      <el-row :gutter="16">
        <!-- Search Input -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-input
            v-model="searchQuery"
            placeholder="Tìm theo tên, chức danh..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>

        <!-- Department Filter -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterPhongBan"
            placeholder="Phòng ban"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả phòng ban" value="" />
            <el-option
              v-for="dept in phongBanList"
              :key="dept._id"
              :label="dept.ten"
              :value="dept._id"
            />
          </el-select>
        </el-col>

        <!-- Location Filter -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterDiaDiem"
            placeholder="Địa điểm"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả địa điểm" value="" />
            <el-option
              v-for="loc in diaDiemList"
              :key="loc._id"
              :label="loc.ten"
              :value="loc._id"
            />
          </el-select>
        </el-col>

        <!-- Job Title Filter -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterChucDanh"
            placeholder="Chức danh"
            clearable
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option label="Tất cả chức danh" value="" />
            <el-option
              v-for="title in chucDanhList"
              :key="title._id"
              :label="title.ten_chuc_danh"
              :value="title._id"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Employee Cards Grid -->
    <el-card
      v-loading="loading"
      class="orangehrm-cards-container"
      shadow="never"
    >
      <div v-if="filteredEmployees.length === 0" class="orangehrm-empty-state">
        <el-empty
          :description="error || 'Không tìm thấy nhân viên nào'"
          :image-size="120"
        />
      </div>

      <div v-else class="orangehrm-employee-grid">
        <el-card
          v-for="employee in paginatedEmployees"
          :key="employee._id"
          class="orangehrm-employee-card"
          shadow="hover"
          @click="handleViewEmployee(employee._id)"
        >
          <div class="orangehrm-card-content">
            <!-- Avatar -->
            <div class="orangehrm-card-avatar">
              <el-avatar
                :size="80"
                :src="
                  employee.avatar_url
                    ? uploadService.getFileUrl(employee.avatar_url)
                    : undefined
                "
              >
                <el-icon :size="40"><User /></el-icon>
              </el-avatar>
            </div>

            <!-- Employee Info -->
            <div class="orangehrm-card-info">
              <h3 class="orangehrm-card-name">
                {{ employee.ho_dem }} {{ employee.ten }}
              </h3>

              <div class="orangehrm-card-details">
                <!-- Job Title -->
                <div
                  v-if="employee.thong_tin_cong_viec?.chuc_danh_id"
                  class="orangehrm-card-item"
                >
                  <el-icon class="orangehrm-card-icon"><Briefcase /></el-icon>
                  <span class="orangehrm-card-text">
                    {{
                      employee.thong_tin_cong_viec.chuc_danh_id.ten_chuc_danh
                    }}
                  </span>
                </div>

                <!-- Department -->
                <div
                  v-if="employee.thong_tin_cong_viec?.phong_ban_id"
                  class="orangehrm-card-item"
                >
                  <el-icon class="orangehrm-card-icon"
                    ><OfficeBuilding
                  /></el-icon>
                  <span class="orangehrm-card-text">
                    {{ employee.thong_tin_cong_viec.phong_ban_id.ten }}
                  </span>
                </div>

                <!-- Location -->
                <div v-if="employee.dia_diem" class="orangehrm-card-item">
                  <el-icon class="orangehrm-card-icon"><Location /></el-icon>
                  <span class="orangehrm-card-text">
                    {{ employee.dia_diem }}
                  </span>
                </div>

                <!-- Phone -->
                <div
                  v-if="employee.lien_he?.di_dong"
                  class="orangehrm-card-item"
                >
                  <el-icon class="orangehrm-card-icon"><Phone /></el-icon>
                  <span class="orangehrm-card-text">
                    {{ employee.lien_he.di_dong }}
                  </span>
                </div>

                <!-- Email -->
                <div
                  v-if="employee.lien_he?.email_cong_viec"
                  class="orangehrm-card-item"
                >
                  <el-icon class="orangehrm-card-icon"><Message /></el-icon>
                  <span class="orangehrm-card-text orangehrm-card-email">
                    {{ employee.lien_he.email_cong_viec }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- View Details Button -->
          <div class="orangehrm-card-footer">
            <el-button type="primary" size="small" :icon="View" text>
              Xem chi tiết
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- Pagination -->
      <div v-if="filteredEmployees.length > 0" class="orangehrm-pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.limit"
          :page-sizes="[12, 24, 48, 96]"
          :total="filteredEmployees.length"
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
import {useRouter} from 'vue-router';
import {
  Search,
  Refresh,
  User,
  View,
  Briefcase,
  OfficeBuilding,
  Location,
  Phone,
  Message,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import phongBanService from '@/services/phongBanService';
import chucDanhService from '@/services/chucDanhService';
import diaDiemService from '@/services/diaDiemService';
import uploadService from '@/services/uploadService';
import {NhanVien, PhongBan, ChucDanh, DiaDiem} from '@/types';

const router = useRouter();

// Data
const nhanVienList = ref<NhanVien[]>([]);
const phongBanList = ref<PhongBan[]>([]);
const chucDanhList = ref<ChucDanh[]>([]);
const diaDiemList = ref<DiaDiem[]>([]);
const loading = ref(false);
const error = ref('');

// Filters
const searchQuery = ref('');
const filterPhongBan = ref('');
const filterDiaDiem = ref('');
const filterChucDanh = ref('');

// Pagination
const pagination = reactive({
  currentPage: 1,
  limit: 12,
});

// Computed - Filtered Employees
const filteredEmployees = computed(() => {
  let result = [...nhanVienList.value];

  // Search by name or job title
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter((emp) => {
      const fullName = `${emp.ho_dem} ${emp.ten}`.toLowerCase();
      const jobTitle =
        emp.thong_tin_cong_viec?.chuc_danh_id?.ten_chuc_danh?.toLowerCase() ||
        '';
      return fullName.includes(query) || jobTitle.includes(query);
    });
  }

  // Filter by department
  if (filterPhongBan.value) {
    result = result.filter(
      (emp) =>
        emp.thong_tin_cong_viec?.phong_ban_id?._id === filterPhongBan.value,
    );
  }

  // Filter by location
  if (filterDiaDiem.value) {
    result = result.filter((emp) => emp.dia_diem === filterDiaDiem.value);
  }

  // Filter by job title
  if (filterChucDanh.value) {
    result = result.filter(
      (emp) =>
        emp.thong_tin_cong_viec?.chuc_danh_id?._id === filterChucDanh.value,
    );
  }

  return result;
});

// Computed - Paginated Employees
const paginatedEmployees = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredEmployees.value.slice(start, end);
});

// Load all data
const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    // Load employees with large limit to get all
    const [employeesRes, departmentsRes, titlesRes, locationsRes] =
      await Promise.all([
        nhanVienService.getAll({limit: 1000}),
        phongBanService.getAll({limit: 1000}),
        chucDanhService.getAll({limit: 1000}),
        diaDiemService.getAll({limit: 1000}),
      ]);

    nhanVienList.value = employeesRes.data || [];
    phongBanList.value = departmentsRes.data || [];
    chucDanhList.value = titlesRes.data || [];
    diaDiemList.value = locationsRes.data || [];
  } catch (err: any) {
    console.error('Error loading directory data:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh bạ công ty';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// Search handler
const handleSearch = () => {
  pagination.currentPage = 1;
};

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  // Scroll to top
  window.scrollTo({top: 0, behavior: 'smooth'});
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.currentPage = 1;
};

// View employee details
const handleViewEmployee = (id: string) => {
  router.push(`/nhan-vien/${id}`);
};

// Initialize
onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-directory-page {
  width: 100%;
}

// Page Header
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

// Search Card
.orangehrm-search-card {
  margin-bottom: $spacing-lg;

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

// Cards Container
.orangehrm-cards-container {
  :deep(.el-card__body) {
    padding: $spacing-xl;
  }
}

// Empty State
.orangehrm-empty-state {
  padding: $spacing-xxl 0;
  text-align: center;
}

// Employee Grid
.orangehrm-employee-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

// Employee Card
.orangehrm-employee-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.orangehrm-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.orangehrm-card-avatar {
  margin-bottom: $spacing-md;

  .el-avatar {
    background-color: $primary-color;
    color: white;
  }
}

.orangehrm-card-info {
  width: 100%;
}

.orangehrm-card-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
  line-height: 1.4;
}

.orangehrm-card-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  text-align: left;
}

.orangehrm-card-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.orangehrm-card-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: $primary-color;
}

.orangehrm-card-text {
  flex: 1;
  word-break: break-word;
  line-height: 1.5;
}

.orangehrm-card-email {
  color: $primary-color;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.orangehrm-card-footer {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: center;
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: center;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

// Responsive Design
// Tablet - 2 columns
@media (max-width: 1024px) {
  .orangehrm-employee-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

// Mobile - 1 column
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

  .orangehrm-employee-grid {
    grid-template-columns: 1fr;
  }

  .orangehrm-pagination {
    padding: $spacing-md 0;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}

// Small mobile adjustments
@media (max-width: 480px) {
  .orangehrm-cards-container {
    :deep(.el-card__body) {
      padding: $spacing-md;
    }
  }

  .orangehrm-employee-card {
    :deep(.el-card__body) {
      padding: $spacing-md;
    }
  }

  .orangehrm-card-avatar {
    .el-avatar {
      width: 64px !important;
      height: 64px !important;

      .el-icon {
        font-size: 32px !important;
      }
    }
  }

  .orangehrm-card-name {
    font-size: $font-size-base;
  }

  .orangehrm-pagination {
    :deep(.el-pagination) {
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>

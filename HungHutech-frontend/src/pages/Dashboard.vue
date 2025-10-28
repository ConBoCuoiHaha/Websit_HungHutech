<template>
  <div class="orangehrm-dashboard">
    <!-- Page Header -->
    <div class="orangehrm-dashboard-header">
      <h1 class="orangehrm-dashboard-title">Dashboard</h1>
      <p class="orangehrm-dashboard-subtitle">Tổng quan hệ thống quản lý nhân sự</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" v-loading="loading" class="orangehrm-loading-container">
      <el-empty description="Đang tải dữ liệu..." />
    </div>

    <!-- Error State -->
    <el-alert
      v-else-if="error"
      type="error"
      title="Lỗi tải dữ liệu"
      :description="error"
      show-icon
      :closable="false"
      class="orangehrm-alert"
    >
      <template #default>
        <el-button type="danger" @click="loadData" style="margin-top: 12px">
          Thử lại
        </el-button>
      </template>
    </el-alert>

    <!-- Dashboard Content -->
    <div v-else class="orangehrm-dashboard-content">
      <!-- Statistics Cards -->
      <el-row :gutter="20" class="orangehrm-stats-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--primary">
            <div class="orangehrm-stat-wrapper">
              <div class="orangehrm-stat-icon">
                <el-icon :size="48" color="#4A90E2">
                  <User />
                </el-icon>
              </div>
              <div class="orangehrm-stat-content">
                <span class="orangehrm-stat-label">Tổng nhân viên</span>
                <el-statistic
                  :value="summary?.employees || 0"
                  class="orangehrm-statistic"
                />
                <span class="orangehrm-stat-desc">Nhân viên đang làm việc</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--success">
            <div class="orangehrm-stat-wrapper">
              <div class="orangehrm-stat-icon">
                <el-icon :size="48" color="#28a745">
                  <Clock />
                </el-icon>
              </div>
              <div class="orangehrm-stat-content">
                <span class="orangehrm-stat-label">Chấm công hôm nay</span>
                <el-statistic
                  :value="summary?.attendanceToday || 0"
                  class="orangehrm-statistic"
                />
                <span class="orangehrm-stat-desc">Nhân viên đã vào làm</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--warning">
            <div class="orangehrm-stat-wrapper">
              <div class="orangehrm-stat-icon">
                <el-icon :size="48" color="#ffc107">
                  <Calendar />
                </el-icon>
              </div>
              <div class="orangehrm-stat-content">
                <span class="orangehrm-stat-label">Chờ duyệt nghỉ phép</span>
                <el-statistic
                  :value="summary?.leavePending || 0"
                  class="orangehrm-statistic"
                />
                <span class="orangehrm-stat-desc">Yêu cầu chưa xử lý</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <el-card shadow="hover" class="orangehrm-stat-card orangehrm-stat-card--info">
            <div class="orangehrm-stat-wrapper">
              <div class="orangehrm-stat-icon">
                <el-icon :size="48" color="#17a2b8">
                  <OfficeBuilding />
                </el-icon>
              </div>
              <div class="orangehrm-stat-content">
                <span class="orangehrm-stat-label">Phòng ban</span>
                <el-statistic
                  :value="summary?.departments || 0"
                  class="orangehrm-statistic"
                />
                <span class="orangehrm-stat-desc">Tổng phòng ban</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Charts Section -->
      <el-row :gutter="20" class="orangehrm-charts-row">
        <!-- Attendance Trend Chart -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="orangehrm-chart-card">
            <template #header>
              <div class="orangehrm-card-header">
                <span class="orangehrm-card-title">
                  <el-icon style="vertical-align: middle; margin-right: 8px">
                    <TrendCharts />
                  </el-icon>
                  Xu hướng chấm công 7 ngày qua
                </span>
              </div>
            </template>
            <v-chart :option="attendanceChartOption" class="orangehrm-chart" autoresize />
          </el-card>
        </el-col>

        <!-- Leave Types Distribution Chart -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="orangehrm-chart-card">
            <template #header>
              <div class="orangehrm-card-header">
                <span class="orangehrm-card-title">
                  <el-icon style="vertical-align: middle; margin-right: 8px">
                    <PieChart />
                  </el-icon>
                  Phân bổ loại nghỉ phép
                </span>
              </div>
            </template>
            <v-chart :option="leaveTypesChartOption" class="orangehrm-chart" autoresize />
          </el-card>
        </el-col>
      </el-row>

      <!-- Quick Actions -->
      <div class="orangehrm-quick-actions">
        <h2 class="orangehrm-section-title">
          <el-icon style="vertical-align: middle; margin-right: 8px">
            <Lightning />
          </el-icon>
          Thao tác nhanh
        </h2>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <router-link to="/nhan-vien" class="orangehrm-action-link">
              <el-card shadow="hover" class="orangehrm-action-card">
                <div class="orangehrm-action-icon">
                  <el-icon :size="40" color="#4A90E2">
                    <User />
                  </el-icon>
                </div>
                <h3 class="orangehrm-action-title">Quản lý Nhân viên</h3>
                <p class="orangehrm-action-desc">
                  Xem và quản lý thông tin nhân viên
                </p>
              </el-card>
            </router-link>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <router-link to="/chuc-danh" class="orangehrm-action-link">
              <el-card shadow="hover" class="orangehrm-action-card">
                <div class="orangehrm-action-icon">
                  <el-icon :size="40" color="#4A90E2">
                    <Briefcase />
                  </el-icon>
                </div>
                <h3 class="orangehrm-action-title">Chức danh</h3>
                <p class="orangehrm-action-desc">
                  Quản lý các chức danh trong công ty
                </p>
              </el-card>
            </router-link>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <router-link to="/phong-ban" class="orangehrm-action-link">
              <el-card shadow="hover" class="orangehrm-action-card">
                <div class="orangehrm-action-icon">
                  <el-icon :size="40" color="#4A90E2">
                    <OfficeBuilding />
                  </el-icon>
                </div>
                <h3 class="orangehrm-action-title">Phòng ban</h3>
                <p class="orangehrm-action-desc">
                  Quản lý cơ cấu tổ chức
                </p>
              </el-card>
            </router-link>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {
  User,
  Calendar,
  Clock,
  Lightning,
  Briefcase,
  OfficeBuilding,
  TrendCharts,
  PieChart,
} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import VChart from 'vue-echarts';
import {use} from 'echarts/core';
import {CanvasRenderer} from 'echarts/renderers';
import {BarChart, LineChart, PieChart as EPieChart} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import dashboardService from '@/services/dashboardService';
import {DashboardSummary} from '@/types';

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  EPieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const summary = ref<DashboardSummary | null>(null);
const loading = ref(false);
const error = ref('');

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    summary.value = await dashboardService.getSummary();
  } catch (err: any) {
    console.error('Error loading dashboard:', err);
    error.value = err.response?.data?.msg || 'Không thể tải dữ liệu dashboard';
    ElMessage.error('Không thể tải dữ liệu dashboard');
  } finally {
    loading.value = false;
  }
};

// Attendance Trend Chart
const attendanceChartOption = computed(() => {
  const trend = summary.value?.attendanceTrend || [];
  const dates = trend.map((item) => item.date);
  const present = trend.map((item) => item.present);
  const absent = trend.map((item) => item.absent);
  const late = trend.map((item) => item.late);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['Có mặt', 'Vắng mặt', 'Đi muộn'],
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        },
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Có mặt',
        type: 'bar',
        data: present,
        itemStyle: {color: '#28a745'},
      },
      {
        name: 'Vắng mặt',
        type: 'bar',
        data: absent,
        itemStyle: {color: '#dc3545'},
      },
      {
        name: 'Đi muộn',
        type: 'bar',
        data: late,
        itemStyle: {color: '#ffc107'},
      },
    ],
  };
});

// Leave Types Distribution Chart
const leaveTypesChartOption = computed(() => {
  const distribution = summary.value?.leaveTypesDistribution || [];

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Loại nghỉ phép',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: distribution,
      },
    ],
  };
});

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.orangehrm-dashboard {
  width: 100%;
}

// Page Header
.orangehrm-dashboard-header {
  margin-bottom: $spacing-xl;
}

.orangehrm-dashboard-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.orangehrm-dashboard-subtitle {
  font-size: $font-size-base;
  color: $text-secondary;
  margin: 0;
}

// Loading & Error States
.orangehrm-loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orangehrm-alert {
  margin-bottom: $spacing-xl;
}

// Dashboard Content
.orangehrm-dashboard-content {
  width: 100%;
}

// Statistics Row
.orangehrm-stats-row {
  margin-bottom: $spacing-xl;
}

.orangehrm-stat-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  &--primary {
    border-left: 4px solid $primary-color;
  }

  &--warning {
    border-left: 4px solid $warning-color;
  }

  &--success {
    border-left: 4px solid $success-color;
  }

  &--info {
    border-left: 4px solid #17a2b8;
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.orangehrm-stat-wrapper {
  display: flex;
  gap: $spacing-lg;
  align-items: flex-start;
}

.orangehrm-stat-icon {
  flex-shrink: 0;
}

.orangehrm-stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.orangehrm-stat-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orangehrm-statistic {
  :deep(.el-statistic__content) {
    font-size: 32px;
    font-weight: $font-weight-bold;
    color: $text-primary;
  }
}

.orangehrm-stat-desc {
  font-size: $font-size-sm;
  color: $text-disabled;
}

// Charts Section
.orangehrm-charts-row {
  margin-bottom: $spacing-xl;
}

.orangehrm-chart-card {
  height: 400px;

  :deep(.el-card__header) {
    border-bottom: 2px solid $primary-color;
  }

  :deep(.el-card__body) {
    height: calc(100% - 60px);
    padding: $spacing-lg;
  }
}

.orangehrm-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.orangehrm-card-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
  display: flex;
  align-items: center;
}

.orangehrm-chart {
  width: 100%;
  height: 100%;
}

// Quick Actions Section
.orangehrm-quick-actions {
  margin-top: $spacing-xl * 1.5;
}

.orangehrm-section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
  display: flex;
  align-items: center;
}

.orangehrm-action-link {
  text-decoration: none;
  display: block;
  height: 100%;
}

.orangehrm-action-card {
  height: 100%;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    border-color: $primary-color;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba($primary-color, 0.2);
  }

  :deep(.el-card__body) {
    padding: $spacing-xl;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.orangehrm-action-icon {
  margin-bottom: $spacing-md;
}

.orangehrm-action-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
}

.orangehrm-action-desc {
  font-size: $font-size-base;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
}

// Responsive Design
@media (max-width: 768px) {
  .orangehrm-dashboard-header {
    margin-bottom: $spacing-lg;
  }

  .orangehrm-dashboard-title {
    font-size: $font-size-lg;
  }

  .orangehrm-stats-row {
    margin-bottom: $spacing-lg;
  }

  .orangehrm-stat-card {
    :deep(.el-card__body) {
      padding: $spacing-md;
    }
  }

  .orangehrm-stat-wrapper {
    gap: $spacing-md;
  }

  .orangehrm-statistic {
    :deep(.el-statistic__content) {
      font-size: 24px;
    }
  }

  .orangehrm-action-card {
    :deep(.el-card__body) {
      padding: $spacing-lg;
    }
  }

  .orangehrm-chart-card {
    height: 300px;
    margin-bottom: $spacing-lg;
  }
}
</style>

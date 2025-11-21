<template>
  <div class="my-performance" v-loading="loading">
    <div class="section-header">
      <div>
        <h3>Đánh giá hiệu suất của tôi</h3>
        <p>Theo dõi điểm số, xếp loại và trạng thái chi trả thưởng.</p>
      </div>
      <el-button :icon="Refresh" @click="loadReviews">Tải lại</el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <p>Tổng số kỳ đánh giá</p>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="summary-card">
        <p>Hoàn tất</p>
        <strong>{{ summary.completed }}</strong>
      </div>
      <div class="summary-card">
        <p>Đang chờ</p>
        <strong>{{ summary.pending }}</strong>
      </div>
      <div class="summary-card">
        <p>Điểm TB</p>
        <strong>{{ summary.avgScore.toFixed(2) }}</strong>
      </div>
    </div>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="reviews"
        empty-text="Chưa có bản đánh giá nào"
      >
        <el-table-column label="Kỳ đánh giá" min-width="220">
          <template #default="{row}">
            <div class="period-text">{{ formatRange(row) }}</div>
            <small>
              Người đánh giá:
              {{ reviewerName(row.nguoi_danh_gia_id) }}
            </small>
          </template>
        </el-table-column>

        <el-table-column label="Điểm & Xếp loại" min-width="220">
          <template #default="{row}">
            <div class="score-row">
              <strong>{{ formatScore(row.diem_tong) }}</strong>
              <span>/ 5.0</span>
              <el-tag
                v-if="row.xep_loai"
                :type="ratingTag(row.xep_loai)"
                size="small"
              >
                {{ row.xep_loai }}
              </el-tag>
            </div>
            <el-progress
              :percentage="scorePercent(row)"
              :stroke-width="12"
              :show-text="false"
            />
          </template>
        </el-table-column>

        <el-table-column label="Thưởng hiệu suất" min-width="200">
          <template #default="{row}">
            <div class="bonus-row">
              <span>{{ formatCurrency(row.thuong_hieu_suat) }}</span>
              <el-tag
                :type="bonusTag(row)"
                size="small"
                effect="plain"
                style="margin-left: 8px"
              >
                {{ bonusStatusText(row) }}
              </el-tag>
            </div>
            <small v-if="lastPayroll(row)">
              Đã vào kỳ:
              {{ lastPayroll(row)?.ky_luong || '---' }}
            </small>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{row}">
            <el-tag :type="statusTag(row.trang_thai)" size="small">
              {{ statusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Chi tiết" width="120" align="center">
          <template #default="{row}">
            <el-button
              type="primary"
              link
              size="small"
              @click="viewDetail(row)"
            >
              Xem
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="pagination.total > pagination.limit">
        <el-pagination
          layout="total, prev, pager, next"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" :size="isMobile ? '100%' : '40%'">
      <template #header>
        <div class="detail-header">
          <h4>Chi tiết đánh giá</h4>
          <span>{{ selectedRange }}</span>
        </div>
      </template>
      <div v-if="selectedReview" class="detail-body">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="Người đánh giá">
            {{ reviewerName(selectedReview.nguoi_danh_gia_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="Điểm tổng">
            {{ formatScore(selectedReview.diem_tong) }} / 5
          </el-descriptions-item>
          <el-descriptions-item label="Xếp loại">
            <el-tag
              v-if="selectedReview.xep_loai"
              :type="ratingTag(selectedReview.xep_loai)"
              size="small"
            >
              {{ selectedReview.xep_loai }}
            </el-tag>
            <span v-else>Chưa xếp loại</span>
          </el-descriptions-item>
          <el-descriptions-item label="Thưởng hiệu suất">
            {{ formatCurrency(selectedReview.thuong_hieu_suat) }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="statusTag(selectedReview.trang_thai)" size="small">
              {{ statusText(selectedReview.trang_thai) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="ratings-section">
          <h4>KPI & điểm chi tiết</h4>
          <el-table
            :data="selectedReview.ratings"
            size="small"
            border
            empty-text="Chưa nhập KPI"
          >
            <el-table-column label="KPI" prop="kpi_id" min-width="200">
              <template #default="{row}">
                {{
                  typeof row.kpi_id === 'object' && row.kpi_id
                    ? row.kpi_id.ten
                    : '---'
                }}
              </template>
            </el-table-column>
            <el-table-column label="Điểm" width="120" prop="diem" />
            <el-table-column
              label="Ghi chú"
              prop="ghi_chu"
              min-width="200"
              show-overflow-tooltip
            />
          </el-table>
        </div>

        <div v-if="selectedReview.payroll_history?.length" class="history-section">
          <h4>Lịch sử chuyển sang bảng lương</h4>
          <el-timeline>
            <el-timeline-item
              v-for="item in selectedReview.payroll_history"
              :key="item.payroll_entry_id || item.ngay_chuyen"
              :timestamp="formatDate(item.ngay_chuyen)"
              type="success"
            >
              <p><strong>Kỳ lương:</strong> {{ item.ky_luong || '---' }}</p>
              <p><strong>Số tiền:</strong> {{ formatCurrency(item.so_tien) }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {Refresh} from '@element-plus/icons-vue';
import {computed, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import dayjs from 'dayjs';
import performanceReviewService from '@/services/performanceReviewService';
import {PerformanceReview} from '@/types';

const reviews = ref<PerformanceReview[]>([]);
const loading = ref(false);
const pagination = reactive({page: 1, limit: 10, total: 0});
const detailVisible = ref(false);
const selectedReview = ref<PerformanceReview | null>(null);

const loadReviews = async () => {
  loading.value = true;
  try {
    const response = await performanceReviewService.getMine({
      page: pagination.page,
      limit: pagination.limit,
    });
    reviews.value = response.data || [];
    pagination.total = response.pagination?.total || reviews.value.length;
  } catch (err: any) {
    console.error('loadReviews error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải đánh giá');
  } finally {
    loading.value = false;
  }
};

const summary = computed(() => {
  const total = pagination.total || reviews.value.length;
  const completed = reviews.value.filter(
    (item) => item.trang_thai === 'Completed',
  ).length;
  const pending = reviews.value.filter(
    (item) => item.trang_thai !== 'Completed',
  ).length;
  const avg =
    reviews.value.reduce((sum, item) => sum + (item.diem_tong || 0), 0) /
      (reviews.value.length || 1) || 0;
  return {total, completed, pending, avgScore: avg};
});

const formatRange = (row: PerformanceReview) => {
  return `${formatDate(row.tu_ngay)} - ${formatDate(row.den_ngay)}`;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '---';
  return dayjs(value).format('DD/MM/YYYY');
};

const reviewerName = (value: PerformanceReview['nguoi_danh_gia_id']) => {
  if (!value) return '---';
  if (typeof value === 'string') return value;
  return `${value.ho_dem || ''} ${value.ten || ''}`.trim() || '---';
};

const formatScore = (value?: number) => {
  if (value === undefined || value === null) return '0.00';
  return value.toFixed(2);
};

const scorePercent = (row: PerformanceReview) => {
  const value = Math.max(0, Math.min(5, row.diem_tong || 0));
  return Math.round((value / 5) * 100);
};

const ratingTag = (label: PerformanceReview['xep_loai']) => {
  switch (label) {
    case 'A':
      return 'success';
    case 'B':
      return 'info';
    case 'C':
      return 'warning';
    default:
      return 'danger';
  }
};

const statusText = (status: PerformanceReview['trang_thai']) => {
  if (status === 'Draft') return 'Nháp';
  if (status === 'InReview') return 'Đang đánh giá';
  return 'Đã hoàn tất';
};

const statusTag = (status: PerformanceReview['trang_thai']) => {
  if (status === 'Completed') return 'success';
  if (status === 'InReview') return 'warning';
  return 'info';
};

const formatCurrency = (value?: number) => {
  if (!value) return '0 đ';
  return `${value.toLocaleString('vi-VN')} đ`;
};

const lastPayroll = (review: PerformanceReview) => {
  const items = review.payroll_history || [];
  if (!items.length) return null;
  return items[items.length - 1];
};

const bonusTag = (review: PerformanceReview) => {
  if (!review.thuong_hieu_suat) return 'info';
  return review.da_chuyen_payroll ? 'success' : 'warning';
};

const bonusStatusText = (review: PerformanceReview) => {
  if (!review.thuong_hieu_suat) return 'Không có';
  return review.da_chuyen_payroll ? 'Đã trả' : 'Chờ chi trả';
};

const viewDetail = (review: PerformanceReview) => {
  selectedReview.value = review;
  detailVisible.value = true;
};

const selectedRange = computed(() =>
  selectedReview.value ? formatRange(selectedReview.value) : '',
);

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadReviews();
};

const isMobile = window.matchMedia('(max-width: 768px)').matches;

onMounted(() => {
  loadReviews();
});
</script>

<style scoped lang="scss">
.my-performance {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-md;

  h3 {
    margin: 0;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: $spacing-md;
}

.summary-card {
  border: 1px solid $border-color;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  background: $bg-gray;

  p {
    margin: 0;
    color: $text-secondary;
  }

  strong {
    display: block;
    margin-top: $spacing-xs;
    font-size: $font-size-xl;
  }
}

.period-text {
  font-weight: $font-weight-medium;
}

.score-row {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-xxs;

  strong {
    font-size: $font-size-lg;
  }
}

.bonus-row {
  display: flex;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-md;
}

.detail-header {
  display: flex;
  flex-direction: column;

  h4 {
    margin: 0;
  }

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.ratings-section,
.history-section {
  h4 {
    margin-bottom: $spacing-sm;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>

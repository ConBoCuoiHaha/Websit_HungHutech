<template>
  <div class="orangehrm-review-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Đánh giá hiệu suất</h1>
      <div class="orangehrm-page-actions">
        <el-button @click="loadData" :icon="Refresh">Tải lại</el-button>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
          Tạo đánh giá mới
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
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

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option label="Nháp" value="Draft" />
            <el-option label="Đang đánh giá" value="InReview" />
            <el-option label="Hoàn thành" value="Completed" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleFilterChange" :icon="Search">
            Tìm kiếm
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Review Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="reviewList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="nhan_vien_id" label="Nhân viên" min-width="200">
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

        <el-table-column label="Thời gian đánh giá" width="200">
          <template #default="{ row }">
            {{ formatDate(row.tu_ngay) }} - {{ formatDate(row.den_ngay) }}
          </template>
        </el-table-column>

        <el-table-column prop="diem_tong" label="Điểm" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.diem_tong)" size="large">
              {{ row.diem_tong.toFixed(1) }}/5
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ getStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{ row }">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="260" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" :icon="View" @click="handleView(row)">Xem</el-button>
              <el-button
                v-if="row.trang_thai !== 'Completed'"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                Sửa
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Draft'"
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

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa đánh giá' : 'Tạo đánh giá mới'"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nhân viên" prop="nhan_vien_id" required>
              <el-select
                v-model="form.nhan_vien_id"
                placeholder="Chọn nhân viên..."
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
          </el-col>

          <el-col :span="12">
            <el-form-item label="Người đánh giá" prop="nguoi_danh_gia_id" required>
              <el-select
                v-model="form.nguoi_danh_gia_id"
                placeholder="Chọn người đánh giá..."
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
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Từ ngày" prop="tu_ngay" required>
              <el-date-picker
                v-model="form.tu_ngay"
                type="date"
                placeholder="Chọn ngày bắt đầu..."
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Đến ngày" prop="den_ngay" required>
              <el-date-picker
                v-model="form.den_ngay"
                type="date"
                placeholder="Chọn ngày kết thúc..."
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Trạng thái" prop="trang_thai" required>
          <el-radio-group v-model="form.trang_thai">
            <el-radio value="Draft">Nháp</el-radio>
            <el-radio value="InReview">Đang đánh giá</el-radio>
            <el-radio value="Completed">Hoàn thành</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider>Đánh giá KPI</el-divider>

        <div v-for="(rating, index) in form.ratings" :key="index" class="orangehrm-rating-item">
          <el-row :gutter="20">
            <el-col :span="10">
              <el-form-item
                :prop="`ratings.${index}.kpi_id`"
                label="KPI"
                :rules="[{required: true, message: 'Vui lòng chọn KPI'}]"
              >
                <el-select
                  v-model="rating.kpi_id"
                  placeholder="Chọn KPI..."
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="kpi in kpis"
                    :key="kpi._id"
                    :label="`${kpi.ten} (${kpi.trong_so}%)`"
                    :value="kpi._id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item
                :prop="`ratings.${index}.diem`"
                label="Điểm"
                :rules="[
                  {required: true, message: 'Vui lòng nhập điểm'},
                  {type: 'number', min: 0, max: 5, message: 'Điểm từ 0-5'},
                ]"
              >
                <el-rate
                  v-model="rating.diem"
                  :max="5"
                  allow-half
                  show-score
                  score-template="{value}"
                />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item :prop="`ratings.${index}.ghi_chu`" label="Ghi chú">
                <el-input
                  v-model="rating.ghi_chu"
                  placeholder="Ghi chú..."
                  maxlength="200"
                />
              </el-form-item>
            </el-col>

            <el-col :span="2">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeRating(index)"
                :disabled="form.ratings.length <= 1"
              />
            </el-col>
          </el-row>
        </div>

        <el-button type="primary" :icon="Plus" @click="addRating" style="width: 100%">
          Thêm KPI đánh giá
        </el-button>

        <el-divider />

        <el-form-item label="Điểm tổng">
          <el-tag type="success" size="large">
            <strong>{{ calculateTotalScore() }}/5.0</strong>
          </el-tag>
          <span class="orangehrm-score-hint">
            (Tính theo trọng số của các KPI)
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="showViewDialog" title="Chi tiết đánh giá hiệu suất" width="800px">
      <div v-if="selectedReview" class="orangehrm-review-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Nhân viên">
            <div v-if="typeof selectedReview.nhan_vien_id === 'object' && selectedReview.nhan_vien_id">
              <strong>{{ selectedReview.nhan_vien_id.ma_nhan_vien }}</strong>
              <div>{{ selectedReview.nhan_vien_id.ho_dem }} {{ selectedReview.nhan_vien_id.ten }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Người đánh giá">
            <div v-if="typeof selectedReview.nguoi_danh_gia_id === 'object' && selectedReview.nguoi_danh_gia_id">
              {{ selectedReview.nguoi_danh_gia_id.ho_dem }} {{ selectedReview.nguoi_danh_gia_id.ten }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Từ ngày">
            {{ formatDate(selectedReview.tu_ngay) }}
          </el-descriptions-item>

          <el-descriptions-item label="Đến ngày">
            {{ formatDate(selectedReview.den_ngay) }}
          </el-descriptions-item>

          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedReview.trang_thai)">
              {{ getStatusText(selectedReview.trang_thai) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Điểm tổng">
            <el-tag :type="getScoreType(selectedReview.diem_tong)" size="large">
              <strong>{{ selectedReview.diem_tong.toFixed(1) }}/5.0</strong>
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Ngày tạo">
            {{ formatDate(selectedReview.ngay_tao) }}
          </el-descriptions-item>

          <el-descriptions-item label="Cập nhật cuối">
            {{ formatDate(selectedReview.ngay_cap_nhat) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>Chi tiết đánh giá KPI</el-divider>

        <el-table :data="selectedReview.ratings" border stripe>
          <el-table-column type="index" label="STT" width="60" />

          <el-table-column prop="kpi_id" label="KPI" min-width="200">
            <template #default="{ row }">
              <div v-if="typeof row.kpi_id === 'object' && row.kpi_id">
                <strong>{{ row.kpi_id.ten }}</strong>
                <div class="orangehrm-text-muted">Trọng số: {{ row.kpi_id.trong_so }}%</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="diem" label="Điểm" width="180" align="center">
            <template #default="{ row }">
              <el-rate :model-value="row.diem" disabled show-score score-template="{value}" />
            </template>
          </el-table-column>

          <el-table-column prop="ghi_chu" label="Ghi chú" min-width="200">
            <template #default="{ row }">
              {{ row.ghi_chu || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Search, Refresh, Plus, Edit, Delete, View} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import performanceReviewService from '@/services/performanceReviewService';
import kpiService from '@/services/kpiService';
import nhanVienService from '@/services/nhanVienService';
import {PerformanceReview, KPI, NhanVien, Rating} from '@/types';

const reviewList = ref<PerformanceReview[]>([]);
const kpis = ref<KPI[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const showViewDialog = ref(false);
const editingId = ref('');
const selectedReview = ref<PerformanceReview | null>(null);
const formRef = ref<FormInstance>();

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  nhan_vien_id: '',
  trang_thai: '',
});

const form = reactive<{
  nhan_vien_id: string;
  nguoi_danh_gia_id: string;
  tu_ngay: string;
  den_ngay: string;
  trang_thai: string;
  ratings: Rating[];
}>({
  nhan_vien_id: '',
  nguoi_danh_gia_id: '',
  tu_ngay: '',
  den_ngay: '',
  trang_thai: 'Draft',
  ratings: [
    {
      kpi_id: '',
      diem: 0,
      ghi_chu: '',
    },
  ],
});

const formRules: FormRules = {
  nhan_vien_id: [{required: true, message: 'Vui lòng chọn nhân viên', trigger: 'change'}],
  nguoi_danh_gia_id: [{required: true, message: 'Vui lòng chọn người đánh giá', trigger: 'change'}],
  tu_ngay: [{required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change'}],
  den_ngay: [{required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change'}],
  trang_thai: [{required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'}],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.nhan_vien_id) params.nhan_vien_id = filters.nhan_vien_id;
    if (filters.trang_thai) params.trang_thai = filters.trang_thai;

    const response = await performanceReviewService.getAll(params);
    reviewList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading reviews:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách đánh giá';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const loadKPIs = async () => {
  try {
    const response = await kpiService.getAll({limit: 1000, kich_hoat: true});
    kpis.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading KPIs:', err);
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

const addRating = () => {
  form.ratings.push({
    kpi_id: '',
    diem: 0,
    ghi_chu: '',
  });
};

const removeRating = (index: number) => {
  if (form.ratings.length > 1) {
    form.ratings.splice(index, 1);
  }
};

const calculateTotalScore = (): string => {
  let totalScore = 0;
  let totalWeight = 0;

  form.ratings.forEach((rating) => {
    const kpi = kpis.value.find((k) => k._id === rating.kpi_id);
    if (kpi && rating.diem > 0) {
      totalScore += rating.diem * kpi.trong_so;
      totalWeight += kpi.trong_so;
    }
  });

  if (totalWeight === 0) return '0.0';
  return (totalScore / totalWeight).toFixed(1);
};

const handleView = (item: PerformanceReview) => {
  selectedReview.value = item;
  showViewDialog.value = true;
};

const handleEdit = (item: PerformanceReview) => {
  editingId.value = item._id;
  form.nhan_vien_id =
    typeof item.nhan_vien_id === 'object' ? item.nhan_vien_id._id : item.nhan_vien_id;
  form.nguoi_danh_gia_id =
    typeof item.nguoi_danh_gia_id === 'object'
      ? item.nguoi_danh_gia_id._id
      : item.nguoi_danh_gia_id;
  form.tu_ngay = item.tu_ngay;
  form.den_ngay = item.den_ngay;
  form.trang_thai = item.trang_thai;
  form.ratings = item.ratings.map((r) => ({
    kpi_id: typeof r.kpi_id === 'object' ? r.kpi_id._id : r.kpi_id,
    diem: r.diem,
    ghi_chu: r.ghi_chu || '',
  }));
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data: any = {
        nhan_vien_id: form.nhan_vien_id,
        nguoi_danh_gia_id: form.nguoi_danh_gia_id,
        tu_ngay: form.tu_ngay,
        den_ngay: form.den_ngay,
        trang_thai: form.trang_thai,
        ratings: form.ratings,
        diem_tong: parseFloat(calculateTotalScore()),
      };

      if (editingId.value) {
        await performanceReviewService.update(editingId.value, data);
        ElMessage.success('Cập nhật đánh giá thành công');
      } else {
        await performanceReviewService.create(data);
        ElMessage.success('Tạo đánh giá thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving review:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu đánh giá');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('Bạn có chắc chắn muốn xóa đánh giá này?', 'Xác nhận xóa', {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning',
    });

    await performanceReviewService.delete(id);
    ElMessage.success('Xóa đánh giá thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting review:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa đánh giá');
    }
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.nhan_vien_id = '';
  form.nguoi_danh_gia_id = '';
  form.tu_ngay = '';
  form.den_ngay = '';
  form.trang_thai = 'Draft';
  form.ratings = [
    {
      kpi_id: '',
      diem: 0,
      ghi_chu: '',
    },
  ];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const getStatusType = (status: string): string => {
  const types: Record<string, string> = {
    Draft: 'info',
    InReview: 'warning',
    Completed: 'success',
  };
  return types[status] || 'info';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    Draft: 'Nháp',
    InReview: 'Đang đánh giá',
    Completed: 'Hoàn thành',
  };
  return texts[status] || status;
};

const getScoreType = (score: number): string => {
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
};

onMounted(() => {
  loadData();
  loadKPIs();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.orangehrm-review-page {
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

.orangehrm-text-muted {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.orangehrm-rating-item {
  padding: $spacing-md;
  background-color: $bg-gray;
  border-radius: 4px;
  margin-bottom: $spacing-md;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.orangehrm-score-hint {
  margin-left: $spacing-md;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.orangehrm-review-details {
  :deep(.el-descriptions__label) {
    font-weight: $font-weight-medium;
  }

  :deep(.el-table) {
    margin-top: $spacing-md;
  }
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

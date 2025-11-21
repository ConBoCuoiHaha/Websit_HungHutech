<template>
  <div class="orangehrm-interview-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quản lý lịch phỏng vấn</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Tạo lịch phỏng vấn
        </el-button>
      </div>
    </div>

    <!-- View Toggle -->
    <el-card class="orangehrm-view-toggle-card" shadow="never">
      <el-radio-group v-model="viewMode" @change="handleViewChange">
        <el-radio-button value="list">
          <el-icon><List /></el-icon>
          Danh sách
        </el-radio-button>
        <el-radio-button value="calendar">
          <el-icon><Calendar /></el-icon>
          Lịch
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filters.q"
            placeholder="Tìm theo ứng viên, vị trí..."
            clearable
            style="width: 300px"
            @keyup.enter="handleFilterChange"
            @clear="handleFilterChange"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Đã lên lịch" value="Đã lên lịch" />
            <el-option label="Đang chờ xác nhận" value="Đang chờ xác nhận" />
            <el-option label="Đã xác nhận" value="Đã xác nhận" />
            <el-option label="Đã hoàn thành" value="Đã hoàn thành" />
            <el-option label="Đã hủy" value="Đã hủy" />
            <el-option label="Ứng viên vắng mặt" value="Ứng viên vắng mặt" />
          </el-select>
        </el-form-item>

        <el-form-item label="Loại phỏng vấn">
          <el-select
            v-model="filters.loai_phong_van"
            placeholder="Tất cả"
            clearable
            style="width: 200px"
            @change="handleFilterChange"
          >
            <el-option label="Sơ tuyển" value="Sơ tuyển" />
            <el-option
              label="Phỏng vấn chuyên môn"
              value="Phỏng vấn chuyên môn"
            />
            <el-option label="Phỏng vấn quản lý" value="Phỏng vấn quản lý" />
            <el-option
              label="Phỏng vấn cuối cùng"
              value="Phỏng vấn cuối cùng"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Từ ngày">
          <el-date-picker
            v-model="filters.tu_ngay"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleFilterChange"
          />
        </el-form-item>

        <el-form-item label="Đến ngày">
          <el-date-picker
            v-model="filters.den_ngay"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleFilterChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilterChange">
            Tìm kiếm
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Calendar View -->
    <el-card
      v-if="viewMode === 'calendar'"
      class="orangehrm-calendar-card"
      shadow="never"
    >
      <el-calendar v-model="calendarDate">
        <template #date-cell="{data}">
          <div class="calendar-day">
            <div class="calendar-day-number">
              {{ data.day.split('-').slice(-1)[0] }}
            </div>
            <div
              v-if="getInterviewsForDate(data.day).length > 0"
              class="calendar-day-interviews"
            >
              <div
                v-for="interview in getInterviewsForDate(data.day).slice(0, 3)"
                :key="interview._id"
                :class="[
                  'interview-item',
                  getInterviewStatusClass(interview.trang_thai),
                ]"
                @click="handleViewInterview(interview)"
              >
                <el-icon><User /></el-icon>
                <span class="interview-time">
                  {{ formatTime(interview.ngay_gio) }}
                </span>
                <span class="interview-candidate">
                  {{ getCandidateName(interview.ung_vien_id) }}
                </span>
              </div>
              <div
                v-if="getInterviewsForDate(data.day).length > 3"
                class="more-interviews"
              >
                +{{ getInterviewsForDate(data.day).length - 3 }} lịch khác
              </div>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <!-- List View -->
    <el-card v-else class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="interviewList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column label="Ứng viên" min-width="180">
          <template #default="{row}">
            <div class="interview-candidate-info">
              <strong>{{ getCandidateName(row.ung_vien_id) }}</strong>
              <div class="candidate-email">
                {{ getCandidateEmail(row.ung_vien_id) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Vị trí tuyển dụng" min-width="200">
          <template #default="{row}">
            {{ getVacancyTitle(row.vi_tri_tuyen_dung_id) }}
          </template>
        </el-table-column>

        <el-table-column label="Loại phỏng vấn" width="180">
          <template #default="{row}">
            <el-tag :type="getInterviewTypeTag(row.loai_phong_van)">
              {{ row.loai_phong_van }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày giờ" width="160">
          <template #default="{row}">
            <div class="interview-datetime">
              <div>
                <el-icon><Calendar /></el-icon> {{ formatDate(row.ngay_gio) }}
              </div>
              <div>
                <el-icon><Clock /></el-icon> {{ formatTime(row.ngay_gio) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Hình thức" width="120">
          <template #default="{row}">
            <el-tag :type="getInterviewFormatTag(row.hinh_thuc)" size="small">
              {{ row.hinh_thuc }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ row.trang_thai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="220" fixed="right">
          <template #default="{row}">
            <el-button
              link
              type="primary"
              size="small"
              :icon="View"
              @click="handleViewInterview(row)"
            >
              Xem
            </el-button>
            <el-button
              v-if="canEdit(row)"
              link
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-dropdown v-if="canManage(row)">
              <el-button link type="primary" size="small">
                Hành động
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="
                      row.trang_thai === 'Đã lên lịch' ||
                      row.trang_thai === 'Đang chờ xác nhận'
                    "
                    @click="handleConfirm(row)"
                  >
                    <el-icon><Check /></el-icon>
                    Xác nhận
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.trang_thai === 'Đã xác nhận'"
                    @click="handleUpdateResult(row)"
                  >
                    <el-icon><Edit /></el-icon>
                    Nhập kết quả
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="
                      row.trang_thai !== 'Đã hủy' &&
                      row.trang_thai !== 'Đã hoàn thành'
                    "
                    @click="handleCancel(row)"
                  >
                    <el-icon><Close /></el-icon>
                    Hủy lịch
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                    Xóa
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="orangehrm-pagination"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- Form Dialog -->
    <InterviewFormDialog
      v-model="showCreateDialog"
      :interview="editingInterview"
      @success="handleFormSuccess"
    />

    <!-- Result Dialog -->
    <InterviewResultDialog
      v-model="showResultDialog"
      :interview="resultInterview"
      @success="handleResultSuccess"
    />

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      :title="'Chi tiết lịch phỏng vấn'"
      width="800px"
      class="interview-view-dialog"
    >
      <div v-if="viewingInterview" class="interview-details">
        <!-- Thông tin ứng viên -->
        <div class="detail-section">
          <h3>Thông tin ứng viên</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Họ tên">
              {{ getCandidateName(viewingInterview.ung_vien_id) }}
            </el-descriptions-item>
            <el-descriptions-item label="Email">
              {{ getCandidateEmail(viewingInterview.ung_vien_id) }}
            </el-descriptions-item>
            <el-descriptions-item label="Điện thoại">
              {{ getCandidatePhone(viewingInterview.ung_vien_id) }}
            </el-descriptions-item>
            <el-descriptions-item label="Vị trí ứng tuyển">
              {{ getVacancyTitle(viewingInterview.vi_tri_tuyen_dung_id) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Thông tin phỏng vấn -->
        <div class="detail-section">
          <h3>Thông tin phỏng vấn</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Loại phỏng vấn">
              <el-tag
                :type="getInterviewTypeTag(viewingInterview.loai_phong_van)"
              >
                {{ viewingInterview.loai_phong_van }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Hình thức">
              <el-tag :type="getInterviewFormatTag(viewingInterview.hinh_thuc)">
                {{ viewingInterview.hinh_thuc }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Ngày giờ">
              {{ formatDateTime(viewingInterview.ngay_gio) }}
            </el-descriptions-item>
            <el-descriptions-item label="Trạng thái">
              <el-tag :type="getStatusType(viewingInterview.trang_thai)">
                {{ viewingInterview.trang_thai }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Địa điểm" :span="2">
              {{ viewingInterview.dia_diem || '-' }}
            </el-descriptions-item>
            <el-descriptions-item
              v-if="viewingInterview.link_phong_van"
              label="Link phỏng vấn"
              :span="2"
            >
              <el-link
                :href="viewingInterview.link_phong_van"
                target="_blank"
                type="primary"
              >
                {{ viewingInterview.link_phong_van }}
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Người phỏng vấn -->
        <div
          v-if="viewingInterview.nguoi_phong_van?.length"
          class="detail-section"
        >
          <h3>Người phỏng vấn</h3>
          <el-table :data="viewingInterview.nguoi_phong_van" border>
            <el-table-column label="Họ tên" prop="nhan_vien_id">
              <template #default="{row}">
                {{ getEmployeeName(row.nhan_vien_id) }}
              </template>
            </el-table-column>
            <el-table-column label="Vai trò" prop="vai_tro" />
          </el-table>
        </div>

        <!-- Kết quả phỏng vấn -->
        <div
          v-if="viewingInterview.ket_qua_phong_van?.quyet_dinh"
          class="detail-section"
        >
          <h3>Kết quả phỏng vấn</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Quyết định">
              <el-tag
                :type="
                  viewingInterview.ket_qua_phong_van.quyet_dinh === 'Đậu'
                    ? 'success'
                    : viewingInterview.ket_qua_phong_van.quyet_dinh === 'Trượt'
                    ? 'danger'
                    : 'warning'
                "
              >
                {{ viewingInterview.ket_qua_phong_van.quyet_dinh }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Điểm số">
              <el-rate
                v-model="viewingInterview.ket_qua_phong_van.diem_so"
                disabled
                show-score
                text-color="#ff9900"
              />
            </el-descriptions-item>
            <el-descriptions-item label="Đánh giá tổng quan" :span="2">
              {{ viewingInterview.ket_qua_phong_van.danh_gia_tong_quan || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Điểm mạnh" :span="2">
              <el-tag
                v-for="(item, index) in viewingInterview.ket_qua_phong_van
                  .diem_manh"
                :key="index"
                type="success"
                class="tag-item"
              >
                {{ item }}
              </el-tag>
              <span v-if="!viewingInterview.ket_qua_phong_van.diem_manh?.length"
                >-</span
              >
            </el-descriptions-item>
            <el-descriptions-item label="Điểm yếu" :span="2">
              <el-tag
                v-for="(item, index) in viewingInterview.ket_qua_phong_van
                  .diem_yeu"
                :key="index"
                type="warning"
                class="tag-item"
              >
                {{ item }}
              </el-tag>
              <span v-if="!viewingInterview.ket_qua_phong_van.diem_yeu?.length"
                >-</span
              >
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Ghi chú -->
        <div v-if="viewingInterview.ghi_chu" class="detail-section">
          <h3>Ghi chú</h3>
          <p>{{ viewingInterview.ghi_chu }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  Refresh,
  Plus,
  Search,
  Edit,
  Delete,
  View,
  Calendar,
  Clock,
  User,
  List,
  Check,
  Close,
  ArrowDown,
} from '@element-plus/icons-vue';
import type {Interview, Candidate, Vacancy, NhanVien} from '@/types';
import interviewService from '@/services/interviewService';
import InterviewFormDialog from '@/components/recruitment/InterviewFormDialog.vue';
import InterviewResultDialog from '@/components/recruitment/InterviewResultDialog.vue';

// State
const loading = ref(false);
const error = ref('');
const interviewList = ref<Interview[]>([]);
const viewMode = ref<'list' | 'calendar'>('list');
const calendarDate = ref(new Date());

// Pagination
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// Filters
const filters = reactive({
  q: '',
  trang_thai: '',
  loai_phong_van: '',
  tu_ngay: '',
  den_ngay: '',
});

// Dialogs
const showCreateDialog = ref(false);
const showResultDialog = ref(false);
const showViewDialog = ref(false);
const editingInterview = ref<Interview | null>(null);
const resultInterview = ref<Interview | null>(null);
const viewingInterview = ref<Interview | null>(null);

// Load data
const loadData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };

    const response = await interviewService.getAll(params);
    interviewList.value = response.data;
    pagination.total = response.pagination?.total;
  } catch (err: any) {
    error.value = err.response?.data?.msg || 'Không thể tải dữ liệu';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// Filter handlers
const handleFilterChange = () => {
  pagination.page = 1;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  loadData();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

// View mode handlers
const handleViewChange = () => {
  if (viewMode.value === 'calendar') {
    // Load all interviews for current month when switching to calendar view
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    filters.tu_ngay = startOfMonth.toISOString().split('T')[0];
    filters.den_ngay = endOfMonth.toISOString().split('T')[0];
    pagination.limit = 1000; // Load all for calendar view
    loadData();
  } else {
    // Reset to default when switching back to list view
    filters.tu_ngay = '';
    filters.den_ngay = '';
    pagination.limit = 20;
    loadData();
  }
};

// Calendar helpers
const getInterviewsForDate = (date: string) => {
  return interviewList.value.filter((interview) => {
    const interviewDate = new Date(interview.ngay_gio)
      .toISOString()
      .split('T')[0];
    return interviewDate === date;
  });
};

// CRUD handlers
const handleEdit = (interview: Interview) => {
  editingInterview.value = interview;
  showCreateDialog.value = true;
};

const handleDelete = async (interview: Interview) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa lịch phỏng vấn này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await interviewService.delete(interview._id);
    ElMessage.success('Xóa lịch phỏng vấn thành công');
    loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa lịch phỏng vấn',
      );
    }
  }
};

const handleConfirm = async (interview: Interview) => {
  try {
    await interviewService.confirm(interview._id);
    ElMessage.success('Xác nhận lịch phỏng vấn thành công');
    loadData();
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể xác nhận lịch phỏng vấn',
    );
  }
};

const handleCancel = async (interview: Interview) => {
  try {
    const {value: ly_do} = await ElMessageBox.prompt(
      'Vui lòng nhập lý do hủy lịch phỏng vấn',
      'Hủy lịch phỏng vấn',
      {
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        inputPlaceholder: 'Lý do hủy...',
      },
    );

    await interviewService.cancel(interview._id, ly_do);
    ElMessage.success('Hủy lịch phỏng vấn thành công');
    loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể hủy lịch phỏng vấn',
      );
    }
  }
};

const handleUpdateResult = (interview: Interview) => {
  resultInterview.value = interview;
  showResultDialog.value = true;
};

const handleViewInterview = async (interview: Interview) => {
  try {
    const data = await interviewService.getById(interview._id);
    viewingInterview.value = data;
    showViewDialog.value = true;
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin lịch phỏng vấn',
    );
  }
};

const handleFormSuccess = () => {
  showCreateDialog.value = false;
  editingInterview.value = null;
  loadData();
};

const handleResultSuccess = () => {
  showResultDialog.value = false;
  resultInterview.value = null;
  loadData();
};

// Permissions
const canEdit = (interview: Interview) => {
  return (
    interview.trang_thai !== 'Đã hoàn thành' &&
    interview.trang_thai !== 'Đã hủy'
  );
};

const canManage = (interview: Interview) => {
  return true; // Add role check if needed
};

// Helper functions
const getCandidateName = (candidate: string | Candidate) => {
  if (typeof candidate === 'object' && candidate) {
    return candidate.ho_ten;
  }
  return '-';
};

const getCandidateEmail = (candidate: string | Candidate) => {
  if (typeof candidate === 'object' && candidate) {
    return candidate.email;
  }
  return '-';
};

const getCandidatePhone = (candidate: string | Candidate) => {
  if (typeof candidate === 'object' && candidate) {
    return candidate.dien_thoai || '-';
  }
  return '-';
};

const getVacancyTitle = (vacancy: string | Vacancy) => {
  if (typeof vacancy === 'object' && vacancy) {
    return vacancy.tieu_de;
  }
  return '-';
};

const getEmployeeName = (employee: string | NhanVien) => {
  if (typeof employee === 'object' && employee) {
    return `${employee.ho_dem} ${employee.ten}`;
  }
  return '-';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
};

const formatDateTime = (dateString: string) => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    'Đã lên lịch': 'info',
    'Đang chờ xác nhận': 'warning',
    'Đã xác nhận': 'primary',
    'Đã hoàn thành': 'success',
    'Đã hủy': 'danger',
    'Ứng viên vắng mặt': 'danger',
  };
  return statusMap[status] || 'info';
};

const getInterviewTypeTag = (type: string) => {
  const typeMap: Record<string, any> = {
    'Sơ tuyển': '',
    'Phỏng vấn chuyên môn': 'primary',
    'Phỏng vấn quản lý': 'warning',
    'Phỏng vấn cuối cùng': 'danger',
  };
  return typeMap[type] || '';
};

const getInterviewFormatTag = (format?: string) => {
  const formatMap: Record<string, any> = {
    'Trực tiếp': 'success',
    'Trực tuyến': 'primary',
    'Điện thoại': 'warning',
  };
  return formatMap[format || ''] || '';
};

const getInterviewStatusClass = (status: string) => {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
@import '@/assets/styles/_variables.scss';

.orangehrm-interview-page {
  padding: 20px;
}

.orangehrm-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .orangehrm-page-title {
    font-size: 24px;
    font-weight: 600;
    color: $primary-color;
    margin: 0;
  }

  .orangehrm-page-actions {
    display: flex;
    gap: 10px;
  }
}

.orangehrm-view-toggle-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 15px;
    display: flex;
    justify-content: center;
  }
}

.orangehrm-filter-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-form) {
    margin-bottom: 0;
  }
}

.orangehrm-table-card,
.orangehrm-calendar-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.orangehrm-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// Calendar styles
.calendar-day {
  height: 100%;
  padding: 5px;

  .calendar-day-number {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .calendar-day-interviews {
    .interview-item {
      font-size: 12px;
      padding: 2px 5px;
      margin-bottom: 2px;
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.3s;

      &:hover {
        opacity: 0.8;
        transform: translateX(2px);
      }

      .interview-time {
        font-weight: 600;
      }

      .interview-candidate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &.status-đã-lên-lịch {
        background-color: #e1f3f8;
        color: #0d6efd;
      }

      &.status-đã-xác-nhận {
        background-color: #d1e7dd;
        color: #198754;
      }

      &.status-đã-hoàn-thành {
        background-color: #d3d3d4;
        color: #6c757d;
      }

      &.status-đã-hủy {
        background-color: #f8d7da;
        color: #dc3545;
      }
    }

    .more-interviews {
      font-size: 11px;
      color: #6c757d;
      font-style: italic;
      margin-top: 3px;
    }
  }
}

// Table styles
.interview-candidate-info {
  .candidate-email {
    font-size: 12px;
    color: #6c757d;
  }
}

.interview-datetime {
  display: flex;
  flex-direction: column;
  gap: 4px;

  div {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.orangehrm-text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Dialog styles
.interview-view-dialog {
  .interview-details {
    .detail-section {
      margin-bottom: 25px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: $primary-color;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f0f0;
      }

      .tag-item {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }
}
</style>

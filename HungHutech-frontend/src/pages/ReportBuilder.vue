<template>
  <div class="report-builder-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ isEditMode ? 'Chỉnh sửa Báo cáo' : 'Tạo Báo cáo mới' }}</h1>
      <div class="page-actions">
        <el-button @click="handleCancel">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEditMode ? 'Cập nhật' : 'Lưu báo cáo' }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <!-- Steps -->
      <el-steps :active="activeStep" finish-status="success" class="steps-container">
        <el-step title="Thông tin cơ bản" />
        <el-step title="Chọn cột hiển thị" />
        <el-step title="Thiết lập bộ lọc" />
        <el-step title="Sắp xếp & Xem trước" />
      </el-steps>

      <!-- Step Content -->
      <div class="step-content">
        <!-- Step 1: Basic Info -->
        <div v-show="activeStep === 0" class="step-panel">
          <el-form :model="reportForm" label-width="150px" label-position="left">
            <el-form-item label="Tên báo cáo" required>
              <el-input
                v-model="reportForm.ten_bao_cao"
                placeholder="Nhập tên báo cáo"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="Loại báo cáo" required>
              <el-select
                v-model="reportForm.loai_bao_cao"
                placeholder="Chọn loại báo cáo"
                style="width: 100%"
                @change="handleReportTypeChange"
              >
                <el-option label="Nhân viên" value="Nhan vien" />
                <el-option label="Chấm công" value="Cham cong" />
                <el-option label="Nghỉ phép" value="Nghi phep" />
                <el-option label="Bồi hoàn" value="Boi hoan" />
                <el-option label="Lương" value="Luong" />
                <el-option label="Hiệu suất" value="Hieu suat" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 2: Select Columns -->
        <div v-show="activeStep === 1" class="step-panel">
          <h3>Chọn các cột muốn hiển thị trong báo cáo</h3>
          <el-checkbox-group v-model="reportForm.cot_hien_thi" class="column-checkboxes">
            <el-checkbox
              v-for="field in availableFields"
              :key="field.value"
              :label="field.value"
              border
            >
              {{ field.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- Step 3: Filters -->
        <div v-show="activeStep === 2" class="step-panel">
          <div class="filter-header">
            <h3>Thiết lập bộ lọc</h3>
            <el-button type="primary" :icon="Plus" @click="addCriteria">
              Thêm tiêu chí
            </el-button>
          </div>

          <div v-if="reportForm.tieu_chi.length === 0" class="empty-state">
            <p>Chưa có tiêu chí lọc nào. Nhấn "Thêm tiêu chí" để bắt đầu.</p>
          </div>

          <div v-else class="criteria-list">
            <el-card
              v-for="(criteria, index) in reportForm.tieu_chi"
              :key="index"
              class="criteria-card"
              shadow="hover"
            >
              <div class="criteria-content">
                <el-row :gutter="16">
                  <el-col :span="7">
                    <el-select
                      v-model="criteria.truong"
                      placeholder="Chọn trường"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="field in availableFields"
                        :key="field.value"
                        :label="field.label"
                        :value="field.value"
                      />
                    </el-select>
                  </el-col>
                  <el-col :span="5">
                    <el-select
                      v-model="criteria.dieu_kien"
                      placeholder="Điều kiện"
                      style="width: 100%"
                    >
                      <el-option label="Bằng (=)" value="=" />
                      <el-option label="Khác (!=)" value="!=" />
                      <el-option label="Lớn hơn (>)" value=">" />
                      <el-option label="Nhỏ hơn (<)" value="<" />
                      <el-option label="Lớn hơn hoặc bằng (>=)" value=">=" />
                      <el-option label="Nhỏ hơn hoặc bằng (<=)" value="<=" />
                      <el-option label="Chứa (LIKE)" value="LIKE" />
                      <el-option label="Trong (IN)" value="IN" />
                    </el-select>
                  </el-col>
                  <el-col :span="10">
                    <el-input
                      v-model="criteria.gia_tri"
                      placeholder="Giá trị"
                    />
                  </el-col>
                  <el-col :span="2">
                    <el-button
                      type="danger"
                      :icon="Delete"
                      circle
                      @click="removeCriteria(index)"
                    />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </div>

        <!-- Step 4: Sorting & Preview -->
        <div v-show="activeStep === 3" class="step-panel">
          <h3>Thiết lập sắp xếp</h3>
          <el-form :model="reportForm" label-width="150px" label-position="left">
            <el-form-item label="Sắp xếp theo">
              <el-select
                v-model="reportForm.sap_xep.truong"
                placeholder="Chọn trường sắp xếp"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="field in availableFields"
                  :key="field.value"
                  :label="field.label"
                  :value="field.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Thứ tự">
              <el-radio-group v-model="reportForm.sap_xep.thu_tu">
                <el-radio label="asc">Tăng dần</el-radio>
                <el-radio label="desc">Giảm dần</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="preview-section">
            <div class="preview-header">
              <h3>Xem trước kết quả</h3>
              <el-button type="primary" @click="handlePreview" :loading="previewing">
                Tạo xem trước
              </el-button>
            </div>

            <div v-if="previewData.length > 0" class="preview-table">
              <el-table :data="previewData" stripe border max-height="400">
                <el-table-column
                  v-for="col in reportForm.cot_hien_thi"
                  :key="col"
                  :prop="col"
                  :label="getFieldLabel(col)"
                  min-width="120"
                >
                  <template #default="{ row }">
                    {{ formatCellValue(row[col]) }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="preview-info">
                <el-text type="info">
                  Hiển thị {{ previewData.length }} / {{ previewTotal }} bản ghi
                </el-text>
              </div>
            </div>

            <div v-else-if="previewing" class="preview-loading">
              <el-text>Đang tải dữ liệu...</el-text>
            </div>

            <div v-else class="preview-empty">
              <el-text type="info">Nhấn "Tạo xem trước" để xem kết quả</el-text>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="step-navigation">
        <el-button v-if="activeStep > 0" @click="prevStep">
          Quay lại
        </el-button>
        <el-button v-if="activeStep < 3" type="primary" @click="nextStep">
          Tiếp theo
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Plus, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import reportService from '@/services/reportService';
import { Report, ReportCriteria, ReportSort } from '@/types';

const router = useRouter();
const route = useRoute();

const activeStep = ref(0);
const saving = ref(false);
const previewing = ref(false);
const previewData = ref<any[]>([]);
const previewTotal = ref(0);

const isEditMode = computed(() => !!route.params.id);

const reportForm = reactive<Partial<Report>>({
  ten_bao_cao: '',
  loai_bao_cao: 'Nhan vien',
  tieu_chi: [],
  cot_hien_thi: [],
  sap_xep: {
    truong: '',
    thu_tu: 'asc',
  },
});

// Field configurations for each report type
const fieldConfigs: Record<string, Array<{ label: string; value: string }>> = {
  'Nhan vien': [
    { label: 'Mã nhân viên', value: 'ma_nhan_vien' },
    { label: 'Họ đệm', value: 'ho_dem' },
    { label: 'Tên', value: 'ten' },
    { label: 'Email', value: 'lien_he.email_cong_viec' },
    { label: 'Ngày sinh', value: 'ngay_sinh' },
    { label: 'Giới tính', value: 'gioi_tinh' },
    { label: 'Phòng ban', value: 'thong_tin_cong_viec.phong_ban_id' },
    { label: 'Chức danh', value: 'thong_tin_cong_viec.chuc_danh_id' },
    { label: 'Ngày vào làm', value: 'thong_tin_cong_viec.ngay_vao_lam' },
    { label: 'Trạng thái lao động', value: 'thong_tin_cong_viec.trang_thai_lao_dong_id' },
  ],
  'Cham cong': [
    { label: 'Nhân viên', value: 'nhan_vien_id' },
    { label: 'Ngày', value: 'ngay' },
    { label: 'Thời gian vào', value: 'thoi_gian_vao' },
    { label: 'Thời gian ra', value: 'thoi_gian_ra' },
    { label: 'Ghi chú', value: 'ghi_chu' },
  ],
  'Nghi phep': [
    { label: 'Nhân viên', value: 'nhan_vien_id' },
    { label: 'Loại ngày nghỉ', value: 'loai_ngay_nghi_id' },
    { label: 'Ngày bắt đầu', value: 'ngay_bat_dau' },
    { label: 'Ngày kết thúc', value: 'ngay_ket_thuc' },
    { label: 'Số ngày', value: 'so_ngay' },
    { label: 'Trạng thái', value: 'trang_thai' },
    { label: 'Lý do', value: 'ly_do' },
  ],
  'Boi hoan': [
    { label: 'Nhân viên', value: 'nhan_vien_id' },
    { label: 'Trạng thái', value: 'trang_thai' },
    { label: 'Tổng tiền', value: 'tong_tien' },
    { label: 'Ngày tạo', value: 'ngay_tao' },
  ],
  'Luong': [
    { label: 'Nhân viên', value: 'nhan_vien_id' },
    { label: 'Tháng', value: 'thang' },
    { label: 'Lương cơ bản', value: 'luong_co_ban' },
    { label: 'Phụ cấp', value: 'phu_cap' },
    { label: 'Thưởng', value: 'thuong' },
    { label: 'Khấu trừ', value: 'khau_tru' },
    { label: 'Thực lãnh', value: 'thuc_lanh' },
  ],
  'Hieu suat': [
    { label: 'Nhân viên', value: 'nhan_vien_id' },
    { label: 'Người đánh giá', value: 'nguoi_danh_gia_id' },
    { label: 'Từ ngày', value: 'tu_ngay' },
    { label: 'Đến ngày', value: 'den_ngay' },
    { label: 'Điểm tổng', value: 'diem_tong' },
    { label: 'Trạng thái', value: 'trang_thai' },
  ],
};

const availableFields = computed(() => {
  return fieldConfigs[reportForm.loai_bao_cao || 'Nhan vien'] || [];
});

const handleReportTypeChange = () => {
  // Reset columns and criteria when report type changes
  reportForm.cot_hien_thi = [];
  reportForm.tieu_chi = [];
  reportForm.sap_xep = { truong: '', thu_tu: 'asc' };
  previewData.value = [];
  previewTotal.value = 0;
};

const addCriteria = () => {
  reportForm.tieu_chi?.push({
    truong: '',
    dieu_kien: '=',
    gia_tri: '',
  });
};

const removeCriteria = (index: number) => {
  reportForm.tieu_chi?.splice(index, 1);
};

const nextStep = () => {
  if (activeStep.value === 0) {
    if (!reportForm.ten_bao_cao) {
      ElMessage.warning('Vui lòng nhập tên báo cáo');
      return;
    }
    if (!reportForm.loai_bao_cao) {
      ElMessage.warning('Vui lòng chọn loại báo cáo');
      return;
    }
  }

  if (activeStep.value === 1) {
    if (!reportForm.cot_hien_thi || reportForm.cot_hien_thi.length === 0) {
      ElMessage.warning('Vui lòng chọn ít nhất một cột để hiển thị');
      return;
    }
  }

  if (activeStep.value < 3) {
    activeStep.value++;
  }
};

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
};

const handlePreview = async () => {
  if (!reportForm.loai_bao_cao) {
    ElMessage.warning('Vui lòng chọn loại báo cáo');
    return;
  }

  previewing.value = true;
  try {
    const response = await reportService.generate({
      loai_bao_cao: reportForm.loai_bao_cao as any,
      tieu_chi: reportForm.tieu_chi as any,
      cot_hien_thi: reportForm.cot_hien_thi,
      sap_xep: reportForm.sap_xep as ReportSort,
      page: 1,
      limit: 10,
    });

    previewData.value = response.data;
    previewTotal.value = response.total;
    ElMessage.success(`Tìm thấy ${response.total} bản ghi`);
  } catch (err: any) {
    console.error('Error previewing report:', err);
    ElMessage.error('Không thể tạo xem trước báo cáo');
  } finally {
    previewing.value = false;
  }
};

const handleSave = async () => {
  if (!reportForm.ten_bao_cao) {
    ElMessage.warning('Vui lòng nhập tên báo cáo');
    return;
  }
  if (!reportForm.loai_bao_cao) {
    ElMessage.warning('Vui lòng chọn loại báo cáo');
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value) {
      await reportService.update(route.params.id as string, reportForm);
      ElMessage.success('Cập nhật báo cáo thành công');
    } else {
      await reportService.create(reportForm);
      ElMessage.success('Tạo báo cáo thành công');
    }
    router.push('/bao-cao');
  } catch (err: any) {
    console.error('Error saving report:', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu báo cáo'
    );
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  router.push('/bao-cao');
};

const getFieldLabel = (field: string): string => {
  const found = availableFields.value.find((f) => f.value === field);
  return found ? found.label : field;
};

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    if (value.ten) return value.ten;
    if (value.ten_chuc_danh) return value.ten_chuc_danh;
    if (value.ho_dem && value.ten) return `${value.ho_dem} ${value.ten}`;
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
};

// Load existing report if editing
onMounted(async () => {
  if (isEditMode.value) {
    try {
      const report = await reportService.getById(route.params.id as string);
      reportForm.ten_bao_cao = report.ten_bao_cao;
      reportForm.loai_bao_cao = report.loai_bao_cao;
      reportForm.tieu_chi = report.tieu_chi || [];
      reportForm.cot_hien_thi = report.cot_hien_thi || [];
      reportForm.sap_xep = report.sap_xep || { truong: '', thu_tu: 'asc' };
    } catch (err: any) {
      console.error('Error loading report:', err);
      ElMessage.error('Không thể tải báo cáo');
      router.push('/bao-cao');
    }
  }
});
</script>

<style lang="scss" scoped>
.report-builder-page {
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

.steps-container {
  margin-bottom: 32px;
}

.step-content {
  min-height: 400px;
  padding: 24px 0;
}

.step-panel {
  h3 {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 24px;
    color: #303133;
  }
}

.column-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;

  .el-checkbox {
    margin: 0;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    margin: 0;
  }
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: #909399;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.criteria-card {
  .criteria-content {
    display: flex;
    align-items: center;
  }
}

.preview-section {
  margin-top: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
  }
}

.preview-table {
  margin-top: 16px;
}

.preview-info {
  margin-top: 12px;
  text-align: right;
}

.preview-loading,
.preview-empty {
  text-align: center;
  padding: 48px 0;
  color: #909399;
}

.step-navigation {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
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

  .column-checkboxes {
    grid-template-columns: 1fr;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

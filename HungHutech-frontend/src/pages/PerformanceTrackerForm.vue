<template>
  <div class="orangehrm-tracker-form-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="handleBack">Quay lại</el-button>
        <h1 class="orangehrm-page-title">
          {{ isViewMode ? 'Chi tiết' : trackerId ? 'Chỉnh sửa' : 'Tạo mới' }} Tracker
        </h1>
      </div>
      <div class="orangehrm-page-actions" v-if="!isViewMode">
        <el-button @click="handleBack">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving" :icon="Check">
          {{ trackerId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <el-card class="orangehrm-form-card" shadow="never" v-loading="loading">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab Thông tin chung -->
        <el-tab-pane label="Thông tin chung" name="info">
          <el-form
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-width="160px"
            label-position="left"
            :disabled="isViewMode"
          >
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Tên tracker" prop="ten_tracker" required>
                  <el-input
                    v-model="form.ten_tracker"
                    placeholder="Nhập tên tracker..."
                    maxlength="200"
                  />
                </el-form-item>
              </el-col>
            </el-row>

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
                <el-form-item label="Từ ngày" prop="ky_danh_gia.tu_ngay" required>
                  <el-date-picker
                    v-model="form.ky_danh_gia.tu_ngay"
                    type="date"
                    placeholder="Chọn ngày bắt đầu..."
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="Đến ngày" prop="ky_danh_gia.den_ngay" required>
                  <el-date-picker
                    v-model="form.ky_danh_gia.den_ngay"
                    type="date"
                    placeholder="Chọn ngày kết thúc..."
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="trang_thai" required>
                  <el-select v-model="form.trang_thai" placeholder="Chọn trạng thái..." style="width: 100%">
                    <el-option label="Nháp" value="Nháp" />
                    <el-option label="Đang theo dõi" value="Đang theo dõi" />
                    <el-option label="Đã hoàn thành" value="Đã hoàn thành" />
                    <el-option label="Đã hủy" value="Đã hủy" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="Ghi chú">
                  <el-input
                    v-model="form.ghi_chu"
                    placeholder="Nhập ghi chú..."
                    maxlength="500"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Summary Statistics -->
            <el-divider>Tổng quan</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tiến độ tổng thể">
                  <el-progress
                    :percentage="calculateOverallProgress()"
                    :color="getProgressColor(calculateOverallProgress())"
                  />
                  <span class="progress-label">{{ calculateOverallProgress() }}%</span>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="Điểm trung bình">
                  <el-tag :type="getScoreType(calculateAverageScore())" size="large">
                    <strong>{{ calculateAverageScore().toFixed(1) }}/5.0</strong>
                  </el-tag>
                  <span class="score-label">({{ form.muc_tieu.length }} mục tiêu)</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- Tab Mục tiêu -->
        <el-tab-pane name="goals">
          <template #label>
            <span>
              Mục tiêu
              <el-badge :value="form.muc_tieu.length" class="tab-badge" />
            </span>
          </template>

          <div class="goals-section">
            <div class="goals-header">
              <h3>Danh sách mục tiêu</h3>
              <el-button
                v-if="!isViewMode"
                type="primary"
                :icon="Plus"
                @click="handleAddGoal"
                size="small"
              >
                Thêm mục tiêu
              </el-button>
            </div>

            <div v-if="form.muc_tieu.length === 0" class="empty-state">
              <el-empty description="Chưa có mục tiêu nào">
                <el-button v-if="!isViewMode" type="primary" @click="handleAddGoal">
                  Thêm mục tiêu đầu tiên
                </el-button>
              </el-empty>
            </div>

            <div v-else class="goals-list">
              <el-card
                v-for="(goal, index) in form.muc_tieu"
                :key="index"
                class="goal-card"
                shadow="hover"
              >
                <div class="goal-header">
                  <div class="goal-title">
                    <span class="goal-number">#{{ index + 1 }}</span>
                    <strong>{{ goal.ten_muc_tieu || 'Mục tiêu chưa có tên' }}</strong>
                  </div>
                  <div class="goal-actions" v-if="!isViewMode">
                    <el-button
                      size="small"
                      :icon="Edit"
                      @click="handleEditGoal(index)"
                      circle
                    />
                    <el-button
                      size="small"
                      type="danger"
                      :icon="Delete"
                      @click="handleDeleteGoal(index)"
                      circle
                    />
                  </div>
                </div>

                <div class="goal-content">
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <div class="goal-info-item">
                        <label>Trạng thái:</label>
                        <el-tag :type="getGoalStatusType(goal.trang_thai)" size="small">
                          {{ goal.trang_thai }}
                        </el-tag>
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="goal-info-item">
                        <label>Trọng số:</label>
                        <span>{{ goal.trong_so || 0 }}%</span>
                      </div>
                    </el-col>
                  </el-row>

                  <el-row :gutter="16" style="margin-top: 12px">
                    <el-col :span="24">
                      <div class="goal-info-item">
                        <label>Tiến độ:</label>
                        <el-progress
                          :percentage="goal.tien_do || 0"
                          :color="getProgressColor(goal.tien_do || 0)"
                        />
                      </div>
                    </el-col>
                  </el-row>

                  <el-row :gutter="16" style="margin-top: 12px">
                    <el-col :span="12">
                      <div class="goal-info-item">
                        <label>Điểm đánh giá:</label>
                        <el-rate
                          v-model="goal.diem_danh_gia"
                          :max="5"
                          disabled
                          show-score
                          score-template="{value}"
                        />
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="goal-info-item">
                        <label>Hạn hoàn thành:</label>
                        <span>{{ formatDate(goal.han_hoan_thanh) }}</span>
                      </div>
                    </el-col>
                  </el-row>

                  <div v-if="goal.mo_ta" class="goal-description">
                    <label>Mô tả:</label>
                    <p>{{ goal.mo_ta }}</p>
                  </div>

                  <div v-if="goal.nhan_xet" class="goal-comment">
                    <label>Nhận xét:</label>
                    <p>{{ goal.nhan_xet }}</p>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab Đánh giá chung -->
        <el-tab-pane label="Đánh giá chung" name="review">
          <el-form
            ref="reviewFormRef"
            :model="form.danh_gia_chung"
            label-width="180px"
            label-position="left"
            :disabled="isViewMode"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Điểm tổng">
                  <el-input-number
                    v-model="form.danh_gia_chung.diem_tong"
                    :min="0"
                    :max="5"
                    :precision="1"
                    :step="0.1"
                    style="width: 100%"
                  />
                  <div class="form-hint">Điểm từ 0 đến 5</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="Xếp loại">
                  <el-select
                    v-model="form.danh_gia_chung.xep_loai"
                    placeholder="Chọn xếp loại..."
                    style="width: 100%"
                  >
                    <el-option label="Xuất sắc" value="Xuất sắc" />
                    <el-option label="Tốt" value="Tốt" />
                    <el-option label="Khá" value="Khá" />
                    <el-option label="Trung bình" value="Trung bình" />
                    <el-option label="Yếu" value="Yếu" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="Nhận xét chung">
              <el-input
                v-model="form.danh_gia_chung.nhan_xet"
                type="textarea"
                :rows="4"
                placeholder="Nhập nhận xét chung về hiệu suất..."
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="Điểm mạnh">
              <el-select
                v-model="form.danh_gia_chung.diem_manh"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Nhập các điểm mạnh..."
                style="width: 100%"
              >
                <el-option label="Chủ động trong công việc" value="Chủ động trong công việc" />
                <el-option label="Kỹ năng giao tiếp tốt" value="Kỹ năng giao tiếp tốt" />
                <el-option label="Làm việc nhóm hiệu quả" value="Làm việc nhóm hiệu quả" />
                <el-option label="Giải quyết vấn đề tốt" value="Giải quyết vấn đề tốt" />
                <el-option label="Quản lý thời gian tốt" value="Quản lý thời gian tốt" />
                <el-option label="Sáng tạo và đổi mới" value="Sáng tạo và đổi mới" />
              </el-select>
              <div class="form-hint">Có thể chọn nhiều hoặc nhập tự do</div>
            </el-form-item>

            <el-form-item label="Điểm yếu">
              <el-select
                v-model="form.danh_gia_chung.diem_yeu"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Nhập các điểm yếu cần cải thiện..."
                style="width: 100%"
              >
                <el-option label="Cần cải thiện kỹ năng giao tiếp" value="Cần cải thiện kỹ năng giao tiếp" />
                <el-option label="Quản lý thời gian chưa tốt" value="Quản lý thời gian chưa tốt" />
                <el-option label="Thiếu chủ động" value="Thiếu chủ động" />
                <el-option label="Cần nâng cao kỹ năng chuyên môn" value="Cần nâng cao kỹ năng chuyên môn" />
                <el-option label="Chưa tự tin khi làm việc nhóm" value="Chưa tự tin khi làm việc nhóm" />
              </el-select>
              <div class="form-hint">Có thể chọn nhiều hoặc nhập tự do</div>
            </el-form-item>

            <el-form-item label="Kế hoạch phát triển">
              <el-input
                v-model="form.danh_gia_chung.ke_hoach_phat_trien"
                type="textarea"
                :rows="4"
                placeholder="Nhập kế hoạch phát triển cho nhân viên..."
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Goal Dialog -->
    <el-dialog
      v-model="showGoalDialog"
      :title="editingGoalIndex !== null ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="goalFormRef"
        :model="goalForm"
        :rules="goalFormRules"
        label-width="160px"
        label-position="left"
      >
        <el-form-item label="Tên mục tiêu" prop="ten_muc_tieu" required>
          <el-input
            v-model="goalForm.ten_muc_tieu"
            placeholder="Nhập tên mục tiêu..."
            maxlength="200"
          />
        </el-form-item>

        <el-form-item label="Mô tả">
          <el-input
            v-model="goalForm.mo_ta"
            type="textarea"
            :rows="3"
            placeholder="Nhập mô tả chi tiết..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Trọng số (%)" prop="trong_so">
              <el-input-number
                v-model="goalForm.trong_so"
                :min="0"
                :max="100"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Trạng thái" prop="trang_thai" required>
              <el-select v-model="goalForm.trang_thai" style="width: 100%">
                <el-option label="Chưa bắt đầu" value="Chưa bắt đầu" />
                <el-option label="Đang thực hiện" value="Đang thực hiện" />
                <el-option label="Hoàn thành" value="Hoàn thành" />
                <el-option label="Quá hạn" value="Quá hạn" />
                <el-option label="Đã hủy" value="Đã hủy" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tiến độ (%)">
              <el-slider v-model="goalForm.tien_do" :min="0" :max="100" show-input />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Điểm đánh giá">
              <el-rate
                v-model="goalForm.diem_danh_gia"
                :max="5"
                allow-half
                show-score
                score-template="{value}"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày bắt đầu">
              <el-date-picker
                v-model="goalForm.ngay_bat_dau"
                type="date"
                placeholder="Chọn ngày..."
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Hạn hoàn thành">
              <el-date-picker
                v-model="goalForm.han_hoan_thanh"
                type="date"
                placeholder="Chọn ngày..."
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Ngày hoàn thành">
          <el-date-picker
            v-model="goalForm.ngay_hoan_thanh"
            type="date"
            placeholder="Chọn ngày hoàn thành..."
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Nhận xét">
          <el-input
            v-model="goalForm.nhan_xet"
            type="textarea"
            :rows="3"
            placeholder="Nhập nhận xét về mục tiêu..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeGoalDialog">Hủy</el-button>
        <el-button type="primary" @click="handleSaveGoal">
          {{ editingGoalIndex !== null ? 'Cập nhật' : 'Thêm' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  ArrowLeft,
  Check,
  Plus,
  Edit,
  Delete,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import performanceTrackerService from '@/services/performanceTrackerService';
import nhanVienService from '@/services/nhanVienService';
import {PerformanceTracker, PerformanceGoal, NhanVien} from '@/types';

const router = useRouter();
const route = useRoute();

const trackerId = computed(() => route.params.id as string);
const isViewMode = computed(() => route.query.mode === 'view');

const activeTab = ref('info');
const loading = ref(false);
const saving = ref(false);
const showGoalDialog = ref(false);
const editingGoalIndex = ref<number | null>(null);
const employees = ref<NhanVien[]>([]);

const formRef = ref<FormInstance>();
const reviewFormRef = ref<FormInstance>();
const goalFormRef = ref<FormInstance>();

const form = reactive<{
  ten_tracker: string;
  nhan_vien_id: string;
  nguoi_danh_gia_id: string;
  ky_danh_gia: {
    tu_ngay: string;
    den_ngay: string;
  };
  muc_tieu: PerformanceGoal[];
  danh_gia_chung: {
    diem_tong?: number;
    xep_loai?: string;
    nhan_xet?: string;
    diem_manh?: string[];
    diem_yeu?: string[];
    ke_hoach_phat_trien?: string;
  };
  trang_thai: string;
  ghi_chu?: string;
}>({
  ten_tracker: '',
  nhan_vien_id: '',
  nguoi_danh_gia_id: '',
  ky_danh_gia: {
    tu_ngay: '',
    den_ngay: '',
  },
  muc_tieu: [],
  danh_gia_chung: {
    diem_manh: [],
    diem_yeu: [],
  },
  trang_thai: 'Nháp',
  ghi_chu: '',
});

const goalForm = reactive<PerformanceGoal>({
  ten_muc_tieu: '',
  mo_ta: '',
  trong_so: 0,
  trang_thai: 'Chưa bắt đầu',
  tien_do: 0,
  diem_danh_gia: 0,
  ngay_bat_dau: '',
  han_hoan_thanh: '',
  ngay_hoan_thanh: '',
  nhan_xet: '',
});

const formRules: FormRules = {
  ten_tracker: [{required: true, message: 'Vui lòng nhập tên tracker', trigger: 'blur'}],
  nhan_vien_id: [{required: true, message: 'Vui lòng chọn nhân viên', trigger: 'change'}],
  nguoi_danh_gia_id: [{required: true, message: 'Vui lòng chọn người đánh giá', trigger: 'change'}],
  'ky_danh_gia.tu_ngay': [{required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change'}],
  'ky_danh_gia.den_ngay': [{required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change'}],
  trang_thai: [{required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'}],
};

const goalFormRules: FormRules = {
  ten_muc_tieu: [{required: true, message: 'Vui lòng nhập tên mục tiêu', trigger: 'blur'}],
  trang_thai: [{required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'}],
};

const loadData = async () => {
  if (!trackerId.value) return;

  loading.value = true;
  try {
    const data = await performanceTrackerService.getById(trackerId.value);
    form.ten_tracker = data.ten_tracker;
    form.nhan_vien_id = typeof data.nhan_vien_id === 'object' ? data.nhan_vien_id._id : data.nhan_vien_id;
    form.nguoi_danh_gia_id = typeof data.nguoi_danh_gia_id === 'object' ? data.nguoi_danh_gia_id._id : data.nguoi_danh_gia_id;
    form.ky_danh_gia = data.ky_danh_gia;
    form.muc_tieu = data.muc_tieu || [];
    form.danh_gia_chung = data.danh_gia_chung || {diem_manh: [], diem_yeu: []};
    form.trang_thai = data.trang_thai;
    form.ghi_chu = data.ghi_chu || '';
  } catch (err: any) {
    console.error('Error loading tracker:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải thông tin tracker');
    handleBack();
  } finally {
    loading.value = false;
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

const calculateOverallProgress = (): number => {
  if (form.muc_tieu.length === 0) return 0;

  let totalProgress = 0;
  let totalWeight = 0;

  form.muc_tieu.forEach((goal) => {
    const weight = goal.trong_so || 0;
    const progress = goal.tien_do || 0;
    totalProgress += progress * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return form.muc_tieu.reduce((sum, goal) => sum + (goal.tien_do || 0), 0) / form.muc_tieu.length;
  }

  return Math.round(totalProgress / totalWeight);
};

const calculateAverageScore = (): number => {
  if (form.muc_tieu.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  form.muc_tieu.forEach((goal) => {
    const weight = goal.trong_so || 0;
    const score = goal.diem_danh_gia || 0;
    totalScore += score * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return form.muc_tieu.reduce((sum, goal) => sum + (goal.diem_danh_gia || 0), 0) / form.muc_tieu.length;
  }

  return totalScore / totalWeight;
};

const handleAddGoal = () => {
  editingGoalIndex.value = null;
  resetGoalForm();
  showGoalDialog.value = true;
};

const handleEditGoal = (index: number) => {
  editingGoalIndex.value = index;
  const goal = form.muc_tieu[index];
  Object.assign(goalForm, goal);
  showGoalDialog.value = true;
};

const handleSaveGoal = async () => {
  if (!goalFormRef.value) return;

  await goalFormRef.value.validate((valid) => {
    if (!valid) return;

    const goalData = {...goalForm};

    if (editingGoalIndex.value !== null) {
      form.muc_tieu[editingGoalIndex.value] = goalData;
      ElMessage.success('Cập nhật mục tiêu thành công');
    } else {
      form.muc_tieu.push(goalData);
      ElMessage.success('Thêm mục tiêu thành công');
    }

    closeGoalDialog();
  });
};

const handleDeleteGoal = async (index: number) => {
  try {
    await ElMessageBox.confirm('Bạn có chắc chắn muốn xóa mục tiêu này?', 'Xác nhận xóa', {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning',
    });

    form.muc_tieu.splice(index, 1);
    ElMessage.success('Xóa mục tiêu thành công');
  } catch (err) {
    // User cancelled
  }
};

const closeGoalDialog = () => {
  showGoalDialog.value = false;
  editingGoalIndex.value = null;
  resetGoalForm();
  if (goalFormRef.value) {
    goalFormRef.value.resetFields();
  }
};

const resetGoalForm = () => {
  goalForm.ten_muc_tieu = '';
  goalForm.mo_ta = '';
  goalForm.trong_so = 0;
  goalForm.trang_thai = 'Chưa bắt đầu';
  goalForm.tien_do = 0;
  goalForm.diem_danh_gia = 0;
  goalForm.ngay_bat_dau = '';
  goalForm.han_hoan_thanh = '';
  goalForm.ngay_hoan_thanh = '';
  goalForm.nhan_xet = '';
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data: any = {
        ten_tracker: form.ten_tracker,
        nhan_vien_id: form.nhan_vien_id,
        nguoi_danh_gia_id: form.nguoi_danh_gia_id,
        ky_danh_gia: form.ky_danh_gia,
        muc_tieu: form.muc_tieu,
        danh_gia_chung: form.danh_gia_chung,
        trang_thai: form.trang_thai,
        ghi_chu: form.ghi_chu,
        tien_do_tong: calculateOverallProgress(),
        diem_trung_binh: calculateAverageScore(),
      };

      if (trackerId.value) {
        await performanceTrackerService.update(trackerId.value, data);
        ElMessage.success('Cập nhật tracker thành công');
      } else {
        await performanceTrackerService.create(data);
        ElMessage.success('Tạo tracker thành công');
      }

      handleBack();
    } catch (err: any) {
      console.error('Error saving tracker:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu tracker');
    } finally {
      saving.value = false;
    }
  });
};

const handleBack = () => {
  router.push({name: 'performance-tracker-list'});
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
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

const getGoalStatusType = (status: string): string => {
  const types: Record<string, string> = {
    'Chưa bắt đầu': 'info',
    'Đang thực hiện': 'warning',
    'Hoàn thành': 'success',
    'Quá hạn': 'danger',
    'Đã hủy': 'info',
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
  loadEmployees();
  if (trackerId.value) {
    loadData();
  }
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.orangehrm-tracker-form-page {
  width: 100%;
}

.orangehrm-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
  gap: $spacing-md;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
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

.orangehrm-form-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;
  }

  :deep(.el-tabs__content) {
    padding: $spacing-lg;
  }
}

.tab-badge {
  margin-left: $spacing-xs;
}

.progress-label,
.score-label {
  margin-left: $spacing-md;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.form-hint {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.goals-section {
  .goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    h3 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-medium;
      color: $text-primary;
    }
  }

  .empty-state {
    padding: $spacing-xl 0;
  }

  .goals-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .goal-card {
    :deep(.el-card__body) {
      padding: $spacing-lg;
    }

    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;
      padding-bottom: $spacing-md;
      border-bottom: 1px solid $border-color;

      .goal-title {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        .goal-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background-color: $primary-color;
          color: $white;
          border-radius: 50%;
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
        }

        strong {
          font-size: $font-size-base;
          color: $text-primary;
        }
      }

      .goal-actions {
        display: flex;
        gap: $spacing-xs;
      }
    }

    .goal-content {
      .goal-info-item {
        margin-bottom: $spacing-sm;

        label {
          display: block;
          font-size: $font-size-sm;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
        }

        span {
          color: $text-primary;
        }
      }

      .goal-description,
      .goal-comment {
        margin-top: $spacing-md;
        padding-top: $spacing-md;
        border-top: 1px dashed $border-color;

        label {
          display: block;
          font-size: $font-size-sm;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
          font-weight: $font-weight-medium;
        }

        p {
          margin: 0;
          color: $text-primary;
          line-height: 1.6;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .orangehrm-page-header {
    flex-direction: column;
    align-items: flex-start;

    .header-left {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
    }

    .orangehrm-page-actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }

  .goals-section {
    .goals-header {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-md;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>

<template>
  <div class="candidate-pool-page">
    <div class="page-header">
      <div>
        <h2>Candidate Pool</h2>
        <p>Bóc tách CV tự động và tìm ứng viên theo kỹ năng/điểm số.</p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" @click="loadPool">Tải lại</el-button>
        <el-button type="primary" :icon="Upload" @click="openImportDialog">
          Bóc tách CV
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="Pipeline">
          <el-select
            v-model="filters.pipeline_stage"
            placeholder="Tất cả"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="stage in pipelineStageOptions"
              :key="stage.value"
              :label="stage.label"
              :value="stage.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Kỹ năng">
          <el-select
            v-model="filters.ky_nang"
            multiple
            collapse-tags
            filterable
            allow-create
            default-first-option
            placeholder="VD: JavaScript, HR..."
            @change="handleFilterChange"
          >
            <el-option
              v-for="skill in skillPresets"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Điểm tối thiểu">
          <el-input-number
            v-model="filters.min_score"
            :min="0"
            :max="100"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item label="Kinh nghiệm (năm)">
          <el-input-number
            v-model="filters.min_exp"
            :min="0"
            :max="30"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilterChange">
            Lọc
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="candidates"
        :empty-text="loading ? 'Đang tải...' : 'Chưa có dữ liệu'"
      >
        <el-table-column type="index" width="60" />
        <el-table-column prop="ho_ten" label="Ứng viên" min-width="200">
          <template #default="{row}">
            <div class="candidate-cell">
              <strong>{{ row.ho_ten }}</strong>
              <span>{{ row.email }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Pipeline" min-width="180">
          <template #default="{row}">
            <el-select
              size="small"
              :model-value="row.pipeline_stage"
              :disabled="stageUpdatingId === row._id"
              @change="(value) => handlePipelineChange(row, value)"
            >
              <el-option
                v-for="stage in pipelineStageOptions"
                :key="stage.value"
                :label="stage.label"
                :value="stage.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Kỹ năng" min-width="220">
          <template #default="{row}">
            <el-space wrap>
              <el-tag
                v-for="skill in row.ky_nang || []"
                :key="skill"
                type="success"
                size="small"
              >
                {{ skill }}
              </el-tag>
              <span v-if="!row.ky_nang || row.ky_nang.length === 0">-</span>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="Score" width="120">
          <template #default="{row}">
            <el-tag :type="row.score && row.score >= 60 ? 'success' : 'info'">
              {{ row.score ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="kinh_nghiem_nam"
          label="Kinh nghiệm"
          width="140"
        >
          <template #default="{row}">
            {{ row.kinh_nghiem_nam ?? 0 }} năm
          </template>
        </el-table-column>
        <el-table-column label="Tóm tắt" min-width="200">
          <template #default="{row}">
            <el-button type="primary" text size="small" @click="viewCandidate(row)">
              Xem chi tiết
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="Thông tin ứng viên" width="520px">
      <template v-if="selectedCandidate">
        <p><strong>Email:</strong> {{ selectedCandidate.email }}</p>
        <p><strong>Điện thoại:</strong> {{ selectedCandidate.dien_thoai || '-' }}</p>
        <p><strong>Kỹ năng:</strong> {{ (selectedCandidate.ky_nang || []).join(', ') || '-' }}</p>
        <p><strong>Tóm tắt:</strong></p>
        <p class="candidate-summary">
          {{
            selectedCandidate.parsed_fields?.tom_tat ||
            selectedCandidate.ghi_chu ||
            'Chưa có thông tin'
          }}
        </p>
        <p><strong>Kinh nghiệm nổi bật:</strong></p>
        <ul>
          <li
            v-for="exp in selectedCandidate.parsed_fields?.kinh_nghiem || []"
            :key="exp"
          >
            {{ exp }}
          </li>
        </ul>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">Đóng</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      title="Bóc tách CV tự động"
      width="600px"
    >
      <div class="import-wrapper">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          @change="handleResumeFileChange"
        />
        <el-form label-width="160px">
          <el-form-item label="Pipeline ban đầu">
            <el-select v-model="importPayload.pipeline_stage">
              <el-option
                v-for="stage in pipelineStageOptions"
                :key="stage.value"
                :label="stage.label"
                :value="stage.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Tags">
            <el-select
              v-model="importPayload.tags"
              multiple
              allow-create
              collapse-tags
              placeholder="VD: Talent, Backend"
            >
              <el-option
                v-for="tag in tagPresets"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Vị trí mong muốn">
            <el-input
              v-model="importPayload.vi_tri_mong_muon"
              placeholder="VD: Backend Engineer"
            />
          </el-form-item>
        </el-form>
        <el-alert
          v-if="importPreview"
          type="success"
          :closable="false"
          class="import-preview"
        >
          <template #title>
            Đã tạo ứng viên: {{ importPreview.ho_ten }} ({{ importPreview.email }})
          </template>
          <p>Score: {{ importPreview.score ?? 0 }}</p>
          <p>
            Kỹ năng được bóc tách:
            {{ (importPreview.ky_nang || []).join(', ') || 'Chưa xác định' }}
          </p>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">Hủy</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          @click="submitImport"
        >
          Bóc tách
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {ElMessage} from 'element-plus';
import {Search, Refresh, Upload} from '@element-plus/icons-vue';
import candidateService from '@/services/candidateService';
import type {Candidate} from '@/types';

const pipelineStageOptions: Array<{value: Candidate['pipeline_stage']; label: string}> =
  [
    {value: 'CV_moi', label: 'CV mới'},
    {value: 'Screening', label: 'Sàng lọc'},
    {value: 'Phong_van_v1', label: 'Phỏng vấn vòng 1'},
    {value: 'Phong_van_v2', label: 'Phỏng vấn vòng 2'},
    {value: 'Offer', label: 'Offer'},
    {value: 'Hired', label: 'Đã nhận việc'},
    {value: 'Rejected', label: 'Không phù hợp'},
  ];

const skillPresets = [
  'JavaScript',
  'Node.js',
  'Vue.js',
  'React',
  'Python',
  'HR Operations',
  'Communication',
  'Leadership',
];

const tagPresets = ['Talent Pool', 'Referral', 'Ưu tiên', 'Senior'];

const candidates = ref<Candidate[]>([]);
const loading = ref(false);
const stageUpdatingId = ref('');
const detailVisible = ref(false);
const selectedCandidate = ref<Candidate | null>(null);

const filters = reactive<{
  pipeline_stage: Candidate['pipeline_stage'] | '';
  ky_nang: string[];
  min_score: number;
  min_exp: number;
}>({
  pipeline_stage: '',
  ky_nang: [],
  min_score: 0,
  min_exp: 0,
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const importDialogVisible = ref(false);
const importLoading = ref(false);
const importPreview = ref<Candidate | null>(null);
const selectedFile = ref<File | null>(null);
const importPayload = reactive({
  pipeline_stage: 'CV_moi' as Candidate['pipeline_stage'],
  tags: [] as string[],
  vi_tri_mong_muon: '',
});

const loadPool = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      min_score: filters.min_score || undefined,
      min_exp: filters.min_exp || undefined,
    };
    if (filters.pipeline_stage) params.pipeline_stage = filters.pipeline_stage;
    if (filters.ky_nang.length) params.ky_nang = filters.ky_nang.join(',');
    const response = await candidateService.searchPool(params);
    candidates.value = response.data || [];
    pagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadPool error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải candidate pool');
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadPool();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadPool();
};

const handlePipelineChange = async (
  row: Candidate,
  stage: Candidate['pipeline_stage'],
) => {
  stageUpdatingId.value = row._id;
  try {
    const updated = await candidateService.updatePipelineStage(row._id, {stage});
    Object.assign(row, updated);
    ElMessage.success('Đã cập nhật pipeline');
  } catch (err: any) {
    console.error('handlePipelineChange error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật pipeline');
  } finally {
    stageUpdatingId.value = '';
  }
};

const viewCandidate = (row: Candidate) => {
  selectedCandidate.value = row;
  detailVisible.value = true;
};

const openImportDialog = () => {
  importDialogVisible.value = true;
  importPreview.value = null;
  selectedFile.value = null;
  importPayload.pipeline_stage = 'CV_moi';
  importPayload.tags = [];
  importPayload.vi_tri_mong_muon = '';
};

const handleResumeFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  selectedFile.value = file || null;
  importPreview.value = null;
};

const submitImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('Vui lòng chọn file CV');
    return;
  }
  importLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('cv', selectedFile.value);
    formData.append('pipeline_stage', importPayload.pipeline_stage);
    formData.append('vi_tri_mong_muon', importPayload.vi_tri_mong_muon);
    if (importPayload.tags.length) {
      formData.append('tags', importPayload.tags.join(','));
    }
    const candidate = await candidateService.importResume(formData);
    importPreview.value = candidate;
    ElMessage.success('Đã bóc tách CV thành công');
    loadPool();
  } catch (err: any) {
    console.error('submitImport', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể bóc tách CV');
  } finally {
    importLoading.value = false;
  }
};

loadPool();
</script>

<style scoped lang="scss">
.candidate-pool-page {
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
    font-size: $font-size-xl;
  }

  p {
    margin: $spacing-xxs 0 0 0;
    color: $text-secondary;
  }
}

.page-actions {
  display: flex;
  gap: $spacing-sm;
}

.filter-card {
  :deep(.el-card__body) {
    padding: $spacing-md;
  }
}

.candidate-cell {
  display: flex;
  flex-direction: column;

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

.import-wrapper {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.import-preview {
  margin-top: $spacing-md;
}

.candidate-summary {
  background-color: $bg-gray;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
}
</style>

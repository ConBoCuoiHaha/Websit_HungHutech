<template>
  <div class="pipeline-page">
    <div class="page-header">
      <div>
        <h2>Pipeline tuyển dụng</h2>
        <p>Theo dõi trạng thái ứng viên theo từng vòng</p>
      </div>
      <div class="filters">
        <el-select
          v-model="selectedVacancy"
          placeholder="Chọn vị trí"
          clearable
          filterable
          @change="loadApplications"
        >
          <el-option
            v-for="vacancy in vacancies"
            :key="vacancy._id"
            :label="vacancy.tieu_de"
            :value="vacancy._id"
          />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="Tìm theo tên ứng viên"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button :icon="Refresh" @click="loadApplications">Tải lại</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="pipeline-board">
      <el-col
        v-for="column in statusColumns"
        :key="column.value"
        :xs="24"
        :sm="12"
        :lg="4"
      >
        <el-card class="pipeline-column" shadow="never">
          <template #header>
            <div class="column-header">
              <span>{{ column.label }}</span>
              <el-tag size="small" type="info">
                {{ filteredApplications(column.value).length }}
              </el-tag>
            </div>
          </template>

          <div class="column-cards">
            <el-empty
              v-if="filteredApplications(column.value).length === 0"
              description="Chưa có"
              :image-size="80"
            />
            <el-card
              v-for="application in filteredApplications(column.value)"
              :key="application._id"
              class="candidate-card"
              shadow="hover"
            >
              <div class="candidate-header">
                <strong>{{ candidateName(application.candidate_id) }}</strong>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="viewCandidate(application)"
                >
                  Xem
                </el-button>
              </div>
              <p class="candidate-subtitle">
                {{ vacancyTitle(application.vacancy_id) }}
              </p>
              <div class="candidate-actions">
                <el-select
                  v-model="application.trang_thai"
                  size="small"
                  @change="(value) => updateStatus(application, value)"
                >
                  <el-option
                    v-for="option in statusColumns"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
              <small class="candidate-date">
                Cập nhật: {{ formatDate(application.ngay_cap_nhat || application.ngay_tao) }}
              </small>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {ElMessage} from 'element-plus';
import {Refresh, Search} from '@element-plus/icons-vue';
import applicationService from '@/services/applicationService';
import vacancyService from '@/services/vacancyService';
import {Application, Vacancy, Candidate} from '@/types';

const applications = ref<Application[]>([]);
const vacancies = ref<Vacancy[]>([]);
const candidates = ref<Record<string, Candidate>>({});
const selectedVacancy = ref('');
const searchKeyword = ref('');
const loading = ref(false);

const statusColumns = [
  {value: 'Ung tuyen', label: 'Ứng tuyển'},
  {value: 'So tuyen', label: 'Sơ tuyển'},
  {value: 'Phong van', label: 'Phỏng vấn'},
  {value: 'Tuyen dung', label: 'Tuyển dụng'},
  {value: 'Tu choi', label: 'Từ chối'},
];

const loadVacancies = async () => {
  try {
    const response = await vacancyService.getAll({limit: 200});
    vacancies.value = response.data || response.items || [];
  } catch (err) {
    console.error('loadVacancies error', err);
  }
};

const loadApplications = async () => {
  loading.value = true;
  try {
    const response = await applicationService.getAll({
      limit: 500,
      vacancy_id: selectedVacancy.value || undefined,
    });
    applications.value = response.data || response.items || [];
    const candidateMap: Record<string, Candidate> = {};
    applications.value.forEach((app) => {
      const candidate = app.candidate_id as Candidate;
      if (candidate && typeof candidate === 'object') {
        candidateMap[String(candidate._id)] = candidate;
      }
    });
    candidates.value = candidateMap;
  } catch (err) {
    console.error('loadApplications error', err);
    ElMessage.error('Không thể tải pipeline ứng viên');
  } finally {
    loading.value = false;
  }
};

const filteredApplications = (status: string) => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return applications.value.filter((app) => {
    if (app.trang_thai !== status) return false;
    if (!keyword) return true;
    const name = candidateName(app.candidate_id).toLowerCase();
    return name.includes(keyword);
  });
};

const updateStatus = async (application: Application, status: Application['trang_thai']) => {
  try {
    await applicationService.updateStatus(application._id, status);
    ElMessage.success('Đã cập nhật trạng thái ứng viên');
    loadApplications();
  } catch (err) {
    console.error('updateStatus error', err);
    ElMessage.error('Không thể cập nhật trạng thái');
  }
};

const candidateName = (candidate: string | Candidate | undefined) => {
  if (!candidate) return '---';
  if (typeof candidate === 'string') {
    return candidates.value[candidate]?.ho_ten || '---';
  }
  return candidate.ho_ten || '---';
};

const vacancyTitle = (vacancy: string | Vacancy | undefined) => {
  if (!vacancy) return '---';
  if (typeof vacancy === 'string') {
    return vacancies.value.find((item) => item._id === vacancy)?.tieu_de || '---';
  }
  return vacancy.tieu_de || '---';
};

const viewCandidate = (application: Application) => {
  const candidate = application.candidate_id as Candidate;
  if (candidate?.email) {
    window.open(`mailto:${candidate.email}`, '_blank');
  }
};

const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
};

loadVacancies();
loadApplications();
</script>

<style scoped lang="scss">
.pipeline-page {
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

.filters {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  flex-wrap: wrap;
}

.pipeline-board {
  min-height: 200px;
}

.pipeline-column {
  min-height: 360px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.candidate-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-subtitle {
  margin: 0;
  color: $text-secondary;
  font-size: $font-size-sm;
}

.candidate-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-date {
  color: $text-secondary;
}
</style>

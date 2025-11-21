<template>
  <div class="orangehrm-candidate-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Quản lý ứng viên</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Thêm ứng viên
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filters.q"
            placeholder="Tìm theo tên, email..."
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

        <el-form-item v-if="route.query.vacancy_id" label="Vị trí ứng tuyển">
          <el-select
            v-model="filters.vacancy_id"
            placeholder="Tất cả"
            clearable
            style="width: 300px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="vac in vacancies"
              :key="vac._id"
              :label="vac.tieu_de"
              :value="vac._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="!filters.vacancy_id" label="Nguồn">
          <el-select
            v-model="filters.nguon"
            placeholder="Tất cả"
            clearable
            style="width: 220px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="option in candidateSourceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="!filters.vacancy_id" label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 220px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="option in candidateStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="!filters.vacancy_id" label="Tags">
          <el-select
            v-model="filters.tags"
            multiple
            collapse-tags
            filterable
            allow-create
            default-first-option
            style="width: 260px"
            placeholder="Nhập tag..."
            @change="handleFilterChange"
          >
            <el-option
              v-for="tag in tagPresets"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilterChange">
            Tìm kiếm
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Applications Table (if viewing for specific vacancy) -->
    <el-card
      v-if="filters.vacancy_id"
      class="orangehrm-table-card"
      shadow="never"
    >
      <template #header>
        <div class="orangehrm-card-header">
          <span class="orangehrm-card-title">Danh sách ứng viên</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="applicationList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="candidate_id" label="Ứng viên" min-width="200">
          <template #default="{row}">
            <div
              v-if="typeof row.candidate_id === 'object' && row.candidate_id"
            >
              <strong>{{ row.candidate_id.ho_ten }}</strong>
              <div class="orangehrm-text-muted">
                {{ row.candidate_id.email }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="candidate_id.dien_thoai"
          label="Điện thoại"
          width="130"
        >
          <template #default="{row}">
            {{
              typeof row.candidate_id === 'object' && row.candidate_id
                ? row.candidate_id.dien_thoai || '-'
                : '-'
            }}
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140">
          <template #default="{row}">
            <el-tag
              :type="getApplicationStatusType(row.trang_thai)"
              size="small"
            >
              {{ getApplicationStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày ứng tuyển" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="260" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button
                size="small"
                :icon="View"
                @click="handleViewApplication(row)"
              >
                Xem
              </el-button>
              <el-dropdown
                @command="(cmd) => handleUpdateApplicationStatus(row._id, cmd)"
              >
                <el-button size="small" :icon="Edit">
                  Cập nhật
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="So tuyen"
                      >Sơ tuyển</el-dropdown-item
                    >
                    <el-dropdown-item command="Phong van"
                      >Phỏng vấn</el-dropdown-item
                    >
                    <el-dropdown-item command="Tuyen dung"
                      >Tuyển dụng</el-dropdown-item
                    >
                    <el-dropdown-item command="Tu choi" divided
                      >Từ chối</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- Candidates Table (general view) -->
    <el-card v-else class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="candidateList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="ho_ten" label="Họ tên" min-width="200">
          <template #default="{row}">
            <strong>{{ row.ho_ten }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="Email" min-width="200" />

        <el-table-column prop="dien_thoai" label="Điện thoại" width="130">
          <template #default="{row}">
            {{ row.dien_thoai || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="nguon" label="Nguồn" width="150">
          <template #default="{row}">
            {{ getCandidateSourceText(row.nguon) }}
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{row}">
            <el-tag :type="getCandidateStatusType(row.trang_thai)" size="small">
              {{ getCandidateStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Tags" min-width="200">
          <template #default="{row}">
            <el-space wrap>
              <el-tag
                v-for="tag in row.tags || []"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!row.tags || row.tags.length === 0">-</span>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="Kỹ năng" min-width="220">
          <template #default="{row}">
            <el-space wrap>
              <el-tag
                v-for="skill in row.ky_nang || []"
                :key="skill"
                size="small"
                type="success"
              >
                {{ skill }}
              </el-tag>
              <span v-if="!row.ky_nang || row.ky_nang.length === 0">-</span>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column
          prop="kinh_nghiem_nam"
          label="Kinh nghiệm (năm)"
          width="170"
        >
          <template #default="{row}">
            {{ row.kinh_nghiem_nam ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="vi_tri_mong_muon" label="Vị trí mong muốn" min-width="180">
          <template #default="{row}">
            {{ row.vi_tri_mong_muon || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="ngay_lien_he_cuoi" label="Liên hệ cuối" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_lien_he_cuoi) }}
          </template>
        </el-table-column>

        <el-table-column prop="ghi_chu" label="Ghi chú" min-width="200">
          <template #default="{row}">
            <div class="orangehrm-text-truncate">{{ row.ghi_chu || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="Edit" @click="handleEdit(row)"
                >Sửa</el-button
              >
              <el-button
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

    <!-- Create/Edit Candidate Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? 'Chỉnh sửa ứng viên' : 'Thêm ứng viên mới'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="Họ tên" prop="ho_ten" required>
          <el-input
            v-model="form.ho_ten"
            placeholder="Nhập họ tên..."
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="Email" prop="email" required>
          <el-input
            v-model="form.email"
            type="email"
            placeholder="Nhập email..."
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="Điện thoại" prop="dien_thoai">
          <el-input
            v-model="form.dien_thoai"
            placeholder="Nhập số điện thoại..."
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="Nguồn" prop="nguon">
          <el-select
            v-model="form.nguon"
            placeholder="Chọn nguồn"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="option in candidateSourceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="trang_thai">
          <el-select
            v-model="form.trang_thai"
            placeholder="Chọn trạng thái"
            style="width: 100%"
          >
            <el-option
              v-for="option in candidateStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Vị trí mong muốn" prop="vi_tri_mong_muon">
          <el-input
            v-model="form.vi_tri_mong_muon"
            placeholder="Nhập vị trí mong muốn..."
            maxlength="120"
          />
        </el-form-item>

        <el-form-item label="Kinh nghiệm (năm)" prop="kinh_nghiem_nam">
          <el-input-number
            v-model="form.kinh_nghiem_nam"
            :min="0"
            :max="50"
            :step="0.5"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Tags" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            collapse-tags
            allow-create
            filterable
            default-first-option
            placeholder="Nhập tag..."
            style="width: 100%"
          >
            <el-option
              v-for="tag in tagPresets"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Kỹ năng" prop="ky_nang">
          <el-select
            v-model="form.ky_nang"
            multiple
            collapse-tags
            allow-create
            filterable
            default-first-option
            placeholder="Nhập kỹ năng..."
            style="width: 100%"
          >
            <el-option
              v-for="skill in skillPresets"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Liên hệ cuối" prop="ngay_lien_he_cuoi">
          <el-date-picker
            v-model="form.ngay_lien_he_cuoi"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="form.ghi_chu"
            type="textarea"
            :rows="4"
            placeholder="Nhập ghi chú..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Application Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Chi tiết hồ sơ ứng tuyển"
      width="600px"
    >
      <div v-if="selectedApplication" class="orangehrm-application-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Ứng viên">
            <div
              v-if="
                typeof selectedApplication.candidate_id === 'object' &&
                selectedApplication.candidate_id
              "
            >
              <strong>{{ selectedApplication.candidate_id.ho_ten }}</strong>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Email">
            {{
              typeof selectedApplication.candidate_id === 'object' &&
              selectedApplication.candidate_id
                ? selectedApplication.candidate_id.email
                : '-'
            }}
          </el-descriptions-item>

          <el-descriptions-item label="Điện thoại">
            {{
              typeof selectedApplication.candidate_id === 'object' &&
              selectedApplication.candidate_id
                ? selectedApplication.candidate_id.dien_thoai || '-'
                : '-'
            }}
          </el-descriptions-item>

          <el-descriptions-item label="Vị trí ứng tuyển">
            {{
              typeof selectedApplication.vacancy_id === 'object' &&
              selectedApplication.vacancy_id
                ? selectedApplication.vacancy_id.tieu_de
                : '-'
            }}
          </el-descriptions-item>

          <el-descriptions-item label="Trạng thái">
            <el-tag
              :type="getApplicationStatusType(selectedApplication.trang_thai)"
            >
              {{ getApplicationStatusText(selectedApplication.trang_thai) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Ghi chú">
            {{ selectedApplication.ghi_chu || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="Ngày ứng tuyển">
            {{ formatDate(selectedApplication.ngay_tao) }}
          </el-descriptions-item>

          <el-descriptions-item label="Cập nhật cuối">
            {{ formatDate(selectedApplication.ngay_cap_nhat) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, watch} from 'vue';
import {useRoute} from 'vue-router';
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  View,
  ArrowDown,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import candidateService from '@/services/candidateService';
import vacancyService from '@/services/vacancyService';
import applicationService from '@/services/applicationService';
import {Candidate, Vacancy, Application} from '@/types';

const DEFAULT_CANDIDATE_SOURCE = 'Khac';
const DEFAULT_CANDIDATE_STATUS: Candidate['trang_thai'] = 'Moi';

const candidateSourceOptions: Array<{value: string; label: string}> = [
  {value: 'LinkedIn', label: 'LinkedIn'},
  {value: 'VietnamWorks', label: 'VietnamWorks'},
  {value: 'TopCV', label: 'TopCV'},
  {value: 'Website', label: 'Website công ty'},
  {value: 'Referral', label: 'Giới thiệu nội bộ'},
  {value: 'JobFair', label: 'Sự kiện tuyển dụng'},
  {value: 'Agency', label: 'Agency'},
  {value: 'Khac', label: 'Khác'},
];

const candidateStatusOptions: Array<{
  value: Candidate['trang_thai'];
  label: string;
  tagType: '' | 'success' | 'info' | 'warning' | 'danger';
}> = [
  {value: 'Moi', label: 'Mới', tagType: 'info'},
  {value: 'Dang_lien_he', label: 'Đang liên hệ', tagType: 'info'},
  {value: 'Phong_van', label: 'Phỏng vấn', tagType: 'warning'},
  {value: 'Duoc_tuyen', label: 'Được tuyển', tagType: 'success'},
  {value: 'Khong_phu_hop', label: 'Không phù hợp', tagType: 'danger'},
];

const tagPresets = [
  'Talent Pool',
  'Ưu tiên',
  'Thực tập',
  'Senior',
  'Referral',
  'Gấp',
];

const skillPresets = [
  'JavaScript',
  'Node.js',
  'Vue.js',
  'NestJS',
  'SQL',
  'HR Operations',
  'Communication',
];

const candidateSourceMap = candidateSourceOptions.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {},
);

const candidateStatusTypeMap = candidateStatusOptions.reduce<
  Record<string, string>
>((acc, option) => {
  acc[option.value] = option.tagType;
  return acc;
}, {});

const candidateStatusLabelMap = candidateStatusOptions.reduce<
  Record<string, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const route = useRoute();
const candidateList = ref<Candidate[]>([]);
const vacancies = ref<Vacancy[]>([]);
const applicationList = ref<Application[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const showViewDialog = ref(false);
const editingId = ref('');
const selectedApplication = ref<Application | null>(null);
const formRef = ref<FormInstance>();

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive<{
  q: string;
  vacancy_id: string;
  nguon: string;
  trang_thai: string;
  tags: string[];
}>({
  q: '',
  vacancy_id: (route.query.vacancy_id as string) || '',
  nguon: '',
  trang_thai: '',
  tags: [],
});

const form = reactive({
  ho_ten: '',
  email: '',
  dien_thoai: '',
  nguon: DEFAULT_CANDIDATE_SOURCE,
  trang_thai: DEFAULT_CANDIDATE_STATUS,
  vi_tri_mong_muon: '',
  kinh_nghiem_nam: 0,
  tags: [] as string[],
  ky_nang: [] as string[],
  ngay_lien_he_cuoi: '',
  ghi_chu: '',
});

const formRules: FormRules = {
  ho_ten: [{required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur'}],
  email: [
    {required: true, message: 'Vui lòng nhập email', trigger: 'blur'},
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
  nguon: [{required: true, message: 'Vui lòng chọn nguồn', trigger: 'change'}],
  trang_thai: [
    {required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change'},
  ],
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.q) params.q = filters.q;

    if (filters.vacancy_id) {
      // Load applications for specific vacancy
      params.vacancy_id = filters.vacancy_id;
      const response = await applicationService.getAll(params);
      applicationList.value = response.data || [];
      pagination.total = response.pagination?.total || 0;
    } else {
      if (filters.nguon) params.nguon = filters.nguon;
      if (filters.trang_thai) params.trang_thai = filters.trang_thai;
      if (filters.tags.length) params.tag = filters.tags.join(',');

      // Load all candidates
      const response = await candidateService.getAll(params);
      candidateList.value = response.data || [];
      pagination.total = response.pagination?.total || 0;
    }
  } catch (err: any) {
    console.error('Error loading data:', err);
    error.value = err.response?.data?.msg || 'Không thể tải dữ liệu';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const loadVacancies = async () => {
  try {
    const response = await vacancyService.getAll({limit: 1000});
    vacancies.value = response.data || [];
  } catch (err: any) {
    console.error('Error loading vacancies:', err);
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

const handleEdit = (item: Candidate) => {
  editingId.value = item._id;
  form.ho_ten = item.ho_ten;
  form.email = item.email;
  form.dien_thoai = item.dien_thoai || '';
  form.nguon = item.nguon || DEFAULT_CANDIDATE_SOURCE;
  form.trang_thai = (item.trang_thai as Candidate['trang_thai']) || DEFAULT_CANDIDATE_STATUS;
  form.vi_tri_mong_muon = item.vi_tri_mong_muon || '';
  form.kinh_nghiem_nam = item.kinh_nghiem_nam ?? 0;
  form.tags = [...(item.tags || [])];
  form.ky_nang = [...(item.ky_nang || [])];
  form.ngay_lien_he_cuoi = item.ngay_lien_he_cuoi
    ? item.ngay_lien_he_cuoi.substring(0, 10)
    : '';
  form.ghi_chu = item.ghi_chu || '';
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data = {
        ho_ten: form.ho_ten,
        email: form.email,
        dien_thoai: form.dien_thoai,
        nguon: form.nguon,
        trang_thai: form.trang_thai,
        tags: [...form.tags],
        ky_nang: [...form.ky_nang],
        kinh_nghiem_nam: form.kinh_nghiem_nam,
        vi_tri_mong_muon: form.vi_tri_mong_muon,
        ngay_lien_he_cuoi: form.ngay_lien_he_cuoi || null,
        ghi_chu: form.ghi_chu,
      };

      if (editingId.value) {
        await candidateService.update(editingId.value, data);
        ElMessage.success('Cập nhật ứng viên thành công');
      } else {
        await candidateService.create(data);
        ElMessage.success('Tạo ứng viên thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving candidate:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu ứng viên');
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa ứng viên này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await candidateService.delete(id);
    ElMessage.success('Xóa ứng viên thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting candidate:', err);
      ElMessage.error(err.response?.data?.msg || 'Không thể xóa ứng viên');
    }
  }
};

const handleViewApplication = (item: Application) => {
  selectedApplication.value = item;
  showViewDialog.value = true;
};

const handleUpdateApplicationStatus = async (id: string, status: string) => {
  try {
    await applicationService.updateStatus(
      id,
      status as
        | 'Ung tuyen'
        | 'So tuyen'
        | 'Phong van'
        | 'Tuyen dung'
        | 'Tu choi',
    );
    ElMessage.success('Cập nhật trạng thái thành công');
    await loadData();
  } catch (err: any) {
    console.error('Error updating application status:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật trạng thái');
  }
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingId.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.ho_ten = '';
  form.email = '';
  form.dien_thoai = '';
  form.nguon = DEFAULT_CANDIDATE_SOURCE;
  form.trang_thai = DEFAULT_CANDIDATE_STATUS;
  form.vi_tri_mong_muon = '';
  form.kinh_nghiem_nam = 0;
  form.tags = [];
  form.ky_nang = [];
  form.ngay_lien_he_cuoi = '';
  form.ghi_chu = '';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const getCandidateStatusType = (status?: Candidate['trang_thai']): string => {
  if (!status) return 'info';
  return candidateStatusTypeMap[status] || 'info';
};

const getCandidateStatusText = (status?: Candidate['trang_thai']): string => {
  if (!status) return 'Khong xac dinh';
  return candidateStatusLabelMap[status] || status;
};

const getCandidateSourceText = (value?: string): string => {
  if (!value) return '-';
  return candidateSourceMap[value] || value;
};

const getApplicationStatusType = (status: string): string => {
  const types: Record<string, string> = {
    'Ung tuyen': 'info',
    'So tuyen': '',
    'Phong van': 'warning',
    'Tuyen dung': 'success',
    'Tu choi': 'danger',
  };
  return types[status] || 'info';
};

const getApplicationStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    'Ung tuyen': 'Ứng tuyển',
    'So tuyen': 'Sơ tuyển',
    'Phong van': 'Phỏng vấn',
    'Tuyen dung': 'Tuyển dụng',
    'Tu choi': 'Từ chối',
  };
  return texts[status] || status;
};

watch(
  () => route.query.vacancy_id,
  (newVal) => {
    filters.vacancy_id = (newVal as string) || '';
    loadData();
  },
);

onMounted(() => {
  loadData();
  loadVacancies();
});
</script>

<style lang="scss" scoped>
.orangehrm-candidate-page {
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

.orangehrm-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.orangehrm-card-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
}

.orangehrm-text-muted {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.orangehrm-text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.orangehrm-application-details {
  :deep(.el-descriptions__label) {
    font-weight: $font-weight-medium;
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

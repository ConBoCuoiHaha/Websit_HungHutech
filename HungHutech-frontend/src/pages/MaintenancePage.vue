<template>
  <div class="orangehrm-maintenance-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Bảo trì dữ liệu & GDPR Compliance</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadActiveTabData"
          >Tải lại</el-button
        >
      </div>
    </div>

    <!-- Tabs -->
    <el-card class="orangehrm-tabs-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Nhân viên Tab -->
        <el-tab-pane label="Nhân viên" name="employees">
          <!-- Warning Banner -->
          <el-alert
            type="error"
            :closable="false"
            show-icon
            class="maintenance-warning"
          >
            <template #title>
              <strong>Cảnh báo: Hành động không thể hoàn tác</strong>
            </template>
            <div>
              Xóa vĩnh viễn nhân viên sẽ xóa TOÀN BỘ dữ liệu liên quan bao gồm:
              yêu cầu nghỉ phép, chấm công, timesheet, đánh giá hiệu suất, bồi
              hoàn và bài viết. Hành động này không thể khôi phục.
            </div>
          </el-alert>

          <!-- Filters -->
          <el-form :inline="true" class="maintenance-filters">
            <el-form-item label="Tìm kiếm">
              <el-input
                v-model="employeeFilters.q"
                placeholder="Tìm theo mã NV, tên..."
                clearable
                style="width: 300px"
                @keyup.enter="loadEmployees"
                @clear="loadEmployees"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadEmployees">
                Tìm kiếm
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Employee Table -->
          <el-table
            v-loading="loadingEmployees"
            :data="purgeableEmployees"
            style="width: 100%"
            stripe
            :empty-text="'Không có nhân viên nào đủ điều kiện xóa'"
          >
            <el-table-column type="index" label="STT" width="60" />

            <el-table-column prop="ma_nhan_vien" label="Mã NV" width="120" />

            <el-table-column label="Họ tên" min-width="200">
              <template #default="{row}">
                <div>
                  <strong>{{ row.ho_dem }} {{ row.ten }}</strong>
                  <div
                    v-if="row.lien_he?.email_cong_viec"
                    class="orangehrm-text-muted"
                  >
                    {{ row.lien_he.email_cong_viec }}
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Thời gian lưu trữ" width="150">
              <template #default="{row}">
                {{ row.retention_period }}
              </template>
            </el-table-column>

            <el-table-column label="Dữ liệu liên quan" width="180">
              <template #default="{row}">
                <el-tag type="info" size="small">
                  {{ row.related_data_count.total }} bản ghi
                </el-tag>
                <el-popover placement="top" :width="300" trigger="hover">
                  <template #reference>
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </template>
                  <div class="data-breakdown">
                    <div v-if="row.related_data_count.leave_requests">
                      Yêu cầu nghỉ phép:
                      <strong>{{
                        row.related_data_count.leave_requests
                      }}</strong>
                    </div>
                    <div v-if="row.related_data_count.attendance">
                      Chấm công:
                      <strong>{{ row.related_data_count.attendance }}</strong>
                    </div>
                    <div v-if="row.related_data_count.timesheets">
                      Timesheets:
                      <strong>{{ row.related_data_count.timesheets }}</strong>
                    </div>
                    <div v-if="row.related_data_count.performance_trackers">
                      Performance Trackers:
                      <strong>{{
                        row.related_data_count.performance_trackers
                      }}</strong>
                    </div>
                    <div v-if="row.related_data_count.performance_reviews">
                      Đánh giá hiệu suất:
                      <strong>{{
                        row.related_data_count.performance_reviews
                      }}</strong>
                    </div>
                    <div v-if="row.related_data_count.claims">
                      Bồi hoàn:
                      <strong>{{ row.related_data_count.claims }}</strong>
                    </div>
                    <div v-if="row.related_data_count.posts">
                      Bài viết Buzz:
                      <strong>{{ row.related_data_count.posts }}</strong>
                    </div>
                  </div>
                </el-popover>
              </template>
            </el-table-column>

            <el-table-column label="Lý do" min-width="250">
              <template #default="{row}">
                <el-text type="warning" size="small">{{ row.reason }}</el-text>
              </template>
            </el-table-column>

            <el-table-column label="Hành động" width="180" fixed="right">
              <template #default="{row}">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="showPurgeEmployeeDialog(row)"
                >
                  Xóa vĩnh viễn
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="purgeableEmployees.length > 0" class="maintenance-stats">
            <el-text type="info">
              Tìm thấy {{ purgeableEmployees.length }} nhân viên đủ điều kiện
              xóa (Chính sách lưu trữ: {{ employeeRetentionDays }} ngày)
            </el-text>
          </div>
        </el-tab-pane>

        <!-- Ứng viên Tab -->
        <el-tab-pane label="Ứng viên" name="candidates">
          <!-- Warning Banner -->
          <el-alert
            type="error"
            :closable="false"
            show-icon
            class="maintenance-warning"
          >
            <template #title>
              <strong>Cảnh báo: Hành động không thể hoàn tác</strong>
            </template>
            <div>
              Xóa vĩnh viễn ứng viên sẽ xóa TOÀN BỘ dữ liệu liên quan bao gồm:
              hồ sơ ứng tuyển và lịch phỏng vấn. Hành động này không thể khôi
              phục.
            </div>
          </el-alert>

          <!-- Filters -->
          <el-form :inline="true" class="maintenance-filters">
            <el-form-item label="Tìm kiếm">
              <el-input
                v-model="candidateFilters.q"
                placeholder="Tìm theo tên, email..."
                clearable
                style="width: 300px"
                @keyup.enter="loadCandidates"
                @clear="loadCandidates"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadCandidates">
                Tìm kiếm
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Candidate Table -->
          <el-table
            v-loading="loadingCandidates"
            :data="purgeableCandidates"
            style="width: 100%"
            stripe
            :empty-text="'Không có ứng viên nào đủ điều kiện xóa'"
          >
            <el-table-column type="index" label="STT" width="60" />

            <el-table-column label="Họ tên" min-width="200">
              <template #default="{row}">
                <div>
                  <strong>{{ row.ho_ten }}</strong>
                  <div class="orangehrm-text-muted">{{ row.email }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="dien_thoai" label="Điện thoại" width="130">
              <template #default="{row}">
                {{ row.dien_thoai || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Trạng thái cuối" width="140">
              <template #default="{row}">
                <el-tag type="info" size="small">
                  {{ getCandidateStatusText(row.last_status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Thời gian lưu trữ" width="150">
              <template #default="{row}">
                {{ row.retention_period }}
              </template>
            </el-table-column>

            <el-table-column label="Dữ liệu liên quan" width="180">
              <template #default="{row}">
                <el-tag type="info" size="small">
                  {{ row.related_data_count.total }} bản ghi
                </el-tag>
                <el-popover placement="top" :width="250" trigger="hover">
                  <template #reference>
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </template>
                  <div class="data-breakdown">
                    <div v-if="row.related_data_count.applications">
                      Hồ sơ ứng tuyển:
                      <strong>{{ row.related_data_count.applications }}</strong>
                    </div>
                    <div v-if="row.related_data_count.interviews">
                      Lịch phỏng vấn:
                      <strong>{{ row.related_data_count.interviews }}</strong>
                    </div>
                  </div>
                </el-popover>
              </template>
            </el-table-column>

            <el-table-column label="Lý do" min-width="250">
              <template #default="{row}">
                <el-text type="warning" size="small">{{ row.reason }}</el-text>
              </template>
            </el-table-column>

            <el-table-column label="Hành động" width="180" fixed="right">
              <template #default="{row}">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="showPurgeCandidateDialog(row)"
                >
                  Xóa vĩnh viễn
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="purgeableCandidates.length > 0" class="maintenance-stats">
            <el-text type="info">
              Tìm thấy {{ purgeableCandidates.length }} ứng viên đủ điều kiện
              xóa (Chính sách lưu trữ: {{ candidateRetentionDays }} ngày)
            </el-text>
          </div>
        </el-tab-pane>

        <!-- Lịch sử Purge Tab -->
        <el-tab-pane label="Lịch sử Purge" name="logs">
          <!-- Filters -->
          <el-form :inline="true" class="maintenance-filters">
            <el-form-item label="Loại">
              <el-select
                v-model="logFilters.loai"
                placeholder="Tất cả"
                clearable
                style="width: 150px"
                @change="loadLogs"
              >
                <el-option label="Nhân viên" value="NhanVien" />
                <el-option label="Ứng viên" value="UngVien" />
              </el-select>
            </el-form-item>

            <el-form-item label="Từ ngày">
              <el-date-picker
                v-model="logFilters.tu_ngay"
                type="date"
                placeholder="Chọn ngày"
                style="width: 180px"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                @change="loadLogs"
              />
            </el-form-item>

            <el-form-item label="Đến ngày">
              <el-date-picker
                v-model="logFilters.den_ngay"
                type="date"
                placeholder="Chọn ngày"
                style="width: 180px"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                @change="loadLogs"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadLogs">
                Tìm kiếm
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Timeline -->
          <div v-loading="loadingLogs" class="logs-timeline-container">
            <el-timeline v-if="purgeLogs.length > 0">
              <el-timeline-item
                v-for="log in purgeLogs"
                :key="log._id"
                :timestamp="formatDateTime(log.ngay_thuc_hien)"
                placement="top"
              >
                <el-card shadow="hover" class="log-card">
                  <div class="log-header">
                    <el-tag
                      :type="log.loai === 'NhanVien' ? 'danger' : 'warning'"
                      size="small"
                    >
                      {{ log.loai === 'NhanVien' ? 'Nhân viên' : 'Ứng viên' }}
                    </el-tag>
                    <strong class="log-name">{{ log.ten_doi_tuong }}</strong>
                  </div>

                  <div class="log-details">
                    <div class="log-item">
                      <el-icon><User /></el-icon>
                      <span>
                        Người thực hiện:
                        <strong>
                          {{
                            typeof log.nguoi_thuc_hien_id === 'object'
                              ? log.nguoi_thuc_hien_id.email
                              : 'N/A'
                          }}
                        </strong>
                      </span>
                    </div>

                    <div class="log-item">
                      <el-icon><DocumentCopy /></el-icon>
                      <span
                        >Lý do: <em>{{ log.ly_do }}</em></span
                      >
                    </div>

                    <div
                      v-if="log.du_lieu_lien_quan?.deleted_records"
                      class="log-item"
                    >
                      <el-icon><Delete /></el-icon>
                      <span>
                        Dữ liệu đã xóa:
                        <el-tag
                          v-for="(count, key) in log.du_lieu_lien_quan
                            .deleted_records"
                          :key="key"
                          size="small"
                          type="info"
                          class="data-tag"
                        >
                          {{ formatRecordType(key) }}: {{ count }}
                        </el-tag>
                      </span>
                    </div>

                    <div
                      v-if="log.du_lieu_lien_quan?.ma_nhan_vien"
                      class="log-item"
                    >
                      <el-icon><Tickets /></el-icon>
                      <span
                        >Mã NV:
                        <strong>{{
                          log.du_lieu_lien_quan.ma_nhan_vien
                        }}</strong></span
                      >
                    </div>

                    <div v-if="log.du_lieu_lien_quan?.email" class="log-item">
                      <el-icon><Message /></el-icon>
                      <span>Email: {{ log.du_lieu_lien_quan.email }}</span>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>

            <el-empty v-else description="Chưa có lịch sử purge nào" />
          </div>

          <!-- Pagination -->
          <div v-if="logPagination.total > 0" class="orangehrm-pagination">
            <el-pagination
              v-model:current-page="logPagination.currentPage"
              v-model:page-size="logPagination.limit"
              :page-sizes="[10, 20, 50]"
              :total="logPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleLogSizeChange"
              @current-change="handleLogPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Purge Confirmation Dialog -->
    <el-dialog
      v-model="purgeDialog.visible"
      :title="purgeDialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert type="error" :closable="false" show-icon class="dialog-warning">
        <template #title>
          <strong>CẢNH BÁO NGHIÊM TRỌNG</strong>
        </template>
        <div>
          Bạn sắp xóa vĩnh viễn dữ liệu. Hành động này KHÔNG THỂ HOÀN TÁC!
        </div>
      </el-alert>

      <div class="purge-info">
        <h3>Thông tin đối tượng:</h3>
        <div class="info-row">
          <strong>Tên:</strong> {{ purgeDialog.objectName }}
        </div>
        <div v-if="purgeDialog.objectCode" class="info-row">
          <strong>Mã NV:</strong> {{ purgeDialog.objectCode }}
        </div>
        <div v-if="purgeDialog.objectEmail" class="info-row">
          <strong>Email:</strong> {{ purgeDialog.objectEmail }}
        </div>
        <div class="info-row">
          <strong>Tổng dữ liệu liên quan:</strong>
          <el-tag type="danger" size="small">
            {{ purgeDialog.totalRecords }} bản ghi
          </el-tag>
        </div>
      </div>

      <div class="data-details">
        <h3>Chi tiết dữ liệu sẽ bị xóa:</h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item
            v-for="(count, key) in purgeDialog.dataBreakdown"
            :key="key"
            :label="formatRecordType(key)"
          >
            <el-tag type="info" size="small">{{ count }} bản ghi</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="purgeDialog" class="purge-form">
        <el-form-item>
          <el-checkbox v-model="purgeDialog.confirmed">
            <strong>Tôi hiểu rằng hành động này không thể hoàn tác</strong>
          </el-checkbox>
        </el-form-item>

        <el-form-item label="Lý do xóa" required>
          <el-input
            v-model="purgeDialog.reason"
            type="textarea"
            :rows="3"
            placeholder="Vui lòng nhập lý do xóa vĩnh viễn dữ liệu này (bắt buộc)"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="purgeDialog.visible = false">Hủy</el-button>
        <el-button
          type="danger"
          :disabled="
            !purgeDialog.confirmed ||
            !purgeDialog.reason ||
            purgeDialog.reason.trim() === ''
          "
          :loading="purgeDialog.loading"
          @click="confirmPurge"
        >
          Xác nhận xóa vĩnh viễn
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  Refresh,
  Search,
  Delete,
  InfoFilled,
  User,
  DocumentCopy,
  Tickets,
  Message,
} from '@element-plus/icons-vue';
import maintenanceService from '@/services/maintenanceService';
import type {PurgeableEmployee, PurgeableCandidate, PurgeLog} from '@/types';

// Active Tab
const activeTab = ref('employees');

// Employee State
const loadingEmployees = ref(false);
const purgeableEmployees = ref<PurgeableEmployee[]>([]);
const employeeRetentionDays = ref(730);
const employeeFilters = ref({
  q: '',
});

// Candidate State
const loadingCandidates = ref(false);
const purgeableCandidates = ref<PurgeableCandidate[]>([]);
const candidateRetentionDays = ref(365);
const candidateFilters = ref({
  q: '',
});

// Logs State
const loadingLogs = ref(false);
const purgeLogs = ref<PurgeLog[]>([]);
const logPagination = ref({
  currentPage: 1,
  limit: 20,
  total: 0,
});
const logFilters = ref<{
  loai?: 'NhanVien' | 'UngVien';
  tu_ngay?: string;
  den_ngay?: string;
}>({});

// Purge Dialog State
const purgeDialog = ref({
  visible: false,
  title: '',
  type: '' as 'employee' | 'candidate',
  objectId: '',
  objectName: '',
  objectCode: '',
  objectEmail: '',
  totalRecords: 0,
  dataBreakdown: {} as Record<string, number>,
  confirmed: false,
  reason: '',
  loading: false,
});

// Methods
const loadEmployees = async () => {
  loadingEmployees.value = true;
  try {
    const response = await maintenanceService.getEmployeesForPurge();

    // Apply client-side filtering if search query exists
    let items = response.data;
    if (employeeFilters.value.q && employeeFilters.value.q.trim() !== '') {
      const query = employeeFilters.value.q.toLowerCase();
      items = items.filter(
        (emp) =>
          emp.ma_nhan_vien.toLowerCase().includes(query) ||
          `${emp.ho_dem} ${emp.ten}`.toLowerCase().includes(query) ||
          emp.lien_he?.email_cong_viec?.toLowerCase().includes(query),
      );
    }

    purgeableEmployees.value = items;
    employeeRetentionDays.value = response.retention_policy_days;
  } catch (error: any) {
    ElMessage.error(
      error.response?.data?.msg || 'Lỗi khi tải danh sách nhân viên',
    );
  } finally {
    loadingEmployees.value = false;
  }
};

const loadCandidates = async () => {
  loadingCandidates.value = true;
  try {
    const response = await maintenanceService.getCandidatesForPurge();

    // Apply client-side filtering
    let items = response.data;
    if (candidateFilters.value.q && candidateFilters.value.q.trim() !== '') {
      const query = candidateFilters.value.q.toLowerCase();
      items = items.filter(
        (cand) =>
          cand.ho_ten.toLowerCase().includes(query) ||
          cand.email.toLowerCase().includes(query),
      );
    }

    purgeableCandidates.value = items;
    candidateRetentionDays.value = response.retention_policy_days;
  } catch (error: any) {
    ElMessage.error(
      error.response?.data?.msg || 'Lỗi khi tải danh sách ứng viên',
    );
  } finally {
    loadingCandidates.value = false;
  }
};

const loadLogs = async () => {
  loadingLogs.value = true;
  try {
    const response = await maintenanceService.getPurgeLogs({
      page: logPagination.value.currentPage,
      limit: logPagination.value.limit,
      ...logFilters.value,
    });

    purgeLogs.value = response.data;
    logPagination.value.total = response.total;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || 'Lỗi khi tải lịch sử purge');
  } finally {
    loadingLogs.value = false;
  }
};

const loadActiveTabData = () => {
  if (activeTab.value === 'employees') {
    loadEmployees();
  } else if (activeTab.value === 'candidates') {
    loadCandidates();
  } else if (activeTab.value === 'logs') {
    loadLogs();
  }
};

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName;
  loadActiveTabData();
};

const showPurgeEmployeeDialog = (employee: PurgeableEmployee) => {
  const recordTypeMap: Record<string, string> = {
    leave_requests: 'yeu_cau_nghi_phep',
    attendance: 'cham_cong',
    timesheets: 'timesheets',
    performance_trackers: 'performance_trackers',
    performance_reviews: 'performance_reviews',
    claims: 'claims',
    posts: 'buzz_posts',
  };

  const dataBreakdown: Record<string, number> = {};
  Object.entries(employee.related_data_count).forEach(([key, value]) => {
    if (key !== 'total' && value && value > 0) {
      const mappedKey = recordTypeMap[key] || key;
      dataBreakdown[mappedKey] = value;
    }
  });

  purgeDialog.value = {
    visible: true,
    title: 'Xóa vĩnh viễn nhân viên',
    type: 'employee',
    objectId: employee._id,
    objectName: `${employee.ho_dem} ${employee.ten}`,
    objectCode: employee.ma_nhan_vien,
    objectEmail: employee.lien_he?.email_cong_viec || '',
    totalRecords: employee.related_data_count.total,
    dataBreakdown,
    confirmed: false,
    reason: '',
    loading: false,
  };
};

const showPurgeCandidateDialog = (candidate: PurgeableCandidate) => {
  const dataBreakdown: Record<string, number> = {};
  if (candidate.related_data_count.applications) {
    dataBreakdown.applications = candidate.related_data_count.applications;
  }
  if (candidate.related_data_count.interviews) {
    dataBreakdown.interviews = candidate.related_data_count.interviews;
  }

  purgeDialog.value = {
    visible: true,
    title: 'Xóa vĩnh viễn ứng viên',
    type: 'candidate',
    objectId: candidate._id,
    objectName: candidate.ho_ten,
    objectCode: '',
    objectEmail: candidate.email,
    totalRecords: candidate.related_data_count.total,
    dataBreakdown,
    confirmed: false,
    reason: '',
    loading: false,
  };
};

const confirmPurge = async () => {
  purgeDialog.value.loading = true;

  try {
    if (purgeDialog.value.type === 'employee') {
      await maintenanceService.purgeEmployee(
        purgeDialog.value.objectId,
        purgeDialog.value.reason,
      );
      ElMessage.success('Đã xóa vĩnh viễn nhân viên thành công');
      await loadEmployees();
    } else {
      await maintenanceService.purgeCandidate(
        purgeDialog.value.objectId,
        purgeDialog.value.reason,
      );
      ElMessage.success('Đã xóa vĩnh viễn ứng viên thành công');
      await loadCandidates();
    }

    purgeDialog.value.visible = false;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || 'Lỗi khi xóa dữ liệu');
  } finally {
    purgeDialog.value.loading = false;
  }
};

const handleLogSizeChange = (newSize: number) => {
  logPagination.value.limit = newSize;
  logPagination.value.currentPage = 1;
  loadLogs();
};

const handleLogPageChange = (newPage: number) => {
  logPagination.value.currentPage = newPage;
  loadLogs();
};

// Utility Methods
const getCandidateStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Ung tuyen': 'Ứng tuyển',
    'So tuyen': 'Sơ tuyển',
    'Phong van': 'Phỏng vấn',
    'Tuyen dung': 'Tuyển dụng',
    'Tu choi': 'Từ chối',
  };
  return statusMap[status] || status;
};

const formatRecordType = (type: string): string => {
  const typeMap: Record<string, string> = {
    yeu_cau_nghi_phep: 'Yêu cầu nghỉ phép',
    cham_cong: 'Chấm công',
    timesheets: 'Timesheets',
    performance_trackers: 'Theo dõi hiệu suất',
    performance_reviews: 'Đánh giá hiệu suất',
    claims: 'Bồi hoàn',
    buzz_posts: 'Bài viết Buzz',
    applications: 'Hồ sơ ứng tuyển',
    interviews: 'Lịch phỏng vấn',
  };
  return typeMap[type] || type;
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Lifecycle
onMounted(() => {
  loadEmployees();
});
</script>

<style scoped lang="scss">
@import '@/assets/styles/_variables.scss';

.orangehrm-maintenance-page {
  padding: 20px;

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

  .orangehrm-tabs-card {
    margin-bottom: 20px;

    .maintenance-warning {
      margin-bottom: 20px;
    }

    .maintenance-filters {
      margin: 20px 0;
    }

    .maintenance-stats {
      margin-top: 15px;
      padding: 10px;
      background-color: #f5f7fa;
      border-radius: 4px;
      text-align: center;
    }
  }

  .info-icon {
    margin-left: 5px;
    cursor: pointer;
    color: $primary-color;
  }

  .data-breakdown {
    div {
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .logs-timeline-container {
    min-height: 300px;
    padding: 20px 0;

    .log-card {
      margin-bottom: 0;

      .log-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;

        .log-name {
          font-size: 16px;
          color: $primary-color;
        }
      }

      .log-details {
        .log-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 14px;

          .el-icon {
            margin-top: 2px;
            color: $primary-color;
          }

          .data-tag {
            margin: 0 4px;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .orangehrm-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

.dialog-warning {
  margin-bottom: 20px;
}

.purge-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff3e0;
  border-radius: 4px;
  border-left: 4px solid #ff9800;

  h3 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #e65100;
  }

  .info-row {
    margin-bottom: 8px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.data-details {
  margin: 20px 0;

  h3 {
    margin-top: 0;
    margin-bottom: 12px;
    color: $text-primary;
  }
}

.purge-form {
  margin-top: 20px;

  .el-checkbox {
    font-weight: 500;
  }
}

.orangehrm-text-muted {
  color: $text-secondary;
  font-size: 12px;
}
</style>

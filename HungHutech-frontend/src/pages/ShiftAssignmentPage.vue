<template>
  <div class="shift-assignment-page">
    <div class="page-header">
      <div>
        <h2>Phân ca linh hoạt</h2>
        <p>Gán ca làm việc chi tiết theo từng ngày và nhân viên.</p>
      </div>
      <el-button :icon="Refresh" @click="loadAssignments">Tải lại</el-button>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>Phân ca nhanh</h3>
          <small>Áp dụng tối đa 62 ngày cho nhiều nhân viên.</small>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="160px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="Nhân viên" prop="nhan_vien_ids">
              <el-select
                v-model="form.nhan_vien_ids"
                multiple
                filterable
                placeholder="Chọn nhân viên"
              >
                <el-option
                  v-for="nv in employeeOptions"
                  :key="nv._id"
                  :label="`${nv.ma_nhan_vien} - ${nv.ho_dem || ''} ${nv.ten || ''}`"
                  :value="nv._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="Ca làm việc" prop="ca_lam_viec_id">
              <el-select v-model="form.ca_lam_viec_id" placeholder="Chọn ca">
                <el-option
                  v-for="shift in shiftOptions"
                  :key="shift._id"
                  :label="`${shift.ten_ca} (${shift.gio_bat_dau} - ${shift.gio_ket_thuc})`"
                  :value="shift._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="Khoảng áp dụng" prop="dateRange">
              <el-date-picker
                v-model="form.dateRange"
                type="daterange"
                unlink-panels
                start-placeholder="Từ ngày"
                end-placeholder="Đến ngày"
                value-format="YYYY-MM-DD"
                format="DD/MM/YYYY"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="Ghi chú">
              <el-input
                v-model="form.ghi_chu"
                placeholder="Ví dụ: Luân phiên lễ tết"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Opportunity"
            :loading="saving"
            @click="handleAssign"
          >
            Gán ca
          </el-button>
          <el-button @click="resetForm">Nhập lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>Danh sách phân ca</h3>
          <div class="card-filters">
            <el-select
              v-model="filters.nhan_vien_id"
              clearable
              placeholder="Lọc theo nhân viên"
              size="small"
            >
              <el-option
                v-for="nv in employeeOptions"
                :key="nv._id"
                :label="`${nv.ma_nhan_vien} - ${nv.ho_dem || ''} ${nv.ten || ''}`"
                :value="nv._id"
              />
            </el-select>
            <el-date-picker
              v-model="filters.dates"
              type="daterange"
              unlink-panels
              start-placeholder="Từ ngày"
              end-placeholder="Đến ngày"
              value-format="YYYY-MM-DD"
              format="DD/MM/YYYY"
              size="small"
            />
            <el-button size="small" :icon="Search" @click="handleFilter">
              Lọc
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="assignments"
        v-loading="listLoading"
        :empty-text="listLoading ? 'Đang tải...' : 'Chưa có dữ liệu'"
      >
        <el-table-column label="Ngày" width="140">
          <template #default="{row}">
            {{ formatDate(row.ngay) }}
          </template>
        </el-table-column>
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            {{
              typeof row.nhan_vien_id === 'object'
                ? `${row.nhan_vien_id?.ho_dem || ''} ${
                    row.nhan_vien_id?.ten || ''
                  }`
                : row.nhan_vien_id
            }}
          </template>
        </el-table-column>
        <el-table-column label="Ca" min-width="180">
          <template #default="{row}">
            <div class="shift-cell">
              <span>{{ row.shift_snapshot?.ten_ca || '---' }}</span>
              <small>
                {{ row.shift_snapshot?.gio_bat_dau || '--:--' }} -
                {{ row.shift_snapshot?.gio_ket_thuc || '--:--' }}
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ghi_chu" label="Ghi chú" min-width="180" />
        <el-table-column label="Hành động" width="130" fixed="right">
          <template #default="{row}">
            <el-popconfirm
              width="220"
              title="Xóa phân ca ngày này?"
              @confirm="handleDelete(row._id)"
            >
              <template #reference>
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  link
                >
                  Xóa
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import dayjs from 'dayjs';
import {
  Refresh,
  Opportunity,
  Search,
  Delete,
} from '@element-plus/icons-vue';
import shiftAssignmentService from '@/services/shiftAssignmentService';
import nhanVienService from '@/services/nhanVienService';
import caLamViecService from '@/services/caLamViecService';
import {NhanVien, CaLamViec, ShiftAssignment} from '@/types';

const employeeOptions = ref<NhanVien[]>([]);
const shiftOptions = ref<CaLamViec[]>([]);
const assignments = ref<ShiftAssignment[]>([]);
const saving = ref(false);
const listLoading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<{
  nhan_vien_ids: string[];
  ca_lam_viec_id: string;
  dateRange: string[];
  ghi_chu: string;
}>({
  nhan_vien_ids: [],
  ca_lam_viec_id: '',
  dateRange: [],
  ghi_chu: '',
});

const formRules: FormRules = {
  nhan_vien_ids: [{required: true, message: 'Chọn ít nhất 1 nhân viên', trigger: 'change'}],
  ca_lam_viec_id: [{required: true, message: 'Chọn ca làm việc', trigger: 'change'}],
  dateRange: [{type: 'array', required: true, message: 'Chọn khoảng ngày', trigger: 'change'}],
};

const filters = reactive<{
  nhan_vien_id: string;
  dates: [string, string];
}>({
  nhan_vien_id: '',
  dates: [
    dayjs().startOf('week').format('YYYY-MM-DD'),
    dayjs().endOf('week').format('YYYY-MM-DD'),
  ],
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

const formatDate = (value?: string) => {
  if (!value) return '--';
  return dayjs(value).format('DD/MM/YYYY');
};

const loadEmployees = async () => {
  try {
    const response = await nhanVienService.getAll({limit: 200});
    employeeOptions.value = response.data || [];
  } catch {
    employeeOptions.value = [];
  }
};

const loadShifts = async () => {
  try {
    const response = await caLamViecService.getAll({limit: 200});
    shiftOptions.value = response.data || response.items || [];
  } catch {
    shiftOptions.value = [];
  }
};

const loadAssignments = async () => {
  listLoading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (filters.nhan_vien_id) params.nhan_vien_id = filters.nhan_vien_id;
    if (filters.dates?.length === 2) {
      params.from = filters.dates[0];
      params.to = filters.dates[1];
    }
    const response = await shiftAssignmentService.getAll(params);
    assignments.value = response.data || [];
    pagination.total = response.pagination.total;
  } catch (err: any) {
    console.error('loadAssignments error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể tải phân ca');
  } finally {
    listLoading.value = false;
  }
};

const handleAssign = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    await shiftAssignmentService.bulkAssign({
      nhan_vien_ids: form.nhan_vien_ids,
      ca_lam_viec_id: form.ca_lam_viec_id,
      from_date: form.dateRange[0],
      to_date: form.dateRange[1],
      ghi_chu: form.ghi_chu || undefined,
    });
    ElMessage.success('Đã gán ca thành công');
    resetForm();
    loadAssignments();
  } catch (err: any) {
    console.error('handleAssign error', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể gán ca');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
  form.nhan_vien_ids = [];
  form.ca_lam_viec_id = '';
  form.dateRange = [];
  form.ghi_chu = '';
};

const handleFilter = () => {
  pagination.page = 1;
  loadAssignments();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadAssignments();
};

const handleDelete = async (id: string) => {
  try {
    await shiftAssignmentService.delete(id);
    ElMessage.success('Đã xóa phân ca');
    loadAssignments();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể xóa phân ca');
  }
};

onMounted(() => {
  loadEmployees();
  loadShifts();
  loadAssignments();
});
</script>

<style scoped lang="scss">
.shift-assignment-page {
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

.card-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-sm;

  h3 {
    margin: 0;
  }

  small {
    color: $text-secondary;
  }
}

.card-filters {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.shift-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  small {
    color: $text-secondary;
  }
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-sm;
}
</style>

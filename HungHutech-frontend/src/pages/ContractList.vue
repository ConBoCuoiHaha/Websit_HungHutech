<template>
  <div class="contract-page">
    <div class="page-header">
      <div>
        <h1>Quản lý hợp đồng</h1>
        <p>
          Theo dõi vòng đời hợp đồng lao động và tự động cập nhật lương cơ bản.
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog"
        >Tạo hợp đồng</el-button
      >
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form inline>
        <el-form-item label="Nhân viên">
          <el-select
            v-model="filters.nhan_vien_id"
            placeholder="Tất cả"
            filterable
            style="width: 220px"
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
            style="width: 180px"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Từ khóa">
          <el-input
            v-model="filters.q"
            placeholder="Số HĐ, ghi chú..."
            clearable
            :prefix-icon="Search"
            @keyup.enter.native="applyFilters"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">Lọc</el-button>
          <el-button @click="resetFilters">Xóa lọc</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="contracts" stripe>
        <el-table-column label="Số HĐ" prop="so_hop_dong" min-width="140" />
        <el-table-column label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div class="emp-info">
              <strong>{{ row.nhan_vien_id?.ma_nhan_vien }}</strong>
              <span>{{ formatEmployee(row.nhan_vien_id) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Loại hợp đồng" min-width="160">
          <template #default="{row}">{{
            contractType(row.loai_hop_dong)
          }}</template>
        </el-table-column>
        <el-table-column label="Hiệu lực" min-width="200">
          <template #default="{row}">
            {{ formatDate(row.hieu_luc_tu) }} -
            {{ formatDate(row.hieu_luc_den) || 'Không xác định' }}
          </template>
        </el-table-column>
        <el-table-column label="Lương cơ bản" width="150">
          <template #default="{row}">
            {{ formatCurrency(row.luong_co_ban) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="140">
          <template #default="{row}">
            <el-tag :type="statusTag(row.trang_thai)">
              {{ statusLabel(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-dropdown @command="(cmd) => changeStatus(row, cmd)">
                <el-button size="small">
                  Trạng thái
                  <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :command="opt.value"
                    >
                      {{ opt.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                size="small"
                :icon="Delete"
                type="danger"
                @click="handleDelete(row._id)"
              >
                Xóa
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          layout="total, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="showDialog"
      title="Tạo hợp đồng lao động"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="150px"
      >
        <el-form-item label="Số hợp đồng" prop="so_hop_dong">
          <el-input v-model="form.so_hop_dong" placeholder="VD: HD/2025/001" />
        </el-form-item>
        <el-form-item label="Nhân viên" prop="nhan_vien_id">
          <el-select
            v-model="form.nhan_vien_id"
            filterable
            placeholder="Chọn nhân viên"
          >
            <el-option
              v-for="emp in employees"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Loại hợp đồng" prop="loai_hop_dong">
          <el-select v-model="form.loai_hop_dong">
            <el-option label="Thử việc" value="Thu_viec" />
            <el-option label="Có thời hạn" value="Co_thoi_han" />
            <el-option label="Không thời hạn" value="Khong_thoi_han" />
            <el-option label="Công tác" value="Cong_tac" />
          </el-select>
        </el-form-item>
        <el-form-item label="Hiệu lực">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="Đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Lương cơ bản" prop="luong_co_ban">
          <el-input-number
            v-model="form.luong_co_ban"
            :min="0"
            :step="500000"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Tập tin hợp đồng">
          <el-input
            v-model="form.file_url"
            placeholder="Đường dẫn file scan hoặc e-contract"
          />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="form.ghi_chu" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">
          Lưu hợp đồng
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import {Plus, Search, Delete} from '@element-plus/icons-vue';
import contractService, {type Contract} from '@/services/contractService';
import nhanVienService from '@/services/nhanVienService';
import type {NhanVien} from '@/types';

const filters = reactive({
  nhan_vien_id: '',
  trang_thai: '',
  q: '',
});

const statusOptions = [
  {label: 'Nháp', value: 'Draft'},
  {label: 'Chờ duyệt', value: 'Cho_duyet'},
  {label: 'Đã ký', value: 'Da_ky'},
  {label: 'Đã hủy', value: 'Da_huy'},
];

const contracts = ref<Contract[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const saving = ref(false);
const pagination = reactive({page: 1, limit: 10, total: 0});
const showDialog = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  so_hop_dong: '',
  nhan_vien_id: '',
  loai_hop_dong: 'Co_thoi_han',
  dateRange: [] as string[] | [],
  luong_co_ban: 0,
  file_url: '',
  ghi_chu: '',
});

const formRules: FormRules = {
  so_hop_dong: [{required: true, message: 'Nhập số hợp đồng', trigger: 'blur'}],
  nhan_vien_id: [
    {required: true, message: 'Chọn nhân viên', trigger: 'change'},
  ],
  luong_co_ban: [
    {required: true, message: 'Nhập lương cơ bản', trigger: 'blur'},
  ],
};

const loadEmployees = async () => {
  const res = await nhanVienService.getAll({page: 1, limit: 200});
  employees.value = res.data || [];
};

const loadContracts = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      q: filters.q || undefined,
      nhan_vien_id: filters.nhan_vien_id || undefined,
      trang_thai: filters.trang_thai || undefined,
    };
    const res = await contractService.getAll(params);
    contracts.value = res.data || [];
    pagination.total = res.pagination?.total || 0;
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tải hợp đồng');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  pagination.page = 1;
  loadContracts();
};

const resetFilters = () => {
  filters.q = '';
  filters.trang_thai = '';
  filters.nhan_vien_id = '';
  applyFilters();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadContracts();
};

const openDialog = () => {
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  form.so_hop_dong = '';
  form.nhan_vien_id = '';
  form.loai_hop_dong = 'Co_thoi_han';
  form.dateRange = [];
  form.luong_co_ban = 0;
  form.file_url = '';
  form.ghi_chu = '';
};

const handleCreate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await contractService.create({
        so_hop_dong: form.so_hop_dong,
        nhan_vien_id: form.nhan_vien_id,
        loai_hop_dong: form.loai_hop_dong as Contract['loai_hop_dong'],
        hieu_luc_tu: form.dateRange[0],
        hieu_luc_den: form.dateRange[1],
        luong_co_ban: form.luong_co_ban,
        file_url: form.file_url,
        ghi_chu: form.ghi_chu,
      });
      ElMessage.success('Đã tạo hợp đồng');
      closeDialog();
      loadContracts();
    } catch (err: any) {
      ElMessage.error(err.response?.data?.msg || 'Không thể tạo hợp đồng');
    } finally {
      saving.value = false;
    }
  });
};

const changeStatus = async (
  row: Contract,
  trang_thai: Contract['trang_thai'],
) => {
  try {
    await contractService.updateStatus(row._id, trang_thai);
    ElMessage.success('Đã cập nhật trạng thái');
    loadContracts();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật trạng thái');
  }
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('Xóa hợp đồng này?', 'Xác nhận', {
      type: 'warning',
    });
    await contractService.delete(id);
    ElMessage.success('Đã xóa hợp đồng');
    loadContracts();
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(err.response?.data?.msg || 'Không thể xóa hợp đồng');
  }
};

const formatEmployee = (employee?: NhanVien | string) => {
  if (!employee || typeof employee === 'string') return '';
  return `${employee.ho_dem || ''} ${employee.ten || ''}`.trim();
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
};

const formatCurrency = (value?: number) => {
  if (!value) return '0 VND';
  return `${value.toLocaleString('vi-VN')} VND`;
};

const contractType = (type: string) => {
  switch (type) {
    case 'Thu_viec':
      return 'Thử việc';
    case 'Khong_thoi_han':
      return 'Không thời hạn';
    case 'Cong_tac':
      return 'Công tác';
    default:
      return 'Có thời hạn';
  }
};

const statusLabel = (status: Contract['trang_thai']) => {
  return statusOptions.find((opt) => opt.value === status)?.label || status;
};

const statusTag = (status: Contract['trang_thai']) => {
  if (status === 'Da_ky') return 'success';
  if (status === 'Cho_duyet') return 'warning';
  if (status === 'Da_huy') return 'danger';
  return 'info';
};

onMounted(() => {
  loadEmployees();
  loadContracts();
});
</script>

<style scoped lang="scss">
.contract-page {
  width: 100%;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;

  h1 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
  }
}
.filter-card {
  margin-bottom: $spacing-lg;
}
.emp-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-md;
}
</style>

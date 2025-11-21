<template>
  <div class="orangehrm-claim-page">
    <!-- Page Header -->
    <div class="orangehrm-page-header">
      <h1 class="orangehrm-page-title">Bồi hoàn chi phí</h1>
      <div class="orangehrm-page-actions">
        <el-button :icon="Refresh" @click="loadData">Tải lại</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          Tạo yêu cầu bồi hoàn
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="orangehrm-filter-card" shadow="never">
      <el-form :inline="true" @submit.prevent="loadData">
        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option label="Đã nộp" value="Submitted" />
            <el-option label="Đã duyệt" value="Approved" />
            <el-option label="Bị từ chối" value="Rejected" />
            <el-option label="Đã thanh toán" value="Paid" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="isAdminOrManager" label="Nhân viên">
          <el-select
            v-model="filters.nhan_vien_id"
            placeholder="Tất cả"
            clearable
            filterable
            style="width: 220px"
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
      </el-form>
    </el-card>

    <!-- Claims Table -->
    <el-card class="orangehrm-table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="claimList"
        style="width: 100%"
        stripe
        :empty-text="error || 'Không có dữ liệu'"
      >
        <el-table-column type="index" label="STT" width="60" />

        <el-table-column prop="nhan_vien_id" label="Nhân viên" min-width="200">
          <template #default="{row}">
            <div
              v-if="typeof row.nhan_vien_id === 'object' && row.nhan_vien_id"
            >
              <strong>{{ row.nhan_vien_id.ma_nhan_vien }}</strong>
              <div class="orangehrm-text-muted">
                {{ row.nhan_vien_id.ho_dem }} {{ row.nhan_vien_id.ten }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="tong_tien"
          label="Tổng tiền"
          width="150"
          align="right"
        >
          <template #default="{row}">
            <strong class="orangehrm-amount">{{
              formatCurrency(row.tong_tien)
            }}</strong>
          </template>
        </el-table-column>

        <el-table-column
          prop="items"
          label="Số khoản"
          width="100"
          align="center"
        >
          <template #default="{row}">
            {{ row.items?.length || 0 }} khoản
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.trang_thai)" size="small">
              {{ getStatusText(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày tạo" width="150">
          <template #default="{row}">
            {{ formatDate(row.ngay_tao) }}
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="240" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="View" @click="handleView(row)">
                Xem
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Submitted'"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                Sửa
              </el-button>
              <el-button
                v-if="row.trang_thai === 'Submitted'"
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
      :title="
        editingId ? 'Chỉnh sửa yêu cầu bồi hoàn' : 'Tạo yêu cầu bồi hoàn mới'
      "
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
        label-position="left"
      >
        <el-form-item
          v-if="isAdminOrManager"
          label="Nhân viên"
          prop="nhan_vien_id"
          required
        >
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

        <el-divider>Danh sách các khoản chi phí</el-divider>

        <div
          v-for="(item, index) in form.items"
          :key="index"
          class="orangehrm-claim-item"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item
                :prop="`items.${index}.ngay`"
                label="Ngày"
                :rules="[{required: true, message: 'Vui lòng chọn ngày'}]"
              >
                <el-date-picker
                  v-model="item.ngay"
                  type="date"
                  placeholder="Chọn ngày..."
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item
                :prop="`items.${index}.so_tien`"
                label="Số tiền"
                :rules="[
                  {required: true, message: 'Vui lòng nhập số tiền'},
                  {type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0'},
                ]"
              >
                <el-input-number
                  v-model="item.so_tien"
                  :min="0"
                  :precision="0"
                  :controls="false"
                  style="width: 100%"
                  placeholder="Nhập số tiền..."
                />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item :prop="`items.${index}.danh_muc`" label="Danh mục">
                <el-select
                  v-model="item.danh_muc"
                  placeholder="Chọn danh mục..."
                  clearable
                  style="width: 100%"
                >
                  <el-option label="Đi lại" value="Di lai" />
                  <el-option label="Ăn uống" value="An uong" />
                  <el-option label="Khách sạn" value="Khach san" />
                  <el-option label="Văn phòng phẩm" value="Van phong pham" />
                  <el-option label="Khác" value="Khac" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :prop="`items.${index}.mo_ta`" label="Mô tả">
            <el-input
              v-model="item.mo_ta"
              placeholder="Mô tả chi phí..."
              maxlength="200"
            />
          </el-form-item>

          <div class="orangehrm-item-actions">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              :disabled="form.items.length <= 1"
              @click="removeItem(index)"
            >
              Xóa khoản này
            </el-button>
          </div>

          <el-divider v-if="index < form.items.length - 1" />
        </div>

        <el-button
          type="primary"
          :icon="Plus"
          style="width: 100%"
          @click="addItem"
        >
          Thêm khoản chi phí
        </el-button>

        <el-divider />

        <el-form-item label="Tổng tiền">
          <strong class="orangehrm-total-amount">{{
            formatCurrency(totalAmount)
          }}</strong>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Details Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Chi tiết yêu cầu bồi hoàn"
      width="700px"
    >
      <div v-if="selectedClaim" class="orangehrm-claim-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Nhân viên">
            <div
              v-if="
                typeof selectedClaim.nhan_vien_id === 'object' &&
                selectedClaim.nhan_vien_id
              "
            >
              <strong>{{ selectedClaim.nhan_vien_id.ma_nhan_vien }}</strong>
              <div>
                {{ selectedClaim.nhan_vien_id.ho_dem }}
                {{ selectedClaim.nhan_vien_id.ten }}
              </div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedClaim.trang_thai)">
              {{ getStatusText(selectedClaim.trang_thai) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Tổng tiền">
            <strong class="orangehrm-amount">{{
              formatCurrency(selectedClaim.tong_tien)
            }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="Số khoản">
            {{ selectedClaim.items?.length || 0 }} khoản
          </el-descriptions-item>

          <el-descriptions-item label="Ngày tạo">
            {{ formatDate(selectedClaim.ngay_tao) }}
          </el-descriptions-item>

          <el-descriptions-item label="Cập nhật cuối">
            {{ formatDate(selectedClaim.ngay_cap_nhat) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>Chi tiết các khoản chi phí</el-divider>

        <el-table :data="selectedClaim.items" border stripe>
          <el-table-column type="index" label="STT" width="60" />

          <el-table-column prop="ngay" label="Ngày" width="120">
            <template #default="{row}">
              {{ formatDate(row.ngay) }}
            </template>
          </el-table-column>

          <el-table-column prop="danh_muc" label="Danh mục" width="140">
            <template #default="{row}">
              {{ row.danh_muc || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="mo_ta" label="Mô tả" min-width="200">
            <template #default="{row}">
              {{ row.mo_ta || '-' }}
            </template>
          </el-table-column>

          <el-table-column
            prop="so_tien"
            label="Số tiền"
            width="140"
            align="right"
          >
            <template #default="{row}">
              {{ formatCurrency(row.so_tien) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {Refresh, Plus, Edit, Delete, View} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import claimService from '@/services/claimService';
import nhanVienService from '@/services/nhanVienService';
import {Claim, ClaimItem, NhanVien} from '@/types';
import {getCurrentUser} from '@/modules/auth/services/auth.service';

const claimList = ref<Claim[]>([]);
const employees = ref<NhanVien[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const showCreateDialog = ref(false);
const showViewDialog = ref(false);
const editingId = ref('');
const selectedClaim = ref<Claim | null>(null);
const formRef = ref<FormInstance>();

const currentUser = getCurrentUser();
const isAdminOrManager = computed(() =>
  ['admin', 'manager'].includes(currentUser?.role || ''),
);

const pagination = reactive({
  currentPage: 1,
  limit: 10,
  total: 0,
});

const filters = reactive({
  trang_thai: '',
  nhan_vien_id: '',
});

const form = reactive<{
  nhan_vien_id: string;
  items: ClaimItem[];
}>({
  nhan_vien_id: '',
  items: [
    {
      ngay: '',
      so_tien: 0,
      mo_ta: '',
      danh_muc: '',
    },
  ],
});

const formRules: FormRules = {
  nhan_vien_id: [
    {required: true, message: 'Vui lòng chọn nhân viên', trigger: 'change'},
  ],
};

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.so_tien || 0), 0);
});

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.trang_thai) {
      params.trang_thai = filters.trang_thai;
    }

    if (filters.nhan_vien_id) {
      params.nhan_vien_id = filters.nhan_vien_id;
    } else if (!isAdminOrManager.value && currentUser?.nhan_vien_id) {
      params.nhan_vien_id = currentUser.nhan_vien_id;
    }

    const response = await claimService.getAll(params);
    claimList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    console.error('Error loading claims:', err);
    error.value = err.response?.data?.msg || 'Không thể tải danh sách bồi hoàn';
    ElMessage.error(error.value);
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

const addItem = () => {
  form.items.push({
    ngay: '',
    so_tien: 0,
    mo_ta: '',
    danh_muc: '',
  });
};

const removeItem = (index: number) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
  }
};

const handleView = (item: Claim) => {
  selectedClaim.value = item;
  showViewDialog.value = true;
};

const handleEdit = (item: Claim) => {
  editingId.value = item._id;
  form.nhan_vien_id =
    typeof item.nhan_vien_id === 'object'
      ? item.nhan_vien_id._id
      : item.nhan_vien_id;
  form.items = item.items.map((i) => ({...i}));
  showCreateDialog.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data: any = {
        nhan_vien_id: isAdminOrManager.value
          ? form.nhan_vien_id
          : currentUser?.nhan_vien_id,
        items: form.items,
        tong_tien: totalAmount.value,
      };

      if (editingId.value) {
        await claimService.update(editingId.value, data);
        ElMessage.success('Cập nhật yêu cầu bồi hoàn thành công');
      } else {
        await claimService.create(data);
        ElMessage.success('Tạo yêu cầu bồi hoàn thành công');
      }
      closeDialog();
      await loadData();
    } catch (err: any) {
      console.error('Error saving claim:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể lưu yêu cầu bồi hoàn',
      );
    } finally {
      saving.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa yêu cầu bồi hoàn này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await claimService.delete(id);
    ElMessage.success('Xóa yêu cầu bồi hoàn thành công');
    await loadData();
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Error deleting claim:', err);
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa yêu cầu bồi hoàn',
      );
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
  form.items = [
    {
      ngay: '',
      so_tien: 0,
      mo_ta: '',
      danh_muc: '',
    },
  ];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getStatusType = (status: string): string => {
  const types: Record<string, string> = {
    Submitted: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Paid: 'info',
  };
  return types[status] || 'info';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    Submitted: 'Đã nộp',
    Approved: 'Đã duyệt',
    Rejected: 'Bị từ chối',
    Paid: 'Đã thanh toán',
  };
  return texts[status] || status;
};

onMounted(() => {
  loadData();
  if (isAdminOrManager.value) {
    loadEmployees();
  }
});
</script>

<style lang="scss" scoped>
.orangehrm-claim-page {
  width: 100%;
}

// Page Header
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

// Filter Card
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

// Table Card
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

.orangehrm-amount {
  color: $primary-color;
  font-weight: $font-weight-medium;
}

// Pagination
.orangehrm-pagination {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

// Claim Item Form
.orangehrm-claim-item {
  padding: $spacing-md;
  background-color: $bg-gray;
  border-radius: 4px;
  margin-bottom: $spacing-md;
}

.orangehrm-item-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-sm;
}

.orangehrm-total-amount {
  font-size: $font-size-xl;
  color: $primary-color;
}

// Claim Details
.orangehrm-claim-details {
  :deep(.el-descriptions__label) {
    font-weight: $font-weight-medium;
  }

  :deep(.el-table) {
    margin-top: $spacing-md;
  }
}

// Responsive
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

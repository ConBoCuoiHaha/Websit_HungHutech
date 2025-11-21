<template>
  <div class="my-leave" v-loading="loading">
    <div class="my-leave__actions">
      <el-select
        v-model="filters.trang_thai"
        placeholder="Tất cả trạng thái"
        clearable
        @change="loadRequests"
        style="width: 200px"
      >
        <el-option label="Tất cả" value="" />
        <el-option label="Chờ duyệt" value="Cho duyet" />
        <el-option label="Đang xử lý" value="InProgress" disabled />
        <el-option label="Đã duyệt" value="Da duyet" />
        <el-option label="Bị từ chối" value="Bi tu choi" />
        <el-option label="Đã hủy" value="Da huy" />
      </el-select>
      <el-button type="primary" :icon="Plus" @click="openDialog">
        Gửi yêu cầu nghỉ phép
      </el-button>
    </div>

    <el-table :data="requests" border :empty-text="loading ? 'Đang tải...' : 'Chưa có yêu cầu'">
      <el-table-column label="Loại" min-width="200">
        <template #default="{ row }">
          {{ row.loai_ngay_nghi_id?.ten || '---' }}
        </template>
      </el-table-column>
      <el-table-column label="Từ - Đến" min-width="220">
        <template #default="{ row }">
          {{ formatDate(row.ngay_bat_dau) }} - {{ formatDate(row.ngay_ket_thuc) }}
        </template>
      </el-table-column>
      <el-table-column prop="so_ngay" label="Số ngày" width="100" />
      <el-table-column label="Trạng thái" width="140">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.trang_thai)">{{ statusLabel(row.trang_thai) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Hành động" width="160">
        <template #default="{ row }">
          <el-button
            v-if="row.trang_thai === 'Cho duyet'"
            type="danger"
            link
            size="small"
            :loading="cancellingId === row._id"
            @click="cancelRequest(row._id)"
          >
            Hủy yêu cầu
          </el-button>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="pagination.total"
        :current-page="pagination.page"
        :page-size="pagination.limit"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" title="Gửi yêu cầu nghỉ phép" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="150px">
        <el-form-item label="Loại ngày nghỉ" prop="loai_ngay_nghi_id">
          <el-select v-model="form.loai_ngay_nghi_id" placeholder="Chọn loại" filterable>
            <el-option
              v-for="option in leaveTypes"
              :key="option._id"
              :label="option.ten"
              :value="option._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Khoảng thời gian" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            unlink-panels
            range-separator="Đến"
            start-placeholder="Ngày bắt đầu"
            end-placeholder="Ngày kết thúc"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Lý do" prop="ly_do">
          <el-input
            v-model="form.ly_do"
            type="textarea"
            placeholder="Nhập lý do"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          Gửi yêu cầu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import dayjs from 'dayjs';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import {Plus} from '@element-plus/icons-vue';
import yeuCauNghiPhepService from '@/services/yeuCauNghiPhepService';
import loaiNgayNghiService from '@/services/loaiNgayNghiService';
import {YeuCauNghiPhep, LoaiNgayNghi} from '@/types';

const loading = ref(false);
const requests = ref<YeuCauNghiPhep[]>([]);
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive<{trang_thai: '' | YeuCauNghiPhep['trang_thai']}>({trang_thai: ''});
const cancellingId = ref('');
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const saving = ref(false);

const leaveTypes = ref<LoaiNgayNghi[]>([]);
const form = reactive({
  loai_ngay_nghi_id: '',
  dateRange: [] as string[],
  ly_do: '',
});

const rules: FormRules = {
  loai_ngay_nghi_id: [{required: true, message: 'Chọn loại ngày nghỉ', trigger: 'change'}],
  dateRange: [{required: true, message: 'Chọn khoảng thời gian', trigger: 'change'}],
};

const statusTag = (status: string) => {
  if (status === 'Da duyet') return 'success';
  if (status === 'Bi tu choi') return 'danger';
  if (status === 'Da huy') return 'info';
  return 'warning';
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'Cho duyet':
      return 'Chờ duyệt';
    case 'Da duyet':
      return 'Đã duyệt';
    case 'Bi tu choi':
      return 'Bị từ chối';
    case 'Da huy':
      return 'Đã hủy';
    default:
      return status;
  }
};

const formatDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const response = await yeuCauNghiPhepService.getMy({
      page: pagination.page,
      limit: pagination.limit,
      trang_thai: filters.trang_thai || undefined,
    });
    requests.value = response.data;
    pagination.total = response.pagination.total;
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tải danh sách');
  } finally {
    loading.value = false;
  }
};

const loadLeaveTypes = async () => {
  try {
    const response = await loaiNgayNghiService.getAll({limit: 100});
    leaveTypes.value = response.items || [];
  } catch {
    leaveTypes.value = [];
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadRequests();
};

const openDialog = () => {
  form.loai_ngay_nghi_id = '';
  form.dateRange = [];
  form.ly_do = '';
  dialogVisible.value = true;
};

const computeTotalDays = () => {
  if (form.dateRange.length !== 2) return 0;
  const start = dayjs(form.dateRange[0]);
  const end = dayjs(form.dateRange[1]);
  return end.diff(start, 'day') + 1;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    await yeuCauNghiPhepService.create({
      loai_ngay_nghi_id: form.loai_ngay_nghi_id,
      ngay_bat_dau: form.dateRange[0],
      ngay_ket_thuc: form.dateRange[1],
      so_ngay: computeTotalDays(),
      ly_do: form.ly_do,
    });
    ElMessage.success('Đã gửi yêu cầu nghỉ phép');
    dialogVisible.value = false;
    loadRequests();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể gửi yêu cầu');
  } finally {
    saving.value = false;
  }
};

const cancelRequest = async (id: string) => {
  try {
    cancellingId.value = id;
    await yeuCauNghiPhepService.cancel(id);
    ElMessage.success('Đã hủy yêu cầu');
    loadRequests();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể hủy yêu cầu');
  } finally {
    cancellingId.value = '';
  }
};

onMounted(() => {
  loadLeaveTypes();
  loadRequests();
});
</script>

<style scoped lang="scss">
.my-leave {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.my-leave__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  justify-content: space-between;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-md;
}
</style>

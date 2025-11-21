<template>
  <div class="my-overtime" v-loading="loading">
    <div class="header">
      <div class="filters">
        <el-select
          v-model="filters.trang_thai"
          placeholder="Trạng thái"
          clearable
          @change="handleFilterChange"
        >
          <el-option label="Tất cả" value="" />
          <el-option label="Chờ duyệt" value="Cho duyet" />
          <el-option label="Đã duyệt" value="Da duyet" />
          <el-option label="Bị từ chối" value="Bi tu choi" />
          <el-option label="Đã hủy" value="Da huy" />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog">
        Đăng ký tăng ca
      </el-button>
    </div>

    <el-table
      :data="requests"
      border
      :empty-text="loading ? 'Đang tải...' : 'Chưa có yêu cầu'"
    >
      <el-table-column prop="ngay" label="Ngày" width="140">
        <template #default="{row}">
          {{ formatDate(row.ngay) }}
        </template>
      </el-table-column>
      <el-table-column label="Khoảng thời gian" min-width="200">
        <template #default="{row}">
          {{ formatTimeRange(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="so_gio" label="Số giờ" width="100">
        <template #default="{row}">
          {{ row.so_gio?.toFixed(2) }}h
        </template>
      </el-table-column>
      <el-table-column label="Loại" min-width="160">
        <template #default="{row}">
          {{ typeLabel(row.loai_ngay) }}
        </template>
      </el-table-column>
      <el-table-column label="Trạng thái" width="140">
        <template #default="{row}">
          <el-tag :type="statusTag(row.trang_thai)">
            {{ statusLabel(row.trang_thai) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Hành động" width="160" align="center">
        <template #default="{row}">
          <el-button
            v-if="row.trang_thai === 'Cho duyet'"
            type="danger"
            link
            size="small"
            :loading="cancellingId === row._id"
            @click="handleCancel(row._id)"
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
        :page-size="pagination.limit"
        :current-page="pagination.page"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" title="Đăng ký tăng ca" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="160px">
        <el-form-item label="Ngày tăng ca" prop="ngay">
          <el-date-picker
            v-model="form.ngay"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Giờ bắt đầu" prop="gio_bat_dau">
          <el-time-picker
            v-model="form.gio_bat_dau"
            placeholder="HH:mm"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Giờ kết thúc" prop="gio_ket_thuc">
          <el-time-picker
            v-model="form.gio_ket_thuc"
            placeholder="HH:mm"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Lý do" prop="ly_do">
          <el-input
            v-model="form.ly_do"
            type="textarea"
            :rows="3"
            placeholder="Mô tả công việc tăng ca"
          />
        </el-form-item>
        <el-alert
          title="Lưu ý"
          type="info"
          :closable="false"
          description="Hệ thống tự động kiểm tra giờ tăng ca theo giới hạn: tối đa 4h/ngày, 40h/tháng, 300h/năm."
        />
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
import {ref, reactive} from 'vue';
import {Plus} from '@element-plus/icons-vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import overtimeRequestService, {
  OvertimeRequest,
} from '@/services/overtimeRequestService';

const requests = ref<OvertimeRequest[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const cancellingId = ref('');
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive<{trang_thai: string}>({trang_thai: ''});

const formRef = ref<FormInstance>();
const form = reactive({
  ngay: '',
  gio_bat_dau: '',
  gio_ket_thuc: '',
  ly_do: '',
});

const rules: FormRules = {
  ngay: [{required: true, message: 'Vui lòng chọn ngày', trigger: 'change'}],
  gio_bat_dau: [{required: true, message: 'Nhập giờ bắt đầu'}],
  gio_ket_thuc: [{required: true, message: 'Nhập giờ kết thúc'}],
};

const statusLabel = (status: OvertimeRequest['trang_thai']) => {
  switch (status) {
    case 'Da duyet':
      return 'Đã duyệt';
    case 'Bi tu choi':
      return 'Bị từ chối';
    case 'Da huy':
      return 'Đã hủy';
    default:
      return 'Chờ duyệt';
  }
};

const statusTag = (status: OvertimeRequest['trang_thai']) => {
  if (status === 'Da duyet') return 'success';
  if (status === 'Bi tu choi') return 'danger';
  if (status === 'Da huy') return 'info';
  return 'warning';
};

const typeLabel = (type?: string) => {
  if (!type) return 'Ngày thường';
  switch (type) {
    case 'holiday':
      return 'Lễ/Tết';
    case 'holiday_night':
      return 'Lễ/Tết đêm';
    case 'weekend':
      return 'Ngày nghỉ';
    case 'weekend_night':
      return 'Ngày nghỉ đêm';
    case 'weekday_night':
      return 'Ngày thường đêm';
    default:
      return 'Ngày thường';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatTime = (value?: string) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  }
  return value;
};

const formatTimeRange = (row: OvertimeRequest) => {
  return `${formatTime(row.thoi_gian_bat_dau)} - ${formatTime(row.thoi_gian_ket_thuc)}`;
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const response = await overtimeRequestService.getMy({
      page: pagination.page,
      limit: pagination.limit,
      trang_thai: filters.trang_thai || undefined,
    });
    requests.value = response.data;
    pagination.total = response.pagination.total;
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách tăng ca',
    );
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadRequests();
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadRequests();
};

const openDialog = () => {
  form.ngay = '';
  form.gio_bat_dau = '';
  form.gio_ket_thuc = '';
  form.ly_do = '';
  dialogVisible.value = true;
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
    await overtimeRequestService.create({
      ngay: form.ngay,
      gio_bat_dau: form.gio_bat_dau,
      gio_ket_thuc: form.gio_ket_thuc,
      ly_do: form.ly_do,
    });
    ElMessage.success('Đã gửi yêu cầu tăng ca');
    dialogVisible.value = false;
    loadRequests();
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể gửi yêu cầu',
    );
  } finally {
    saving.value = false;
  }
};

const handleCancel = async (id: string) => {
  try {
    cancellingId.value = id;
    await overtimeRequestService.cancel(id);
    ElMessage.success('Đã hủy yêu cầu tăng ca');
    loadRequests();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể hủy yêu cầu');
  } finally {
    cancellingId.value = '';
  }
};

loadRequests();
</script>

<style scoped lang="scss">
.my-overtime {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.filters {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-md;
}
</style>

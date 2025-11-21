<template>
  <div v-loading="loading" class="orangehrm-report-info">
    <el-form label-width="180px" label-position="left">
      <div class="orangehrm-form-section">
        <div class="orangehrm-section-header">
          <h3 class="orangehrm-section-title">Báo cáo cho</h3>
          <el-button
            v-if="!isEditing"
            type="primary"
            :icon="Edit"
            @click="isEditing = true"
          >
            Chỉnh sửa
          </el-button>
          <template v-else>
            <el-button @click="handleCancel">Hủy</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">
              Lưu thay đổi
            </el-button>
          </template>
        </div>

        <el-form-item label="Người quản lý trực tiếp">
          <el-select
            v-model="managerIds"
            multiple
            filterable
            placeholder="Chọn người quản lý"
            :disabled="!isEditing"
            style="width: 100%"
          >
            <el-option
              v-for="emp in availableManagers"
              :key="emp._id"
              :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
              :value="emp._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="currentManagers.length > 0"
          label="Danh sách quản lý hiện tại"
        >
          <el-tag
            v-for="manager in currentManagers"
            :key="manager._id"
            closable
            :disable-transitions="false"
            style="margin-right: 10px; margin-bottom: 10px"
            @close="removeManager(manager._id)"
          >
            {{ manager.ma_nhan_vien }} - {{ manager.ho_dem }} {{ manager.ten }}
          </el-tag>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, computed, onMounted} from 'vue';
import {Edit} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

// Enable editing by default to allow dropdown to open
const isEditing = ref(true);
const saving = ref(false);
const managerIds = ref<string[]>([]);
const availableManagers = ref<NhanVien[]>([]);
const managersLoading = ref(false);

const currentManagers = computed(() => {
  if (!props.employee?.thong_tin_cong_viec?.quan_ly_truc_tiep_ids) return [];
  return props.employee.thong_tin_cong_viec.quan_ly_truc_tiep_ids.filter(
    (m): m is NhanVien => typeof m === 'object',
  );
});

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee?.thong_tin_cong_viec?.quan_ly_truc_tiep_ids) {
      managerIds.value =
        newEmployee.thong_tin_cong_viec.quan_ly_truc_tiep_ids.map((m: any) =>
          typeof m === 'object' ? m._id : m,
        );
    }
  },
  {immediate: true},
);

const loadAvailableManagers = async () => {
  try {
    managersLoading.value = true;
    const response = await nhanVienService.getAll({limit: 1000});
    const list: any[] =
      (response as any)?.data || (response as any)?.items || [];
    // Exclude current employee from list
    availableManagers.value = list.filter(
      (emp: any) => emp?._id && emp._id !== props.employee?._id,
    );
  } catch (err) {
    console.error('Error loading managers:', err);
  } finally {
    managersLoading.value = false;
  }
};

const handleSave = async () => {
  if (!props.employee) return;

  saving.value = true;
  try {
    await nhanVienService.update(props.employee._id, {
      thong_tin_cong_viec: {
        ...props.employee.thong_tin_cong_viec,
        quan_ly_truc_tiep_ids: managerIds.value,
      },
    });
    ElMessage.success('Cập nhật thông tin báo cáo thành công');
    isEditing.value = false;
    emit('reload');
  } catch (err: any) {
    console.error('Error updating report info:', err);
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật thông tin');
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  isEditing.value = false;
  if (props.employee?.thong_tin_cong_viec?.quan_ly_truc_tiep_ids) {
    managerIds.value =
      props.employee.thong_tin_cong_viec.quan_ly_truc_tiep_ids.map((m: any) =>
        typeof m === 'object' ? m._id : m,
      );
  }
};

const removeManager = (managerId: string) => {
  managerIds.value = managerIds.value.filter((id) => id !== managerId);
};

// Ensure managers are loaded when component mounts and when entering edit mode
onMounted(() => {
  loadAvailableManagers();
});

watch(
  () => isEditing.value,
  (editing) => {
    if (editing && availableManagers.value.length === 0) {
      loadAvailableManagers();
    }
  },
);
</script>

<style lang="scss" scoped>
@import './employee-form-styles.scss';

.orangehrm-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>

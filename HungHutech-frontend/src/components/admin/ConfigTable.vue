<template>
  <div class="config-table">
    <!-- Toolbar -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchText"
          placeholder="Tìm kiếm..."
          clearable
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filterActive"
          placeholder="Trạng thái"
          clearable
          style="width: 150px; margin-left: 12px"
          @change="loadData"
        >
          <el-option label="Đang kích hoạt" :value="true" />
          <el-option label="Đã vô hiệu hóa" :value="false" />
        </el-select>
      </div>

      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        Thêm mới
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="items"
      border
      stripe
      style="width: 100%; margin-top: 16px"
    >
      <el-table-column
        v-for="field in config.fields"
        :key="field.key"
        :prop="field.key"
        :label="field.label"
        :min-width="field.width || 150"
      >
        <template #default="{row}">
          <span v-if="field.type === 'select'">{{ row[field.key] }}</span>
          <span v-else>{{ row[field.key] || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Trạng thái" width="120" align="center">
        <template #default="{row}">
          <el-tag :type="row.kich_hoat ? 'success' : 'info'" size="small">
            {{ row.kich_hoat ? 'Kích hoạt' : 'Vô hiệu' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="Thao tác"
        width="200"
        align="center"
        fixed="right"
      >
        <template #default="{row}">
          <el-button link type="primary" size="small" @click="handleEdit(row)">
            Sửa
          </el-button>
          <el-button
            link
            :type="row.kich_hoat ? 'warning' : 'success'"
            size="small"
            @click="handleToggleActive(row)"
          >
            {{ row.kich_hoat ? 'Vô hiệu' : 'Kích hoạt' }}
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">
            Xóa
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? `Chỉnh sửa ${config.title}` : `Thêm ${config.title}`"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-form-item
          v-for="field in config.fields"
          :key="field.key"
          :label="field.label"
          :prop="field.key"
        >
          <!-- Text Input -->
          <el-input
            v-if="field.type === 'text'"
            v-model="formData[field.key]"
            :maxlength="field.maxlength"
            :placeholder="`Nhập ${field.label.toLowerCase()}`"
          />

          <!-- Textarea -->
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.key]"
            type="textarea"
            :rows="3"
            :placeholder="`Nhập ${field.label.toLowerCase()}`"
          />

          <!-- Number -->
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formData[field.key]"
            :min="field.min || 0"
            :max="field.max"
            style="width: 100%"
          />

          <!-- Select -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.key]"
            :placeholder="`Chọn ${field.label.toLowerCase()}`"
            style="width: 100%"
          >
            <el-option
              v-for="option in field.options"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Kích hoạt">
          <el-switch v-model="formData.kich_hoat" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          Lưu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import {Search, Plus} from '@element-plus/icons-vue';

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  required?: boolean;
  maxlength?: number;
  min?: number;
  max?: number;
  width?: number;
  options?: string[];
}

interface ConfigDefinition {
  title: string;
  service: any;
  fields: ConfigField[];
  displayField: string;
}

const props = defineProps<{
  config: ConfigDefinition;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

// State
const loading = ref(false);
const saving = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchText = ref('');
const filterActive = ref<boolean | undefined>(undefined);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<any>({});

// Form rules
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {};
  props.config.fields.forEach((field) => {
    if (field.required) {
      rules[field.key] = [
        {
          required: true,
          message: `Vui lòng nhập ${field.label.toLowerCase()}`,
          trigger: 'blur',
        },
      ];
    }
  });
  return rules;
});

// Load data
const loadData = async () => {
  try {
    loading.value = true;
    const response = await props.config.service.getAll({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchText.value,
      kich_hoat: filterActive.value,
    });

    items.value = response.items;
    total.value = response.total;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu');
  } finally {
    loading.value = false;
  }
};

// Search handler
let searchTimeout: any = null;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadData();
  }, 300);
};

// Add handler
const handleAdd = () => {
  isEdit.value = false;
  resetFormData();
  dialogVisible.value = true;
};

// Edit handler
const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.keys(formData).forEach((key) => {
    formData[key] = row[key];
  });
  formData._id = row._id;
  dialogVisible.value = true;
};

// Save handler
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    saving.value = true;

    if (isEdit.value) {
      await props.config.service.update(formData._id, formData);
      ElMessage.success('Cập nhật thành công');
    } else {
      await props.config.service.create(formData);
      ElMessage.success('Thêm mới thành công');
    }

    dialogVisible.value = false;
    loadData();
    emit('refresh');
  } catch (error: any) {
    if (error.response) {
      ElMessage.error(error.response.data?.message || 'Lỗi khi lưu dữ liệu');
    }
  } finally {
    saving.value = false;
  }
};

// Delete handler
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa "${row[props.config.displayField]}"?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    await props.config.service.delete(row._id);
    ElMessage.success('Xóa thành công');
    loadData();
    emit('refresh');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || 'Lỗi khi xóa');
    }
  }
};

// Toggle active handler
const handleToggleActive = async (row: any) => {
  try {
    await props.config.service.toggleActive(row._id);
    ElMessage.success(
      `Đã ${row.kich_hoat ? 'vô hiệu hóa' : 'kích hoạt'} thành công`,
    );
    loadData();
    emit('refresh');
  } catch (error: any) {
    ElMessage.error(
      error.response?.data?.message || 'Lỗi khi thay đổi trạng thái',
    );
  }
};

// Reset form
const resetForm = () => {
  formRef.value?.resetFields();
  resetFormData();
};

const resetFormData = () => {
  Object.keys(formData).forEach((key) => delete formData[key]);
  props.config.fields.forEach((field) => {
    if (field.type === 'number') {
      formData[field.key] = 0;
    } else if (
      field.type === 'select' &&
      field.options &&
      field.options.length > 0
    ) {
      formData[field.key] = field.options[0];
    } else {
      formData[field.key] = '';
    }
  });
  formData.kich_hoat = true;
};

onMounted(() => {
  resetFormData();
  loadData();
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.config-table {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left {
      display: flex;
      align-items: center;
    }
  }

  .pagination-container {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

<template>
  <div class="my-documents" v-loading="loading">
    <div class="my-documents__filters">
      <el-select v-model="filters.folder" placeholder="Tất cả thư mục" clearable @change="loadDocuments">
        <el-option
          v-for="option in folderOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-input
        v-model="filters.q"
        placeholder="Tìm tên tài liệu"
        clearable
        :prefix-icon="Search"
        @clear="loadDocuments"
        @keyup.enter.native="loadDocuments"
      />
    </div>

    <el-table :data="documents" border :empty-text="loading ? 'Đang tải...' : 'Chưa có tài liệu'">
      <el-table-column prop="tieu_de" label="Tên tài liệu" min-width="220" />
      <el-table-column label="Thư mục" width="160">
        <template #default="{ row }">
          <el-tag type="info">{{ folderLabel(row.folder) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Hiệu lực" min-width="200">
        <template #default="{ row }">
          <span v-if="row.ngay_hieu_luc">
            {{ formatDate(row.ngay_hieu_luc) }} -
            {{ row.ngay_het_han ? formatDate(row.ngay_het_han) : 'Không rõ' }}
          </span>
          <span v-else>---</span>
        </template>
      </el-table-column>
      <el-table-column label="Hành động" width="140">
        <template #default="{ row }">
          <el-button type="primary" link :icon="Download" @click="download(row)">
            Tải xuống
          </el-button>
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
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {Download, Search} from '@element-plus/icons-vue';
import employeeDocumentService, {DocumentFolder, EmployeeDocument} from '@/services/employeeDocumentService';
import uploadService from '@/services/uploadService';

const loading = ref(false);
const documents = ref<EmployeeDocument[]>([]);
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive<{folder: '' | DocumentFolder; q: string}>({folder: '', q: ''});

const folderOptions = [
  {label: 'Hồ sơ lao động', value: 'ho_so_lao_dong'},
  {label: 'Hồ sơ BHXH', value: 'ho_so_bhxh'},
  {label: 'Hồ sơ nội bộ', value: 'ho_so_noi_bo'},
  {label: 'Hồ sơ pháp lý', value: 'ho_so_phap_ly'},
];

const folderLabel = (value: string) => folderOptions.find((o) => o.value === value)?.label || value;

const formatDate = (value?: string) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    const response = await employeeDocumentService.getMy({
      page: pagination.page,
      limit: pagination.limit,
      folder: filters.folder || undefined,
      q: filters.q || undefined,
    });
    documents.value = response.data;
    pagination.total = response.pagination.total;
  } catch (err) {
    console.error('loadDocuments error', err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadDocuments();
};

const download = (doc: EmployeeDocument) => {
  if (doc.file_url) {
    const url = uploadService.getFileUrl(doc.file_url) || doc.file_url;
    window.open(url, '_blank');
  }
};

onMounted(() => {
  loadDocuments();
});
</script>

<style scoped lang="scss">
.my-documents {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.my-documents__filters {
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

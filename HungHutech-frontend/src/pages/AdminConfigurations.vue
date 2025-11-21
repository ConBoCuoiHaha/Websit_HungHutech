<template>
  <div class="admin-configurations">
    <el-card class="page-header">
      <h1>Cấu hình hệ thống</h1>
      <p>Quản lý các thiết lập cấu hình cho toàn hệ thống</p>
    </el-card>

    <el-card class="config-tabs-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Employment Statuses -->
        <el-tab-pane label="Trạng thái làm việc" name="employment-statuses">
          <ConfigTable :config="employmentStatusConfig" @refresh="loadData" />
        </el-tab-pane>

        <!-- Job Categories -->
        <el-tab-pane label="Danh mục công việc" name="job-categories">
          <ConfigTable :config="jobCategoryConfig" @refresh="loadData" />
        </el-tab-pane>

        <!-- Nationalities -->
        <el-tab-pane label="Quốc tịch" name="nationalities">
          <ConfigTable :config="nationalityConfig" @refresh="loadData" />
        </el-tab-pane>

        <!-- Skills -->
        <el-tab-pane label="Kỹ năng" name="skills">
          <ConfigTable :config="skillConfig" @refresh="loadData" />
        </el-tab-pane>

        <!-- Education Levels -->
        <el-tab-pane label="Trình độ học vấn" name="education-levels">
          <ConfigTable :config="educationLevelConfig" @refresh="loadData" />
        </el-tab-pane>

        <!-- Languages -->
        <el-tab-pane label="Ngôn ngữ" name="languages">
          <ConfigTable :config="languageConfig" @refresh="loadData" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import ConfigTable from '@/components/admin/ConfigTable.vue';
import adminConfigService from '@/services/adminConfigService';

const activeTab = ref('employment-statuses');

// Config cho Employment Statuses
const employmentStatusConfig = {
  title: 'Trạng thái làm việc',
  service: adminConfigService.employmentStatus,
  fields: [
    {
      key: 'ten_trang_thai',
      label: 'Tên trạng thái',
      type: 'text',
      required: true,
    },
    {key: 'mo_ta', label: 'Mô tả', type: 'textarea'},
    {key: 'thu_tu_sap_xep', label: 'Thứ tự sắp xếp', type: 'number'},
  ],
  displayField: 'ten_trang_thai',
};

// Config cho Job Categories
const jobCategoryConfig = {
  title: 'Danh mục công việc',
  service: adminConfigService.jobCategory,
  fields: [
    {key: 'ten_danh_muc', label: 'Tên danh mục', type: 'text', required: true},
    {key: 'mo_ta', label: 'Mô tả', type: 'textarea'},
  ],
  displayField: 'ten_danh_muc',
};

// Config cho Nationalities
const nationalityConfig = {
  title: 'Quốc tịch',
  service: adminConfigService.nationality,
  fields: [
    {
      key: 'ten_quoc_tich',
      label: 'Tên quốc tịch',
      type: 'text',
      required: true,
    },
    {
      key: 'ma_quoc_gia',
      label: 'Mã quốc gia (ISO)',
      type: 'text',
      maxlength: 3,
    },
  ],
  displayField: 'ten_quoc_tich',
};

// Config cho Skills
const skillConfig = {
  title: 'Kỹ năng',
  service: adminConfigService.skill,
  fields: [
    {key: 'ten_ky_nang', label: 'Tên kỹ năng', type: 'text', required: true},
    {key: 'mo_ta', label: 'Mô tả', type: 'textarea'},
    {
      key: 'loai_ky_nang',
      label: 'Loại kỹ năng',
      type: 'select',
      options: ['Kỹ thuật', 'Quản lý', 'Giao tiếp', 'Ngoại ngữ', 'Khác'],
    },
  ],
  displayField: 'ten_ky_nang',
};

// Config cho Education Levels
const educationLevelConfig = {
  title: 'Trình độ học vấn',
  service: adminConfigService.educationLevel,
  fields: [
    {key: 'ten_trinh_do', label: 'Tên trình độ', type: 'text', required: true},
    {key: 'mo_ta', label: 'Mô tả', type: 'textarea'},
    {key: 'cap_do', label: 'Cấp độ', type: 'number', min: 0},
  ],
  displayField: 'ten_trinh_do',
};

// Config cho Languages
const languageConfig = {
  title: 'Ngôn ngữ',
  service: adminConfigService.language,
  fields: [
    {key: 'ten_ngon_ngu', label: 'Tên ngôn ngữ', type: 'text', required: true},
    {
      key: 'ma_ngon_ngu',
      label: 'Mã ngôn ngữ (ISO)',
      type: 'text',
      maxlength: 3,
    },
  ],
  displayField: 'ten_ngon_ngu',
};

const loadData = () => {
  // Trigger reload in child component
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

.admin-configurations {
  padding: $spacing-lg;
  background: $background;
  min-height: 100vh;
}

.page-header {
  margin-bottom: $spacing-lg;

  h1 {
    margin: 0 0 $spacing-sm 0;
    color: $text-primary;
    font-size: $font-size-xxl;
  }

  p {
    margin: 0;
    color: $text-secondary;
    font-size: $font-size-base;
  }
}

.config-tabs-card {
  :deep(.el-tabs__content) {
    padding: $spacing-lg;
  }
}
</style>

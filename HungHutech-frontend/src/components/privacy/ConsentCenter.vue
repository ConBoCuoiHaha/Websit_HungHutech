<template>
  <div v-loading="loading" class="consent-center">
    <el-alert
      type="info"
      show-icon
      class="consent-alert"
      title="Nghi dinh 13/2023/ND-CP ve bao ve du lieu ca nhan"
      description="Ban co the theo doi va chinh sua su dong y xu ly du lieu bat ky luc nao. Cac muc bat buoc duoc danh dau ro rang va khong the tat."
    />

    <el-space direction="vertical" :size="16" style="width: 100%">
      <el-card
        v-for="item in consentItems"
        :key="item.key"
        class="consent-card"
        :body-style="{padding: '16px'}"
      >
        <div class="consent-card-header">
          <div class="consent-card-title">
            <h4>
              {{ item.name }}
              <el-tag
                v-if="item.required"
                type="danger"
                size="small"
                effect="plain"
              >
                Bat buoc
              </el-tag>
            </h4>
            <p>{{ item.description }}</p>
          </div>
          <div class="consent-card-action">
            <div class="consent-status">
              <el-tag :type="statusTag(item.status)" size="small">
                {{ statusLabel(item.status) }}
              </el-tag>
              <small v-if="item.granted_at || item.withdrawn_at">
                Cap nhat:
                {{ formatDate(item.granted_at || item.withdrawn_at) }}
              </small>
            </div>
            <el-switch
              v-model="consentValues[item.key]"
              :disabled="item.required || savingKey === item.key"
              :loading="savingKey === item.key"
              inline-prompt
              active-text="Dong y"
              inactive-text="Tu choi"
              @change="handleToggle(item, $event)"
            />
          </div>
        </div>

        <div class="consent-details">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="Co so phap ly">
              {{ item.legal_basis || '---' }}
            </el-descriptions-item>
            <el-descriptions-item label="Loai du lieu xu ly">
              <el-tag
                v-for="data in item.data_types"
                :key="data"
                size="small"
                class="mr-4"
              >
                {{ data }}
              </el-tag>
              <span v-if="!item.data_types?.length">---</span>
            </el-descriptions-item>
            <el-descriptions-item label="Chia se voi don vi">
              <el-tag
                v-for="recipient in item.recipients"
                :key="recipient"
                size="small"
                class="mr-4"
                type="info"
              >
                {{ recipient }}
              </el-tag>
              <span v-if="!item.recipients?.length">---</span>
            </el-descriptions-item>
            <el-descriptions-item label="Thoi han luu tru">
              {{ item.retention || 'Theo chinh sach luu tru cua doanh nghiep' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </el-space>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import consentService from '@/services/consentService';
import {ConsentView, ConsentStatus} from '@/types';

const consentItems = ref<ConsentView[]>([]);
const consentValues = reactive<Record<string, boolean>>({});
const loading = ref(false);
const savingKey = ref<string | null>(null);

const statusLabel = (status: ConsentStatus) => {
  if (status === 'Accepted') return 'Da dong y';
  if (status === 'Withdrawn') return 'Da rut lai';
  return 'Chua chap thuan';
};

const statusTag = (status: ConsentStatus) => {
  if (status === 'Accepted') return 'success';
  if (status === 'Withdrawn') return 'danger';
  return 'info';
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN');
};

const resetValues = (items: ConsentView[]) => {
  Object.keys(consentValues).forEach((key) => {
    delete consentValues[key];
  });
  items.forEach((item) => {
    consentValues[item.key] = item.status === 'Accepted';
  });
};

const loadConsents = async () => {
  loading.value = true;
  try {
    const {items} = await consentService.getMyConsents();
    consentItems.value = items;
    resetValues(items);
  } catch (err: any) {
    console.error('loadConsents error', err);
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải thông tin đồng thuận',
    );
  } finally {
    loading.value = false;
  }
};

const handleToggle = async (item: ConsentView, value: boolean) => {
  if (item.required && !value) {
    consentValues[item.key] = true;
    ElMessage.warning('Muc dich nay bat buoc theo chinh sach cong ty');
    return;
  }

  if (!value) {
    try {
      await ElMessageBox.confirm(
        'Ban chac chan muon rut lai su dong y voi muc dich nay? Co the anh huong den viec nhan thong tin phuc loi.',
        'Xac nhan',
        {
          confirmButtonText: 'Rut lai',
          cancelButtonText: 'Huy',
          type: 'warning',
        },
      );
    } catch {
      consentValues[item.key] = true;
      return;
    }
  }

  savingKey.value = item.key;
  try {
    await consentService.saveConsents([{purpose: item.key, accepted: value}]);
    ElMessage.success(
      value ? 'Da dong y muc dich nay' : 'Da rut lai su dong y',
    );
    await loadConsents();
    window.dispatchEvent(new CustomEvent('consent-updated'));
  } catch (err: any) {
    console.error('handleToggle error', err);
    consentValues[item.key] = !value;
    ElMessage.error(
      err.response?.data?.msg || 'Không thể cập nhật đồng thuận',
    );
  } finally {
    savingKey.value = null;
  }
};

onMounted(() => {
  loadConsents();
});
</script>

<style scoped lang="scss">
.consent-center {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.consent-alert {
  margin-bottom: $spacing-md;
}

.consent-card {
  .consent-card-header {
    display: flex;
    justify-content: space-between;
    gap: $spacing-lg;
    flex-wrap: wrap;
  }

  .consent-card-title {
    flex: 1;

    h4 {
      margin: 0;
      font-size: $font-size-lg;
    }

    p {
      margin: $spacing-xxs 0 0 0;
      color: $text-secondary;
    }
  }

  .consent-card-action {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $spacing-sm;
  }

  .consent-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;

    small {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }

  .consent-details {
    margin-top: $spacing-md;
  }
}

.mr-4 {
  margin-right: $spacing-xs;
  margin-bottom: $spacing-xxs;
}
</style>

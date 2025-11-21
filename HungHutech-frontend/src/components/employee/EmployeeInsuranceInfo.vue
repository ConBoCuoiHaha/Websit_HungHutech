<template>
  <div v-loading="loading" class="orangehrm-insurance-info">
    <el-form
      ref="formRef"
      :model="form"
      label-width="200px"
      label-position="left"
      :rules="rules"
    >
      <el-alert
        v-if="isReadonly"
        title="Thong tin chi doc"
        description="Ban chi xem duoc thong tin BHXH. Neu can chinh sua vui long lien he HR hoac gui yeu cau cap nhat."
        type="info"
        show-icon
        class="mb-lg"
      />

      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">So BHXH/BHYT</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="So so BHXH" prop="so_bhxh">
              <el-input
                v-model="form.so_bhxh"
                placeholder="Vi du: 1234567890"
                :disabled="isReadonly"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="So BHYT" prop="so_bhyt">
              <el-input
                v-model="form.so_bhyt"
                placeholder="Vi du: DN123456789"
                :disabled="isReadonly"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-section">
        <h3 class="orangehrm-section-title">Muc luong dong BHXH/BHYT</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Luong dong BHXH" prop="muc_luong_bhxh">
              <el-input-number
                v-model="form.muc_luong_bhxh"
                :min="0"
                :step="50000"
                controls-position="right"
                style="width: 100%"
                placeholder="Vi du: 5000000"
                :disabled="isReadonly"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Luong dong BHYT" prop="muc_luong_bhyt">
              <el-input-number
                v-model="form.muc_luong_bhyt"
                :min="0"
                :step="50000"
                controls-position="right"
                style="width: 100%"
                placeholder="Vi du: 5000000"
                :disabled="isReadonly"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-section">
        <div class="section-header">
          <h3 class="orangehrm-section-title">Ty le dong (%)</h3>
          <el-button
            v-if="!isReadonly"
            type="default"
            size="small"
            @click="resetRates"
          >
            Khoi phuc mac dinh
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="rate-panel">
              <h4>Nguoi lao dong</h4>
              <el-form-item label="BHXH" prop="ti_le_bhxh_nv">
                <el-input-number
                  v-model="form.ti_le_bhxh_nv"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
              <el-form-item label="BHYT" prop="ti_le_bhyt_nv">
                <el-input-number
                  v-model="form.ti_le_bhyt_nv"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
              <el-form-item label="BHTN" prop="ti_le_bhtn_nv">
                <el-input-number
                  v-model="form.ti_le_bhtn_nv"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="rate-panel">
              <h4>Doanh nghiep</h4>
              <el-form-item label="BHXH" prop="ti_le_bhxh_dn">
                <el-input-number
                  v-model="form.ti_le_bhxh_dn"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
              <el-form-item label="BHYT" prop="ti_le_bhyt_dn">
                <el-input-number
                  v-model="form.ti_le_bhyt_dn"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
              <el-form-item label="BHTN" prop="ti_le_bhtn_dn">
                <el-input-number
                  v-model="form.ti_le_bhtn_dn"
                  :min="0"
                  :max="50"
                  :step="0.1"
                  controls-position="right"
                  :disabled="isReadonly"
                />
              </el-form-item>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="orangehrm-form-actions" v-if="!isReadonly">
        <el-button @click="handleReset" :icon="Refresh">Dat lai</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          Luu thong tin
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {reactive, watch, ref, computed} from 'vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import {Refresh} from '@element-plus/icons-vue';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';

const DEFAULT_RATES = {
  ti_le_bhxh_nv: 8,
  ti_le_bhxh_dn: 17.5,
  ti_le_bhyt_nv: 1.5,
  ti_le_bhyt_dn: 3,
  ti_le_bhtn_nv: 1,
  ti_le_bhtn_dn: 1,
};

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const formRef = ref<FormInstance>();
const saving = ref(false);
const isReadonly = computed(() => !!props.readonly);

const form = reactive({
  so_bhxh: '',
  so_bhyt: '',
  muc_luong_bhxh: null as number | null,
  muc_luong_bhyt: null as number | null,
  ...DEFAULT_RATES,
});

const rules: FormRules = {
  muc_luong_bhxh: [{type: 'number', min: 0, message: 'Muc luong khong hop le'}],
  muc_luong_bhyt: [{type: 'number', min: 0, message: 'Muc luong khong hop le'}],
};

const parseDecimal = (value: any) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    const maybe = value.$numberDecimal ?? value.toString?.();
    if (maybe !== undefined) {
      const parsed = Number(maybe);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }
  return null;
};

const setFormFromEmployee = () => {
  const insurance = props.employee?.bao_hiem || {};
  form.so_bhxh = insurance.so_bhxh || '';
  form.so_bhyt = insurance.so_bhyt || '';
  form.muc_luong_bhxh = parseDecimal(insurance.muc_luong_bhxh);
  form.muc_luong_bhyt = parseDecimal(insurance.muc_luong_bhyt);
  form.ti_le_bhxh_nv = insurance.ti_le_bhxh_nv ?? DEFAULT_RATES.ti_le_bhxh_nv;
  form.ti_le_bhxh_dn = insurance.ti_le_bhxh_dn ?? DEFAULT_RATES.ti_le_bhxh_dn;
  form.ti_le_bhyt_nv = insurance.ti_le_bhyt_nv ?? DEFAULT_RATES.ti_le_bhyt_nv;
  form.ti_le_bhyt_dn = insurance.ti_le_bhyt_dn ?? DEFAULT_RATES.ti_le_bhyt_dn;
  form.ti_le_bhtn_nv = insurance.ti_le_bhtn_nv ?? DEFAULT_RATES.ti_le_bhtn_nv;
  form.ti_le_bhtn_dn = insurance.ti_le_bhtn_dn ?? DEFAULT_RATES.ti_le_bhtn_dn;
};

watch(
  () => props.employee,
  () => {
    setFormFromEmployee();
  },
  {immediate: true},
);

const resetRates = () => {
  form.ti_le_bhxh_nv = DEFAULT_RATES.ti_le_bhxh_nv;
  form.ti_le_bhxh_dn = DEFAULT_RATES.ti_le_bhxh_dn;
  form.ti_le_bhyt_nv = DEFAULT_RATES.ti_le_bhyt_nv;
  form.ti_le_bhyt_dn = DEFAULT_RATES.ti_le_bhyt_dn;
  form.ti_le_bhtn_nv = DEFAULT_RATES.ti_le_bhtn_nv;
  form.ti_le_bhtn_dn = DEFAULT_RATES.ti_le_bhtn_dn;
};

const handleReset = () => {
  setFormFromEmployee();
};

const handleSave = async () => {
  if (isReadonly.value || !props.employee) return;
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await nhanVienService.update(props.employee!._id, {
        bao_hiem: {...form},
      });
      ElMessage.success('Da luu thong tin BHXH');
      emit('reload');
    } catch (err: any) {
      ElMessage.error(err.response?.data?.msg || 'Không thể lưu thông tin');
    } finally {
      saving.value = false;
    }
  });
};
</script>

<style scoped lang="scss">
.orangehrm-insurance-info {
  min-height: 200px;
}

.mb-lg {
  margin-bottom: $spacing-lg;
}

.orangehrm-form-section {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-xl;
  border-bottom: 1px solid $border-color;

  &:last-of-type {
    border-bottom: none;
  }
}

.orangehrm-section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  margin: 0 0 $spacing-md 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.rate-panel {
  border: 1px dashed $border-color;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  h4 {
    margin: 0 0 $spacing-sm 0;
  }
}

.orangehrm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}
</style>

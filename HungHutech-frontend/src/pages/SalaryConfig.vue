<template>
  <div class="salary-config-page">
    <div class="page-header">
      <div>
        <h1>Cấu hình thu nhập</h1>
        <p>
          Cấu hình chung áp dụng cho toàn bộ hệ thống: bảo hiểm, thuế, làm tròn.
        </p>
      </div>
      <el-space>
        <el-button :icon="Refresh" :loading="loading" @click="loadConfig"
          >Tải lại</el-button
        >
        <el-button
          type="primary"
          :icon="DocumentChecked"
          :loading="saving"
          @click="saveConfig"
        >
          Lưu cấu hình
        </el-button>
      </el-space>
    </div>

    <el-card shadow="never">
      <el-form label-width="240px" :model="form" @submit.prevent>
        <h3>Ngưỡng thuế, giảm trừ & làm tròn</h3>
        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item label="Mức lương bắt đầu tính Thuế TNCN">
              <el-input-number
                v-model="form.muc_luong_bat_dau_tinh_tncn"
                :min="0"
                :step="500000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="Mức giảm trừ cho mỗi Người phụ thuộc">
              <el-input-number
                v-model="form.giam_tru_phu_thuoc"
                :min="0"
                :step="500000"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item label="Số chữ số làm tròn Lương thực lĩnh">
              <el-input-number
                v-model="form.lam_tron_luong_thuc_linh"
                :step="1"
              />
              <small class="note"
                >Ví dụ -3: làm tròn đến nghìn; 0: không làm tròn.</small
              >
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="Không tính BHXH, BHYT nếu ít hơn số ngày">
              <el-input-number
                v-model="form.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi"
                :min="0"
                :step="1"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item label="Lương cơ bản tính BHXH, BHYT">
              <el-input-number
                v-model="form.luong_co_ban_bhxh_bhyt"
                :min="0"
                :step="100000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="Lương tối thiểu vùng tính BHTN">
              <el-input-number
                v-model="form.luong_toi_thieu_vung_bhtn"
                :min="0"
                :step="100000"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />
        <h3>Tỷ lệ đóng BH/Quỹ (Doanh nghiệp)</h3>
        <el-row :gutter="16">
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHXH">
              <el-input-number
                v-model="form.ti_le_dn.bhxh"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHYT">
              <el-input-number
                v-model="form.ti_le_dn.bhyt"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHTN">
              <el-input-number
                v-model="form.ti_le_dn.bhtn"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% KPCĐ">
              <el-input-number
                v-model="form.ti_le_dn.kpcd"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="6" :sm="12">
            <el-form-item label="Khoản tiền khác (DN)">
              <el-input-number
                v-model="form.ti_le_dn.tien"
                :min="0"
                :step="50000"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />
        <h3>Tỷ lệ đóng BH/Quỹ (Người lao động)</h3>
        <el-row :gutter="16">
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHXH">
              <el-input-number
                v-model="form.ti_le_nld.bhxh"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHYT">
              <el-input-number
                v-model="form.ti_le_nld.bhyt"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% BHTN">
              <el-input-number
                v-model="form.ti_le_nld.bhtn"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="% KPCĐ">
              <el-input-number
                v-model="form.ti_le_nld.kpcd"
                :min="0"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="6" :sm="12">
            <el-form-item label="Khoản tiền khác (NLĐ)">
              <el-input-number
                v-model="form.ti_le_nld.tien"
                :min="0"
                :step="50000"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />
        <h3>Biểu thuế TNCN</h3>
        <el-row :gutter="16">
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 5%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac5"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 10%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac10"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 15%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac15"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 20%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac20"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 25%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac25"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 30%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac30"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :md="8" :sm="12">
            <el-form-item label="Mức 35%">
              <el-input-number
                v-model="form.thue_tncn_bac.bac35"
                :min="0"
                :step="1000000"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref, onMounted} from 'vue';
import {ElMessage} from 'element-plus';
import {Refresh, DocumentChecked} from '@element-plus/icons-vue';
import salaryConfigService from '@/services/salaryConfigService';
import type {SalaryConfig} from '@/types';

const loading = ref(false);
const saving = ref(false);
const form = reactive<SalaryConfig>({
  muc_luong_bat_dau_tinh_tncn: 0,
  giam_tru_phu_thuoc: 0,
  lam_tron_luong_thuc_linh: 0,
  luong_co_ban_bhxh_bhyt: 0,
  luong_toi_thieu_vung_bhtn: 0,
  khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi: 0,
  ti_le_dn: {bhxh: 0, bhyt: 0, bhtn: 0, kpcd: 0, tien: 0},
  ti_le_nld: {bhxh: 0, bhyt: 0, bhtn: 0, kpcd: 0, tien: 0},
  thue_tncn_bac: {
    bac5: 0,
    bac10: 0,
    bac15: 0,
    bac20: 0,
    bac25: 0,
    bac30: 0,
    bac35: 0,
  },
});

const loadConfig = async () => {
  loading.value = true;
  try {
    const data = await salaryConfigService.get();
    Object.assign(form, data);
  } catch (err: any) {
    console.error(err);
    ElMessage.error('Không thể tải cấu hình thu nhập');
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  saving.value = true;
  try {
    const data = await salaryConfigService.update(form);
    Object.assign(form, data);
    ElMessage.success('Đã lưu cấu hình thu nhập');
  } catch (err: any) {
    console.error(err);
    ElMessage.error(err?.response?.data?.msg || 'Lưu cấu hình thất bại');
  } finally {
    saving.value = false;
  }
};

onMounted(loadConfig);
</script>

<style scoped>
.salary-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.page-header h1 {
  margin: 0;
}
.page-header p {
  margin: 4px 0 0;
  color: #606266;
}
h3 {
  margin-top: 0;
}
.note {
  color: #909399;
  margin-left: 8px;
}
</style>

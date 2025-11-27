<template>
  <div class="payroll-page">
    <div class="page-header">
      <div>
        <h1>Quan ly bang luong</h1>
        <p>Tao va theo doi cac ky luong, dam bao tinh dung - du truoc khi chi tra.</p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadRuns">Tai lai</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">Tao bang luong</el-button>
      </div>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form inline @submit.prevent>
        <el-form-item label="Tu khoa">
          <el-input
            v-model="filters.q"
            placeholder="Ky luong, ghi chu..."
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleFilter"
          />
        </el-form-item>
        <el-form-item label="Loai ky">
          <el-select v-model="filters.loai_ky" placeholder="Tat ca" clearable style="width: 160px">
            <el-option label="Ky thang" value="Thang" />
            <el-option label="Ky tuan" value="Tuan" />
            <el-option label="Tuy chinh" value="Tuy_chinh" />
          </el-select>
        </el-form-item>
        <el-form-item label="Trang thai">
          <el-select v-model="filters.trang_thai" placeholder="Tat ca" clearable style="width: 180px">
            <el-option v-for="item in runStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">Ap dung</el-button>
          <el-button @click="resetFilters">Xoa loc</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="runs"
        :empty-text="loading ? 'Dang tai...' : 'Chua co bang luong'"
        stripe
      >
        <el-table-column label="Ky luong" min-width="160">
          <template #default="{ row }">
            <div class="run-title">
              <strong>{{ row.ky_luong }}</strong>
              <span>{{ formatDateRange(row.ngay_bat_dau, row.ngay_ket_thuc) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Loai ky" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getRunTypeLabel(row.loai_ky) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trang thai" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.trang_thai)" size="small">
              {{ runStatusLabel(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tong thu nhap" min-width="150">
          <template #default="{ row }">
            {{ formatCurrency(row.tong_thu_nhap, row.currency) }}
          </template>
        </el-table-column>
        <el-table-column label="Thuc nhan" min-width="150">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.tong_net, row.currency) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="tong_so_nhan_vien" label="Nhan vien" width="110" />
        <el-table-column label="Hanh dong" width="200" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" :icon="View" @click="openDetail(row)">Chi tiet</el-button>
              <el-dropdown @command="(cmd: string) => handleRunStatusAction(row, cmd)">
                <el-button size="small">Cap nhat</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="item in runStatusOptions"
                      :key="item.value"
                      :command="item.value"
                    >
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                size="small"
                type="danger"
                text
                @click="() => handleDeleteRun(row)"
              >
                Xoa
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>

  <!-- Dialog tao bang luong -->
  <el-dialog v-model="showCreateDialog" title="Tao bang luong" width="820px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="150px">
      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Ten ky luong" prop="ky_luong">
            <el-input v-model="form.ky_luong" placeholder="VD: Luong thang 01/2025" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Loai ky" prop="loai_ky">
            <el-select v-model="form.loai_ky">
              <el-option label="Thang" value="Thang" />
              <el-option label="Tuan" value="Tuan" />
              <el-option label="Tuy chinh" value="Tuy_chinh" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Ngay bat dau" prop="ngay_bat_dau">
            <el-date-picker
              v-model="form.ngay_bat_dau"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Ngay ket thuc" prop="ngay_ket_thuc">
            <el-date-picker
              v-model="form.ngay_ket_thuc"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Tien te">
            <el-select v-model="form.currency">
              <el-option label="VND" value="VND" />
              <el-option label="USD" value="USD" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Ghi chu">
            <el-input v-model="form.ghi_chu" placeholder="Ghi chu chung" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">Ty le khau tru</el-divider>
      <el-row :gutter="16" class="settings-row">
        <el-col :md="6" :sm="12">
          <el-form-item label="BHXH">
            <el-input-number v-model="form.settings.ti_le_bhxh" :min="0" :max="1" :step="0.005" />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="BHYT">
            <el-input-number v-model="form.settings.ti_le_bhyt" :min="0" :max="1" :step="0.005" />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="BHTN">
            <el-input-number v-model="form.settings.ti_le_bhtn" :min="0" :max="1" :step="0.005" />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="KPCD">
            <el-input-number
              v-model="form.settings.ti_le_kpcd"
              :min="0"
              :max="1"
              :step="0.005"
              :disabled="!form.settings.ap_dung_kpcd"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :md="6" :sm="12">
          <el-form-item label="Ap dung KPCD">
            <el-switch v-model="form.settings.ap_dung_kpcd" />
          </el-form-item>
        </el-col>
        <el-col :md="9" :sm="12">
          <el-form-item label="Giam tru ban than">
            <el-input-number
              v-model="form.settings.giam_tru_ban_than"
              :min="0"
              :step="500000"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="9" :sm="12">
          <el-form-item label="Giam tru phu thuoc">
            <el-input-number
              v-model="form.settings.giam_tru_phu_thuoc"
              :min="0"
              :step="100000"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="auto-fill-bar">
        <el-alert type="info" :closable="false" show-icon>
          Co the tu dong lay du lieu timesheet/OT va don nghi cho khoang ngay da chon, sau do bam "Tu dong tinh luong" de ap dung vao bang luong.
        </el-alert>
        <div class="auto-fill-actions">
          <el-button type="primary" plain :loading="autoFillLoading" @click="handleAutoFill">
            Tu dong lay du lieu
          </el-button>
          <el-button type="success" plain :loading="autoFillLoading" @click="handleRecalculate">
            Tinh lai luong
          </el-button>
        </div>
      </div>

      <div class="entries-header">
        <el-divider content-position="left">Nhan vien trong ky</el-divider>
        <el-button type="primary" plain size="small" @click="addEntry">Them dong</el-button>
      </div>

      <div v-for="(entry, index) in form.entries" :key="entry.uid" class="entry-card">
        <div class="entry-card__header">
          <div>
            <span class="entry-card__index">Nhan vien #{{ index + 1 }}</span>
            <p v-if="entryEmployeeLabel(entry.nhan_vien_id)">{{ entryEmployeeLabel(entry.nhan_vien_id) }}</p>
          </div>
          <div class="entry-card__actions">
            <el-button v-if="form.entries.length > 1" type="danger" text @click="removeEntry(index)">
              Xoa
            </el-button>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item :label="`Nhan vien #${index + 1}`">
              <el-select
                v-model="entry.nhan_vien_id"
                placeholder="Chon nhan vien"
                filterable
                style="width: 100%"
                @change="() => handleEntryEmployeeChange(entry)"
              >
                <el-option
                  v-for="emp in employees"
                  :key="emp._id"
                  :label="`${emp.ma_nhan_vien} - ${emp.ho_dem} ${emp.ten}`"
                  :value="emp._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="Luong co ban (VND)">
              <el-input-number
                v-model="entry.luong_co_ban"
                :min="0"
                :step="500000"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item label="So nguoi phu thuoc">
              <el-input-number
                v-model="entry.so_nguoi_phu_thuoc"
                :min="0"
                :step="1"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="entry.metadata" class="entry-card__meta">
          <el-tag size="small">Gio cham cong: {{ entry.metadata.tong_gio_timesheet || 0 }}</el-tag>
          <el-tag size="small" type="warning">OT: {{ entry.metadata.tong_gio_ot || 0 }}h</el-tag>
          <el-tag size="small" type="info">Nghi: {{ entry.metadata.so_ngay_nghi || 0 }} ngay</el-tag>
          <el-tag size="small" type="success">Ngay cong: {{ entry.metadata.so_ngay_cong || 0 }}</el-tag>
          <el-tag v-if="entry.calculated" size="small" type="primary">
            Thu nhap: {{ formatCurrency(entry.calculated?.tong_thu_nhap, form.currency) }}
          </el-tag>
          <el-tag v-if="entry.calculated" size="small" type="danger">
            Khau tru: {{ formatCurrency(entry.calculated?.tong_khau_tru, form.currency) }}
          </el-tag>
          <el-tag v-if="entry.calculated" size="small" type="warning">
            Thue TNCN: {{ formatCurrency(entry.calculated?.thue_tncn, form.currency) }}
          </el-tag>
          <el-tag v-if="entry.calculated" size="small" type="success">
            Thuc nhan: {{ formatCurrency(entry.calculated?.luong_thuc_nhan, form.currency) }}
          </el-tag>
        </div>

        <div class="money-grid">
          <div class="money-section">
            <div class="money-section__header">
              <span>Phu cap</span>
              <el-button text type="primary" size="small" @click="addMoneyItem(index, 'phu_cap')">Them</el-button>
            </div>
            <div v-if="entry.phu_cap.length === 0" class="money-section__empty">Chua co phu cap</div>
            <div
              v-for="(item, itemIndex) in entry.phu_cap"
              :key="`phucap-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Ten khoan" />
              <el-input-number v-model="item.so_tien" :min="0" :step="100000" :controls="false" />
              <el-button text type="danger" @click="removeMoneyItem(index, 'phu_cap', itemIndex)">Xoa</el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>Thuong</span>
              <el-button text type="primary" size="small" @click="addMoneyItem(index, 'thuong')">Them</el-button>
            </div>
            <div v-if="entry.thuong.length === 0" class="money-section__empty">Chua co thuong</div>
            <div
              v-for="(item, itemIndex) in entry.thuong"
              :key="`thuong-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Ten khoan" />
              <el-input-number v-model="item.so_tien" :min="0" :step="100000" :controls="false" />
              <el-button text type="danger" @click="removeMoneyItem(index, 'thuong', itemIndex)">Xoa</el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>OT / Lam them</span>
              <el-button text type="primary" size="small" @click="addMoneyItem(index, 'ot')">Them</el-button>
            </div>
            <div v-if="entry.ot.length === 0" class="money-section__empty">Chua co OT</div>
            <div v-for="(item, itemIndex) in entry.ot" :key="`ot-${entry.uid}-${itemIndex}`" class="money-section__row">
              <el-input v-model="item.ten" placeholder="Mo ta" />
              <el-input-number v-model="item.so_tien" :min="0" :step="100000" :controls="false" />
              <el-button text type="danger" @click="removeMoneyItem(index, 'ot', itemIndex)">Xoa</el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>Khau tru</span>
              <el-button text type="primary" size="small" @click="addMoneyItem(index, 'khoan_khau_tru')">
                Them
              </el-button>
            </div>
            <div v-if="entry.khoan_khau_tru.length === 0" class="money-section__empty">Chua co khau tru</div>
            <div
              v-for="(item, itemIndex) in entry.khoan_khau_tru"
              :key="`khau-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Ten khoan" />
              <el-input-number v-model="item.so_tien" :min="0" :step="100000" :controls="false" />
              <el-button text type="danger" @click="removeMoneyItem(index, 'khoan_khau_tru', itemIndex)">
                Xoa
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="closeCreateDialog">Huy</el-button>
      <el-button type="primary" :loading="saving" @click="handleCreateRun">Tao bang luong</el-button>
    </template>
  </el-dialog>

  <!-- Drawer chi tiet -->
  <el-drawer v-model="showDetailDrawer" title="Chi tiet bang luong" size="65%" :destroy-on-close="false">
    <el-skeleton :loading="detailLoading" animated>
      <template #default>
        <div v-if="selectedRun" class="drawer-body">
          <div class="drawer-header">
            <div>
              <h2>{{ selectedRun.ky_luong }}</h2>
              <p>{{ formatDateRange(selectedRun.ngay_bat_dau, selectedRun.ngay_ket_thuc) }}</p>
            </div>
            <div class="drawer-actions">
              <el-button type="primary" plain size="small" :loading="exporting" @click="handleExportExcel">
                Xuat Excel
              </el-button>
              <el-tag :type="statusTagType(selectedRun.trang_thai)">
                {{ runStatusLabel(selectedRun.trang_thai) }}
              </el-tag>
            </div>
          </div>

          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="Loai ky">
              {{ getRunTypeLabel(selectedRun.loai_ky) }}
            </el-descriptions-item>
            <el-descriptions-item label="Nhan vien">
              {{ selectedRun.tong_so_nhan_vien }}
            </el-descriptions-item>
            <el-descriptions-item label="Tong thu nhap">
              {{ formatCurrency(selectedRun.tong_thu_nhap, selectedRun.currency) }}
            </el-descriptions-item>
            <el-descriptions-item label="Khau tru">
              {{ formatCurrency(selectedRun.tong_khau_tru, selectedRun.currency) }}
            </el-descriptions-item>
            <el-descriptions-item label="Thue TNCN">
              {{ formatCurrency(selectedRun.tong_thue_tncn, selectedRun.currency) }}
            </el-descriptions-item>
            <el-descriptions-item label="Thuc nhan">
              <strong>{{ formatCurrency(selectedRun.tong_net, selectedRun.currency) }}</strong>
            </el-descriptions-item>
          </el-descriptions>

          <el-table :data="selectedRun.entries" size="small" border>
            <el-table-column label="Nhan vien" min-width="220">
              <template #default="{ row }">
                <div class="employee-cell">
                  <strong>{{ row.ho_ten }}</strong>
                  <span>{{ row.ma_nhan_vien }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Luong co ban" min-width="140">
              <template #default="{ row }">
                {{ formatCurrency(row.luong_co_ban, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Thu nhap" min-width="140">
              <template #default="{ row }">
                {{ formatCurrency(row.tong_thu_nhap, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Khau tru" min-width="140">
              <template #default="{ row }">
                {{ formatCurrency(row.tong_khau_tru, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Thuc nhan" min-width="140">
              <template #default="{ row }">
                <strong>{{ formatCurrency(row.luong_thuc_nhan, selectedRun.currency) }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="Trang thai" min-width="160">
              <template #default="{ row }">
                <el-select v-model="row.trang_thai" size="small" @change="(val: string) => updateEntryStatus(row, val)">
                  <el-option v-for="opt in entryStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-skeleton>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import { Refresh, Plus, Search, View } from '@element-plus/icons-vue';
import payrollService, { CreatePayrollRunPayload } from '@/services/payrollService';
import nhanVienService from '@/services/nhanVienService';
import type {
  PayrollRun,
  PayrollEntry,
  PayrollRunStatus,
  NhanVien,
  PayrollPreviewEntry,
  PayrollPreviewResponse,
} from '@/types';

interface MoneyItemForm {
  ten: string;
  so_tien: number | null;
  ghi_chu?: string;
}

interface PayrollEntryForm {
  uid: string;
  nhan_vien_id: string;
  luong_co_ban: number | null;
  so_nguoi_phu_thuoc: number;
  phu_cap: MoneyItemForm[];
  thuong: MoneyItemForm[];
  ot: MoneyItemForm[];
  khoan_khau_tru: MoneyItemForm[];
  metadata?: {
    tong_gio_timesheet?: number;
    tong_gio_ot?: number;
    so_ngay_nghi?: number;
    so_ngay_cong?: number;
  };
  calculated?: {
    tong_thu_nhap?: number;
    tong_khau_tru?: number;
    thue_tncn?: number;
    luong_thuc_nhan?: number;
  };
}

const runs = ref<PayrollRun[]>([]);
const loading = ref(false);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({
  q: '',
  loai_ky: '' as PayrollRun['loai_ky'] | '',
  trang_thai: '' as PayrollRunStatus | '',
});

const runStatusOptions = [
  { label: 'Nhap', value: 'Draft' },
  { label: 'Cho duyet', value: 'Cho_duyet' },
  { label: 'Da duyet', value: 'Da_duyet' },
  { label: 'Da chi', value: 'Da_chi' },
];

const entryStatusOptions = [
  { label: 'Cho duyet', value: 'Cho_duyet' },
  { label: 'Da duyet', value: 'Da_duyet' },
  { label: 'Da chi', value: 'Da_chi' },
];

const defaultSettings = {
  ti_le_bhxh: 0.08,
  ti_le_bhyt: 0.015,
  ti_le_bhtn: 0.01,
  ti_le_kpcd: 0.01,
  ap_dung_kpcd: true,
  giam_tru_ban_than: 11000000,
  giam_tru_phu_thuoc: 4400000,
};

const formRef = ref<FormInstance>();
const showCreateDialog = ref(false);
const saving = ref(false);
const autoFillLoading = ref(false);
const employees = ref<NhanVien[]>([]);
const form = reactive({
  ky_luong: '',
  loai_ky: 'Thang' as PayrollRun['loai_ky'],
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  currency: 'VND',
  ghi_chu: '',
  settings: { ...defaultSettings },
  entries: [] as PayrollEntryForm[],
});

const formRules: FormRules = {
  ky_luong: [{ required: true, message: 'Nhap ten ky luong', trigger: 'blur' }],
  loai_ky: [{ required: true, message: 'Chon loai ky', trigger: 'change' }],
  ngay_bat_dau: [{ required: true, message: 'Chon ngay bat dau', trigger: 'change' }],
  ngay_ket_thuc: [{ required: true, message: 'Chon ngay ket thuc', trigger: 'change' }],
};

const showDetailDrawer = ref(false);
const selectedRun = ref<PayrollRun | null>(null);
const detailLoading = ref(false);
const exporting = ref(false);

const formatCurrency = (value?: number, currency = 'VND') => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `${(value || 0).toLocaleString('vi-VN')} ${currency}`;
  }
};

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return '---';
  return `${new Date(start).toLocaleDateString('vi-VN')} - ${new Date(end).toLocaleDateString('vi-VN')}`;
};

const runStatusLabel = (status: PayrollRunStatus) => {
  const item = runStatusOptions.find((opt) => opt.value === status);
  return item?.label || status;
};

const statusTagType = (status: PayrollRunStatus) => {
  if (status === 'Da_duyet' || status === 'Da_chi') return 'success';
  if (status === 'Cho_duyet') return 'warning';
  return 'info';
};

const getRunTypeLabel = (type: PayrollRun['loai_ky']) => {
  if (type === 'Thang') return 'Ky thang';
  if (type === 'Tuan') return 'Ky tuan';
  return 'Tuy chinh';
};

const loadRuns = async () => {
  loading.value = true;
  try {
    const response = await payrollService.getRuns({
      page: pagination.page,
      limit: pagination.limit,
      q: filters.q || undefined,
      loai_ky: filters.loai_ky || undefined,
      trang_thai: filters.trang_thai || undefined,
    });
    runs.value = (response as any)?.data ?? (response as any) ?? [];
    const paginationRes = (response as any)?.pagination;
    pagination.total = paginationRes?.total ?? runs.value.length ?? 0;
    pagination.limit = paginationRes?.limit ?? pagination.limit;
    pagination.page = paginationRes?.page ?? pagination.page;
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || 'Khong the tai bang luong');
  } finally {
    loading.value = false;
  }
};

const loadEmployees = async () => {
  try {
    const res = await nhanVienService.getAll({ page: 1, limit: 200 });
    employees.value = (res as any)?.data ?? [];
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || 'Khong the tai danh sach nhan vien');
  }
};

const handleFilter = () => {
  pagination.page = 1;
  loadRuns();
};

const resetFilters = () => {
  filters.q = '';
  filters.loai_ky = '' as any;
  filters.trang_thai = '' as any;
  handleFilter();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadRuns();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  loadRuns();
};

const createEmptyEntry = (): PayrollEntryForm => ({
  uid: `${Date.now()}-${Math.random()}`,
  nhan_vien_id: '',
  luong_co_ban: null,
  so_nguoi_phu_thuoc: 0,
  phu_cap: [],
  thuong: [],
  ot: [],
  khoan_khau_tru: [],
});

const resetForm = () => {
  form.ky_luong = '';
  form.loai_ky = 'Thang';
  form.ngay_bat_dau = '';
  form.ngay_ket_thuc = '';
  form.currency = 'VND';
  form.ghi_chu = '';
  form.settings = { ...defaultSettings };
  form.entries.splice(0, form.entries.length, createEmptyEntry());
};

const openCreateDialog = async () => {
  resetForm();
  showCreateDialog.value = true;
  if (!employees.value.length) await loadEmployees();
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
};

const addEntry = () => {
  form.entries.push(createEmptyEntry());
};

const removeEntry = (index: number) => {
  if (form.entries.length === 1) {
    ElMessage.warning('Phai co it nhat mot nhan vien');
    return;
  }
  form.entries.splice(index, 1);
};

const handleEntryEmployeeChange = (entry: PayrollEntryForm) => {
  const employee = employees.value.find((emp) => emp._id === entry.nhan_vien_id);
  if (!employee) return;
  if (!entry.so_nguoi_phu_thuoc && (employee as any).nguoi_phu_thuoc) {
    entry.so_nguoi_phu_thuoc = (employee as any).nguoi_phu_thuoc.length;
  }
  if ((!entry.luong_co_ban || entry.luong_co_ban === 0) && (employee as any).luong?.length) {
    const firstSalary = (employee as any).luong[0];
    const value =
      typeof firstSalary.so_tien === 'object'
        ? Number(firstSalary.so_tien.$numberDecimal)
        : Number(firstSalary.so_tien);
    if (!Number.isNaN(value)) entry.luong_co_ban = value;
  }
};

const entryEmployeeLabel = (employeeId: string) => {
  const employee = employees.value.find((emp) => emp._id === employeeId);
  if (!employee) return '';
  return `${employee.ho_dem || ''} ${employee.ten || ''} (${employee.ma_nhan_vien})`.trim();
};

const addMoneyItem = (entryIndex: number, key: 'phu_cap' | 'thuong' | 'ot' | 'khoan_khau_tru') => {
  const target = form.entries[entryIndex][key];
  target.push({ ten: '', so_tien: null });
};

const removeMoneyItem = (entryIndex: number, key: 'phu_cap' | 'thuong' | 'ot' | 'khoan_khau_tru', itemIndex: number) => {
  const target = form.entries[entryIndex][key];
  target.splice(itemIndex, 1);
};

const cloneMoneyItems = (items: Array<{ ten?: string; so_tien?: number; ghi_chu?: string }> = []) =>
  items.map((item) => ({
    ten: item.ten || '',
    so_tien: Number(item.so_tien ?? 0),
    ghi_chu: item.ghi_chu,
  }));

const sanitizeMoneyItems = (items: MoneyItemForm[], defaultName: string = 'Khoan') =>
  items
    .filter((item) => item.so_tien !== null && Number(item.so_tien) > 0)
    .map((item, index) => ({
      ten: item.ten || `${defaultName} ${index + 1}`,
      so_tien: Number(item.so_tien),
      ghi_chu: item.ghi_chu,
    }));

const applyPreviewEntries = (previewEntries: PayrollPreviewEntry[] = []) => {
  previewEntries.forEach((preview) => {
    let entry = form.entries.find((item) => item.nhan_vien_id === preview.nhan_vien_id);
    if (!entry) {
      entry = createEmptyEntry();
      entry.nhan_vien_id = preview.nhan_vien_id;
      form.entries.push(entry);
    }
    entry.luong_co_ban = preview.luong_co_ban ?? entry.luong_co_ban;
    if (typeof preview.so_nguoi_phu_thuoc === 'number') {
      entry.so_nguoi_phu_thuoc = preview.so_nguoi_phu_thuoc;
    }
    entry.phu_cap = cloneMoneyItems(preview.phu_cap || []);
    entry.thuong = cloneMoneyItems(preview.thuong || []);
    entry.ot = cloneMoneyItems(preview.ot || []);
    entry.khoan_khau_tru = cloneMoneyItems(preview.khoan_khau_tru || []);
    entry.metadata = {
      tong_gio_timesheet: (preview as any).metadata?.tong_gio_timesheet,
      tong_gio_ot: (preview as any).metadata?.tong_gio_ot,
      so_ngay_nghi: (preview as any).metadata?.so_ngay_nghi,
      so_ngay_cong: (preview as any).metadata?.so_ngay_cong,
    };
    entry.calculated = (preview as any).calculated || entry.calculated;
  });
};

const handleAutoFill = async () => {
  if (!form.ngay_bat_dau || !form.ngay_ket_thuc) {
    ElMessage.warning('Vui long chon khoang thoi gian truoc khi lay du lieu');
    return;
  }
  autoFillLoading.value = true;
  try {
    const employeeIds = form.entries.map((entry) => entry.nhan_vien_id).filter(Boolean);
    const response: PayrollPreviewResponse = await payrollService.preview({
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc,
      employee_ids: employeeIds.length ? employeeIds : undefined,
    });
    if ((response as any)?.settings) {
      form.settings = { ...form.settings, ...(response as any).settings };
    }
    applyPreviewEntries(response.data || []);
    if (!form.entries.length) {
      form.entries.push(createEmptyEntry());
    }
    if (response.summary?.totalEmployees) {
      ElMessage.success(`Da tai du lieu cho ${response.summary.totalEmployees} nhan vien`);
    }
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || 'Khong the lay du lieu tu dong');
  } finally {
    autoFillLoading.value = false;
  }
};

const handleRecalculate = async () => {
  console.log('=== handleRecalculate called ===');
  console.log('form.entries:', form.entries);

  if (!form.entries.length) {
    ElMessage.warning('Chua co nhan vien nao de tinh luong');
    return;
  }
  const invalidEntries = form.entries.filter(
    (entry) => !entry.nhan_vien_id || !entry.luong_co_ban || entry.luong_co_ban <= 0
  );
  if (invalidEntries.length > 0) {
    ElMessage.warning('Tat ca nhan vien can co thong tin va luong co ban hop le');
    return;
  }
  if (!form.ngay_bat_dau || !form.ngay_ket_thuc) {
    ElMessage.warning('Vui long chon khoang thoi gian truoc khi tinh luong');
    return;
  }
  autoFillLoading.value = true;
  try {
    // Gửi entries đã sửa từ form để backend tính lại
    const entries = form.entries.map((entry) => ({
      nhan_vien_id: entry.nhan_vien_id,
      luong_co_ban: Number(entry.luong_co_ban),
      so_nguoi_phu_thuoc: entry.so_nguoi_phu_thuoc || 0,
      so_ngay_cong: entry.metadata?.so_ngay_cong || entry.calculated?.so_ngay_cong || 0,
      phu_cap: sanitizeMoneyItems(entry.phu_cap, 'Phu cap'),
      thuong: sanitizeMoneyItems(entry.thuong, 'Thuong'),
      ot: sanitizeMoneyItems(entry.ot, 'OT'),
      khoan_khau_tru: sanitizeMoneyItems(entry.khoan_khau_tru, 'Khau tru'),
      metadata: entry.metadata,
    }));

    console.log('Sending entries to API:', entries);

    const response: PayrollPreviewResponse = await payrollService.preview({
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc,
      entries,
      settings: form.settings,
    });

    console.log('API response:', response);
    console.log('response.data:', response.data);

    if ((response as any)?.settings) {
      form.settings = { ...form.settings, ...(response as any).settings };
    }

    // Cập nhật calculated từ response
    form.entries.forEach((entry) => {
      const preview = (response.data || []).find(
        (p: PayrollPreviewEntry) => p.nhan_vien_id === entry.nhan_vien_id
      );
      console.log('Processing entry:', entry.nhan_vien_id, 'preview:', preview);
      if (preview && (preview as any).calculated) {
        console.log('Updating calculated:', (preview as any).calculated);
        console.log('Chi tiet tinh luong:');
        console.log('- Luong co ban:', (preview as any).calculated.luong_co_ban);
        console.log('- Phu cap:', (preview as any).calculated.tong_phu_cap);
        console.log('- Thuong:', (preview as any).calculated.tong_thuong);
        console.log('- OT:', (preview as any).calculated.tong_ot);
        console.log('- Tong thu nhap:', (preview as any).calculated.tong_thu_nhap);
        console.log('- BHXH:', (preview as any).calculated.bhxh);
        console.log('- BHYT:', (preview as any).calculated.bhyt);
        console.log('- BHTN:', (preview as any).calculated.bhtn);
        console.log('- KPCD:', (preview as any).calculated.kpcd);
        console.log('- Thue TNCN:', (preview as any).calculated.thue_tncn);
        console.log('- Tong khau tru:', (preview as any).calculated.tong_khau_tru);
        console.log('- LUONG THUC NHAN:', (preview as any).calculated.luong_thuc_nhan);
        entry.calculated = (preview as any).calculated;
        // Giữ nguyên metadata nếu có
        if ((preview as any).metadata) {
          entry.metadata = {
            ...entry.metadata,
            ...(preview as any).metadata,
          };
        }
      } else {
        console.warn('No preview or calculated for entry:', entry.nhan_vien_id);
      }
    });

    console.log('Updated form.entries:', form.entries);
    ElMessage.success(`Da tinh lai luong cho ${form.entries.length} nhan vien`);
  } catch (err: any) {
    console.error('handleRecalculate error:', err);
    console.error('Error response:', err?.response?.data);
    ElMessage.error(err?.response?.data?.msg || 'Khong the tinh luong');
  } finally {
    autoFillLoading.value = false;
  }
};

const handleCreateRun = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    if (new Date(form.ngay_ket_thuc) < new Date(form.ngay_bat_dau)) {
      ElMessage.warning('Ngay ket thuc phai lon hon hoac bang ngay bat dau');
      return;
    }
    const invalidRow = form.entries.find(
      (entry) => !entry.nhan_vien_id || !entry.luong_co_ban || entry.luong_co_ban <= 0,
    );
    if (invalidRow) {
      ElMessage.warning('Moi nhan vien can thong tin va luong co ban hop le');
      return;
    }
    const payload: CreatePayrollRunPayload = {
      ky_luong: form.ky_luong,
      loai_ky: form.loai_ky,
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc,
      currency: form.currency,
      ghi_chu: form.ghi_chu,
      settings: { ...form.settings },
      entries: form.entries.map((entry) => ({
        nhan_vien_id: entry.nhan_vien_id,
        luong_co_ban: Number(entry.luong_co_ban),
        so_nguoi_phu_thuoc: entry.so_nguoi_phu_thuoc,
        so_ngay_cong: entry.metadata?.so_ngay_cong || entry.calculated?.so_ngay_cong || 0,
        phu_cap: sanitizeMoneyItems(entry.phu_cap, 'Phu cap'),
        thuong: sanitizeMoneyItems(entry.thuong, 'Thuong'),
        ot: sanitizeMoneyItems(entry.ot, 'OT'),
        khoan_khau_tru: sanitizeMoneyItems(entry.khoan_khau_tru, 'Khau tru'),
        metadata: entry.metadata,
      })),
    };
    saving.value = true;
    try {
      await payrollService.createRun(payload);
      ElMessage.success('Tao bang luong thanh cong');
      closeCreateDialog();
      loadRuns();
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.msg || 'Khong the tao bang luong');
    } finally {
      saving.value = false;
    }
  });
};

const openDetail = async (run: PayrollRun) => {
  showDetailDrawer.value = true;
  detailLoading.value = true;
  try {
    selectedRun.value = await payrollService.getRun(run._id);
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || 'Khong the tai chi tiet bang luong');
    showDetailDrawer.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const handleRunStatusAction = async (run: PayrollRun, status: string) => {
  if (!run._id) return;
  const statusValue = status as PayrollRunStatus;
  try {
    await ElMessageBox.confirm(
      `Chuyen trang thai \"${run.ky_luong}\" sang ${runStatusLabel(statusValue)}?`,
      'Xac nhan',
      { type: 'warning' },
    );
    await payrollService.updateRunStatus(run._id, statusValue);
    ElMessage.success('Cap nhat trang thai thanh cong');
    loadRuns();
    if (selectedRun.value && selectedRun.value._id === run._id) {
      selectedRun.value.trang_thai = statusValue;
    }
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(err?.response?.data?.msg || 'Khong the cap nhat trang thai');
  }
};

const handleDeleteRun = async (run: PayrollRun) => {
  if (!run._id) return;
  try {
    await ElMessageBox.confirm(
      `Ban chac chan muon xoa bang luong "${run.ky_luong}"?`,
      'Xac nhan',
      { type: 'warning' },
    );
    await payrollService.deleteRun(run._id);
    ElMessage.success('Da xoa bang luong');
    if (selectedRun.value?._id === run._id) {
      showDetailDrawer.value = false;
      selectedRun.value = null;
    }
    loadRuns();
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(err?.response?.data?.msg || 'Khong the xoa bang luong');
  }
};

const updateEntryStatus = async (entry: PayrollEntry, status: string) => {
  if (!selectedRun.value || !entry._id) return;
  const prev = entry.trang_thai;
  entry.trang_thai = status as PayrollEntry['trang_thai'];
  try {
    await payrollService.updateEntryStatus(selectedRun.value._id, entry._id, {
      trang_thai: status as 'Cho_duyet' | 'Da_duyet' | 'Da_chi',
    });
    ElMessage.success('Da cap nhat trang thai phieu luong');
  } catch (err: any) {
    entry.trang_thai = prev;
    ElMessage.error(err?.response?.data?.msg || 'Khong the cap nhat phieu luong');
  }
};

const handleExportExcel = async () => {
  if (!selectedRun.value) return;
  exporting.value = true;
  try {
    const blob = await payrollService.exportRun(selectedRun.value._id);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    const safeName = selectedRun.value.ky_luong?.replace(/[\\/:*?"<>|]/g, '_') || selectedRun.value._id;
    link.href = url;
    link.download = `payroll-${safeName}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || 'Khong the xuat bang luong');
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadRuns();
  loadEmployees();
});
</script>

<style scoped>
.payroll-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card .run-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-card .run-title span {
  color: #666;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.settings-row .el-input-number {
  width: 100%;
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.auto-fill-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.entry-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  background: #fff;
}

.entry-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entry-card__index {
  font-weight: 600;
  color: #666;
}

.entry-card__header p {
  margin: 4px 0 0;
  color: #111;
}

.entry-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.money-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.money-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.money-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.money-section__empty {
  color: #666;
  font-size: 13px;
}

.money-section__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.money-section__row .el-input {
  flex: 1;
}

.money-section__row .el-input-number {
  width: 140px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-header h2 {
  margin: 0;
}

.drawer-header p {
  margin: 4px 0 0;
  color: #666;
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-cell span {
  color: #666;
  font-size: 13px;
}

@media (max-width: 768px) {
  .settings-row .el-input-number {
    width: 100%;
  }

  .money-section__row {
    flex-direction: column;
  }

  .money-section__row .el-input-number {
    width: 100%;
  }
}
</style>

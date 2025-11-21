<template>
  <div class="payroll-page">
    <div class="page-header">
      <div>
        <h1>Quản lý bảng lương</h1>
        <p>
          Tạo và theo dõi các kỳ lương, đảm bảo tính đúng – đủ trước khi chi
          trả.
        </p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadRuns"
          >Tải lại</el-button
        >
        <el-button type="primary" :icon="Plus" @click="openCreateDialog"
          >Tạo bảng lương</el-button
        >
      </div>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form inline @submit.prevent>
        <el-form-item label="Từ khóa">
          <el-input
            v-model="filters.q"
            placeholder="Kỳ lương, ghi chú..."
            clearable
            :prefix-icon="Search"
            @keyup.enter.native="handleFilter"
          />
        </el-form-item>
        <el-form-item label="Loại kỳ">
          <el-select
            v-model="filters.loai_ky"
            placeholder="Tất cả"
            clearable
            style="width: 160px"
          >
            <el-option label="Kỳ tháng" value="Thang" />
            <el-option label="Kỳ tuần" value="Tuan" />
            <el-option label="Tùy chỉnh" value="Tuy_chinh" />
          </el-select>
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select
            v-model="filters.trang_thai"
            placeholder="Tất cả"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in runStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">Áp dụng</el-button>
          <el-button @click="resetFilters">Xóa lọc</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="runs"
        :empty-text="loading ? 'Đang tải...' : 'Chưa có bảng lương'"
        stripe
      >
        <el-table-column label="Kỳ lương" min-width="160">
          <template #default="{row}">
            <div class="run-title">
              <strong>{{ row.ky_luong }}</strong>
              <span>{{
                formatDateRange(row.ngay_bat_dau, row.ngay_ket_thuc)
              }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Loại kỳ" width="120">
          <template #default="{row}">
            <el-tag type="info" size="small">{{
              getRunTypeLabel(row.loai_ky)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130">
          <template #default="{row}">
            <el-tag :type="statusTagType(row.trang_thai)" size="small">
              {{ runStatusLabel(row.trang_thai) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tổng thu nhập" min-width="150">
          <template #default="{row}">{{
            formatCurrency(row.tong_thu_nhap, row.currency)
          }}</template>
        </el-table-column>
        <el-table-column label="Thực nhận" min-width="150">
          <template #default="{row}">
            <strong>{{ formatCurrency(row.tong_net, row.currency) }}</strong>
          </template>
        </el-table-column>
        <el-table-column
          prop="tong_so_nhan_vien"
          label="Nhân viên"
          width="110"
        />
        <el-table-column label="Hành động" width="200" fixed="right">
          <template #default="{row}">
            <el-space>
              <el-button size="small" :icon="View" @click="openDetail(row)"
                >Chi tiết</el-button
              >
              <el-dropdown @command="(cmd) => handleRunStatusAction(row, cmd)">
                <el-button size="small">Cập nhật</el-button>
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

  <el-dialog
    v-model="showCreateDialog"
    title="Tạo bảng lương"
    width="820px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="150px">
      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Tên kỳ lương" prop="ky_luong">
            <el-input
              v-model="form.ky_luong"
              placeholder="VD: Lương tháng 01/2025"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Loại kỳ" prop="loai_ky">
            <el-select v-model="form.loai_ky">
              <el-option label="Tháng" value="Thang" />
              <el-option label="Tuần" value="Tuan" />
              <el-option label="Tùy chỉnh" value="Tuy_chinh" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Ngày bắt đầu" prop="ngay_bat_dau">
            <el-date-picker
              v-model="form.ngay_bat_dau"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Ngày kết thúc" prop="ngay_ket_thuc">
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
          <el-form-item label="Tiền tệ">
            <el-select v-model="form.currency">
              <el-option label="VND" value="VND" />
              <el-option label="USD" value="USD" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Ghi chú">
            <el-input v-model="form.ghi_chu" placeholder="Ghi chú chung" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">Tỷ lệ khấu trừ</el-divider>
      <el-row :gutter="16" class="settings-row">
        <el-col :md="6" :sm="12">
          <el-form-item label="BHXH">
            <el-input-number
              v-model="form.settings.ti_le_bhxh"
              :min="0"
              :max="1"
              :step="0.005"
            />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="BHYT">
            <el-input-number
              v-model="form.settings.ti_le_bhyt"
              :min="0"
              :max="1"
              :step="0.005"
            />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="BHTN">
            <el-input-number
              v-model="form.settings.ti_le_bhtn"
              :min="0"
              :max="1"
              :step="0.005"
            />
          </el-form-item>
        </el-col>
        <el-col :md="6" :sm="12">
          <el-form-item label="KPCĐ">
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
          <el-form-item label="Áp dụng KPCĐ">
            <el-switch v-model="form.settings.ap_dung_kpcd" />
          </el-form-item>
        </el-col>
        <el-col :md="9" :sm="12">
          <el-form-item label="Giảm trừ bản thân">
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
          <el-form-item label="Giảm trừ phụ thuộc">
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
          Có thể tự động lấy dữ liệu timesheet/OT và đơn nghỉ cho khoảng ngày đã
          chọn.
        </el-alert>
        <el-button
          type="primary"
          plain
          :loading="autoFillLoading"
          @click="handleAutoFill"
        >
          Tự động lấy dữ liệu
        </el-button>
      </div>

      <div class="entries-header">
        <el-divider content-position="left">Nhân viên trong kỳ</el-divider>
        <el-button type="primary" plain size="small" @click="addEntry"
          >Thêm dòng</el-button
        >
      </div>
      <div
        v-for="(entry, index) in form.entries"
        :key="entry.uid"
        class="entry-card"
      >
        <div class="entry-card__header">
          <div>
            <span class="entry-card__index">Nhân viên #{{ index + 1 }}</span>
            <p v-if="entryEmployeeLabel(entry.nhan_vien_id)">
              {{ entryEmployeeLabel(entry.nhan_vien_id) }}
            </p>
          </div>
          <div class="entry-card__actions">
            <el-button
              v-if="form.entries.length > 1"
              type="danger"
              text
              @click="removeEntry(index)"
            >
              Xóa
            </el-button>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <el-form-item :label="`Nhân viên #${index + 1}`">
              <el-select
                v-model="entry.nhan_vien_id"
                placeholder="Chọn nhân viên"
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
            <el-form-item label="Lương cơ bản (VND)">
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
            <el-form-item label="Số người phụ thuộc">
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
          <el-tag size="small"
            >Giờ chấm công: {{ entry.metadata.tong_gio_timesheet || 0 }}</el-tag
          >
          <el-tag size="small" type="warning"
            >OT: {{ entry.metadata.tong_gio_ot || 0 }}h</el-tag
          >
          <el-tag size="small" type="info"
            >Nghỉ: {{ entry.metadata.so_ngay_nghi || 0 }} ngày</el-tag
          >
        </div>

        <div class="money-grid">
          <div class="money-section">
            <div class="money-section__header">
              <span>Phụ cấp</span>
              <el-button
                text
                type="primary"
                size="small"
                @click="addMoneyItem(index, 'phu_cap')"
              >
                Thêm
              </el-button>
            </div>
            <div v-if="entry.phu_cap.length === 0" class="money-section__empty">
              Chưa có phụ cấp
            </div>
            <div
              v-for="(item, itemIndex) in entry.phu_cap"
              :key="`phucap-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Tên khoản" />
              <el-input-number
                v-model="item.so_tien"
                :min="0"
                :step="100000"
                :controls="false"
              />
              <el-button
                text
                type="danger"
                @click="removeMoneyItem(index, 'phu_cap', itemIndex)"
              >
                Xóa
              </el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>Thưởng</span>
              <el-button
                text
                type="primary"
                size="small"
                @click="addMoneyItem(index, 'thuong')"
              >
                Thêm
              </el-button>
            </div>
            <div v-if="entry.thuong.length === 0" class="money-section__empty">
              Chưa có thưởng
            </div>
            <div
              v-for="(item, itemIndex) in entry.thuong"
              :key="`thuong-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Tên khoản" />
              <el-input-number
                v-model="item.so_tien"
                :min="0"
                :step="100000"
                :controls="false"
              />
              <el-button
                text
                type="danger"
                @click="removeMoneyItem(index, 'thuong', itemIndex)"
              >
                Xóa
              </el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>OT / Làm thêm</span>
              <el-button
                text
                type="primary"
                size="small"
                @click="addMoneyItem(index, 'ot')"
              >
                Thêm
              </el-button>
            </div>
            <div v-if="entry.ot.length === 0" class="money-section__empty">
              Chưa có OT
            </div>
            <div
              v-for="(item, itemIndex) in entry.ot"
              :key="`ot-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Mô tả" />
              <el-input-number
                v-model="item.so_tien"
                :min="0"
                :step="100000"
                :controls="false"
              />
              <el-button
                text
                type="danger"
                @click="removeMoneyItem(index, 'ot', itemIndex)"
              >
                Xóa
              </el-button>
            </div>
          </div>

          <div class="money-section">
            <div class="money-section__header">
              <span>Khấu trừ</span>
              <el-button
                text
                type="primary"
                size="small"
                @click="addMoneyItem(index, 'khoan_khau_tru')"
              >
                Thêm
              </el-button>
            </div>
            <div
              v-if="entry.khoan_khau_tru.length === 0"
              class="money-section__empty"
            >
              Chưa có khấu trừ
            </div>
            <div
              v-for="(item, itemIndex) in entry.khoan_khau_tru"
              :key="`khau-${entry.uid}-${itemIndex}`"
              class="money-section__row"
            >
              <el-input v-model="item.ten" placeholder="Tên khoản" />
              <el-input-number
                v-model="item.so_tien"
                :min="0"
                :step="100000"
                :controls="false"
              />
              <el-button
                text
                type="danger"
                @click="removeMoneyItem(index, 'khoan_khau_tru', itemIndex)"
              >
                Xóa
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="closeCreateDialog">Hủy</el-button>
      <el-button type="primary" :loading="saving" @click="handleCreateRun"
        >Tạo bảng lương</el-button
      >
    </template>
  </el-dialog>

  <el-drawer
    v-model="showDetailDrawer"
    title="Chi tiết bảng lương"
    size="65%"
    :destroy-on-close="false"
  >
    <el-skeleton :loading="detailLoading" animated>
      <template #default>
        <div v-if="selectedRun" class="drawer-body">
          <div class="drawer-header">
            <div>
              <h2>{{ selectedRun.ky_luong }}</h2>
              <p>
                {{
                  formatDateRange(
                    selectedRun.ngay_bat_dau,
                    selectedRun.ngay_ket_thuc,
                  )
                }}
              </p>
            </div>
            <div class="drawer-actions">
              <el-button-group>
                <el-button
                  type="primary"
                  plain
                  size="small"
                  :loading="exporting"
                  @click="handleExport"
                >
                  Xuất CSV tổng
                </el-button>
                <el-dropdown trigger="click" @command="handleExportTemplate">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    :loading="exporting"
                  >
                    Xuất theo mẫu
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="bhxh"
                        >Mẫu báo cáo BHXH</el-dropdown-item
                      >
                      <el-dropdown-item command="thue"
                        >Mẫu quyết toán thuế</el-dropdown-item
                      >
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-button-group>
              <el-tag :type="statusTagType(selectedRun.trang_thai)">
                {{ runStatusLabel(selectedRun.trang_thai) }}
              </el-tag>
            </div>
          </div>

          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="Loại kỳ">
              {{ getRunTypeLabel(selectedRun.loai_ky) }}
            </el-descriptions-item>
            <el-descriptions-item label="Nhân viên">
              {{ selectedRun.tong_so_nhan_vien }}
            </el-descriptions-item>
            <el-descriptions-item label="Tổng thu nhập">
              {{
                formatCurrency(selectedRun.tong_thu_nhap, selectedRun.currency)
              }}
            </el-descriptions-item>
            <el-descriptions-item label="Khấu trừ">
              {{
                formatCurrency(selectedRun.tong_khau_tru, selectedRun.currency)
              }}
            </el-descriptions-item>
            <el-descriptions-item label="Thuế TNCN">
              {{
                formatCurrency(selectedRun.tong_thue_tncn, selectedRun.currency)
              }}
            </el-descriptions-item>
            <el-descriptions-item label="Thực nhận">
              <strong>{{
                formatCurrency(selectedRun.tong_net, selectedRun.currency)
              }}</strong>
            </el-descriptions-item>
          </el-descriptions>

          <el-table :data="selectedRun.entries" size="small" border>
            <el-table-column label="Nhân viên" min-width="220">
              <template #default="{row}">
                <div class="employee-cell">
                  <strong>{{ row.ho_ten }}</strong>
                  <span>{{ row.ma_nhan_vien }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Lương cơ bản" min-width="140">
              <template #default="{row}">
                {{ formatCurrency(row.luong_co_ban, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Thu nhập" min-width="140">
              <template #default="{row}">
                {{ formatCurrency(row.tong_thu_nhap, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Khấu trừ" min-width="140">
              <template #default="{row}">
                {{ formatCurrency(row.tong_khau_tru, selectedRun.currency) }}
              </template>
            </el-table-column>
            <el-table-column label="Thực nhận" min-width="140">
              <template #default="{row}">
                <strong>{{
                  formatCurrency(row.luong_thuc_nhan, selectedRun.currency)
                }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="Trạng thái" min-width="160">
              <template #default="{row}">
                <el-select
                  v-model="row.trang_thai"
                  size="small"
                  @change="(val) => updateEntryStatus(row, val)"
                >
                  <el-option
                    v-for="opt in entryStatusOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
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
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import {Refresh, Plus, Search, View} from '@element-plus/icons-vue';
import payrollService, {
  CreatePayrollRunPayload,
} from '@/services/payrollService';
import nhanVienService from '@/services/nhanVienService';
import type {
  PayrollRun,
  PayrollEntry,
  PayrollRunStatus,
  NhanVien,
  PayrollPreviewEntry,
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
  };
}

const runs = ref<PayrollRun[]>([]);
const loading = ref(false);
const pagination = reactive({page: 1, limit: 10, total: 0});
const filters = reactive({q: '', loai_ky: '', trang_thai: ''});

const runStatusOptions = [
  {label: 'Nháp', value: 'Draft'},
  {label: 'Chờ duyệt', value: 'Cho_duyet'},
  {label: 'Đã duyệt', value: 'Da_duyet'},
  {label: 'Đã chi', value: 'Da_chi'},
];

const entryStatusOptions = [
  {label: 'Chờ duyệt', value: 'Cho_duyet'},
  {label: 'Đã duyệt', value: 'Da_duyet'},
  {label: 'Đã chi', value: 'Da_chi'},
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
  loai_ky: 'Thang',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  currency: 'VND',
  ghi_chu: '',
  settings: {...defaultSettings},
  entries: [] as PayrollEntryForm[],
});

const formRules: FormRules = {
  ky_luong: [{required: true, message: 'Nhập tên kỳ lương', trigger: 'blur'}],
  loai_ky: [{required: true, message: 'Chọn loại kỳ', trigger: 'change'}],
  ngay_bat_dau: [
    {required: true, message: 'Chọn ngày bắt đầu', trigger: 'change'},
  ],
  ngay_ket_thuc: [
    {required: true, message: 'Chọn ngày kết thúc', trigger: 'change'},
  ],
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
  return `${new Date(start).toLocaleDateString('vi-VN')} - ${new Date(
    end,
  ).toLocaleDateString('vi-VN')}`;
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
  if (type === 'Thang') return 'Kỳ tháng';
  if (type === 'Tuan') return 'Kỳ tuần';
  return 'Tùy chỉnh';
};

const loadRuns = async () => {
  loading.value = true;
  try {
    const response = await payrollService.getRuns({
      page: pagination.page,
      limit: pagination.limit,
      q: filters.q || undefined,
      loai_ky: (filters.loai_ky as PayrollRun['loai_ky']) || undefined,
      trang_thai: (filters.trang_thai as PayrollRunStatus) || undefined,
    });
    runs.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể tải bảng lương');
  } finally {
    loading.value = false;
  }
};

const loadEmployees = async () => {
  try {
    const res = await nhanVienService.getAll({page: 1, limit: 200});
    employees.value = res.data || [];
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải danh sách nhân viên',
    );
  }
};

const handleFilter = () => {
  pagination.page = 1;
  loadRuns();
};

const resetFilters = () => {
  filters.q = '';
  filters.loai_ky = '';
  filters.trang_thai = '';
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
  form.settings = {...defaultSettings};
  form.entries.splice(0, form.entries.length, createEmptyEntry());
};

const openCreateDialog = async () => {
  resetForm();
  showCreateDialog.value = true;
  if (employees.value.length === 0) await loadEmployees();
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
};

const addEntry = () => {
  form.entries.push(createEmptyEntry());
};

const removeEntry = (index: number) => {
  if (form.entries.length === 1) {
    ElMessage.warning('Phải có ít nhất một nhân viên');
    return;
  }
  form.entries.splice(index, 1);
};

const handleEntryEmployeeChange = (entry: PayrollEntryForm) => {
  const employee = employees.value.find(
    (emp) => emp._id === entry.nhan_vien_id,
  );
  if (!employee) return;
  if (!entry.so_nguoi_phu_thuoc && employee.nguoi_phu_thuoc) {
    entry.so_nguoi_phu_thuoc = employee.nguoi_phu_thuoc.length;
  }
  if (
    (!entry.luong_co_ban || entry.luong_co_ban === 0) &&
    employee.luong?.length
  ) {
    const firstSalary = employee.luong[0];
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
  return `${employee.ho_dem || ''} ${employee.ten || ''} (${
    employee.ma_nhan_vien
  })`.trim();
};

const addMoneyItem = (
  entryIndex: number,
  key: keyof Pick<
    PayrollEntryForm,
    'phu_cap' | 'thuong' | 'ot' | 'khoan_khau_tru'
  >,
) => {
  const target = form.entries[entryIndex][key];
  target.push({ten: '', so_tien: null});
};

const removeMoneyItem = (
  entryIndex: number,
  key: keyof Pick<
    PayrollEntryForm,
    'phu_cap' | 'thuong' | 'ot' | 'khoan_khau_tru'
  >,
  itemIndex: number,
) => {
  const target = form.entries[entryIndex][key];
  target.splice(itemIndex, 1);
};

const cloneMoneyItems = (
  items: Array<{ten?: string; so_tien?: number; ghi_chu?: string}> = [],
) =>
  items.map((item) => ({
    ten: item.ten || '',
    so_tien: Number(item.so_tien ?? 0),
    ghi_chu: item.ghi_chu,
  }));

const sanitizeMoneyItems = (items: MoneyItemForm[]) =>
  items
    .filter(
      (item) => item.ten && item.so_tien !== null && Number(item.so_tien) > 0,
    )
    .map((item) => ({
      ten: item.ten,
      so_tien: Number(item.so_tien),
      ghi_chu: item.ghi_chu,
    }));

const applyPreviewEntries = (previewEntries: PayrollPreviewEntry[] = []) => {
  previewEntries.forEach((preview) => {
    let entry = form.entries.find(
      (item) => item.nhan_vien_id === preview.nhan_vien_id,
    );
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
    entry.metadata = preview.metadata;
  });
};

const handleAutoFill = async () => {
  if (!form.ngay_bat_dau || !form.ngay_ket_thuc) {
    ElMessage.warning('Vui lòng chọn khoảng thời gian trước khi lấy dữ liệu');
    return;
  }
  autoFillLoading.value = true;
  try {
    const employeeIds = form.entries
      .map((entry) => entry.nhan_vien_id)
      .filter(Boolean);
    const response = await payrollService.preview({
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc,
      employee_ids: employeeIds.length ? employeeIds : undefined,
    });
    applyPreviewEntries(response.data || []);
    if (!form.entries.length) {
      form.entries.push(createEmptyEntry());
    }
    if (response.summary?.totalEmployees) {
      ElMessage.success(
        `Đã tải dữ liệu cho ${response.summary.totalEmployees} nhân viên`,
      );
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể lấy dữ liệu tự động');
  } finally {
    autoFillLoading.value = false;
  }
};

const handleCreateRun = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    if (new Date(form.ngay_ket_thuc) < new Date(form.ngay_bat_dau)) {
      ElMessage.warning('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
      return;
    }
    const invalidRow = form.entries.find(
      (entry) =>
        !entry.nhan_vien_id || !entry.luong_co_ban || entry.luong_co_ban <= 0,
    );
    if (invalidRow) {
      ElMessage.warning('Mỗi nhân viên cần thông tin và lương cơ bản hợp lệ');
      return;
    }
    const payload: CreatePayrollRunPayload = {
      ky_luong: form.ky_luong,
      loai_ky: form.loai_ky as PayrollRun['loai_ky'],
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc,
      currency: form.currency,
      ghi_chu: form.ghi_chu,
      settings: {...form.settings},
      entries: form.entries.map((entry) => ({
        nhan_vien_id: entry.nhan_vien_id,
        luong_co_ban: Number(entry.luong_co_ban),
        so_nguoi_phu_thuoc: entry.so_nguoi_phu_thuoc,
        phu_cap: sanitizeMoneyItems(entry.phu_cap),
        thuong: sanitizeMoneyItems(entry.thuong),
        ot: sanitizeMoneyItems(entry.ot),
        khoan_khau_tru: sanitizeMoneyItems(entry.khoan_khau_tru),
      })),
    };
    saving.value = true;
    try {
      await payrollService.createRun(payload);
      ElMessage.success('Tạo bảng lương thành công');
      closeCreateDialog();
      loadRuns();
    } catch (err: any) {
      ElMessage.error(err.response?.data?.msg || 'Không thể tạo bảng lương');
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
    ElMessage.error(
      err.response?.data?.msg || 'Không thể tải chi tiết bảng lương',
    );
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
      `Chuyển trạng thái "${run.ky_luong}" sang ${runStatusLabel(
        statusValue,
      )}?`,
      'Xác nhận',
      {type: 'warning'},
    );
    await payrollService.updateRunStatus(run._id, statusValue);
    ElMessage.success('Cập nhật trạng thái thành công');
    loadRuns();
    if (selectedRun.value && selectedRun.value._id === run._id) {
      selectedRun.value.trang_thai = statusValue;
    }
  } catch (err: any) {
    if (err === 'cancel') return;
    ElMessage.error(err.response?.data?.msg || 'Không thể cập nhật trạng thái');
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
    ElMessage.success('Đã cập nhật trạng thái phiếu lương');
  } catch (err: any) {
    entry.trang_thai = prev;
    ElMessage.error(
      err.response?.data?.msg || 'Không thể cập nhật phiếu lương',
    );
  }
};

const handleExport = async () => {
  if (!selectedRun.value) return;
  exporting.value = true;
  try {
    const blob = await payrollService.exportRun(selectedRun.value._id);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    const safeName =
      selectedRun.value.ky_luong?.replace(/[\\/:*?"<>|]/g, '_') ||
      selectedRun.value._id;
    link.href = url;
    link.download = `payroll-${safeName}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể xuất bảng lương');
  } finally {
    exporting.value = false;
  }
};

const handleExportTemplate = async (template: string) => {
  if (!selectedRun.value) return;
  exporting.value = true;
  try {
    const blob = await payrollService.exportTemplate(
      selectedRun.value._id,
      template,
    );
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    const safeName =
      selectedRun.value.ky_luong?.replace(/[\\/:*?"<>|]/g, '_') ||
      selectedRun.value._id;
    link.href = url;
    link.download = `payroll-${template}-${safeName}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    ElMessage.error(err.response?.data?.msg || 'Không thể xuất biểu mẫu');
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadRuns();
  loadEmployees();
});
</script>

<style scoped lang="scss">
.payroll-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  h1 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
  }

  p {
    margin: $spacing-xs 0 0;
    color: $text-secondary;
  }
}

.page-actions {
  display: flex;
  gap: $spacing-sm;
}

.filter-card {
  margin-bottom: $spacing-lg;
}

.table-card {
  .run-title {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-md;
}

.settings-row .el-input-number {
  width: 100%;
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-lg;
}

.auto-fill-bar {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
}

.entry-card {
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  box-shadow: $box-shadow-sm;
  background: $white;
}

.entry-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  .entry-card__index {
    font-weight: $font-weight-medium;
    color: $text-secondary;
  }

  p {
    margin: 4px 0 0;
    color: $text-primary;
  }
}

.entry-card__meta {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
  margin-bottom: $spacing-md;
}

.money-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $spacing-md;
}

.money-section {
  border: 1px solid $border-color;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    font-weight: $font-weight-medium;
  }

  &__empty {
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;

    .el-input {
      flex: 1;
    }

    .el-input-number {
      width: 140px;
    }
  }
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  h2 {
    margin: 0;
  }

  p {
    margin: 4px 0 0;
    color: $text-secondary;
  }
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.employee-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

@media (max-width: 768px) {
  .settings-row .el-input-number {
    width: 100%;
  }

  .money-section__row {
    flex-direction: column;

    .el-input-number {
      width: 100%;
    }
  }
}
</style>

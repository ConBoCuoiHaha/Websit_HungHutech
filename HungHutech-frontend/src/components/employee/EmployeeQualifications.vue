<template>
  <div v-loading="loading" class="orangehrm-qualifications">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Education Tab -->
      <el-tab-pane label="Học vấn" name="education">
        <div class="section-header">
          <h3 class="orangehrm-section-title">Trình độ học vấn</h3>
          <el-button
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAddEducation"
          >
            Thêm học vấn
          </el-button>
        </div>

        <el-table
          v-if="educations.length > 0"
          :data="educations"
          border
          class="orangehrm-table"
          style="margin-top: 20px"
        >
          <el-table-column prop="truong" label="Trường" min-width="200" />
          <el-table-column prop="bang_cap" label="Bằng cấp" min-width="120" />
          <el-table-column
            prop="chuyen_nganh"
            label="Chuyên ngành"
            min-width="150"
          />
          <el-table-column label="Năm" min-width="120">
            <template #default="scope">
              {{ scope.row.nam_bat_dau }} -
              {{ scope.row.nam_ket_thuc || 'Hiện tại' }}
            </template>
          </el-table-column>
          <el-table-column prop="diem_gpa" label="GPA" width="80" />
          <el-table-column label="Thao tác" width="150" align="center">
            <template #default="scope">
              <el-button
                size="small"
                :icon="Edit"
                @click="handleEditEducation(scope.$index)"
              >
                Sửa
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteEducation(scope.$index)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-else
          description="Chưa có thông tin học vấn"
          :image-size="100"
        />
      </el-tab-pane>

      <!-- Skills Tab -->
      <el-tab-pane label="Kỹ năng" name="skills">
        <div class="section-header">
          <h3 class="orangehrm-section-title">Kỹ năng chuyên môn</h3>
          <el-button
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAddSkill"
          >
            Thêm kỹ năng
          </el-button>
        </div>

        <el-table
          v-if="skills.length > 0"
          :data="skills"
          border
          class="orangehrm-table"
          style="margin-top: 20px"
        >
          <el-table-column
            prop="ten_ky_nang"
            label="Tên kỹ năng"
            min-width="200"
          />
          <el-table-column label="Trình độ" width="120">
            <template #default="scope">
              <el-tag :type="getSkillLevelType(scope.row.trinh_do)">{{
                scope.row.trinh_do
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="nam_kinh_nghiem"
            label="Kinh nghiệm"
            width="120"
          >
            <template #default="scope">
              {{ scope.row.nam_kinh_nghiem }} năm
            </template>
          </el-table-column>
          <el-table-column
            prop="ghi_chu"
            label="Ghi chú"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column label="Thao tác" width="150" align="center">
            <template #default="scope">
              <el-button
                size="small"
                :icon="Edit"
                @click="handleEditSkill(scope.$index)"
              >
                Sửa
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteSkill(scope.$index)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-else
          description="Chưa có thông tin kỹ năng"
          :image-size="100"
        />
      </el-tab-pane>

      <!-- Languages Tab -->
      <el-tab-pane label="Ngoại ngữ" name="languages">
        <div class="section-header">
          <h3 class="orangehrm-section-title">Trình độ ngoại ngữ</h3>
          <el-button
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAddLanguage"
          >
            Thêm ngoại ngữ
          </el-button>
        </div>

        <el-table
          v-if="languages.length > 0"
          :data="languages"
          border
          class="orangehrm-table"
          style="margin-top: 20px"
        >
          <el-table-column prop="ngon_ngu" label="Ngôn ngữ" min-width="150" />
          <el-table-column label="Trình độ" width="100">
            <template #default="scope">
              <el-tag type="success">{{ scope.row.trinh_do }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="chung_chi" label="Chứng chỉ" min-width="120" />
          <el-table-column prop="diem_so" label="Điểm số" width="100" />
          <el-table-column
            prop="ghi_chu"
            label="Ghi chú"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column label="Thao tác" width="150" align="center">
            <template #default="scope">
              <el-button
                size="small"
                :icon="Edit"
                @click="handleEditLanguage(scope.$index)"
              >
                Sửa
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteLanguage(scope.$index)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-else
          description="Chưa có thông tin ngoại ngữ"
          :image-size="100"
        />
      </el-tab-pane>

      <!-- Licenses Tab -->
      <el-tab-pane label="Giấy phép" name="licenses">
        <div class="section-header">
          <h3 class="orangehrm-section-title">Giấy phép & Chứng chỉ</h3>
          <el-button
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAddLicense"
          >
            Thêm giấy phép
          </el-button>
        </div>

        <el-table
          v-if="licenses.length > 0"
          :data="licenses"
          border
          class="orangehrm-table"
          style="margin-top: 20px"
        >
          <el-table-column
            prop="loai_giay_phep"
            label="Loại giấy phép"
            min-width="200"
          />
          <el-table-column
            prop="so_giay_phep"
            label="Số giấy phép"
            min-width="150"
          />
          <el-table-column label="Ngày cấp" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.ngay_cap) }}
            </template>
          </el-table-column>
          <el-table-column label="Ngày hết hạn" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.ngay_het_han) }}
            </template>
          </el-table-column>
          <el-table-column prop="noi_cap" label="Nơi cấp" min-width="150" />
          <el-table-column label="Thao tác" width="150" align="center">
            <template #default="scope">
              <el-button
                size="small"
                :icon="Edit"
                @click="handleEditLicense(scope.$index)"
              >
                Sửa
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteLicense(scope.$index)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-else
          description="Chưa có thông tin giấy phép"
          :image-size="100"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Education Dialog -->
    <el-dialog
      v-model="educationDialogVisible"
      :title="editEducationIndex === -1 ? 'Thêm học vấn' : 'Chỉnh sửa học vấn'"
      width="600px"
    >
      <el-form
        ref="educationFormRef"
        :model="educationForm"
        :rules="educationFormRules"
        label-width="140px"
      >
        <el-form-item label="Trường" prop="truong" required>
          <el-input v-model="educationForm.truong" placeholder="Tên trường" />
        </el-form-item>

        <el-form-item label="Bằng cấp" prop="bang_cap" required>
          <el-select
            v-model="educationForm.bang_cap"
            placeholder="Chọn bằng cấp"
            style="width: 100%"
          >
            <el-option label="Trung học" value="Trung học" />
            <el-option label="Cao đẳng" value="Cao đẳng" />
            <el-option label="Đại học" value="Đại học" />
            <el-option label="Thạc sĩ" value="Thạc sĩ" />
            <el-option label="Tiến sĩ" value="Tiến sĩ" />
          </el-select>
        </el-form-item>

        <el-form-item label="Chuyên ngành" prop="chuyen_nganh">
          <el-input
            v-model="educationForm.chuyen_nganh"
            placeholder="Chuyên ngành học"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Năm bắt đầu" prop="nam_bat_dau" required>
              <el-input-number
                v-model="educationForm.nam_bat_dau"
                :min="1950"
                :max="2100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Năm kết thúc" prop="nam_ket_thuc">
              <el-input-number
                v-model="educationForm.nam_ket_thuc"
                :min="1950"
                :max="2100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Điểm GPA" prop="diem_gpa">
          <el-input v-model="educationForm.diem_gpa" placeholder="3.5/4.0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="educationDialogVisible = false">Hủy</el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="handleSaveEducation"
        >
          {{ editEducationIndex === -1 ? 'Thêm' : 'Cập nhật' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Skill Dialog -->
    <el-dialog
      v-model="skillDialogVisible"
      :title="editSkillIndex === -1 ? 'Thêm kỹ năng' : 'Chỉnh sửa kỹ năng'"
      width="600px"
    >
      <el-form
        ref="skillFormRef"
        :model="skillForm"
        :rules="skillFormRules"
        label-width="140px"
      >
        <el-form-item label="Tên kỹ năng" prop="ten_ky_nang" required>
          <el-input
            v-model="skillForm.ten_ky_nang"
            placeholder="Ví dụ: JavaScript, Project Management"
          />
        </el-form-item>

        <el-form-item label="Trình độ" prop="trinh_do" required>
          <el-select
            v-model="skillForm.trinh_do"
            placeholder="Chọn trình độ"
            style="width: 100%"
          >
            <el-option label="Cơ bản" value="Cơ bản" />
            <el-option label="Trung bình" value="Trung bình" />
            <el-option label="Khá" value="Khá" />
            <el-option label="Giỏi" value="Giỏi" />
            <el-option label="Chuyên gia" value="Chuyên gia" />
          </el-select>
        </el-form-item>

        <el-form-item label="Kinh nghiệm" prop="nam_kinh_nghiem">
          <el-input-number
            v-model="skillForm.nam_kinh_nghiem"
            :min="0"
            :max="50"
            style="width: 100%"
          />
          <span style="margin-left: 10px">năm</span>
        </el-form-item>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="skillForm.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú về kỹ năng"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="skillDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveSkill">
          {{ editSkillIndex === -1 ? 'Thêm' : 'Cập nhật' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Language Dialog -->
    <el-dialog
      v-model="languageDialogVisible"
      :title="
        editLanguageIndex === -1 ? 'Thêm ngoại ngữ' : 'Chỉnh sửa ngoại ngữ'
      "
      width="600px"
    >
      <el-form
        ref="languageFormRef"
        :model="languageForm"
        :rules="languageFormRules"
        label-width="140px"
      >
        <el-form-item label="Ngôn ngữ" prop="ngon_ngu" required>
          <el-select
            v-model="languageForm.ngon_ngu"
            placeholder="Chọn ngôn ngữ"
            style="width: 100%"
          >
            <el-option label="Tiếng Anh" value="Tiếng Anh" />
            <el-option label="Tiếng Trung" value="Tiếng Trung" />
            <el-option label="Tiếng Nhật" value="Tiếng Nhật" />
            <el-option label="Tiếng Hàn" value="Tiếng Hàn" />
            <el-option label="Tiếng Pháp" value="Tiếng Pháp" />
            <el-option label="Tiếng Đức" value="Tiếng Đức" />
            <el-option label="Tiếng Nga" value="Tiếng Nga" />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-form-item label="Trình độ" prop="trinh_do" required>
          <el-select
            v-model="languageForm.trinh_do"
            placeholder="Chọn trình độ"
            style="width: 100%"
          >
            <el-option label="A1 - Cơ bản" value="A1" />
            <el-option label="A2 - Sơ cấp" value="A2" />
            <el-option label="B1 - Trung cấp" value="B1" />
            <el-option label="B2 - Trung cấp cao" value="B2" />
            <el-option label="C1 - Cao cấp" value="C1" />
            <el-option label="C2 - Thành thạo" value="C2" />
            <el-option label="Native - Bản ngữ" value="Native" />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Chứng chỉ" prop="chung_chi">
              <el-select
                v-model="languageForm.chung_chi"
                placeholder="Loại chứng chỉ"
                style="width: 100%"
              >
                <el-option label="TOEIC" value="TOEIC" />
                <el-option label="IELTS" value="IELTS" />
                <el-option label="TOEFL" value="TOEFL" />
                <el-option label="TOPIK" value="TOPIK" />
                <el-option label="JLPT" value="JLPT" />
                <el-option label="HSK" value="HSK" />
                <el-option label="DELF/DALF" value="DELF/DALF" />
                <el-option label="Khác" value="Khác" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Điểm số" prop="diem_so">
              <el-input
                v-model="languageForm.diem_so"
                placeholder="850/990, 6.5/9.0"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Ghi chú" prop="ghi_chu">
          <el-input
            v-model="languageForm.ghi_chu"
            type="textarea"
            :rows="3"
            placeholder="Ghi chú về trình độ ngoại ngữ"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="languageDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveLanguage">
          {{ editLanguageIndex === -1 ? 'Thêm' : 'Cập nhật' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- License Dialog -->
    <el-dialog
      v-model="licenseDialogVisible"
      :title="
        editLicenseIndex === -1 ? 'Thêm giấy phép' : 'Chỉnh sửa giấy phép'
      "
      width="600px"
    >
      <el-form
        ref="licenseFormRef"
        :model="licenseForm"
        :rules="licenseFormRules"
        label-width="140px"
      >
        <el-form-item label="Loại giấy phép" prop="loai_giay_phep" required>
          <el-select
            v-model="licenseForm.loai_giay_phep"
            placeholder="Chọn loại giấy phép"
            style="width: 100%"
          >
            <el-option label="Bằng lái xe" value="Bằng lái xe" />
            <el-option
              label="Chứng chỉ hành nghề"
              value="Chứng chỉ hành nghề"
            />
            <el-option
              label="Giấy phép kinh doanh"
              value="Giấy phép kinh doanh"
            />
            <el-option
              label="Chứng chỉ chuyên môn"
              value="Chứng chỉ chuyên môn"
            />
            <el-option label="Khác" value="Khác" />
          </el-select>
        </el-form-item>

        <el-form-item label="Số giấy phép" prop="so_giay_phep" required>
          <el-input
            v-model="licenseForm.so_giay_phep"
            placeholder="Số hiệu giấy phép"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngày cấp" prop="ngay_cap">
              <el-date-picker
                v-model="licenseForm.ngay_cap"
                type="date"
                placeholder="Chọn ngày cấp"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ngày hết hạn" prop="ngay_het_han">
              <el-date-picker
                v-model="licenseForm.ngay_het_han"
                type="date"
                placeholder="Chọn ngày hết hạn"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Nơi cấp" prop="noi_cap">
          <el-input
            v-model="licenseForm.noi_cap"
            placeholder="Cơ quan cấp giấy phép"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="licenseDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveLicense">
          {{ editLicenseIndex === -1 ? 'Thêm' : 'Cập nhật' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, watch} from 'vue';
import {Plus, Edit, Delete} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox, FormInstance, FormRules} from 'element-plus';
import nhanVienService from '@/services/nhanVienService';
import {NhanVien} from '@/types';
import dayjs from 'dayjs';

const props = defineProps<{
  employee: NhanVien | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const activeTab = ref('education');
const saving = ref(false);

// Education
const educationDialogVisible = ref(false);
const educationFormRef = ref<FormInstance>();
const editEducationIndex = ref(-1);
const educations = ref<any[]>([]);

const educationForm = reactive({
  truong: '',
  bang_cap: '',
  chuyen_nganh: '',
  nam_bat_dau: new Date().getFullYear(),
  nam_ket_thuc: null as number | null,
  diem_gpa: '',
});

const educationFormRules: FormRules = {
  truong: [
    {required: true, message: 'Vui lòng nhập tên trường', trigger: 'blur'},
  ],
  bang_cap: [
    {required: true, message: 'Vui lòng chọn bằng cấp', trigger: 'change'},
  ],
  nam_bat_dau: [
    {required: true, message: 'Vui lòng nhập năm bắt đầu', trigger: 'blur'},
  ],
};

// Skills
const skillDialogVisible = ref(false);
const skillFormRef = ref<FormInstance>();
const editSkillIndex = ref(-1);
const skills = ref<any[]>([]);

const skillForm = reactive({
  ten_ky_nang: '',
  trinh_do: '',
  nam_kinh_nghiem: 0,
  ghi_chu: '',
});

const skillFormRules: FormRules = {
  ten_ky_nang: [
    {required: true, message: 'Vui lòng nhập tên kỹ năng', trigger: 'blur'},
  ],
  trinh_do: [
    {required: true, message: 'Vui lòng chọn trình độ', trigger: 'change'},
  ],
};

// Languages
const languageDialogVisible = ref(false);
const languageFormRef = ref<FormInstance>();
const editLanguageIndex = ref(-1);
const languages = ref<any[]>([]);

const languageForm = reactive({
  ngon_ngu: '',
  trinh_do: '',
  chung_chi: '',
  diem_so: '',
  ghi_chu: '',
});

const languageFormRules: FormRules = {
  ngon_ngu: [
    {required: true, message: 'Vui lòng chọn ngôn ngữ', trigger: 'change'},
  ],
  trinh_do: [
    {required: true, message: 'Vui lòng chọn trình độ', trigger: 'change'},
  ],
};

// Licenses
const licenseDialogVisible = ref(false);
const licenseFormRef = ref<FormInstance>();
const editLicenseIndex = ref(-1);
const licenses = ref<any[]>([]);

const licenseForm = reactive({
  loai_giay_phep: '',
  so_giay_phep: '',
  ngay_cap: '',
  ngay_het_han: '',
  noi_cap: '',
});

const licenseFormRules: FormRules = {
  loai_giay_phep: [
    {
      required: true,
      message: 'Vui lòng chọn loại giấy phép',
      trigger: 'change',
    },
  ],
  so_giay_phep: [
    {required: true, message: 'Vui lòng nhập số giấy phép', trigger: 'blur'},
  ],
};

watch(
  () => props.employee,
  (newEmployee) => {
    if (newEmployee) {
      educations.value = [...(newEmployee.hoc_van || [])];
      skills.value = [...(newEmployee.ky_nang || [])];
      languages.value = [...(newEmployee.ngoai_ngu || [])];
      licenses.value = [...(newEmployee.giay_phep || [])];
    } else {
      educations.value = [];
      skills.value = [];
      languages.value = [];
      licenses.value = [];
    }
  },
  {immediate: true, deep: true},
);

// Education handlers
const handleAddEducation = () => {
  editEducationIndex.value = -1;
  educationForm.truong = '';
  educationForm.bang_cap = '';
  educationForm.chuyen_nganh = '';
  educationForm.nam_bat_dau = new Date().getFullYear();
  educationForm.nam_ket_thuc = null;
  educationForm.diem_gpa = '';
  educationDialogVisible.value = true;
};

const handleEditEducation = (index: number) => {
  editEducationIndex.value = index;
  const edu = educations.value[index];
  educationForm.truong = edu.truong || '';
  educationForm.bang_cap = edu.bang_cap || '';
  educationForm.chuyen_nganh = edu.chuyen_nganh || '';
  educationForm.nam_bat_dau = edu.nam_bat_dau || new Date().getFullYear();
  educationForm.nam_ket_thuc = edu.nam_ket_thuc || null;
  educationForm.diem_gpa = edu.diem_gpa || '';
  educationDialogVisible.value = true;
};

const handleDeleteEducation = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin học vấn này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedEducations = [...educations.value];
    updatedEducations.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      hoc_van: updatedEducations,
    });
    ElMessage.success('Xóa thông tin học vấn thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa thông tin học vấn',
      );
    }
  } finally {
    saving.value = false;
  }
};

const handleSaveEducation = async () => {
  if (!educationFormRef.value) return;
  if (!props.employee) return;

  try {
    const valid = await educationFormRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const updatedEducations = [...educations.value];

    if (editEducationIndex.value === -1) {
      updatedEducations.push({...educationForm});
    } else {
      updatedEducations[editEducationIndex.value] = {...educationForm};
    }

    await nhanVienService.update(props.employee._id, {
      hoc_van: updatedEducations,
    });

    ElMessage.success(
      editEducationIndex.value === -1
        ? 'Thêm thông tin học vấn thành công'
        : 'Cập nhật thông tin học vấn thành công',
    );
    educationDialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu thông tin học vấn',
    );
  } finally {
    saving.value = false;
  }
};

// Skill handlers
const handleAddSkill = () => {
  editSkillIndex.value = -1;
  skillForm.ten_ky_nang = '';
  skillForm.trinh_do = '';
  skillForm.nam_kinh_nghiem = 0;
  skillForm.ghi_chu = '';
  skillDialogVisible.value = true;
};

const handleEditSkill = (index: number) => {
  editSkillIndex.value = index;
  const skill = skills.value[index];
  skillForm.ten_ky_nang = skill.ten_ky_nang || '';
  skillForm.trinh_do = skill.trinh_do || '';
  skillForm.nam_kinh_nghiem = skill.nam_kinh_nghiem || 0;
  skillForm.ghi_chu = skill.ghi_chu || '';
  skillDialogVisible.value = true;
};

const handleDeleteSkill = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin kỹ năng này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedSkills = [...skills.value];
    updatedSkills.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      ky_nang: updatedSkills,
    });
    ElMessage.success('Xóa thông tin kỹ năng thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa thông tin kỹ năng',
      );
    }
  } finally {
    saving.value = false;
  }
};

const handleSaveSkill = async () => {
  if (!skillFormRef.value) return;
  if (!props.employee) return;

  try {
    const valid = await skillFormRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const updatedSkills = [...skills.value];

    if (editSkillIndex.value === -1) {
      updatedSkills.push({...skillForm});
    } else {
      updatedSkills[editSkillIndex.value] = {...skillForm};
    }

    await nhanVienService.update(props.employee._id, {
      ky_nang: updatedSkills,
    });

    ElMessage.success(
      editSkillIndex.value === -1
        ? 'Thêm thông tin kỹ năng thành công'
        : 'Cập nhật thông tin kỹ năng thành công',
    );
    skillDialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu thông tin kỹ năng',
    );
  } finally {
    saving.value = false;
  }
};

// Language handlers
const handleAddLanguage = () => {
  editLanguageIndex.value = -1;
  languageForm.ngon_ngu = '';
  languageForm.trinh_do = '';
  languageForm.chung_chi = '';
  languageForm.diem_so = '';
  languageForm.ghi_chu = '';
  languageDialogVisible.value = true;
};

const handleEditLanguage = (index: number) => {
  editLanguageIndex.value = index;
  const lang = languages.value[index];
  languageForm.ngon_ngu = lang.ngon_ngu || '';
  languageForm.trinh_do = lang.trinh_do || '';
  languageForm.chung_chi = lang.chung_chi || '';
  languageForm.diem_so = lang.diem_so || '';
  languageForm.ghi_chu = lang.ghi_chu || '';
  languageDialogVisible.value = true;
};

const handleDeleteLanguage = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin ngoại ngữ này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedLanguages = [...languages.value];
    updatedLanguages.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      ngoai_ngu: updatedLanguages,
    });
    ElMessage.success('Xóa thông tin ngoại ngữ thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa thông tin ngoại ngữ',
      );
    }
  } finally {
    saving.value = false;
  }
};

const handleSaveLanguage = async () => {
  if (!languageFormRef.value) return;
  if (!props.employee) return;

  try {
    const valid = await languageFormRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const updatedLanguages = [...languages.value];

    if (editLanguageIndex.value === -1) {
      updatedLanguages.push({...languageForm});
    } else {
      updatedLanguages[editLanguageIndex.value] = {...languageForm};
    }

    await nhanVienService.update(props.employee._id, {
      ngoai_ngu: updatedLanguages,
    });

    ElMessage.success(
      editLanguageIndex.value === -1
        ? 'Thêm thông tin ngoại ngữ thành công'
        : 'Cập nhật thông tin ngoại ngữ thành công',
    );
    languageDialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu thông tin ngoại ngữ',
    );
  } finally {
    saving.value = false;
  }
};

// License handlers
const handleAddLicense = () => {
  editLicenseIndex.value = -1;
  licenseForm.loai_giay_phep = '';
  licenseForm.so_giay_phep = '';
  licenseForm.ngay_cap = '';
  licenseForm.ngay_het_han = '';
  licenseForm.noi_cap = '';
  licenseDialogVisible.value = true;
};

const handleEditLicense = (index: number) => {
  editLicenseIndex.value = index;
  const license = licenses.value[index];
  licenseForm.loai_giay_phep = license.loai_giay_phep || '';
  licenseForm.so_giay_phep = license.so_giay_phep || '';
  licenseForm.ngay_cap = license.ngay_cap || '';
  licenseForm.ngay_het_han = license.ngay_het_han || '';
  licenseForm.noi_cap = license.noi_cap || '';
  licenseDialogVisible.value = true;
};

const handleDeleteLicense = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa thông tin giấy phép này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      },
    );

    const updatedLicenses = [...licenses.value];
    updatedLicenses.splice(index, 1);

    saving.value = true;
    await nhanVienService.update(props.employee!._id, {
      giay_phep: updatedLicenses,
    });
    ElMessage.success('Xóa thông tin giấy phép thành công');
    emit('reload');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(
        err.response?.data?.msg || 'Không thể xóa thông tin giấy phép',
      );
    }
  } finally {
    saving.value = false;
  }
};

const handleSaveLicense = async () => {
  if (!licenseFormRef.value) return;
  if (!props.employee) return;

  try {
    const valid = await licenseFormRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const updatedLicenses = [...licenses.value];

    if (editLicenseIndex.value === -1) {
      updatedLicenses.push({...licenseForm});
    } else {
      updatedLicenses[editLicenseIndex.value] = {...licenseForm};
    }

    await nhanVienService.update(props.employee._id, {
      giay_phep: updatedLicenses,
    });

    ElMessage.success(
      editLicenseIndex.value === -1
        ? 'Thêm thông tin giấy phép thành công'
        : 'Cập nhật thông tin giấy phép thành công',
    );
    licenseDialogVisible.value = false;
    emit('reload');
  } catch (err: any) {
    ElMessage.error(
      err.response?.data?.msg || 'Không thể lưu thông tin giấy phép',
    );
  } finally {
    saving.value = false;
  }
};

// Utility functions
const getSkillLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    'Cơ bản': 'info',
    'Trung bình': '',
    Khá: 'success',
    Giỏi: 'warning',
    'Chuyên gia': 'danger',
  };
  return typeMap[level] || '';
};

const formatDate = (date: any) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};
</script>

<style lang="scss" scoped>
@import './employee-form-styles.scss';
@import '@/assets/styles/_variables.scss';

.orangehrm-qualifications {
  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;
  }

  :deep(.el-tabs__header) {
    background-color: $background;
    border-bottom: 2px solid $border-color;
  }

  :deep(.el-tabs__item) {
    font-weight: $font-weight-medium;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.orangehrm-section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
}

.orangehrm-table {
  margin-top: 20px;
}
</style>

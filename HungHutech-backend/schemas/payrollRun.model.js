const mongoose = require('mongoose');

const { Schema } = mongoose;

const MoneyDetailSchema = new Schema({
  ten: { type: String, required: true },
  so_tien: { type: Number, default: 0 },
  ghi_chu: String,
  reference_type: { type: String },
  reference_id: { type: Schema.Types.ObjectId },
}, { _id: false });

const TaxBreakdownSchema = new Schema({
  bac: Number,
  muc_chiu_thue: Number,
  thue_suat: Number,
  tien_thue: Number,
}, { _id: false });

const PayrollEntrySchema = new Schema({
  nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
  ma_nhan_vien: String,
  ho_ten: String,
  luong_co_ban: { type: Number, required: true },
  phu_cap: { type: [MoneyDetailSchema], default: [] },
  thuong: { type: [MoneyDetailSchema], default: [] },
  ot: { type: [MoneyDetailSchema], default: [] },
  khoan_khau_tru: { type: [MoneyDetailSchema], default: [] },
  tong_phu_cap: { type: Number, default: 0 },
  tong_thuong: { type: Number, default: 0 },
  tong_ot: { type: Number, default: 0 },
  tong_khau_tru_khac: { type: Number, default: 0 },
  tong_thu_nhap: { type: Number, default: 0 },
  bhxh: { type: Number, default: 0 },
  bhyt: { type: Number, default: 0 },
  bhtn: { type: Number, default: 0 },
  kpcd: { type: Number, default: 0 },
  tong_khau_tru_bat_buoc: { type: Number, default: 0 },
  giam_tru_ban_than: { type: Number, default: 11000000 },
  giam_tru_phu_thuoc: { type: Number, default: 0 },
  so_nguoi_phu_thuoc: { type: Number, default: 0 },
  thu_nhap_tinh_thue: { type: Number, default: 0 },
  thue_tncn: { type: Number, default: 0 },
  chi_tiet_thue: { type: [TaxBreakdownSchema], default: [] },
  tong_khau_tru: { type: Number, default: 0 },
  luong_thuc_nhan: { type: Number, default: 0 },
  trang_thai: {
    type: String,
    enum: ['Cho_duyet', 'Da_duyet', 'Da_chi'],
    default: 'Cho_duyet',
  },
  ghi_chu: String,

  // Trang thai xac nhan cua nhan vien
  trang_thai_xac_nhan: {
    type: String,
    enum: ['Chua_gui', 'Cho_xac_nhan', 'Da_xac_nhan', 'Tu_choi'],
    default: 'Chua_gui',
  },

  // Thong tin gui xac nhan
  gui_xac_nhan: {
    ngay_gui: Date,
    nguoi_gui_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    nguoi_gui_ten: String,
    deadline: Date, // Deadline = ngay_gui + 3 ngay
  },

  // Thong tin xac nhan
  xac_nhan: {
    da_xac_nhan: { type: Boolean, default: false },
    ngay_xac_nhan: Date,
    biometric_signature: String, // Hash cua van tay
    device_info: String, // Thong tin thiet bi xac nhan
    ip_address: String,
  },

  // Thong tin tu choi
  tu_choi: {
    ly_do: String,
    ngay_tu_choi: Date,
    ghi_chu: String,
    da_xu_ly: { type: Boolean, default: false }, // HR da xu ly chua
    nguoi_xu_ly_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    ngay_xu_ly: Date,
    ket_qua_xu_ly: String,
  },

  // Lich su xac nhan
  lich_su_xac_nhan: {
    type: [{
      hanh_dong: {
        type: String,
        enum: ['gui_xac_nhan', 'xac_nhan', 'tu_choi', 'gui_lai', 'xu_ly_tu_choi'],
      },
      ngay: { type: Date, default: Date.now },
      nguoi_thuc_hien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
      nguoi_thuc_hien_ten: String,
      ghi_chu: String,
    }],
    default: [],
  },
}, { _id: true });

const PayrollRunSchema = new Schema({
  ky_luong: { type: String, required: true },
  loai_ky: {
    type: String,
    enum: ['Thang', 'Tuan', 'Tuy_chinh'],
    default: 'Thang',
  },
  ngay_bat_dau: { type: Date, required: true },
  ngay_ket_thuc: { type: Date, required: true },
  trang_thai: {
    type: String,
    enum: ['Draft', 'Cho_duyet', 'Da_duyet', 'Da_chi'],
    default: 'Draft',
  },
  currency: { type: String, default: 'VND' },
  settings: {
    ti_le_bhxh: { type: Number, default: 0.08 },
    ti_le_bhyt: { type: Number, default: 0.015 },
    ti_le_bhtn: { type: Number, default: 0.01 },
    ti_le_kpcd: { type: Number, default: 0.01 },
    ap_dung_kpcd: { type: Boolean, default: true },
    giam_tru_ban_than: { type: Number, default: 11000000 },
    giam_tru_phu_thuoc: { type: Number, default: 4400000 },
  },
  entries: { type: [PayrollEntrySchema], default: [] },
  tong_so_nhan_vien: { type: Number, default: 0 },
  tong_thu_nhap: { type: Number, default: 0 },
  tong_khau_tru: { type: Number, default: 0 },
  tong_thue_tncn: { type: Number, default: 0 },
  tong_net: { type: Number, default: 0 },
  nguoi_tao_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
  ghi_chu: String,
  approved_at: { type: Date },
  approved_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
  locked_at: { type: Date },
  locked_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
  audit_log: {
    type: [
      {
        action: String,
        trang_thai: String,
        user_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
        user_name: String,
        ghi_chu: String,
        at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
});

PayrollRunSchema.index({ ky_luong: 1, loai_ky: 1 }, { unique: false });

const PayrollRun = mongoose.model('PayrollRun', PayrollRunSchema, 'payroll_runs');

module.exports = PayrollRun;

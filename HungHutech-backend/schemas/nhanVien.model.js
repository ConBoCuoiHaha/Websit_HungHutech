const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema cho các đối tượng con được nhúng
const LuongSchema = new Schema({
  ten_luong: String, // Ví dụ: 'Lương cơ bản', 'Phụ cấp ăn trưa'
  so_tien: Schema.Types.Decimal128,
  don_vi_tien_te: String, // 'VND', 'USD'
  ky_tra_luong: String, // 'Hàng tháng', 'Hàng quý'
  ghi_chu: String,
}, { _id: false });

const NguoiPhuThuocSchema = new Schema({
  ten: String,
  moi_quan_he: String,
  ngay_sinh: Date,
}, { _id: false });

const KinhNghiemLamViecSchema = new Schema({
  cong_ty: String,
  chuc_danh: String,
  ngay_bat_dau: Date,
  ngay_ket_thuc: Date,
  mo_ta: String,
}, { _id: false });

const HocVanSchema = new Schema({
  truong: String,
  bang_cap: String, // 'Trung học', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'
  chuyen_nganh: String,
  nam_bat_dau: Number,
  nam_ket_thuc: Number,
  diem_gpa: String,
}, { _id: false });

const KyNangSchema = new Schema({
  ten_ky_nang: String,
  trinh_do: String, // 'Cơ bản', 'Trung bình', 'Khá', 'Giỏi', 'Chuyên gia'
  nam_kinh_nghiem: Number,
  ghi_chu: String,
}, { _id: false });

const NgoaiNguSchema = new Schema({
  ngon_ngu: String, // 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'
  trinh_do: String, // 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'
  chung_chi: String, // 'TOEIC', 'IELTS', 'TOPIK', 'JLPT', 'HSK'
  diem_so: String,
  ghi_chu: String,
}, { _id: false });

const BaoHiemSchema = new Schema({
  so_bhxh: String,
  so_bhyt: String,
  muc_luong_bhxh: Schema.Types.Decimal128,
  muc_luong_bhyt: Schema.Types.Decimal128,
  ti_le_bhxh_nv: Number,
  ti_le_bhxh_dn: Number,
  ti_le_bhyt_nv: Number,
  ti_le_bhyt_dn: Number,
  ti_le_bhtn_nv: Number,
  ti_le_bhtn_dn: Number,
}, { _id: false });

const GiayPhepSchema = new Schema({
  loai_giay_phep: String, // 'Bằng lái xe', 'Chứng chỉ hành nghề', 'Giấy phép kinh doanh'
  so_giay_phep: String,
  ngay_cap: Date,
  ngay_het_han: Date,
  noi_cap: String,
}, { _id: false });

const LienHeKhanCapSchema = new Schema({
  ten: String,
  moi_quan_he: String, // 'Cha', 'Mẹ', 'Vợ/Chồng', 'Con', 'Anh/Chị/Em', 'Bạn', 'Khác'
  dien_thoai_nha: String,
  di_dong: String,
  dien_thoai_cong_viec: String,
}, { _id: false });

const XuatNhapCanh = new Schema({
  loai_giay_to: String, // 'Hộ chiếu', 'Visa', 'Thẻ xanh', 'Giấy phép lao động'
  so_giay_to: String,
  ngay_cap: Date,
  ngay_het_han: Date,
  quoc_gia_cap: String,
  trang_thai: String, // 'Còn hiệu lực', 'Hết hạn', 'Đang xử lý'
  ghi_chu: String,
}, { _id: false });

const ThanhVienToChucSchema = new Schema({
  to_chuc: String, // Tên tổ chức/hội
  loai_thanh_vien: String, // 'Thành viên', 'Hội viên', 'Cộng tác viên'
  ma_thanh_vien: String,
  ngay_bat_dau: Date,
  ngay_ket_thuc: Date,
  phi_thanh_vien: Schema.Types.Decimal128,
  don_vi_tien_te: String,
}, { _id: false });

const TaiLieuDinhKemSchema = new Schema({
  ten_tai_lieu: String,
  loai_tai_lieu: String, // 'CV', 'Bằng cấp', 'Chứng chỉ', 'Hợp đồng', 'Giấy tờ', 'Khác'
  duong_dan: String, // URL hoặc path
  ten_file: String,
  kich_thuoc: Number, // bytes
  dinh_dang: String, // pdf, doc, jpg, etc.
  ngay_tai_len: Date,
  mo_ta: String,
}, { _id: false });




// Schema chính cho Nhân Viên
const NhanVienSchema = new Schema({
  ma_nhan_vien: { type: String, required: true, unique: true },
  ho_dem: { type: String, required: true },
  ten: { type: String, required: true },
  biet_danh: String,
  avatar_url: String, // URL to employee avatar/photo
  ngay_sinh: Date,
  gioi_tinh: String, // 'Nam', 'Nữ', 'Khác'
  tinh_trang_hon_nhan: String, // 'Độc thân', 'Đã kết hôn', 'Khác'
  quoc_tich: String, // Nationality

  thong_tin_ca_nhan: {
    cmnd_cccd: String,
    // Bo sung cac truong de luu thong tin giay to
    ngay_cap_cmnd: Date,
    noi_cap_cmnd: String,
    so_ho_chieu: String,
    so_giay_phep_lai_xe: String,
    ngay_het_han_gplx: Date,
    nghia_vu_quan_su: String,
  },

  dia_chi: {
    duong_so_1: String,
    duong_so_2: String,
    thanh_pho: String,
    tinh_thanh: String,
    ma_buu_dien: String,
    quoc_gia: String,
  },

  lien_he: {
    dien_thoai_nha: String,
    di_dong: String,
    email_cong_viec: { type: String, unique: true, sparse: true },
    email_khac: { type: String, unique: true, sparse: true },
  },

  bao_hiem: BaoHiemSchema,

  thong_tin_cong_viec: {
    ngay_vao_lam: Date,
    chuc_danh_id: { type: Schema.Types.ObjectId, ref: 'ChucDanh' },
    trang_thai_lao_dong_id: { type: Schema.Types.ObjectId, ref: 'TrangThaiLaoDong' },
    phong_ban_id: { type: Schema.Types.ObjectId, ref: 'PhongBan' },
    ca_lam_viec_id: { type: Schema.Types.ObjectId, ref: 'CaLamViec' },
    dia_diem_lam_viec_ids: [{ type: Schema.Types.ObjectId, ref: 'DiaDiem' }],
    quan_ly_truc_tiep_ids: [{ type: Schema.Types.ObjectId, ref: 'NhanVien' }],
  },

  luong: [LuongSchema],
  nguoi_phu_thuoc: [NguoiPhuThuocSchema],
  kinh_nghiem_lam_viec: [KinhNghiemLamViecSchema],

  // Qualifications
  hoc_van: [HocVanSchema],
  ky_nang: [KyNangSchema],
  ngoai_ngu: [NgoaiNguSchema],
  giay_phep: [GiayPhepSchema],

  // Additional Information
  lien_he_khan_cap: [LienHeKhanCapSchema],
  xuat_nhap_canh: [XuatNhapCanh],
  thanh_vien_to_chuc: [ThanhVienToChucSchema],
  tai_lieu_dinh_kem: [TaiLieuDinhKemSchema],

  custom_fields: Schema.Types.Mixed, // Cho các trường tùy chỉnh

  da_xoa: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } // Tự động thêm ngày tạo và ngày cập nhật
});

const NhanVien = mongoose.model('NhanVien', NhanVienSchema, 'nhan_vien');

module.exports = NhanVien;

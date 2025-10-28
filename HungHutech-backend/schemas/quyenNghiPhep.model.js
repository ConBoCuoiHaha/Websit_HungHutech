const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuyenNghiPhepSchema = new Schema({
  nhan_vien_id: {
    type: Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true,
  },
  loai_ngay_nghi_id: {
    type: Schema.Types.ObjectId,
    ref: 'LoaiNgayNghi',
    required: true,
  },
  so_ngay_duoc_huong: {
    type: Number,
    required: true,
  },
  so_ngay_da_su_dung: {
    type: Number,
    default: 0,
  },
  nam: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear(),
  },
  ghi_chu: {
    type: String,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

// Đảm bảo mỗi nhân viên chỉ có 1 quyền cho 1 loại nghỉ phép trong 1 năm
QuyenNghiPhepSchema.index({ nhan_vien_id: 1, loai_ngay_nghi_id: 1, nam: 1 }, { unique: true });

const QuyenNghiPhep = mongoose.model('QuyenNghiPhep', QuyenNghiPhepSchema, 'quyen_nghi_phep');

module.exports = QuyenNghiPhep;

const mongoose = require('mongoose');
const { Schema } = mongoose;

const YeuCauNghiPhepSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    loai_ngay_nghi_id: { type: Schema.Types.ObjectId, ref: 'LoaiNgayNghi', required: true },
    ngay_bat_dau: { type: Date, required: true },
    ngay_ket_thuc: { type: Date, required: true },
    so_ngay: { type: Number, required: true },
    ly_do: { type: String },
    trang_thai: {
      type: String,
      enum: ['Cho duyet', 'Da duyet', 'Bi tu choi', 'Da huy'],
      default: 'Cho duyet',
    },
    nguoi_duyet_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    ghi_chu_quan_ly: { type: String },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const YeuCauNghiPhep = mongoose.model(
  'YeuCauNghiPhep',
  YeuCauNghiPhepSchema,
  'yeu_cau_nghi_phep'
);

module.exports = YeuCauNghiPhep;


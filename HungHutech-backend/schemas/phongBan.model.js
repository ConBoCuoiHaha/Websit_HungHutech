const mongoose = require('mongoose');
const { Schema } = mongoose;

const PhongBanSchema = new Schema({
  ten: {
    type: String,
    required: true,
    unique: true,
  },
  mo_ta: {
    type: String,
  },
  quan_ly_id: {
    type: Schema.Types.ObjectId,
    ref: 'NhanVien',
    default: null
  },
  // Thêm trường này nếu bạn muốn xây dựng cấu trúc phòng ban cha-con
  phong_ban_cha_id: {
    type: Schema.Types.ObjectId,
    ref: 'PhongBan',
    default: null
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const PhongBan = mongoose.model('PhongBan', PhongBanSchema, 'phong_ban');

module.exports = PhongBan;

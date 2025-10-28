const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChucDanhSchema = new Schema({
  ten_chuc_danh: {
    type: String,
    required: true,
    unique: true,
  },
  mo_ta: {
    type: String,
  },
  ghi_chu: {
    type: String,
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const ChucDanh = mongoose.model('ChucDanh', ChucDanhSchema, 'chuc_danh');

module.exports = ChucDanh;

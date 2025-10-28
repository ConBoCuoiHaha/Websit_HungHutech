const mongoose = require('mongoose');
const { Schema } = mongoose;

const LoaiNgayNghiSchema = new Schema({
  ten: {
    type: String,
    required: true,
    unique: true,
  },
  mo_ta: {
    type: String,
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const LoaiNgayNghi = mongoose.model('LoaiNgayNghi', LoaiNgayNghiSchema, 'loai_ngay_nghi');

module.exports = LoaiNgayNghi;

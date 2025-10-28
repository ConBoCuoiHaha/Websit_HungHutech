const mongoose = require('mongoose');
const { Schema } = mongoose;

const TrangThaiLaoDongSchema = new Schema({
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

const TrangThaiLaoDong = mongoose.model('TrangThaiLaoDong', TrangThaiLaoDongSchema, 'trang_thai_lao_dong');

module.exports = TrangThaiLaoDong;

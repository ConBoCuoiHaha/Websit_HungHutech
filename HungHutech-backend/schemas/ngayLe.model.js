const mongoose = require('mongoose');
const { Schema } = mongoose;

const NgayLeSchema = new Schema({
  ten_ngay_le: {
    type: String,
    required: true,
  },
  ngay: {
    type: Date,
    required: true,
  },
  lap_lai_hang_nam: {
    type: Boolean,
    default: false, // Nếu true, ngày lễ này sẽ lặp lại hàng năm
  },
  mo_ta: String,
  khu_vuc: String, // 'Toàn quốc', 'Miền Bắc', 'Miền Nam', etc.
  trang_thai: {
    type: String,
    enum: ['Kích hoạt', 'Không kích hoạt'],
    default: 'Kích hoạt',
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const NgayLe = mongoose.model('NgayLe', NgayLeSchema, 'ngay_le');

module.exports = NgayLe;

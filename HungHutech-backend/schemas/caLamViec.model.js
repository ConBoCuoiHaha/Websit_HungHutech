const mongoose = require('mongoose');
const { Schema } = mongoose;

const CaLamViecSchema = new Schema({
  ten_ca: {
    type: String,
    required: true,
    trim: true,
  },
  gio_bat_dau: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  gio_ket_thuc: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  thoi_gian_nghi: {
    type: Number,
    default: 0,
    min: 0,
  },
  mo_ta: {
    type: String,
    trim: true,
  },
  trang_thai: {
    type: String,
    enum: ['Kích hoạt', 'Không kích hoạt'],
    default: 'Kích hoạt',
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

// Validate end time is after start time
CaLamViecSchema.pre('save', function(next) {
  const [startHour, startMin] = this.gio_bat_dau.split(':').map(Number);
  const [endHour, endMin] = this.gio_ket_thuc.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    next(new Error('Giờ kết thúc phải sau giờ bắt đầu'));
  } else {
    next();
  }
});

const CaLamViec = mongoose.model('CaLamViec', CaLamViecSchema, 'ca_lam_viec');

module.exports = CaLamViec;

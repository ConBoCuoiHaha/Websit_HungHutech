const mongoose = require('mongoose');
const { Schema } = mongoose;

const DiaDiemSchema = new Schema({
  ten: {
    type: String,
    required: true,
  },
  quoc_gia: {
    type: String,
  },
  tinh_thanh: {
    type: String,
  },
  thanh_pho: {
    type: String,
  },
  dia_chi: {
    type: String,
  },
  ma_buu_dien: {
    type: String,
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const DiaDiem = mongoose.model('DiaDiem', DiaDiemSchema, 'dia_diem');

module.exports = DiaDiem;

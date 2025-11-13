const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChamCongSchema = new Schema({
  nhan_vien_id: {
    type: Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true,
  },
  ca_lam_viec_id: {
    type: Schema.Types.ObjectId,
    ref: 'CaLamViec',
  },
  thoi_gian_vao: {
    type: Date,
    required: true,
  },
  thoi_gian_ra: {
    type: Date,
  },
  ngay: {
    type: Date,
    required: true,
  },
  ghi_chu: {
    type: String,
  },
  shift_snapshot: {
    ten_ca: String,
    gio_bat_dau: String,
    gio_ket_thuc: String,
  },
  flags: {
    isLate: Boolean,
    lateOver30: Boolean,
    lateMinutes: Number,
    shiftStart: Date,
    earliestCheckIn: Date,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

// Đảm bảo một nhân viên chỉ có một bản ghi chấm công mỗi ngày
ChamCongSchema.index({ nhan_vien_id: 1, ngay: 1 }, { unique: true });

const ChamCong = mongoose.model('ChamCong', ChamCongSchema, 'cham_cong');

module.exports = ChamCong;

const mongoose = require('mongoose');

const {Schema} = mongoose;

function normalizeDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const ShiftAssignmentSchema = new Schema(
  {
    nhan_vien_id: {type: Schema.Types.ObjectId, ref: 'NhanVien', required: true},
    ngay: {type: Date, required: true},
    ca_lam_viec_id: {type: Schema.Types.ObjectId, ref: 'CaLamViec', required: true},
    shift_snapshot: {
      ten_ca: String,
      gio_bat_dau: String,
      gio_ket_thuc: String,
      thoi_gian_nghi: Number,
    },
    nguoi_phan_cong_id: {type: Schema.Types.ObjectId, ref: 'NhanVien'},
    ghi_chu: {type: String, default: ''},
  },
  {
    timestamps: {createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat'},
  },
);

ShiftAssignmentSchema.pre('validate', function normalize() {
  if (this.ngay) {
    this.ngay = normalizeDay(this.ngay);
  }
  if (!this.shift_snapshot && this.populated?.('ca_lam_viec_id')) {
    const shift = this.populated('ca_lam_viec_id');
    this.shift_snapshot = {
      ten_ca: shift.ten_ca,
      gio_bat_dau: shift.gio_bat_dau,
      gio_ket_thuc: shift.gio_ket_thuc,
      thoi_gian_nghi: shift.thoi_gian_nghi,
    };
  }
});

ShiftAssignmentSchema.index({nhan_vien_id: 1, ngay: 1}, {unique: true});

module.exports = mongoose.model(
  'ShiftAssignment',
  ShiftAssignmentSchema,
  'shift_assignments',
);

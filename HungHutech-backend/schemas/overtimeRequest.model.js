const mongoose = require('mongoose');
const {Schema} = mongoose;

const AuditLogSchema = new Schema(
  {
    action: String,
    trang_thai: String,
    user_id: {type: Schema.Types.ObjectId, ref: 'NhanVien'},
    user_name: String,
    ghi_chu: String,
    at: {type: Date, default: Date.now},
  },
  {_id: false},
);

const OvertimeRequestSchema = new Schema(
  {
    nhan_vien_id: {type: Schema.Types.ObjectId, ref: 'NhanVien', required: true},
    ngay: {type: Date, required: true},
    thoi_gian_bat_dau: {type: Date, required: true},
    thoi_gian_ket_thuc: {type: Date, required: true},
    so_gio: {type: Number, required: true, min: 0},
    loai_ngay: {
      type: String,
      enum: [
        'weekday',
        'weekend',
        'holiday',
        'weekday_night',
        'weekend_night',
        'holiday_night',
      ],
      default: 'weekday',
    },
    he_so: {type: Number, default: 1.5},
    trang_thai: {
      type: String,
      enum: ['Cho duyet', 'Da duyet', 'Bi tu choi', 'Da huy'],
      default: 'Cho duyet',
    },
    ly_do: String,
    ghi_chu_quan_ly: String,
    nguoi_duyet_id: {type: Schema.Types.ObjectId, ref: 'NhanVien'},
    audit_log: {type: [AuditLogSchema], default: []},
    auto_created: {type: Boolean, default: false},
  },
  {timestamps: {createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat'}},
);

OvertimeRequestSchema.index({nhan_vien_id: 1, ngay: 1});
OvertimeRequestSchema.index({ngay: 1, trang_thai: 1});

module.exports = mongoose.model('OvertimeRequest', OvertimeRequestSchema, 'overtime_requests');

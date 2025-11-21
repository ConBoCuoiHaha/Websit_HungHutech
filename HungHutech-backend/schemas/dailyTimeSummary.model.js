const mongoose = require('mongoose');

const {Schema} = mongoose;

function normalizeDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DailyTimeSummarySchema = new Schema(
  {
    nhan_vien_id: {type: Schema.Types.ObjectId, ref: 'NhanVien', required: true},
    ngay: {type: Date, required: true},
    shift_assignment_id: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
    },
    shift_snapshot: {
      ten_ca: String,
      gio_bat_dau: String,
      gio_ket_thuc: String,
      thoi_gian_nghi: Number,
    },
    check_in: Date,
    check_out: Date,
    work_minutes: {type: Number, default: 0},
    paid_minutes: {type: Number, default: 0},
    leave_minutes: {type: Number, default: 0},
    ot_minutes: {type: Number, default: 0},
    ot_hours: {type: Number, default: 0},
    ot_multiplier: {type: Number, default: 0},
    late_minutes: {type: Number, default: 0},
    early_minutes: {type: Number, default: 0},
    status: {
      type: String,
      enum: [
        'NoData',
        'OnTime',
        'Late',
        'EarlyOut',
        'LateEarly',
        'Leave',
        'Absent',
        'MissingCheckin',
        'MissingCheckout',
      ],
      default: 'NoData',
    },
    violations: {type: [String], default: []},
    notes: {type: String, default: ''},
    data_sources: {
      attendance_id: {type: Schema.Types.ObjectId, ref: 'ChamCong'},
      leave_request_ids: [
        {type: Schema.Types.ObjectId, ref: 'YeuCauNghiPhep'},
      ],
      overtime_request_ids: [
        {type: Schema.Types.ObjectId, ref: 'OvertimeRequest'},
      ],
    },
    computed_at: {type: Date, default: Date.now},
  },
  {
    timestamps: {createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat'},
  },
);

DailyTimeSummarySchema.pre('save', function normalize() {
  if (this.ngay) {
    this.ngay = normalizeDay(this.ngay);
  }
});

DailyTimeSummarySchema.index({nhan_vien_id: 1, ngay: 1}, {unique: true});

module.exports = mongoose.model(
  'DailyTimeSummary',
  DailyTimeSummarySchema,
  'daily_time_summaries',
);

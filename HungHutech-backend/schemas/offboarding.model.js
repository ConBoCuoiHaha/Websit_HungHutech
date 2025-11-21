const mongoose = require('mongoose');

const { Schema } = mongoose;

const OffboardingTaskSchema = new Schema(
  {
    name: { type: String, required: true },
    department: String,
    assigned_to: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    status: {
      type: String,
      enum: ['Pending', 'InProgress', 'Completed'],
      default: 'Pending',
    },
    due_date: Date,
    note: String,
    completed_at: Date,
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } },
);

const OffboardingSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    reason: String,
    last_working_day: Date,
    status: {
      type: String,
      enum: ['Pending', 'InProgress', 'Completed'],
      default: 'Pending',
    },
    requested_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    tasks: [OffboardingTaskSchema],
    note: String,
    reminder_log: {
      type: [
        {
          days_before: Number,
          recipients: [String],
          sent_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } },
);

OffboardingSchema.index({ nhan_vien_id: 1, status: 1 });

module.exports = mongoose.model('Offboarding', OffboardingSchema, 'offboarding_requests');

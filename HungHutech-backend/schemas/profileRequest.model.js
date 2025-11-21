const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProfileRequestSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    type: {
      type: String,
      enum: ['personal', 'contact', 'dependents'],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    note: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approver_note: String,
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    reviewed_at: Date,
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
  },
);

ProfileRequestSchema.index({ nhan_vien_id: 1, status: 1 });

const ProfileRequest = mongoose.model(
  'ProfileRequest',
  ProfileRequestSchema,
  'profile_requests',
);

module.exports = ProfileRequest;

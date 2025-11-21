const mongoose = require('mongoose');

const { Schema } = mongoose;

const ConsentHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['Accepted', 'Withdrawn'],
      required: true,
    },
    acted_at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    actor_id: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const ConsentSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ['Accepted', 'Withdrawn'],
      default: 'Accepted',
    },
    note: { type: String, default: '' },
    granted_at: { type: Date },
    withdrawn_at: { type: Date },
    history: { type: [ConsentHistorySchema], default: [] },
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
  },
);

ConsentSchema.index({ user_id: 1, purpose: 1 }, { unique: true });

const Consent = mongoose.model('Consent', ConsentSchema, 'consents');

module.exports = Consent;

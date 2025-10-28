const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entity_id: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    ip: { type: String },
    ua: { type: String },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const AuditLog = mongoose.model('AuditLog', AuditSchema, 'audit_logs');
module.exports = AuditLog;


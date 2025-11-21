const mongoose = require('mongoose');

const { Schema } = mongoose;

const ComplianceReminderLogSchema = new Schema(
  {
    report_id: { type: String, required: true },
    report_name: { type: String, required: true },
    period_key: { type: String, required: true },
    sent_at: { type: Date, default: Date.now },
    due_date: { type: Date },
    manual: { type: Boolean, default: false },
    manual_by: { type: Schema.Types.ObjectId, ref: 'NhanVien', default: null },
    notes: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

ComplianceReminderLogSchema.index({ report_id: 1, period_key: 1 }, { unique: true });

module.exports = mongoose.model('ComplianceReminderLog', ComplianceReminderLogSchema, 'compliance_reminder_logs');

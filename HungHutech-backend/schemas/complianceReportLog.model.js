const mongoose = require('mongoose');

const {Schema} = mongoose;

const ComplianceReportLogSchema = new Schema(
  {
    type: {type: String, required: true},
    report_name: {type: String, required: true},
    requested_by: {type: Schema.Types.ObjectId, ref: 'NhanVien'},
    params: {
      from_date: String,
      to_date: String,
      contributions: Schema.Types.Mixed,
    },
    total_rows: {type: Number, default: 0},
    format: {type: String, default: 'csv'},
    exported_at: {type: Date, default: Date.now},
  },
  {timestamps: {createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat'}},
);

ComplianceReportLogSchema.index({type: 1, exported_at: -1});

module.exports = mongoose.model(
  'ComplianceReportLog',
  ComplianceReportLogSchema,
  'compliance_report_logs',
);

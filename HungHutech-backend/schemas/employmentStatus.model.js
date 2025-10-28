const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmploymentStatusSchema = new Schema({
  ten_trang_thai: {
    type: String,
    required: true,
    trim: true
  },
  mo_ta: {
    type: String,
    trim: true
  },
  kich_hoat: {
    type: Boolean,
    default: true
  },
  thu_tu_sap_xep: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'employment_statuses'
});

// Index cho tìm kiếm
EmploymentStatusSchema.index({ ten_trang_thai: 1 });
EmploymentStatusSchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('EmploymentStatus', EmploymentStatusSchema);

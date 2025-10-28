const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApplicationSchema = new Schema(
  {
    vacancy_id: { type: Schema.Types.ObjectId, ref: 'Vacancy', required: true },
    candidate_id: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    trang_thai: { type: String, enum: ['Ung tuyen', 'So tuyen', 'Phong van', 'Tuyen dung', 'Tu choi'], default: 'Ung tuyen' },
    ghi_chu: { type: String },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

ApplicationSchema.index({ vacancy_id: 1, candidate_id: 1 }, { unique: true });

const Application = mongoose.model('Application', ApplicationSchema, 'applications');
module.exports = Application;


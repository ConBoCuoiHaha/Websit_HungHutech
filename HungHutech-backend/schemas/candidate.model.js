const mongoose = require('mongoose');
const { Schema } = mongoose;

const CandidateSchema = new Schema(
  {
    ho_ten: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    dien_thoai: { type: String },
    ghi_chu: { type: String },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

CandidateSchema.index({ email: 1 }, { unique: false });

const Candidate = mongoose.model('Candidate', CandidateSchema, 'candidates');
module.exports = Candidate;


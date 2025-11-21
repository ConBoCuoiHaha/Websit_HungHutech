const mongoose = require('mongoose');
const { Schema } = mongoose;

const CandidateSchema = new Schema(
  {
    ho_ten: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    dien_thoai: { type: String },
    ghi_chu: { type: String },
    nguon: { type: String, default: 'Khac' },
    trang_thai: {
      type: String,
      enum: ['Moi', 'Dang_lien_he', 'Phong_van', 'Duoc_tuyen', 'Khong_phu_hop'],
      default: 'Moi',
    },
    pipeline_stage: {
      type: String,
      enum: ['CV_moi', 'Screening', 'Phong_van_v1', 'Phong_van_v2', 'Offer', 'Rejected', 'Hired'],
      default: 'CV_moi',
    },
    pipeline_history: {
      type: [
        {
          stage: String,
          ghi_chu: String,
          nguoi_cap_nhat_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
          thoi_gian: { type: Date, default: Date.now },
          score: Number,
        },
      ],
      default: [],
    },
    tags: { type: [String], default: [] },
    ky_nang: { type: [String], default: [] },
    kinh_nghiem_nam: { type: Number, default: 0 },
    vi_tri_mong_muon: String,
    ngay_lien_he_cuoi: Date,
    score: { type: Number, default: 0 },
    cv_file: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      url: String,
    },
    parsed_fields: {
      tom_tat: String,
      email: String,
      dien_thoai: String,
      dia_chi: String,
      ky_nang: [String],
      hoc_van: [String],
      kinh_nghiem: [String],
    },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

CandidateSchema.index({ email: 1 }, { unique: false });
CandidateSchema.index({ pipeline_stage: 1 });
CandidateSchema.index({ ky_nang: 1 });
CandidateSchema.index({ tags: 1 });

const Candidate = mongoose.model('Candidate', CandidateSchema, 'candidates');
module.exports = Candidate;

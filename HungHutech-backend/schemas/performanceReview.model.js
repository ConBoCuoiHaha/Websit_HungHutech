const mongoose = require('mongoose');
const { Schema } = mongoose;

const RatingSchema = new Schema(
  {
    kpi_id: { type: Schema.Types.ObjectId, ref: 'KPI', required: true },
    diem: { type: Number, min: 0, max: 5, required: true },
    ghi_chu: { type: String },
  },
  { _id: false }
);

const PerformanceReviewSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    nguoi_danh_gia_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    tu_ngay: { type: Date, required: true },
    den_ngay: { type: Date, required: true },
    trang_thai: { type: String, enum: ['Draft', 'InReview', 'Completed'], default: 'Draft' },
    xep_loai: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', null],
      default: null,
    },
    thuong_hieu_suat: { type: Number, default: 0 },
    da_chuyen_payroll: { type: Boolean, default: false },
    payroll_history: {
      type: [
        {
          payroll_run_id: { type: Schema.Types.ObjectId, ref: 'PayrollRun' },
          payroll_entry_id: { type: Schema.Types.ObjectId },
          so_tien: Number,
          ky_luong: String,
          ngay_chuyen: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    ratings: { type: [RatingSchema], default: [] },
    diem_tong: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const PerformanceReview = mongoose.model('PerformanceReview', PerformanceReviewSchema, 'performance_reviews');
module.exports = PerformanceReview;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PerformanceTrackerSchema = new Schema({
  ten_tracker: {
    type: String,
    required: true,
    trim: true
  },
  nhan_vien_id: {
    type: Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true
  },
  nguoi_danh_gia_id: {
    type: Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true
  },
  ky_danh_gia: {
    tu_ngay: {
      type: Date,
      required: true
    },
    den_ngay: {
      type: Date,
      required: true
    }
  },
  muc_tieu: [{
    ten_muc_tieu: {
      type: String,
      required: true
    },
    mo_ta: String,
    trong_so: {
      type: Number,
      default: 1,
      min: 0,
      max: 100
    },
    trang_thai: {
      type: String,
      enum: ['Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành', 'Quá hạn', 'Đã hủy'],
      default: 'Chưa bắt đầu'
    },
    tien_do: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    diem_danh_gia: {
      type: Number,
      min: 0,
      max: 10
    },
    nhan_xet: String,
    ngay_bat_dau: Date,
    ngay_hoan_thanh: Date,
    han_hoan_thanh: Date
  }],
  danh_gia_chung: {
    diem_tong: {
      type: Number,
      min: 0,
      max: 10
    },
    xep_loai: {
      type: String,
      enum: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu']
    },
    nhan_xet: String,
    diem_manh: [String],
    diem_yeu: [String],
    ke_hoach_phat_trien: String
  },
  trang_thai: {
    type: String,
    enum: ['Nháp', 'Đang theo dõi', 'Đã hoàn thành', 'Đã hủy'],
    default: 'Nháp'
  },
  ghi_chu: String
}, {
  timestamps: true,
  collection: 'performance_trackers'
});

// Indexes
PerformanceTrackerSchema.index({ nhan_vien_id: 1, 'ky_danh_gia.tu_ngay': 1 });
PerformanceTrackerSchema.index({ nguoi_danh_gia_id: 1 });
PerformanceTrackerSchema.index({ trang_thai: 1 });
PerformanceTrackerSchema.index({ 'ky_danh_gia.tu_ngay': 1, 'ky_danh_gia.den_ngay': 1 });

// Virtual để tính điểm trung bình từ các mục tiêu
PerformanceTrackerSchema.virtual('diem_trung_binh').get(function() {
  if (!this.muc_tieu || this.muc_tieu.length === 0) return null;

  const mucs_co_diem = this.muc_tieu.filter(m => m.diem_danh_gia !== undefined && m.diem_danh_gia !== null);
  if (mucs_co_diem.length === 0) return null;

  const tong_trong_so = mucs_co_diem.reduce((sum, m) => sum + (m.trong_so || 1), 0);
  const diem_trung_binh_trong_so = mucs_co_diem.reduce((sum, m) =>
    sum + (m.diem_danh_gia * (m.trong_so || 1)), 0) / tong_trong_so;

  return Math.round(diem_trung_binh_trong_so * 100) / 100;
});

// Virtual để tính tiến độ tổng thể
PerformanceTrackerSchema.virtual('tien_do_tong').get(function() {
  if (!this.muc_tieu || this.muc_tieu.length === 0) return 0;

  const tong_tien_do = this.muc_tieu.reduce((sum, m) => sum + (m.tien_do || 0), 0);
  return Math.round(tong_tien_do / this.muc_tieu.length);
});

// Ensure virtuals are included when converting to JSON
PerformanceTrackerSchema.set('toJSON', { virtuals: true });
PerformanceTrackerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PerformanceTracker', PerformanceTrackerSchema);

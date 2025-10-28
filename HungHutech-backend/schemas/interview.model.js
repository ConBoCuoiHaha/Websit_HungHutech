const mongoose = require('mongoose');
const { Schema } = mongoose;

const InterviewSchema = new Schema(
  {
    ung_vien_id: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    vi_tri_tuyen_dung_id: {
      type: Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: true,
    },
    loai_phong_van: {
      type: String,
      enum: ['Sơ tuyển', 'Phỏng vấn chuyên môn', 'Phỏng vấn quản lý', 'Phỏng vấn cuối cùng'],
      required: true,
    },
    ngay_gio: {
      type: Date,
      required: true,
    },
    dia_diem: {
      type: String,
    },
    hinh_thuc: {
      type: String,
      enum: ['Trực tiếp', 'Trực tuyến', 'Điện thoại'],
      default: 'Trực tiếp',
    },
    nguoi_phong_van: [
      {
        nhan_vien_id: {
          type: Schema.Types.ObjectId,
          ref: 'NhanVien',
        },
        vai_tro: {
          type: String,
        },
      },
    ],
    trang_thai: {
      type: String,
      enum: ['Đã lên lịch', 'Đang chờ xác nhận', 'Đã xác nhận', 'Đã hoàn thành', 'Đã hủy', 'Ứng viên vắng mặt'],
      default: 'Đã lên lịch',
    },
    link_phong_van: {
      type: String,
    },
    ghi_chu: {
      type: String,
    },
    ket_qua_phong_van: {
      danh_gia_tong_quan: {
        type: String,
      },
      diem_so: {
        type: Number,
        min: 0,
        max: 10,
      },
      diem_manh: [String],
      diem_yeu: [String],
      quyet_dinh: {
        type: String,
        enum: ['Đậu', 'Trượt', 'Chưa quyết định'],
      },
      y_kien_nguoi_phong_van: [
        {
          nhan_vien_id: {
            type: Schema.Types.ObjectId,
            ref: 'NhanVien',
          },
          y_kien: {
            type: String,
          },
          diem: {
            type: Number,
            min: 0,
            max: 10,
          },
        },
      ],
    },
    da_xoa: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
  }
);

// Index for efficient queries
InterviewSchema.index({ ung_vien_id: 1, vi_tri_tuyen_dung_id: 1 });
InterviewSchema.index({ ngay_gio: 1 });
InterviewSchema.index({ trang_thai: 1 });
InterviewSchema.index({ 'nguoi_phong_van.nhan_vien_id': 1 });

const Interview = mongoose.model('Interview', InterviewSchema, 'interviews');
module.exports = Interview;

const mongoose = require('mongoose');
const { Schema } = mongoose;

const TieuChiSchema = new Schema(
  {
    truong: { type: String, required: true }, // Field name
    dieu_kien: {
      type: String,
      enum: ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'BETWEEN'],
      required: true
    }, // Condition
    gia_tri: { type: Schema.Types.Mixed, required: true }, // Value (can be any type)
  },
  { _id: false }
);

const SapXepSchema = new Schema(
  {
    truong: { type: String, required: true },
    thu_tu: { type: String, enum: ['asc', 'desc'], default: 'asc' },
  },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    ten_bao_cao: { type: String, required: true },
    loai_bao_cao: {
      type: String,
      enum: ['Nhan vien', 'Cham cong', 'Nghi phep', 'Boi hoan', 'Luong', 'Hieu suat'],
      required: true,
    },
    tieu_chi: { type: [TieuChiSchema], default: [] }, // Filter criteria array
    cot_hien_thi: { type: [String], default: [] }, // Columns to display
    sap_xep: { type: SapXepSchema }, // Sorting options
    nguoi_tao_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ngay_tao: { type: Date, default: Date.now },
    ngay_cap_nhat: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
  }
);

const Report = mongoose.model('Report', ReportSchema, 'reports');

module.exports = Report;

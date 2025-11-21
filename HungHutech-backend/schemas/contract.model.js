const mongoose = require('mongoose');

const { Schema } = mongoose;

const AllowanceSchema = new Schema(
  {
    ten: String,
    so_tien: Number,
    ghi_chu: String,
  },
  { _id: false },
);

const ContractSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    so_hop_dong: { type: String, required: true, unique: true },
    loai_hop_dong: {
      type: String,
      enum: ['Thu_viec', 'Co_thoi_han', 'Khong_thoi_han', 'Cong_tac'],
      default: 'Co_thoi_han',
    },
    template: { type: String },
    trang_thai: {
      type: String,
      enum: ['Draft', 'Cho_duyet', 'Da_ky', 'Da_huy'],
      default: 'Draft',
    },
    ngay_ky: Date,
    hieu_luc_tu: Date,
    hieu_luc_den: Date,
    luong_co_ban: Number,
    phu_cap: { type: [AllowanceSchema], default: [] },
    file_url: String,
    file_id: { type: Schema.Types.ObjectId, ref: 'File' },
    ghi_chu: String,
    auto_extend: { type: Boolean, default: false },
    reminder_log: {
      type: [
        {
          days_before: Number,
          recipients: [String],
          sent_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    audit_log: {
      type: [
        {
          action: String,
          user_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
          ghi_chu: String,
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
  },
);

ContractSchema.index({ nhan_vien_id: 1, trang_thai: 1 });

const Contract = mongoose.model('Contract', ContractSchema, 'contracts');

module.exports = Contract;

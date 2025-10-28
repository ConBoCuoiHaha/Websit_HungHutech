const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClaimItemSchema = new Schema(
  {
    ngay: { type: Date, required: true },
    so_tien: { type: Number, required: true, min: 0 },
    mo_ta: { type: String },
    danh_muc: { type: String },
  },
  { _id: false }
);

const ClaimSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    trang_thai: { type: String, enum: ['Submitted', 'Approved', 'Rejected', 'Paid'], default: 'Submitted' },
    tong_tien: { type: Number, default: 0 },
    items: { type: [ClaimItemSchema], default: [] },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const Claim = mongoose.model('Claim', ClaimSchema, 'claims');
module.exports = Claim;


const mongoose = require('mongoose');
const { Schema } = mongoose;

const BacLuongSchema = new Schema({
  ten_bac_luong: {
    type: String,
    required: true,
    unique: true,
  },
  muc_luong_toi_thieu: {
    type: Schema.Types.Decimal128,
    default: null,
  },
  muc_luong_toi_da: {
    type: Schema.Types.Decimal128,
    default: null,
  },
  don_vi_tien_te: {
    type: String,
    enum: ['VND', 'USD'],
    default: 'VND',
  },
  ghi_chu: {
    type: String,
  },
  da_xoa: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

const BacLuong = mongoose.model('BacLuong', BacLuongSchema, 'bac_luong');

module.exports = BacLuong;

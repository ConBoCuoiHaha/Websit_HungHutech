const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

// Create unique index for email
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema, 'users');
module.exports = User;


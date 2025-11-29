const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', default: null },
    active: { type: Boolean, default: true },

    // Biometric device binding
    biometric_device: {
      device_id: { type: String, default: null }, // Unique device identifier
      device_name: { type: String, default: null }, // e.g., "Samsung Galaxy S21"
      fingerprint_signature: { type: String, default: null }, // SHA-256 hash of biometric data
      registered_at: { type: Date, default: null },
      last_used_at: { type: Date, default: null },
    },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

// Create unique index for email
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema, 'users');
module.exports = User;


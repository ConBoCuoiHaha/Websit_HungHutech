const mongoose = require('mongoose');

const nonceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nonce: { type: String, required: true, index: true, unique: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: 'nonces' },
);

// TTL index: tự xoá sau khi hết hạn
nonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Nonce', nonceSchema);


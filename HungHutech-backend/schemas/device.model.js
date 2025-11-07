const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nhan_vien_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
    deviceIdHash: { type: String, required: true, unique: true },
    publicKeyPem: { type: String, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true, collection: 'devices' },
);

deviceSchema.index({ user_id: 1 }, { unique: true }); // 1 thiết bị/nhân viên (có thể nới lên 2 nếu cần)

module.exports = mongoose.model('Device', deviceSchema);


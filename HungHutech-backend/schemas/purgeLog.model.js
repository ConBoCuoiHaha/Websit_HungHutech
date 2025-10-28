const mongoose = require('mongoose');
const { Schema } = mongoose;

const PurgeLogSchema = new Schema(
  {
    loai: {
      type: String,
      enum: ['NhanVien', 'UngVien'],
      required: true,
    },
    doi_tuong_id: {
      type: String,
      required: true,
    },
    ten_doi_tuong: {
      type: String,
      required: true,
    },
    nguoi_thuc_hien_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngay_thuc_hien: {
      type: Date,
      default: Date.now,
    },
    ly_do: {
      type: String,
      required: true,
    },
    du_lieu_lien_quan: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

// Index for efficient queries
PurgeLogSchema.index({ loai: 1, ngay_thuc_hien: -1 });
PurgeLogSchema.index({ nguoi_thuc_hien_id: 1 });
PurgeLogSchema.index({ doi_tuong_id: 1 });

const PurgeLog = mongoose.model('PurgeLog', PurgeLogSchema, 'purge_logs');
module.exports = PurgeLog;

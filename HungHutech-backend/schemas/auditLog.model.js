const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'EXPORT',
        'IMPORT',
        'APPROVE',
        'REJECT',
        'UPLOAD',
        'DOWNLOAD',
        'OTHER',
      ],
    },
    resource: {
      type: String,
      required: true, // VD: 'nhanvien', 'phongban', 'sites', 'leave_requests'
    },
    resourceId: {
      type: String, // ID của resource bị thao tác (nếu có)
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    endpoint: {
      type: String,
      required: true, // VD: '/api/nhanvien/123'
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number, // milliseconds
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Thông tin chi tiết (request body, query params, v.v.)
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Không cần createdAt/updatedAt vì đã có timestamp
    collection: 'audit_logs',
  }
);

// Indexes for performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL Index: Tự động xóa logs sau 90 ngày
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('AuditLog', auditLogSchema);

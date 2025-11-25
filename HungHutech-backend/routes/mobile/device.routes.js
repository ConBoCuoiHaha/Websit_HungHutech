const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth: authenticate } = require('../../middlewares/auth');
const { handleValidation } = require('../../middlewares/validate');
const Device = require('../../schemas/device.model');
const AuditLog = require('../../schemas/auditLog.model');

// All routes require authentication
router.use(authenticate);

async function logAudit(req, options = {}) {
  const {
    action = 'CREATE',
    resource = 'mobile_device',
    resourceId = null,
    statusCode = 200,
    responseTime = 0,
    details = {},
  } = options;

  try {
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown';

    await AuditLog.create({
      userId: req.user?.id || req.user?._id || null,
      username: req.user?.email || req.user?.username || 'mobile_user',
      action,
      resource,
      resourceId,
      method: req.method,
      endpoint: req.originalUrl || req.url,
      ipAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      statusCode,
      responseTime,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('audit log (mobile device) error:', err.message);
  }
}

// POST /api/mobile/devices/register - register device (idempotent)
router.post(
  '/register',
  [
    body('deviceIdHash').isString().trim().isLength({ min: 10 }).withMessage('deviceIdHash khong hop le'),
    body('publicKeyPem').isString().trim().isLength({ min: 50 }).withMessage('publicKeyPem khong hop le'),
  ],
  handleValidation,
  async (req, res) => {
    const start = Date.now();
    try {
      const { deviceIdHash, publicKeyPem } = req.body;
      const userId = req.user.id || req.user._id;
      const nhanVienId = req.user.nhan_vien_id || null;

      const existingByUser = await Device.findOne({ user_id: userId });
      if (existingByUser) {
        existingByUser.deviceIdHash = deviceIdHash;
        existingByUser.publicKeyPem = publicKeyPem;
        existingByUser.revokedAt = null;
        await existingByUser.save();
      } else {
        await Device.findOneAndUpdate(
          { deviceIdHash },
          { user_id: userId, nhan_vien_id: nhanVienId, publicKeyPem, revokedAt: null },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }

      await logAudit(req, {
        action: 'CREATE',
        resource: 'mobile_device',
        resourceId: String(userId),
        statusCode: 200,
        responseTime: Date.now() - start,
        details: { body: { deviceIdHash }, nhanVienId },
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Error device register:', err);
      await logAudit(req, {
        action: 'CREATE',
        resource: 'mobile_device',
        resourceId: req.user?.id || null,
        statusCode: res.statusCode || 500,
        responseTime: Date.now() - start,
        details: { error: err.message },
      });
      res.status(500).json({ msg: 'Loi may chu', error: err.message });
    }
  },
);

module.exports = router;

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
    body('deviceIdHash')
      .isString()
      .trim()
      .isLength({ min: 10 })
      .withMessage('deviceIdHash khong hop le'),
    body('publicKeyPem')
      .isString()
      .trim()
      .isLength({ min: 50 })
      .withMessage('publicKeyPem khong hop le'),
    // fingerprint bat buoc de dam bao moi van tay gan voi duy nhat mot tai khoan
    body('fingerprint_signature')
      .isString()
      .trim()
      .isLength({ min: 10 })
      .withMessage('fingerprint_signature khong hop le'),
    body('device_name').optional().isString().trim().withMessage('device_name khong hop le'),
  ],
  handleValidation,
  async (req, res) => {
    const start = Date.now();
    try {
      const { deviceIdHash, publicKeyPem, fingerprint_signature, device_name } = req.body;
      const userId = req.user.id || req.user._id;
      const nhanVienId = req.user.nhan_vien_id || null;

      console.log('=== DEVICE REGISTRATION ===');
      console.log('userId:', userId);
      console.log('fingerprint_signature:', fingerprint_signature ? 'present' : 'missing');

      // Kiem tra fingerprint dang duoc dung boi user khac
      const existingFingerprintDevice = await Device.findOne({
        fingerprint_signature,
        user_id: { $ne: userId },
      });
      if (existingFingerprintDevice) {
        console.log('Fingerprint already registered to another user:', existingFingerprintDevice.user_id);
        await logAudit(req, {
          action: 'CREATE',
          resource: 'mobile_device',
          resourceId: String(userId),
          statusCode: 409,
          responseTime: Date.now() - start,
          details: { error: 'fingerprint_duplicate', conflictUserId: String(existingFingerprintDevice.user_id) },
        });
        return res.status(409).json({
          msg: 'Van tay nay da duoc dang ky cho tai khoan khac.',
          type: 'fingerprint_duplicate',
        });
      }

      // Kiem tra deviceIdHash dang duoc dung boi user khac
      const existingByDeviceHash = await Device.findOne({
        deviceIdHash,
        user_id: { $ne: userId },
      });
      if (existingByDeviceHash) {
        await logAudit(req, {
          action: 'CREATE',
          resource: 'mobile_device',
          resourceId: String(userId),
          statusCode: 409,
          responseTime: Date.now() - start,
          details: { error: 'device_in_use', conflictUserId: String(existingByDeviceHash.user_id) },
        });
        return res.status(409).json({
          msg: 'Thiet bi nay da duoc lien ket voi tai khoan khac.',
          type: 'device_in_use',
        });
      }

      // Mot user chi co mot device
      const existingByUser = await Device.findOne({ user_id: userId });
      if (existingByUser) {
        existingByUser.deviceIdHash = deviceIdHash;
        existingByUser.publicKeyPem = publicKeyPem;
        existingByUser.fingerprint_signature = fingerprint_signature;
        existingByUser.device_name = device_name || existingByUser.device_name;
        existingByUser.revokedAt = null;
        await existingByUser.save();
        console.log('Device updated for user:', userId);
      } else {
        await Device.create({
          user_id: userId,
          nhan_vien_id: nhanVienId,
          deviceIdHash,
          publicKeyPem,
          fingerprint_signature,
          device_name: device_name || null,
          revokedAt: null,
        });
        console.log('New device created for user:', userId);
      }

      await logAudit(req, {
        action: 'CREATE',
        resource: 'mobile_device',
        resourceId: String(userId),
        statusCode: 200,
        responseTime: Date.now() - start,
        details: { body: { deviceIdHash, has_fingerprint: !!fingerprint_signature }, nhanVienId },
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

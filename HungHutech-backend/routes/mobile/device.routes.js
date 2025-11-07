const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth: authenticate } = require('../../middlewares/auth');
const { handleValidation } = require('../../middlewares/validate');
const Device = require('../../schemas/device.model');

// All routes require authentication
router.use(authenticate);

// POST /api/mobile/devices/register - Đăng ký/ghi nhận thiết bị cho người dùng (idempotent)
router.post(
  '/register',
  [
    body('deviceIdHash').isString().trim().isLength({ min: 10 }).withMessage('deviceIdHash không hợp lệ'),
    body('publicKeyPem').isString().trim().isLength({ min: 50 }).withMessage('publicKeyPem không hợp lệ'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { deviceIdHash, publicKeyPem } = req.body;
      const userId = req.user.id || req.user._id;
      const nhanVienId = req.user.nhan_vien_id || null;

      // Nếu người dùng đã có thiết bị khác → chặn (1 thiết bị/nhân viên)
      const existingByUser = await Device.findOne({ user_id: userId });
      if (existingByUser) {
        // Cho phép thay thế thiết bị cũ bằng thiết bị mới cho cùng user (tiện cho QA/chuyển máy)
        existingByUser.deviceIdHash = deviceIdHash;
        existingByUser.publicKeyPem = publicKeyPem;
        existingByUser.revokedAt = null;
        await existingByUser.save();
      } else {
        // Upsert theo deviceIdHash (idempotent)
        await Device.findOneAndUpdate(
          { deviceIdHash },
          { user_id: userId, nhan_vien_id: nhanVienId, publicKeyPem, revokedAt: null },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error device register:', err);
      res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
    }
  },
);

module.exports = router;

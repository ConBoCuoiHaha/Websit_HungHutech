const express = require('express');
const crypto = require('crypto');
const { body } = require('express-validator');
const { auth: authenticate } = require('../../middlewares/auth');
const { handleValidation } = require('../../middlewares/validate');
const Nonce = require('../../schemas/nonce.model');
const Device = require('../../schemas/device.model');
const Site = require('../../schemas/site.model');
const ChamCong = require('../../schemas/chamCong.model');

const router = express.Router();

router.use(authenticate);

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/mobile/attendance/nonce - cấp nonce ngắn hạn
router.get('/nonce', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const nonce = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút
    await Nonce.create({ user_id: userId, nonce, expiresAt });
    res.json({ nonce, expiresAt });
  } catch (err) {
    console.error('Error get nonce:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
});

// POST body validator
const checkBodyValidators = [
  body('deviceIdHash').isString().trim().isLength({ min: 10 }),
  body('nonce').isString().trim().isLength({ min: 10 }),
  body('signature').isString().trim().isLength({ min: 20 }),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat({ min: 0, max: 5000 }),
];

async function processCheck(req, res, type) {
  try {
    const userId = req.user.id || req.user._id;
    const employeeId = req.user.nhan_vien_id || null;
    const { deviceIdHash, nonce, signature, lat, lng, accuracy = 0 } = req.body;

    // 1) Tồn tại nonce và chưa dùng + chưa hết hạn
    const nonceDoc = await Nonce.findOne({ user_id: userId, nonce, used: false, expiresAt: { $gt: new Date() } });
    if (!nonceDoc) return res.status(400).json({ msg: 'Nonce không hợp lệ hoặc đã hết hạn', type: 'invalid_nonce' });

    // 2) Thiết bị đã đăng ký và thuộc về user
    const device = await Device.findOne({ user_id: userId });
    if (!device) return res.status(409).json({ msg: 'Thiết bị chưa đăng ký', type: 'device_not_registered' });
    if (device.deviceIdHash !== deviceIdHash) return res.status(409).json({ msg: 'Thiết bị không khớp', type: 'device_mismatch' });
    if (device.revokedAt) return res.status(409).json({ msg: 'Thiết bị đã bị thu hồi', type: 'device_revoked' });

    // 3) Xác minh chữ ký ECDSA
    const isValid = crypto
      .createVerify('sha256')
      .update(Buffer.from(nonce))
      .verify(device.publicKeyPem, Buffer.from(signature, 'base64'));
    if (!isValid) return res.status(400).json({ msg: 'Chữ ký không hợp lệ', type: 'invalid_signature' });

    // 4) Kiểm tra accuracy
    const MAX_ACCURACY = 50; // mét, có thể điều chỉnh qua cấu hình
    if (accuracy && Number(accuracy) > MAX_ACCURACY) {
      return res.status(400).json({ msg: `Độ chính xác GPS thấp (${Math.round(accuracy)}m)`, type: 'low_gps_accuracy' });
    }

    // 5) Tìm site gần nhất (tối đa 10km)
    const nearSites = await Site.find({
      da_xoa: false,
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: 10000,
        },
      },
    })
      .select('siteId name address location radius')
      .limit(1);

    if (!nearSites.length) return res.status(400).json({ msg: 'Không có địa điểm hợp lệ gần bạn', type: 'no_site_nearby' });
    const site = nearSites[0];
    const distance = haversineDistanceMeters(Number(lat), Number(lng), site.latitude, site.longitude);
    if (distance > site.radius) {
      return res.status(400).json({
        msg: `Bạn cách ${Math.round(distance)}m. Cần gần hơn ${site.radius}m để chấm công`,
        type: 'out_of_radius',
        distance,
        requiredDistance: site.radius,
      });
    }

    // 6) Business: late/lateOver30 cho check-in (mặc định 08:30, không có phân ca)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let flags = { isLate: false, lateOver30: false, isMock: false };
    if (type === 'check_in') {
      const threshold = new Date(today);
      threshold.setHours(8, 30, 0, 0);
      const late30 = new Date(threshold);
      late30.setMinutes(threshold.getMinutes() + 30);
      flags.isLate = now > threshold;
      flags.lateOver30 = now > late30;
    }

    // 7) Ghi nhận vào collection cham_cong hiện có
    let record = await ChamCong.findOne({ nhan_vien_id: employeeId, ngay: today });
    if (type === 'check_in') {
      if (record) return res.status(400).json({ msg: 'Hôm nay bạn đã check-in rồi' });
      record = new ChamCong({ nhan_vien_id: employeeId, ngay: today, thoi_gian_vao: now, ghi_chu: `site:${site.siteId};dist:${Math.round(distance)}m` });
      await record.save();
    } else {
      if (!record) return res.status(404).json({ msg: 'Bạn chưa check-in hôm nay' });
      if (record.thoi_gian_ra) return res.status(400).json({ msg: 'Hôm nay bạn đã check-out rồi' });
      record.thoi_gian_ra = now;
      await record.save();
    }

    // 8) Đánh dấu nonce đã dùng
    await Nonce.updateOne({ _id: nonceDoc._id }, { $set: { used: true } });

    res.json({
      distance,
      flags,
      attendance: {
        _id: record._id,
        employeeId: String(employeeId),
        type,
        time: now,
        siteId: site.siteId,
      },
    });
  } catch (err) {
    console.error('Error process attendance:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
}

router.post('/check-in', checkBodyValidators, handleValidation, (req, res) => processCheck(req, res, 'check_in'));
router.post('/check-out', checkBodyValidators, handleValidation, (req, res) => processCheck(req, res, 'check_out'));

module.exports = router;

// GET /api/mobile/attendance/today - trạng thái hôm nay
router.get('/today', async (req, res) => {
  try {
    const employeeId = req.user.nhan_vien_id || null;
    if (!employeeId) return res.status(400).json({ msg: 'Thiếu nhan_vien_id trong token' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await ChamCong.findOne({ nhan_vien_id: employeeId, ngay: today });
    if (!record) return res.json({ status: 'absent' });
    return res.json({
      status: record.thoi_gian_ra ? 'checked_out' : 'checked_in',
      record,
    });
  } catch (err) {
    console.error('Error today attendance:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
});

// GET /api/mobile/attendance/history?from&to&limit
router.get('/history', async (req, res) => {
  try {
    const employeeId = req.user.nhan_vien_id || null;
    if (!employeeId) return res.status(400).json({ msg: 'Thiếu nhan_vien_id trong token' });
    const { from, to, limit = 60 } = req.query;
    const filter = { nhan_vien_id: employeeId };
    if (from || to) {
      filter.ngay = {};
      if (from) filter.ngay.$gte = new Date(from);
      if (to) filter.ngay.$lte = new Date(to);
    } else {
      // mặc định 30 ngày gần nhất
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      filter.ngay = { $gte: start };
    }
    const items = await ChamCong.find(filter)
      .sort({ ngay: -1 })
      .limit(Math.min(Number(limit) || 60, 200));
    res.json({ data: items, total: items.length });
  } catch (err) {
    console.error('Error history attendance:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
});

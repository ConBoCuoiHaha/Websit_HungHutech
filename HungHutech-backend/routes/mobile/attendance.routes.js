const express = require('express');
const crypto = require('crypto');
const { body } = require('express-validator');
const { auth: authenticate } = require('../../middlewares/auth');
const { handleValidation } = require('../../middlewares/validate');
const Nonce = require('../../schemas/nonce.model');
const Device = require('../../schemas/device.model');
const Site = require('../../schemas/site.model');
const ChamCong = require('../../schemas/chamCong.model');
const NhanVien = require('../../schemas/nhanVien.model');
const CaLamViec = require('../../schemas/caLamViec.model');
const OvertimeRequest = require('../../schemas/overtimeRequest.model');
const {startOfDay, classifyOvertimeType} = require('../../services/overtimeHelper');
const timeRuleEngine = require('../../services/timeRuleEngine');

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
const SHIFT_EARLY_MINUTES = 30;
const AUTO_OT_MINUTES = 30;

function combineTimeWithDate(baseDate, hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(baseDate);
  dt.setHours(h || 0, m || 0, 0, 0);
  return dt;
}

function formatTime(date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function getShiftContext(employeeId, today) {
  try {
    const nv = await NhanVien.findById(employeeId).select('thong_tin_cong_viec.ca_lam_viec_id');
    const shiftId = nv?.thong_tin_cong_viec?.ca_lam_viec_id;
    if (!shiftId) return null;
    const shift = await CaLamViec.findById(shiftId).lean();
    if (!shift) return null;
    const shiftStart = combineTimeWithDate(today, shift.gio_bat_dau);
    const shiftEnd = combineTimeWithDate(today, shift.gio_ket_thuc);
    const earliestCheckIn = shiftStart ? new Date(shiftStart.getTime() - SHIFT_EARLY_MINUTES * 60000) : null;
    return { shift, shiftStart, shiftEnd, earliestCheckIn };
  } catch (err) {
    console.error('getShiftContext error:', err);
    return null;
  }
}

function buildDefaultShift(today) {
  const shiftStart = combineTimeWithDate(today, '08:30');
  const shiftEnd = combineTimeWithDate(today, '17:30');
  const earliestCheckIn = new Date(shiftStart.getTime() - SHIFT_EARLY_MINUTES * 60000);
  return {
    shift: { ten_ca: 'Ca mặc định', gio_bat_dau: '08:30', gio_ket_thuc: '17:30', _id: null },
    shiftStart,
    shiftEnd,
    earliestCheckIn,
  };
}

async function ensureAutoOvertimeRequest({employeeId, record, shiftContext, now}) {
  try {
    if (!employeeId || !shiftContext?.shiftEnd) return;
    const overtimeMs = now - shiftContext.shiftEnd;
    if (overtimeMs < AUTO_OT_MINUTES * 60000) return;
    const ngay = startOfDay(record.ngay || now);
    const hours = Number((overtimeMs / 3600000).toFixed(2));
    if (hours <= 0) return;
    const {type, multiplier} = await classifyOvertimeType(ngay, shiftContext.shiftEnd, now);
    const existing = await OvertimeRequest.findOne({
      nhan_vien_id: employeeId,
      ngay,
      auto_created: true,
      trang_thai: {$in: ['Cho duyet', 'Da duyet']},
    });
    if (existing) {
      existing.thoi_gian_ket_thuc = now;
      existing.so_gio = hours;
      existing.he_so = Number(multiplier.toFixed(2));
      existing.loai_ngay = type;
      await existing.save();
      timeRuleEngine.queueRecalc(employeeId, ngay);
      return;
    }
    await OvertimeRequest.create({
      nhan_vien_id: employeeId,
      ngay,
      thoi_gian_bat_dau: shiftContext.shiftEnd,
      thoi_gian_ket_thuc: now,
      so_gio: hours,
      loai_ngay: type,
      he_so: Number(multiplier.toFixed(2)),
      trang_thai: 'Cho duyet',
      ly_do: 'Tu dong de xuat tang ca tu cham cong mobile',
      auto_created: true,
    });
    timeRuleEngine.queueRecalc(employeeId, ngay);
  } catch (err) {
    console.error('ensureAutoOvertimeRequest error', err);
  }
}

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
    const shiftContext = (await getShiftContext(employeeId, today)) || buildDefaultShift(today);

    if (type === 'check_in' && shiftContext.earliestCheckIn && now < shiftContext.earliestCheckIn) {
      return res.status(400).json({
        msg: `Chưa tới giờ chấm công. Chỉ được chấm sớm tối đa ${SHIFT_EARLY_MINUTES} phút (từ ${formatTime(shiftContext.earliestCheckIn)}).`,
        type: 'too_early',
      });
    }

    let flags = { isLate: false, lateOver30: false, lateMinutes: 0, shiftName: shiftContext.shift?.ten_ca || 'Ca mặc định' };
    if (shiftContext.shiftStart) {
      const lateMinutes = Math.max(0, Math.round((now - shiftContext.shiftStart) / 60000));
      flags.isLate = lateMinutes > 5;
      flags.lateOver30 = lateMinutes > 30;
      flags.lateMinutes = lateMinutes;
      flags.shiftStart = shiftContext.shiftStart;
      flags.earliestCheckIn = shiftContext.earliestCheckIn;
    }

    // 7) Ghi nhận vào collection cham_cong hiện có
    let record = await ChamCong.findOne({ nhan_vien_id: employeeId, ngay: today });
    if (type === 'check_in') {
      if (record) return res.status(400).json({ msg: 'Hôm nay bạn đã check-in rồi' });
      record = new ChamCong({
        nhan_vien_id: employeeId,
        ca_lam_viec_id: shiftContext.shift?._id || null,
        ngay: today,
        thoi_gian_vao: now,
        ghi_chu: `site:${site.siteId};dist:${Math.round(distance)}m`,
        shift_snapshot: shiftContext.shift
          ? {
              ten_ca: shiftContext.shift.ten_ca,
              gio_bat_dau: shiftContext.shift.gio_bat_dau,
              gio_ket_thuc: shiftContext.shift.gio_ket_thuc,
            }
          : undefined,
        flags,
      });
      await record.save();
      timeRuleEngine.queueRecalc(employeeId, today);
    } else {
      if (!record) return res.status(404).json({ msg: 'Bạn chưa check-in hôm nay' });
      if (record.thoi_gian_ra) return res.status(400).json({ msg: 'Hôm nay bạn đã check-out rồi' });
      record.thoi_gian_ra = now;
      await record.save();
      await ensureAutoOvertimeRequest({ employeeId, record, shiftContext, now });
      timeRuleEngine.queueRecalc(employeeId, today);
    }

    // 8) Đánh dấu nonce đã dùng
    await Nonce.updateOne({ _id: nonceDoc._id }, { $set: { used: true } });

    res.json({
      distance,
      flags: record.flags || flags,
      attendance: {
        _id: record._id,
        employeeId: String(employeeId),
        type,
        time: now,
        siteId: site.siteId,
        shift: record.shift_snapshot || shiftContext.shift || null,
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
      .limit(Math.min(Number(limit) || 60, 200))
      .lean();
    res.json({ data: items, total: items.length });
  } catch (err) {
    console.error('Error history attendance:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
});

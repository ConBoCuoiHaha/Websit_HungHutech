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
const { startOfDay, classifyOvertimeType } = require('../../services/overtimeHelper');
const timeRuleEngine = require('../../services/timeRuleEngine');
const AuditLog = require('../../schemas/auditLog.model');

const router = express.Router();

router.use(authenticate);

async function logAudit(req, { action = 'CREATE', resource = 'mobile_attendance', resourceId = null, statusCode = 200, responseTime = 0, details = {} }) {
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
    console.error('audit log (mobile attendance) error:', err.message);
  }
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/nonce', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const nonce = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    await Nonce.create({ user_id: userId, nonce, expiresAt });
    res.json({ nonce, expiresAt });
  } catch (err) {
    console.error('Error get nonce:', err);
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
});

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
    shift: { ten_ca: 'Ca mac dinh', gio_bat_dau: '08:30', gio_ket_thuc: '17:30', _id: null },
    shiftStart,
    shiftEnd,
    earliestCheckIn,
  };
}

async function ensureAutoOvertimeRequest({ employeeId, record, shiftContext, now }) {
  try {
    if (!employeeId || !shiftContext?.shiftEnd) return;
    const overtimeMs = now - shiftContext.shiftEnd;
    if (overtimeMs < AUTO_OT_MINUTES * 60000) return;
    const ngay = startOfDay(record.ngay || now);
    const hours = Number((overtimeMs / 3600000).toFixed(2));
    if (hours <= 0) return;
    const { type, multiplier } = await classifyOvertimeType(ngay, shiftContext.shiftEnd, now);
    const existing = await OvertimeRequest.findOne({
      nhan_vien_id: employeeId,
      ngay,
      auto_created: true,
      trang_thai: { $in: ['Cho duyet', 'Da duyet'] },
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
  body('fingerprint_signature').isString().trim().isLength({ min: 10 }).withMessage('fingerprint_signature khong hop le'),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat({ min: 0, max: 5000 }),
];

async function processCheck(req, res, type) {
  const start = Date.now();
  try {
    const userId = req.user.id || req.user._id;
    const employeeId = req.user.nhan_vien_id || null;
    const { deviceIdHash, nonce, signature, fingerprint_signature, lat, lng, accuracy = 0 } = req.body;

    console.log('=== ATTENDANCE CHECK ===');
    console.log('userId:', userId);
    console.log('type:', type);
    console.log('fingerprint_signature:', fingerprint_signature ? 'present' : 'missing');

    const nonceDoc = await Nonce.findOne({ user_id: userId, nonce, used: false, expiresAt: { $gt: new Date() } });
    if (!nonceDoc) return res.status(400).json({ msg: 'Nonce khong hop le hoac da het han', type: 'invalid_nonce' });

    const device = await Device.findOne({ user_id: userId });
    if (!device) return res.status(409).json({ msg: 'Thiet bi chua dang ky', type: 'device_not_registered' });
    if (device.deviceIdHash !== deviceIdHash) return res.status(409).json({ msg: 'Thiet bi khong khop', type: 'device_mismatch' });
    if (device.revokedAt) return res.status(409).json({ msg: 'Thiet bi da bi thu hoi', type: 'device_revoked' });

    // CRITICAL: Verify fingerprint signature matches the registered one
    if (!device.fingerprint_signature) {
      console.log('⚠️ Device has no fingerprint registered');
      return res.status(400).json({
        msg: 'Thiết bị chưa đăng ký vân tay. Vui lòng đăng ký lại thiết bị.',
        type: 'fingerprint_not_registered'
      });
    }

    if (!fingerprint_signature) {
      console.log('⚠️ Missing fingerprint_signature in request');
      return res.status(400).json({
        msg: 'Thiếu chữ ký vân tay',
        type: 'missing_fingerprint'
      });
    }

    if (device.fingerprint_signature !== fingerprint_signature) {
      console.log('⚠️ Fingerprint mismatch');
      console.log('  Expected:', device.fingerprint_signature.substring(0, 20) + '...');
      console.log('  Received:', fingerprint_signature.substring(0, 20) + '...');
      return res.status(403).json({
        msg: 'Vân tay không khớp. Vui lòng sử dụng vân tay đã đăng ký.',
        type: 'fingerprint_mismatch'
      });
    }

    console.log('✅ Fingerprint verified successfully');

    const isValid = crypto.createVerify('sha256').update(Buffer.from(nonce)).verify(device.publicKeyPem, Buffer.from(signature, 'base64'));
    if (!isValid) return res.status(400).json({ msg: 'Chu ky khong hop le', type: 'invalid_signature' });

    const MAX_ACCURACY = 50;
    if (accuracy && Number(accuracy) > MAX_ACCURACY) {
      return res.status(400).json({ msg: `Do chinh xac GPS thap (${Math.round(accuracy)}m)`, type: 'low_gps_accuracy' });
    }

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

    if (!nearSites.length) return res.status(400).json({ msg: 'Khong co dia diem hop le gan ban', type: 'no_site_nearby' });
    const site = nearSites[0];
    const distance = haversineDistanceMeters(Number(lat), Number(lng), site.latitude, site.longitude);
    if (distance > site.radius) {
      return res.status(400).json({
        msg: `Ban cach ${Math.round(distance)}m. Can gan hon ${site.radius}m de cham cong`,
        type: 'out_of_radius',
        distance,
        requiredDistance: site.radius,
      });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const shiftContext = (await getShiftContext(employeeId, today)) || buildDefaultShift(today);

    if (type === 'check_in' && shiftContext.earliestCheckIn && now < shiftContext.earliestCheckIn) {
      return res.status(400).json({
        msg: `Chua toi gio cham cong. Chi duoc cham som toi da ${SHIFT_EARLY_MINUTES} phut (tu ${formatTime(shiftContext.earliestCheckIn)}).`,
        type: 'too_early',
      });
    }

    let flags = { isLate: false, lateOver30: false, lateMinutes: 0, shiftName: shiftContext.shift?.ten_ca || 'Ca mac dinh' };
    if (shiftContext.shiftStart) {
      const lateMinutes = Math.max(0, Math.round((now - shiftContext.shiftStart) / 60000));
      flags.isLate = lateMinutes > 5;
      flags.lateOver30 = lateMinutes > 30;
      flags.lateMinutes = lateMinutes;
      flags.shiftStart = shiftContext.shiftStart;
      flags.earliestCheckIn = shiftContext.earliestCheckIn;
    }

    let record = await ChamCong.findOne({ nhan_vien_id: employeeId, ngay: today });
    if (type === 'check_in') {
      if (record) return res.status(400).json({ msg: 'Hom nay ban da check-in roi' });
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
      if (!record) return res.status(404).json({ msg: 'Ban chua check-in hom nay' });
      if (record.thoi_gian_ra) return res.status(400).json({ msg: 'Hom nay ban da check-out roi' });
      record.thoi_gian_ra = now;
      await record.save();
      await ensureAutoOvertimeRequest({ employeeId, record, shiftContext, now });
      timeRuleEngine.queueRecalc(employeeId, today);
    }

    await Nonce.updateOne({ _id: nonceDoc._id }, { $set: { used: true } });

    await logAudit(req, {
      action: type === 'check_in' ? 'CREATE' : 'UPDATE',
      resource: 'mobile_attendance',
      resourceId: record?._id ? String(record._id) : null,
      statusCode: 200,
      responseTime: Date.now() - start,
      details: {
        type,
        siteId: site.siteId,
        distance: Math.round(distance),
        flags: record.flags || flags,
      },
    });

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
    await logAudit(req, {
      action: type === 'check_in' ? 'CREATE' : 'UPDATE',
      resource: 'mobile_attendance',
      resourceId: null,
      statusCode: res.statusCode || 500,
      responseTime: Date.now() - start,
      details: { error: err.message, type },
    });
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
}

router.get('/today', async (req, res) => {
  try {
    const employeeId = req.user.nhan_vien_id || null;
    if (!employeeId) return res.status(400).json({ msg: 'Thieu nhan_vien_id trong token' });
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
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const employeeId = req.user.nhan_vien_id || null;
    if (!employeeId) return res.status(400).json({ msg: 'Thieu nhan_vien_id trong token' });
    const { from, to, limit = 60 } = req.query;
    const filter = { nhan_vien_id: employeeId };
    if (from || to) {
      filter.ngay = {};
      if (from) filter.ngay.$gte = new Date(from);
      if (to) filter.ngay.$lte = new Date(to);
    } else {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      filter.ngay = { $gte: start };
    }
    const items = await ChamCong.find(filter).sort({ ngay: -1 }).limit(Math.min(Number(limit) || 60, 200)).lean();
    res.json({ data: items, total: items.length });
  } catch (err) {
    console.error('Error history attendance:', err);
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
});

router.post('/check-in', checkBodyValidators, handleValidation, (req, res) => processCheck(req, res, 'check_in'));
router.post('/check-out', checkBodyValidators, handleValidation, (req, res) => processCheck(req, res, 'check_out'));

module.exports = router;

const mongoose = require('mongoose');
const OvertimeRequest = require('../schemas/overtimeRequest.model');
const NhanVien = require('../schemas/nhanVien.model');
const {parseListParams, buildSort} = require('../utils/pagination');
const {sendMail} = require('../utils/mailer');
const {
  startOfDay,
  endOfDay,
  combineTimeWithDate: combineDateTime,
  classifyOvertimeType,
} = require('../services/overtimeHelper');
const timeRuleEngine = require('../services/timeRuleEngine');

const DAILY_LIMIT_HOURS = 4; // 50% so voi ngay lam viec 8h
const MONTHLY_LIMIT_HOURS = 40;
const YEARLY_LIMIT_HOURS = 300;

const STATUS_APPROVED = 'Da duyet';
const STATUS_PENDING = 'Cho duyet';

const STATUS_SET_FOR_LIMIT = [STATUS_PENDING, STATUS_APPROVED];

const NOTIFY_STATUSES = [STATUS_PENDING, STATUS_APPROVED, 'Bi tu choi'];
const ALERT_THRESHOLD = 0.8;

const addAuditLog = (doc, action, reqUser, note) => {
  if (!doc.audit_log) doc.audit_log = [];
  doc.audit_log.push({
    action,
    trang_thai: doc.trang_thai,
    user_id: reqUser?.nhan_vien_id || null,
    user_name: reqUser?.email || '',
    ghi_chu: note,
    at: new Date(),
  });
};


const normalizeObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
};

const sumHoursWithin = async (employeeId, from, to) => {
  const objectId = normalizeObjectId(employeeId);
  if (!objectId) return 0;
  const [result] = await OvertimeRequest.aggregate([
    {
      $match: {
        nhan_vien_id: objectId,
        ngay: {$gte: from, $lte: to},
        trang_thai: {$in: STATUS_SET_FOR_LIMIT},
      },
    },
    {
      $group: {_id: null, tong_gio: {$sum: '$so_gio'}},
    },
  ]);
  return result?.tong_gio || 0;
};

const validateLimits = async (nhanVienId, ngay, soGio) => {
  const dayStart = startOfDay(ngay);
  const dayEnd = endOfDay(ngay);
  const dailyHours = await sumHoursWithin(nhanVienId, dayStart, dayEnd);
  if (dailyHours + soGio > DAILY_LIMIT_HOURS + 1e-6) {
    return `Vuot gio OT toi da trong ngay (${DAILY_LIMIT_HOURS}h). Da dang ky ${dailyHours.toFixed(
      2,
    )}h.`;
  }

  const monthStart = new Date(ngay.getFullYear(), ngay.getMonth(), 1);
  const monthEnd = new Date(ngay.getFullYear(), ngay.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthHours = await sumHoursWithin(nhanVienId, monthStart, monthEnd);
  if (monthHours + soGio > MONTHLY_LIMIT_HOURS + 1e-6) {
    return `Vuot gio OT toi da trong thang (${MONTHLY_LIMIT_HOURS}h). Da dang ky ${monthHours.toFixed(
      2,
    )}h.`;
  }

  const yearStart = new Date(ngay.getFullYear(), 0, 1);
  const yearEnd = new Date(ngay.getFullYear(), 11, 31, 23, 59, 59, 999);
  const yearHours = await sumHoursWithin(nhanVienId, yearStart, yearEnd);
  if (yearHours + soGio > YEARLY_LIMIT_HOURS + 1e-6) {
    return `Vuot gio OT toi da trong nam (${YEARLY_LIMIT_HOURS}h). Da dang ky ${yearHours.toFixed(
      2,
    )}h.`;
  }
  return null;
};

const sendNotification = async (doc, employee, action) => {
  try {
    const recipients = [];
    if (process.env.HR_EMAIL) recipients.push(process.env.HR_EMAIL);
    if (employee?.lien_he?.email_cong_viec) {
      recipients.push(employee.lien_he.email_cong_viec);
    } else if (employee?.lien_he?.email_khac) {
      recipients.push(employee.lien_he.email_khac);
    }
    if (!recipients.length) return;
    const label = action === 'create' ? 'Yeu cau tang ca moi' : 'Cap nhat yeu cau tang ca';
    await sendMail({
      to: recipients.join(','),
      subject: `[OT] ${label} - ${employee?.ma_nhan_vien || ''}`,
      text: `Nhan vien ${employee?.ho_dem || ''} ${employee?.ten || ''} dang ky tang ca ${doc.so_gio}h (${doc.loai_ngay}). Trang thai: ${doc.trang_thai}`,
    });
  } catch (err) {
    console.error('sendNotification OT error', err);
  }
};

const buildAlertGroup = async ({from, to, limit}) => {
  if (!limit) return {limit: limit || 0, items: []};
  const agg = await OvertimeRequest.aggregate([
    {
      $match: {
        ngay: {$gte: from, $lte: to},
        trang_thai: {$in: STATUS_SET_FOR_LIMIT},
      },
    },
    {
      $group: {
        _id: '$nhan_vien_id',
        hours: {$sum: '$so_gio'},
      },
    },
    {
      $match: {
        hours: {$gte: limit * ALERT_THRESHOLD},
      },
    },
    {$sort: {hours: -1}},
    {$limit: 10},
  ]);

  if (!agg.length) {
    return {limit, items: []};
  }

  const ids = agg.map((item) => item._id).filter(Boolean);
  const employees = await NhanVien.find({_id: {$in: ids}})
    .select('ho_dem ten ma_nhan_vien thong_tin_cong_viec.phong_ban_id')
    .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
    .lean();
  const map = new Map(employees.map((emp) => [String(emp._id), emp]));

  return {
    limit,
    items: agg.map((item) => {
      const emp = map.get(String(item._id));
      const percent = Math.round((item.hours / limit) * 1000) / 10;
      return {
        nhan_vien_id: item._id,
        ho_ten: emp ? `${emp.ho_dem || ''} ${emp.ten || ''}`.trim() : '---',
        ma_nhan_vien: emp?.ma_nhan_vien || '',
        phong_ban: emp?.thong_tin_cong_viec?.phong_ban_id?.ten || '',
        hours: Number(item.hours.toFixed(2)),
        percent: percent > 999 ? 999 : percent,
        limit,
      };
    }),
  };
};

exports.createRequest = async (req, res) => {
  try {
    const payload = {...req.body};
    if (req.user?.role === 'employee' || req.user?.nhan_vien_id) {
      if (!req.user?.nhan_vien_id) {
        return res.status(400).json({msg: 'Tai khoan khong gan voi nhan vien'});
      }
      payload.nhan_vien_id = req.user.nhan_vien_id;
    }
    if (!payload.nhan_vien_id) {
      return res.status(400).json({msg: 'Thieu nhan vien'});
    }
    const ngay = new Date(payload.ngay);
    if (Number.isNaN(ngay.getTime())) {
      return res.status(400).json({msg: 'Ngay tang ca khong hop le'});
    }

    const start = payload.thoi_gian_bat_dau
      ? new Date(payload.thoi_gian_bat_dau)
      : combineDateTime(payload.ngay, payload.gio_bat_dau);
    const end = payload.thoi_gian_ket_thuc
      ? new Date(payload.thoi_gian_ket_thuc)
      : combineDateTime(payload.ngay, payload.gio_ket_thuc);
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({msg: 'Khong the doc gio bat dau/ket thuc'});
    }
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    const hours = (end - start) / 3600000;
    if (hours <= 0) {
      return res.status(400).json({msg: 'So gio tang ca khong hop le'});
    }

    const limitMsg = await validateLimits(payload.nhan_vien_id, ngay, hours);
    if (limitMsg) {
      return res.status(400).json({msg: limitMsg});
    }

    const {type, multiplier} = await classifyOvertimeType(ngay, start, end);
    const doc = await OvertimeRequest.create({
      nhan_vien_id: payload.nhan_vien_id,
      ngay,
      thoi_gian_bat_dau: start,
      thoi_gian_ket_thuc: end,
      so_gio: Number(hours.toFixed(2)),
      loai_ngay: type,
      he_so: Number(multiplier.toFixed(2)),
      ly_do: payload.ly_do || '',
      trang_thai: STATUS_PENDING,
    });
    addAuditLog(doc, 'create', req.user, payload.ly_do);
    await doc.save();
    const employee = await NhanVien.findById(doc.nhan_vien_id)
      .select('ho_dem ten ma_nhan_vien lien_he')
      .lean();
    timeRuleEngine.queueRecalc(doc.nhan_vien_id, doc.ngay);
    await sendNotification(doc, employee, 'create');
    res.status(201).json(doc);
  } catch (err) {
    console.error('createRequest error', err);
    res.status(500).json({msg: 'Khong the tao yeu cau tang ca', error: err.message});
  }
};

const buildFilter = (query = {}, req) => {
  const filter = {};
  if (query.nhan_vien_id) filter.nhan_vien_id = query.nhan_vien_id;
  if (query.trang_thai) filter.trang_thai = query.trang_thai;
  if (query.from && query.to) {
    filter.ngay = {
      $gte: new Date(query.from),
      $lte: new Date(query.to),
    };
  }
  if (
    req.user &&
    req.user.role === 'employee' &&
    req.user.nhan_vien_id &&
    !filter.nhan_vien_id
  ) {
    filter.nhan_vien_id = req.user.nhan_vien_id;
  }
  return filter;
};

exports.listRequests = async (req, res) => {
  try {
    const {limit, skip, sort, page, q} = parseListParams(req.query);
    const filter = buildFilter(req.query, req);
    if (q) {
      filter.$or = [
        {ly_do: {$regex: q, $options: 'i'}},
        {ghi_chu_quan_ly: {$regex: q, $options: 'i'}},
      ];
    }
    const [items, total] = await Promise.all([
      OvertimeRequest.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten ma_nhan_vien')
        .populate('nguoi_duyet_id', 'ho_dem ten ma_nhan_vien')
        .sort(buildSort(sort) || '-ngay')
        .skip(skip)
        .limit(limit),
      OvertimeRequest.countDocuments(filter),
    ]);
    res.json({
      data: items,
      pagination: {total, page, limit, totalPages: Math.ceil(total / limit)},
    });
  } catch (err) {
    console.error('listRequests error', err);
    res.status(500).json({msg: 'Khong the tai danh sach tang ca', error: err.message});
  }
};

exports.listMyRequests = async (req, res) => {
  if (!req.user?.nhan_vien_id) {
    return res.status(400).json({msg: 'Tai khoan khong gan voi nhan vien'});
  }
  try {
    const {limit, skip, page} = parseListParams(req.query);
    const filter = {
      nhan_vien_id: req.user.nhan_vien_id,
    };
    if (req.query.trang_thai) {
      filter.trang_thai = req.query.trang_thai;
    }
    const [items, total] = await Promise.all([
      OvertimeRequest.find(filter).sort('-ngay').skip(skip).limit(limit),
      OvertimeRequest.countDocuments(filter),
    ]);
    res.json({
      data: items,
      pagination: {total, page, limit, totalPages: Math.ceil(total / limit)},
    });
  } catch (err) {
    console.error('listMyRequests error', err);
    res.status(500).json({msg: 'Khong the tai yeu cau tang ca', error: err.message});
  }
};

exports.updateStatus = async (req, res) => {
  try {
    if (!(req.user && ['admin', 'manager'].includes(req.user.role))) {
      return res.status(403).json({msg: 'Chi HR/Manager moi duoc duyet OT'});
    }
    const doc = await OvertimeRequest.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({msg: 'Khong tim thay yeu cau'});
    }
    if (doc.trang_thai === 'Da huy') {
      return res.status(400).json({msg: 'Yeu cau da huy khong the cap nhat'});
    }

    const {trang_thai, ghi_chu_quan_ly} = req.body;
    if (!['Da duyet', 'Bi tu choi'].includes(trang_thai)) {
      return res.status(400).json({msg: 'Trang thai khong hop le'});
    }
    doc.trang_thai = trang_thai;
    if (ghi_chu_quan_ly !== undefined) doc.ghi_chu_quan_ly = ghi_chu_quan_ly;
    if (req.user.nhan_vien_id) doc.nguoi_duyet_id = req.user.nhan_vien_id;
    addAuditLog(doc, `update:${trang_thai}`, req.user, ghi_chu_quan_ly);
    await doc.save();
    timeRuleEngine.queueRecalc(doc.nhan_vien_id, doc.ngay);
    const employee = await NhanVien.findById(doc.nhan_vien_id)
      .select('ho_dem ten ma_nhan_vien lien_he')
      .lean();
    if (NOTIFY_STATUSES.includes(trang_thai)) {
      await sendNotification(doc, employee, 'update');
    }
    res.json(doc);
  } catch (err) {
    console.error('updateStatus OT error', err);
    res.status(500).json({msg: 'Khong the cap nhat yeu cau', error: err.message});
  }
};

exports.cancelRequest = async (req, res) => {
  if (!req.user?.nhan_vien_id) {
    return res.status(400).json({msg: 'Tai khoan khong gan voi nhan vien'});
  }
  try {
    const doc = await OvertimeRequest.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({msg: 'Khong tim thay yeu cau'});
    }
    if (String(doc.nhan_vien_id) !== String(req.user.nhan_vien_id)) {
      return res.status(403).json({msg: 'Khong the huy yeu cau cua nguoi khac'});
    }
    if (doc.trang_thai !== STATUS_PENDING) {
      return res.status(400).json({msg: 'Chi huy duoc yeu cau dang cho duyet'});
    }
    doc.trang_thai = 'Da huy';
    addAuditLog(doc, 'cancel', req.user);
    await doc.save();
    timeRuleEngine.queueRecalc(doc.nhan_vien_id, doc.ngay);
    res.json(doc);
  } catch (err) {
    console.error('cancelRequest OT error', err);
    res.status(500).json({msg: 'Khong the huy yeu cau', error: err.message});
  }
};

exports.getAlerts = async (_req, res) => {
  try {
    const today = new Date();
    const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
    const monthEnd = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    const yearStart = startOfDay(new Date(today.getFullYear(), 0, 1));
    const yearEnd = endOfDay(new Date(today.getFullYear(), 11, 31));
    const [day, month, year] = await Promise.all([
      buildAlertGroup({from: startOfDay(today), to: endOfDay(today), limit: DAILY_LIMIT_HOURS}),
      buildAlertGroup({from: monthStart, to: monthEnd, limit: MONTHLY_LIMIT_HOURS}),
      buildAlertGroup({from: yearStart, to: yearEnd, limit: YEARLY_LIMIT_HOURS}),
    ]);
    res.json({day, month, year});
  } catch (err) {
    console.error('getAlerts error', err);
    res.status(500).json({msg: 'Khong the tai canh bao tang ca', error: err.message});
  }
};

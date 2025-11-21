const mongoose = require('mongoose');
const DailyTimeSummary = require('../schemas/dailyTimeSummary.model');
const NhanVien = require('../schemas/nhanVien.model');
const timeRuleEngine = require('../services/timeRuleEngine');
const {parseListParams} = require('../utils/pagination');

function normalizeDay(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resolveEmployeeFilter({nhan_vien_id, phong_ban_id}) {
  const filter = {da_xoa: {$ne: true}};
  if (nhan_vien_id) {
    if (!mongoose.Types.ObjectId.isValid(nhan_vien_id)) {
      return [];
    }
    filter._id = nhan_vien_id;
  }
  if (phong_ban_id) {
    filter['thong_tin_cong_viec.phong_ban_id'] = phong_ban_id;
  }
  const employees = await NhanVien.find(filter)
    .select('ho_dem ten ma_nhan_vien thong_tin_cong_viec')
    .lean();
  return employees;
}

exports.listDailySummaries = async (req, res) => {
  try {
    const {limit, skip, page, sort} = parseListParams(req.query);
    const query = {};
    const from = normalizeDay(req.query.from);
    const to = normalizeDay(req.query.to);
    if (from || to) {
      query.ngay = {};
      if (from) query.ngay.$gte = from;
      if (to) query.ngay.$lte = to;
    }
    if (req.query.trang_thai) query.status = req.query.trang_thai;
    if (req.query.nhan_vien_id) {
      query.nhan_vien_id = req.query.nhan_vien_id;
    } else if (req.query.phong_ban_id) {
      const employees = await resolveEmployeeFilter({
        phong_ban_id: req.query.phong_ban_id,
      });
      if (!employees.length) {
        return res.json({
          data: [],
          pagination: {total: 0, page, limit, totalPages: 0},
        });
      }
      query.nhan_vien_id = {$in: employees.map((emp) => emp._id)};
    }

    const [items, total] = await Promise.all([
      DailyTimeSummary.find(query)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .sort(sort || '-ngay')
        .skip(skip)
        .limit(limit)
        .lean(),
      DailyTimeSummary.countDocuments(query),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('listDailySummaries error', err);
    res.status(500).json({msg: 'Khong the tai rule engine', error: err.message});
  }
};

exports.recalculateRange = async (req, res) => {
  try {
    const {from_date, to_date, nhan_vien_ids, phong_ban_id} = req.body || {};
    if (!from_date) {
      return res.status(400).json({msg: 'Vui long chon ngay bat dau tinh toan'});
    }
    const from = normalizeDay(from_date);
    const to = normalizeDay(to_date || from_date);
    if (!from || !to) {
      return res.status(400).json({msg: 'Ngay khong hop le'});
    }
    if (to < from) {
      return res.status(400).json({msg: 'Khoang thoi gian khong hop le'});
    }
    const employeeFilter = {da_xoa: {$ne: true}};
    let targetIds = [];
    if (Array.isArray(nhan_vien_ids) && nhan_vien_ids.length) {
      targetIds = nhan_vien_ids.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (!targetIds.length) {
        return res.status(400).json({msg: 'Danh sach nhan vien khong hop le'});
      }
      employeeFilter._id = {$in: targetIds};
    }
    if (phong_ban_id && mongoose.Types.ObjectId.isValid(phong_ban_id)) {
      employeeFilter['thong_tin_cong_viec.phong_ban_id'] = phong_ban_id;
    }

    const employees = await NhanVien.find(employeeFilter)
      .select('ho_dem ten ma_nhan_vien thong_tin_cong_viec')
      .lean();
    if (!employees.length) {
      return res.status(400).json({msg: 'Khong tim thay nhan vien phu hop'});
    }

    await timeRuleEngine.recalcRange({employees, from, to});
    res.json({
      msg: 'Da xu ly rule engine',
      metadata: {
        employees: employees.length,
        range_days: Math.round((to - from) / 86400000) + 1,
      },
    });
  } catch (err) {
    console.error('recalculateRange error', err);
    res.status(500).json({msg: 'Khong the tinh toan', error: err.message});
  }
};

exports.getViolations = async (req, res) => {
  try {
    const match = {};
    const from = normalizeDay(req.query.from);
    const to = normalizeDay(req.query.to);
    if (from || to) {
      match.ngay = {};
      if (from) match.ngay.$gte = from;
      if (to) match.ngay.$lte = to;
    }
    match.status = {
      $in: [
        'Late',
        'EarlyOut',
        'LateEarly',
        'MissingCheckin',
        'MissingCheckout',
        'Absent',
      ],
    };
    const agg = await DailyTimeSummary.aggregate([
      {$match: match},
      {$group: {_id: '$status', count: {$sum: 1}}},
    ]);
    res.json({data: agg});
  } catch (err) {
    console.error('getViolations error', err);
    res.status(500).json({msg: 'Khong the thong ke vi pham', error: err.message});
  }
};

exports.getMySummaries = async (req, res) => {
  if (!req.user?.nhan_vien_id) {
    return res.status(400).json({msg: 'Tai khoan khong gan voi nhan vien'});
  }
  try {
    const {limit, skip, page} = parseListParams(req.query);
    const query = {nhan_vien_id: req.user.nhan_vien_id};
    const from = normalizeDay(req.query.from);
    const to = normalizeDay(req.query.to);
    if (from || to) {
      query.ngay = {};
      if (from) query.ngay.$gte = from;
      if (to) query.ngay.$lte = to;
    }
    const [items, total] = await Promise.all([
      DailyTimeSummary.find(query)
        .sort('-ngay')
        .skip(skip)
        .limit(limit)
        .lean(),
      DailyTimeSummary.countDocuments(query),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('getMySummaries error', err);
    res.status(500).json({msg: 'Khong the tai du lieu cua ban', error: err.message});
  }
};

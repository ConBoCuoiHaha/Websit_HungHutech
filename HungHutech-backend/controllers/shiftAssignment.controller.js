const mongoose = require('mongoose');
const ShiftAssignment = require('../schemas/shiftAssignment.model');
const CaLamViec = require('../schemas/caLamViec.model');
const {parseListParams} = require('../utils/pagination');
const timeRuleEngine = require('../services/timeRuleEngine');

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

exports.listAssignments = async (req, res) => {
  try {
    const {limit, skip, page} = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    if (req.query.from || req.query.to) {
      filter.ngay = {};
      if (req.query.from) {
        const from = normalizeDay(req.query.from);
        if (!from) return res.status(400).json({msg: 'Ngay bat dau khong hop le'});
        filter.ngay.$gte = from;
      }
      if (req.query.to) {
        const to = normalizeDay(req.query.to);
        if (!to) return res.status(400).json({msg: 'Ngay ket thuc khong hop le'});
        filter.ngay.$lte = to;
      }
    }

    const [items, total] = await Promise.all([
      ShiftAssignment.find(filter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .populate('ca_lam_viec_id', 'ten_ca gio_bat_dau gio_ket_thuc')
        .sort({ngay: 1})
        .skip(skip)
        .limit(limit),
      ShiftAssignment.countDocuments(filter),
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
    console.error('listAssignments error', err);
    res.status(500).json({msg: 'Khong the tai phan cong ca lam viec', error: err.message});
  }
};

exports.bulkAssign = async (req, res) => {
  try {
    const {
      nhan_vien_ids: rawEmployeeIds,
      ca_lam_viec_id,
      from_date,
      to_date,
      ghi_chu,
    } = req.body || {};

    const employeeIds = (rawEmployeeIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (!employeeIds.length) {
      return res.status(400).json({msg: 'Vui long chon nhan vien de phan ca'});
    }
    if (!ca_lam_viec_id || !mongoose.Types.ObjectId.isValid(ca_lam_viec_id)) {
      return res.status(400).json({msg: 'Ca lam viec khong hop le'});
    }
    if (!from_date) {
      return res.status(400).json({msg: 'Thieu ngay bat dau'});
    }

    const shift = await CaLamViec.findById(ca_lam_viec_id).lean();
    if (!shift) {
      return res.status(404).json({msg: 'Khong tim thay ca lam viec'});
    }

    const from = normalizeDay(from_date);
    const to = normalizeDay(to_date || from_date);
    if (!from || !to) {
      return res.status(400).json({msg: 'Ngay phan ca khong hop le'});
    }
    if (to < from) {
      return res.status(400).json({msg: 'Khoang thoi gian khong hop le'});
    }
    const rangeDays = Math.round((to - from) / 86400000) + 1;
    if (rangeDays > 62) {
      return res.status(400).json({msg: 'Chi cho phep phan ca toi da 62 ngay / dot'});
    }

    const snapshot = {
      ten_ca: shift.ten_ca,
      gio_bat_dau: shift.gio_bat_dau,
      gio_ket_thuc: shift.gio_ket_thuc,
      thoi_gian_nghi: shift.thoi_gian_nghi,
    };

    const actorId = req.user?.nhan_vien_id || null;
    const tasks = [];
    employeeIds.forEach((employeeId) => {
      for (let day = 0; day < rangeDays; day += 1) {
        const current = new Date(from);
        current.setDate(from.getDate() + day);
        tasks.push(
          ShiftAssignment.findOneAndUpdate(
            {nhan_vien_id: employeeId, ngay: current},
            {
              $set: {
                nhan_vien_id: employeeId,
                ngay: current,
                ca_lam_viec_id,
                shift_snapshot: snapshot,
                nguoi_phan_cong_id: actorId,
                ghi_chu: ghi_chu || '',
              },
            },
            {upsert: true, new: true, setDefaultsOnInsert: true},
          ),
        );
      }
    });

    await Promise.all(tasks);
    employeeIds.forEach((employeeId) => {
      for (let day = 0; day < rangeDays; day += 1) {
        const current = new Date(from);
        current.setDate(from.getDate() + day);
        timeRuleEngine.queueRecalc(employeeId, current);
      }
    });

    res.json({
      msg: 'Da phan ca thanh cong',
      metadata: {employees: employeeIds.length, days: rangeDays},
    });
  } catch (err) {
    console.error('bulkAssign shift error', err);
    res.status(500).json({msg: 'Khong the phan ca', error: err.message});
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await ShiftAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({msg: 'Khong tim thay phan cong'});
    }
    timeRuleEngine.queueRecalc(assignment.nhan_vien_id, assignment.ngay);
    res.json({msg: 'Da xoa phan cong ca lam viec'});
  } catch (err) {
    console.error('deleteAssignment error', err);
    res.status(500).json({msg: 'Khong the xoa phan cong', error: err.message});
  }
};

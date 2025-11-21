const ChamCong = require('../schemas/chamCong.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const OvertimeRequest = require('../schemas/overtimeRequest.model');
const ShiftAssignment = require('../schemas/shiftAssignment.model');
const DailyTimeSummary = require('../schemas/dailyTimeSummary.model');
const NhanVien = require('../schemas/nhanVien.model');
const CaLamViec = require('../schemas/caLamViec.model');

const DEFAULT_SHIFT = {
  ten_ca: 'Ca hanh chinh',
  gio_bat_dau: '08:30',
  gio_ket_thuc: '17:30',
  thoi_gian_nghi: 60,
};

function normalizeDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDateTime(baseDate, hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const dt = new Date(baseDate);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function buildShiftTimes(shiftSnapshot, ngay) {
  if (!shiftSnapshot) return {shiftStart: null, shiftEnd: null};
  const shiftStart = buildDateTime(ngay, shiftSnapshot.gio_bat_dau);
  let shiftEnd = buildDateTime(ngay, shiftSnapshot.gio_ket_thuc);
  if (shiftStart && shiftEnd && shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }
  return {shiftStart, shiftEnd};
}

function diffMinutes(from, to) {
  if (!from || !to) return 0;
  return Math.round((to - from) / 60000);
}

function computeShiftMinutes(shiftSnapshot, shiftStart, shiftEnd) {
  if (!shiftSnapshot || !shiftStart || !shiftEnd) return 0;
  const total = diffMinutes(shiftStart, shiftEnd);
  return Math.max(0, total - (shiftSnapshot.thoi_gian_nghi || 0));
}

async function resolveShift(nhanVienId, ngay, employeeCache) {
  const day = normalizeDay(ngay);
  const assignment = await ShiftAssignment.findOne({
    nhan_vien_id: nhanVienId,
    ngay: day,
  })
    .populate('ca_lam_viec_id')
    .lean();

  if (assignment) {
    const snapshot =
      assignment.shift_snapshot ||
      (assignment.ca_lam_viec_id && {
        ten_ca: assignment.ca_lam_viec_id.ten_ca,
        gio_bat_dau: assignment.ca_lam_viec_id.gio_bat_dau,
        gio_ket_thuc: assignment.ca_lam_viec_id.gio_ket_thuc,
        thoi_gian_nghi: assignment.ca_lam_viec_id.thoi_gian_nghi,
      }) ||
      {...DEFAULT_SHIFT};
    const {shiftStart, shiftEnd} = buildShiftTimes(snapshot, day);
    return {
      shift_snapshot: snapshot,
      shift_assignment_id: assignment._id,
      shiftStart,
      shiftEnd,
    };
  }

  let employee = employeeCache;
  if (!employee) {
    employee = await NhanVien.findById(nhanVienId)
      .select('thong_tin_cong_viec.ca_lam_viec_id')
      .lean();
  }
  let shiftDoc = null;
  if (employee?.thong_tin_cong_viec?.ca_lam_viec_id) {
    const shiftId = employee.thong_tin_cong_viec.ca_lam_viec_id;
    shiftDoc = await CaLamViec.findById(shiftId).lean();
  }
  const snapshot = shiftDoc
    ? {
        ten_ca: shiftDoc.ten_ca,
        gio_bat_dau: shiftDoc.gio_bat_dau,
        gio_ket_thuc: shiftDoc.gio_ket_thuc,
        thoi_gian_nghi: shiftDoc.thoi_gian_nghi,
      }
    : {...DEFAULT_SHIFT};
  const {shiftStart, shiftEnd} = buildShiftTimes(snapshot, day);
  return {
    shift_snapshot: snapshot,
    shift_assignment_id: null,
    shiftStart,
    shiftEnd,
  };
}

async function fetchLeaveRecords(nhanVienId, dayStart, dayEnd) {
  return YeuCauNghiPhep.find({
    nhan_vien_id: nhanVienId,
    trang_thai: 'Da duyet',
    ngay_bat_dau: {$lte: dayEnd},
    ngay_ket_thuc: {$gte: dayStart},
  })
    .populate('loai_ngay_nghi_id', 'ten co_luong')
    .lean();
}

async function fetchOvertimeRecords(nhanVienId, dayStart) {
  return OvertimeRequest.find({
    nhan_vien_id: nhanVienId,
    ngay: dayStart,
    trang_thai: 'Da duyet',
  })
    .select('so_gio he_so loai_ngay')
    .lean();
}

async function calculateDailySummary({
  nhan_vien_id,
  ngay,
  employee,
}) {
  const dayStart = normalizeDay(ngay);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const shiftContext = await resolveShift(nhan_vien_id, dayStart, employee);
  const shiftMinutes = computeShiftMinutes(
    shiftContext.shift_snapshot,
    shiftContext.shiftStart,
    shiftContext.shiftEnd,
  );

  const attendance = await ChamCong.findOne({
    nhan_vien_id,
    ngay: dayStart,
  }).lean();
  const leaves = await fetchLeaveRecords(nhan_vien_id, dayStart, dayEnd);
  const overtime = await fetchOvertimeRecords(nhan_vien_id, dayStart);

  const leavePaid = leaves.some(
    (leave) => leave.loai_ngay_nghi_id?.co_luong,
  );
  const leaveMinutes = leaves.length ? shiftMinutes : 0;

  let workMinutes = 0;
  let checkIn = attendance?.thoi_gian_vao || null;
  let checkOut = attendance?.thoi_gian_ra || null;
  if (checkIn && checkOut) {
    workMinutes = Math.max(
      0,
      diffMinutes(checkIn, checkOut) -
        (shiftContext.shift_snapshot?.thoi_gian_nghi || 0),
    );
  }

  let status = 'NoData';
  const violations = [];
  let lateMinutes = 0;
  let earlyMinutes = 0;

  if (leaves.length && !attendance) {
    status = 'Leave';
  } else if (!attendance) {
    status = 'Absent';
    violations.push('absent');
  } else {
    if (!checkIn) {
      status = 'MissingCheckin';
      violations.push('missing_checkin');
    }
    if (!checkOut) {
      status = status === 'MissingCheckin' ? 'NoData' : 'MissingCheckout';
      violations.push('missing_checkout');
    }
    if (checkIn && shiftContext.shiftStart) {
      lateMinutes = Math.max(
        0,
        diffMinutes(shiftContext.shiftStart, checkIn),
      );
      if (lateMinutes >= 1) {
        violations.push(
          lateMinutes >= 30 ? 'late_over_30' : 'late_under_30',
        );
      }
    }
    if (checkOut && shiftContext.shiftEnd) {
      earlyMinutes = Math.max(
        0,
        diffMinutes(checkOut, shiftContext.shiftEnd),
      );
      if (earlyMinutes >= 1) {
        violations.push(
          earlyMinutes >= 30 ? 'early_over_30' : 'early_under_30',
        );
      }
    }

    if (checkIn && checkOut) {
      if (lateMinutes && earlyMinutes) status = 'LateEarly';
      else if (lateMinutes) status = 'Late';
      else if (earlyMinutes) status = 'EarlyOut';
      else status = 'OnTime';
    } else if (checkIn && !checkOut) {
      status = 'MissingCheckout';
    } else if (!checkIn && checkOut) {
      status = 'MissingCheckin';
    }
  }

  if (leaves.length && attendance) {
    status = 'Leave';
  }

  const otHours = overtime.reduce(
    (sum, item) => sum + Number(item.so_gio || 0),
    0,
  );
  const otMinutes = Math.round(otHours * 60);
  const totalMultiplierWeight = overtime.reduce((sum, item) => {
    const hours = Number(item.so_gio || 0);
    const heSo = Number(item.he_so || 0);
    return sum + hours * heSo;
  }, 0);
  const avgMultiplier = otHours
    ? Number((totalMultiplierWeight / otHours).toFixed(2))
    : 0;

  let paidMinutes = Math.min(workMinutes, shiftMinutes);
  if (leavePaid && leaveMinutes) {
    paidMinutes = Math.max(paidMinutes, leaveMinutes);
  }
  const notes = [];
  if (lateMinutes) notes.push(`Di tre ${lateMinutes} phut`);
  if (earlyMinutes) notes.push(`Ve som ${earlyMinutes} phut`);
  if (!attendance && !leaves.length) notes.push('Khong co cham cong');
  if (leaves.length) {
    notes.push(
      `Nghi: ${leaves
        .map((leave) => leave.loai_ngay_nghi_id?.ten || '---')
        .join(', ')}`,
    );
  }
  if (otHours) {
    notes.push(`Tang ca ${otHours.toFixed(2)}h (x${avgMultiplier || 0})`);
  }

  if (paidMinutes < workMinutes && !leavePaid) {
    paidMinutes = workMinutes;
  }

  const summary = {
    nhan_vien_id,
    ngay: dayStart,
    shift_assignment_id: shiftContext.shift_assignment_id,
    shift_snapshot: shiftContext.shift_snapshot,
    check_in: checkIn,
    check_out: checkOut,
    work_minutes: workMinutes,
    paid_minutes: paidMinutes,
    leave_minutes: leaveMinutes,
    ot_minutes: otMinutes,
    ot_hours: Number(otHours.toFixed(2)),
    ot_multiplier: avgMultiplier,
    late_minutes: lateMinutes,
    early_minutes: earlyMinutes,
    status,
    violations,
    notes: notes.join('; '),
    data_sources: {
      attendance_id: attendance?._id || null,
      leave_request_ids: leaves.map((leave) => leave._id),
      overtime_request_ids: overtime.map((item) => item._id),
    },
    computed_at: new Date(),
  };

  await DailyTimeSummary.findOneAndUpdate(
    {nhan_vien_id, ngay: dayStart},
    {$set: summary},
    {upsert: true, new: true},
  );
  return summary;
}

const pendingKeys = new Set();

function queueRecalc(nhan_vien_id, ngay) {
  if (!nhan_vien_id || !ngay) return;
  const dayStart = normalizeDay(ngay);
  const key = `${nhan_vien_id}-${dayStart.toISOString()}`;
  if (pendingKeys.has(key)) return;
  pendingKeys.add(key);
  setImmediate(async () => {
    try {
      await calculateDailySummary({nhan_vien_id, ngay: dayStart});
    } catch (err) {
      console.error('timeRuleEngine queueRecalc error', err);
    } finally {
      pendingKeys.delete(key);
    }
  });
}

async function recalcRange({employees, from, to}) {
  const start = normalizeDay(from);
  const end = normalizeDay(to || from);
  const days = Math.round((end - start) / 86400000) + 1;
  if (days > 62) {
    throw new Error('Khoang thoi gian qua lon (toi da 62 ngay / dot).');
  }
  if (!Array.isArray(employees) || !employees.length) {
    throw new Error('Khong co nhan vien hop le de tinh toan.');
  }

  for (const employee of employees) {
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      try {
        await calculateDailySummary({
          nhan_vien_id: employee._id,
          ngay: date,
          employee,
        });
      } catch (err) {
        console.error(
          'recalcRange error',
          employee._id?.toString(),
          date.toISOString(),
          err,
        );
      }
    }
  }
}

async function listSummaries(filter = {}, options = {}) {
  const query = {};
  if (filter.nhan_vien_id) query.nhan_vien_id = filter.nhan_vien_id;
  if (filter.trang_thai) query.status = filter.trang_thai;
  if (filter.from) query.ngay = {...query.ngay, $gte: normalizeDay(filter.from)};
  if (filter.to) query.ngay = {...query.ngay, $lte: normalizeDay(filter.to)};

  const cursor = DailyTimeSummary.find(query)
    .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
    .sort(options.sort || '-ngay');
  if (options.limit) cursor.limit(options.limit);
  if (options.skip) cursor.skip(options.skip);
  const [items, total] = await Promise.all([
    cursor.lean(),
    DailyTimeSummary.countDocuments(query),
  ]);
  return {items, total};
}

module.exports = {
  DEFAULT_SHIFT,
  queueRecalc,
  recalcRange,
  calculateDailySummary,
  listSummaries,
};

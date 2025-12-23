const mongoose = require('mongoose');
const PayrollRun = require('../schemas/payrollRun.model');
const NhanVien = require('../schemas/nhanVien.model');
const PerformanceReview = require('../schemas/performanceReview.model');
const { parseListParams, buildSort } = require('../utils/pagination');
const { calculatePayrollEntry, roundVnd } = require('../utils/payrollEngine');
const { Parser } = require('json2csv');
const SalaryConfig = require('../schemas/salaryConfig.model');
const WORKING_DAYS_IN_MONTH = 22;
const HOURS_PER_DAY = 8;

const FALLBACK_SALARY_CONFIG = {
  muc_luong_bat_dau_tinh_tncn: 9000000,
  giam_tru_phu_thuoc: 3600000,
  lam_tron_luong_thuc_linh: -3,
  luong_co_ban_bhxh_bhyt: 1300000,
  luong_toi_thieu_vung_bhtn: 3980000,
  khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi: 5,
  ti_le_dn: { bhxh: 18, bhyt: 3, bhtn: 1, kpcd: 0, tien: 0 },
  ti_le_nld: { bhxh: 8, bhyt: 1.5, bhtn: 1, kpcd: 0, tien: 50000 },
  thue_tncn_bac: {
    bac5: 5000000,
    bac10: 10000000,
    bac15: 18000000,
    bac20: 32000000,
    bac25: 52000000,
    bac30: 80000000,
    bac35: 1000000000,
  },
};

// Cấu hình mặc định dùng khi chưa có cấu hình thu nhập
const DEFAULT_SETTINGS = {
  ti_le_bhxh: 0.08,
  ti_le_bhyt: 0.015,
  ti_le_bhtn: 0.01,
  ti_le_kpcd: 0.01,
  ap_dung_kpcd: true,
  giam_tru_ban_than: FALLBACK_SALARY_CONFIG.muc_luong_bat_dau_tinh_tncn || 11000000,
  giam_tru_phu_thuoc: FALLBACK_SALARY_CONFIG.giam_tru_phu_thuoc || 4400000,
  luong_co_ban_bhxh_bhyt: FALLBACK_SALARY_CONFIG.luong_co_ban_bhxh_bhyt || 0,
  luong_toi_thieu_vung_bhtn: FALLBACK_SALARY_CONFIG.luong_toi_thieu_vung_bhtn || 0,
  khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi:
    FALLBACK_SALARY_CONFIG.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi || 0,
  lam_tron_luong_thuc_linh: FALLBACK_SALARY_CONFIG.lam_tron_luong_thuc_linh || 0,
  thue_tncn_bac: FALLBACK_SALARY_CONFIG.thue_tncn_bac || {},
};

const rateFromPercent = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
};
function decimalToNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (typeof value === 'object') {
    if (value.$numberDecimal) return Number(value.$numberDecimal) || 0;
    if (typeof value.toString === 'function') return Number(value.toString()) || 0;
  }
  return 0;
}

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function appendAuditLog(doc, action, user, notes) {
  if (!doc.audit_log) doc.audit_log = [];
  doc.audit_log.push({
    action,
    trang_thai: doc.trang_thai,
    user_id: user?.nhan_vien_id || null,
    user_name: user?.email || '',
    ghi_chu: notes,
    at: new Date(),
  });
}

async function ensureSalaryConfig() {
  let config = await SalaryConfig.findOne();
  if (!config) {
    config = await SalaryConfig.create(FALLBACK_SALARY_CONFIG);
  }
  return config.toObject();
}

function mapSalaryConfigToSettings(config = {}) {
  const tiLeNld = config.ti_le_nld || {};
  return {
    ti_le_bhxh: rateFromPercent(tiLeNld.bhxh),
    ti_le_bhyt: rateFromPercent(tiLeNld.bhyt),
    ti_le_bhtn: rateFromPercent(tiLeNld.bhtn),
    ti_le_kpcd: rateFromPercent(tiLeNld.kpcd),
    ap_dung_kpcd: true,
    giam_tru_ban_than:
      Number(config.muc_luong_bat_dau_tinh_tncn) || DEFAULT_SETTINGS.giam_tru_ban_than,
    giam_tru_phu_thuoc:
      Number(config.giam_tru_phu_thuoc) || DEFAULT_SETTINGS.giam_tru_phu_thuoc,
    luong_co_ban_bhxh_bhyt: Number(config.luong_co_ban_bhxh_bhyt) || 0,
    luong_toi_thieu_vung_bhtn: Number(config.luong_toi_thieu_vung_bhtn) || 0,
    khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi:
      Number(config.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi) || 0,
    lam_tron_luong_thuc_linh: Number(config.lam_tron_luong_thuc_linh) || 0,
    thue_tncn_bac: config.thue_tncn_bac || {},
  };
}

async function sendPayslipEmails(runDoc, type) {
  try {
    const employeeIds = runDoc.entries
      .map((entry) => entry.nhan_vien_id)
      .filter((id) => !!id);
    if (!employeeIds.length) return;
    const employees = await NhanVien.find({ _id: { $in: employeeIds } })
      .select('ho_dem ten lien_he.email_cong_viec lien_he.email_khac');
    const employeeMap = new Map(
      employees.map((emp) => [
        String(emp._id),
        {
          name: `${emp.ho_dem || ''} ${emp.ten || ''}`.trim(),
          email:
            emp.lien_he?.email_cong_viec ||
            emp.lien_he?.email_khac ||
            null,
        },
      ]),
    );
    for (const entry of runDoc.entries) {
      const info = employeeMap.get(String(entry.nhan_vien_id));
      if (!info?.email) continue;
      const subject =
        type === 'paid'
          ? `Phiếu lương ${runDoc.ky_luong} đã được chi`
          : `Phiếu lương ${runDoc.ky_luong} đã được tạo`;
      const amount = entry.luong_thuc_nhan || entry.tong_thu_nhap || 0;
      const bodyLines = [
        `Xin chào ${info.name || 'Anh/Chị'},`,
        '',
        type === 'paid'
          ? `Phiếu lương kỳ ${runDoc.ky_luong} đã được chi trả.`
          : `Phiếu lương kỳ ${runDoc.ky_luong} đã được tạo trên hệ thống.`,
        `Giá trị thực nhận (ước tính): ${Math.round(amount).toLocaleString('vi-VN')} ${
          runDoc.currency || 'VND'
        }.`,
        '',
        'Bạn có thể đăng nhập vào cổng nhân viên để xem chi tiết.',
        '',
        'Trân trọng,',
        'Hung Hutech HRM',
      ];
      await sendMail({
        to: info.email,
        subject,
        text: bodyLines.join('\n'),
      });
    }
  } catch (err) {
    console.error('Error sending payslip emails:', err);
  }
}
function formatDateRangeVN(start, end) {
  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN');
  };
  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`.trim();
  }
  return formatDate(start || end);
}

async function linkPerformanceBonusesToReviews(runDoc) {
  try {
    if (!runDoc?.entries?.length) return;
    const bulkOps = [];
    runDoc.entries.forEach((entry) => {
      (entry.thuong || []).forEach((bonus) => {
        if (bonus.reference_type === 'performance_review' && bonus.reference_id) {
          bulkOps.push({
            updateOne: {
              filter: { _id: bonus.reference_id },
              update: {
                $set: { da_chuyen_payroll: true },
                $push: {
                  payroll_history: {
                    payroll_run_id: runDoc._id,
                    payroll_entry_id: entry._id,
                    so_tien: bonus.so_tien,
                    ky_luong: runDoc.ky_luong,
                    ngay_chuyen: new Date(),
                  },
                },
              },
            },
          });
        }
      });
    });
    if (bulkOps.length) {
      await PerformanceReview.bulkWrite(bulkOps, { ordered: false });
    }
  } catch (err) {
    console.error('Error linking performance reviews to payroll:', err);
  }
}
const Timesheet = require('../schemas/timesheet.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const LoaiNgayNghi = require('../schemas/loaiNgayNghi.model');
const OvertimeRequest = require('../schemas/overtimeRequest.model');
const ChamCong = require('../schemas/chamCong.model');
const { sendMail } = require('../utils/mailer');

const RUN_STATUSES = ['Draft', 'Cho_duyet', 'Da_duyet', 'Da_chi'];
const ENTRY_STATUSES = ['Cho_duyet', 'Da_duyet', 'Da_chi'];

function normalizeSettings(settings = {}) {
  return {
    ti_le_bhxh: Number(settings.ti_le_bhxh ?? DEFAULT_SETTINGS.ti_le_bhxh),
    ti_le_bhyt: Number(settings.ti_le_bhyt ?? DEFAULT_SETTINGS.ti_le_bhyt),
    ti_le_bhtn: Number(settings.ti_le_bhtn ?? DEFAULT_SETTINGS.ti_le_bhtn),
    ti_le_kpcd: Number(settings.ti_le_kpcd ?? DEFAULT_SETTINGS.ti_le_kpcd),
    ap_dung_kpcd: settings.ap_dung_kpcd ?? DEFAULT_SETTINGS.ap_dung_kpcd,
    giam_tru_ban_than: Number(settings.giam_tru_ban_than ?? DEFAULT_SETTINGS.giam_tru_ban_than),
    giam_tru_phu_thuoc: Number(settings.giam_tru_phu_thuoc ?? DEFAULT_SETTINGS.giam_tru_phu_thuoc),
    luong_co_ban_bhxh_bhyt: Number(settings.luong_co_ban_bhxh_bhyt ?? DEFAULT_SETTINGS.luong_co_ban_bhxh_bhyt),
    luong_toi_thieu_vung_bhtn: Number(settings.luong_toi_thieu_vung_bhtn ?? DEFAULT_SETTINGS.luong_toi_thieu_vung_bhtn),
    khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi: Number(settings.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi ?? DEFAULT_SETTINGS.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi),
    lam_tron_luong_thuc_linh: Number(settings.lam_tron_luong_thuc_linh ?? DEFAULT_SETTINGS.lam_tron_luong_thuc_linh),
    thue_tncn_bac: settings.thue_tncn_bac || DEFAULT_SETTINGS.thue_tncn_bac,
  };
}

const formatOtLabel = (doc = {}) => {
  const type = doc.loai_ngay || 'weekday';
  let label = 'Ngay thuong';
  if (type.includes('holiday')) label = 'Le/Tet';
  else if (type.includes('weekend')) label = 'Ngay nghi';
  if (type.includes('night')) {
    label += ' dem';
  }
  return label;
};

exports.previewPayrollData = async (req, res) => {
  try {
    const { ngay_bat_dau, ngay_ket_thuc, employee_ids, entries, settings = {} } = req.body || {};
    console.log('=== previewPayrollData called ===');
    console.log('ngay_bat_dau:', ngay_bat_dau, 'ngay_ket_thuc:', ngay_ket_thuc);
    console.log('entries received:', entries ? entries.length : 0);
    console.log('entries:', entries);

    if (!ngay_bat_dau || !ngay_ket_thuc) {
      return res.status(400).json({ msg: 'Thiếu khoảng thời gian' });
    }

    // Nếu có entries (dữ liệu form đã sửa), tính lại theo entries
    if (Array.isArray(entries) && entries.length > 0) {
      console.log('Using entries mode (recalculate from form)');
      const salaryConfig = await ensureSalaryConfig();
      const configSettings = mapSalaryConfigToSettings(salaryConfig);
      const normalizedSettings = normalizeSettings({ ...configSettings, ...settings });
      console.log('normalizedSettings:', normalizedSettings);

      const employeeIds = entries.map((e) => e.nhan_vien_id).filter(Boolean);
      const employees = await NhanVien.find({ _id: { $in: employeeIds } })
        .select('ma_nhan_vien ho_dem ten nguoi_phu_thuoc')
        .lean();
      const employeeMap = new Map(employees.map((emp) => [String(emp._id), emp]));

      const previewEntries = entries.map((entry) => {
        const employee = employeeMap.get(String(entry.nhan_vien_id));
        console.log('Calculating for employee:', employee?.ma_nhan_vien);
        console.log('Settings:', {
          luong_toi_thieu_vung_bhtn: normalizedSettings.luong_toi_thieu_vung_bhtn,
          ti_le_bhtn: normalizedSettings.ti_le_bhtn,
          luong_co_ban: entry.luong_co_ban
        });
        const calculated = calculatePayrollEntry(entry, normalizedSettings, {
          employee,
          dependents: entry.so_nguoi_phu_thuoc,
          so_ngay_cong: entry.so_ngay_cong ?? entry.metadata?.so_ngay_cong ?? 0,
          workdays_in_month: WORKING_DAYS_IN_MONTH,
        });
        console.log('Calculated BHTN:', calculated.bhtn);
        return {
          ...entry,
          calculated,
          metadata: entry.metadata || {},
        };
      });

      const summary = previewEntries.reduce(
        (acc, entry) => {
          acc.totalEmployees += 1;
          acc.totalGross += entry.calculated?.tong_thu_nhap || 0;
          acc.totalDeductions += entry.calculated?.tong_khau_tru || 0;
          acc.totalNet += entry.calculated?.luong_thuc_nhan || 0;
          acc.totalTax += entry.calculated?.thue_tncn || 0;
          return acc;
        },
        { totalEmployees: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, totalTax: 0 }
      );

      console.log('Returning preview entries:', previewEntries.length);
      console.log('Summary:', summary);
      return res.json({ data: previewEntries, summary, settings: normalizedSettings });
    }
    const startDate = new Date(ngay_bat_dau);
    const endDate = new Date(ngay_ket_thuc);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return res.status(400).json({ msg: 'Khoảng thời gian không hợp lệ' });
    }

    const employeeObjectIds = Array.isArray(employee_ids)
      ? employee_ids.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id))
      : [];

    const employeeFilter = { da_xoa: { $ne: true } };
    if (employeeObjectIds.length) {
      employeeFilter._id = { $in: employeeObjectIds };
    }

    const salaryConfig = await ensureSalaryConfig();
    const configSettings = mapSalaryConfigToSettings(salaryConfig);
    const normalizedSettings = normalizeSettings({ ...configSettings, ...settings });
    const employees = await NhanVien.find(employeeFilter)
      .select('ma_nhan_vien ho_dem ten luong nguoi_phu_thuoc thong_tin_cong_viec');

    if (!employees.length) {
      return res.json({
        data: [],
        summary: {
          totalEmployees: 0,
          totalOtHours: 0,
          totalLeaveDays: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          totalTax: 0,
        },
        settings: normalizedSettings,
      });
    }

    const employeeMap = new Map(employees.map((emp) => [String(emp._id), emp]));
    const employeeIdList = employees.map((emp) => emp._id);

    const timesheetAgg = await Timesheet.aggregate([
      {
        $match: {
          trang_thai: 'Da duyet',
          nhan_vien_id: { $in: employeeIdList },
          ngay: { $gte: startDate, $lte: endDate },
        },
      },
      {$unwind: '$entries'},
      {
        $match: {
          'entries.ngay': {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            nhan_vien_id: '$nhan_vien_id',
            ngay: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$entries.ngay',
              },
            },
          },
          gio: {$sum: '$entries.gio'},
        },
      },
      {
        $group: {
          _id: '$_id.nhan_vien_id',
          days: {$push: {ngay: '$_id.ngay', gio: '$gio'}},
          tong_gio: {$sum: '$gio'},
        },
      },
    ]);

    const timesheetMap = new Map();
    timesheetAgg.forEach((item) => {
      timesheetMap.set(String(item._id), item);
    });

    // Bổ sung dữ liệu chấm công từ mobile (collection cham_cong) để có giờ công/OT khi chưa có timesheet duyệt
    const chamCongDocs = await ChamCong.find({
      nhan_vien_id: {$in: employeeIdList},
      ngay: {$gte: startDate, $lte: endDate},
    }).lean();

    const chamCongMap = new Map();
    chamCongDocs.forEach((cc) => {
      const key = String(cc.nhan_vien_id);
      if (!chamCongMap.has(key)) chamCongMap.set(key, []);
      chamCongMap.get(key).push(cc);
    });

    chamCongMap.forEach((records, empId) => {
      const days = [];
      let total = 0;
      records.forEach((rec) => {
        const start = rec.thoi_gian_vao ? new Date(rec.thoi_gian_vao) : null;
        const end = rec.thoi_gian_ra ? new Date(rec.thoi_gian_ra) : null;
        const hours =
          start && end
            ? Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
            : HOURS_PER_DAY; // nếu chưa check-out, tạm tính đủ ca
        const dayKey = new Date(rec.ngay).toISOString().slice(0, 10);
        days.push({ngay: dayKey, gio: hours});
        total += hours;
      });

      if (days.length > 0) {
        const existing = timesheetMap.get(empId);
        if (existing) {
          // Gộp thêm giờ công từ chấm công, tránh trùng ngày
          const dayMap = new Map(existing.days.map(d => [d.ngay, d.gio]));
          days.forEach((d) => {
            // Nếu ngày chưa có trong timesheet, thêm vào
            if (!dayMap.has(d.ngay)) {
              dayMap.set(d.ngay, d.gio);
            }
            // Nếu đã có, giữ nguyên giờ từ timesheet (đã duyệt)
          });
          const mergedDays = Array.from(dayMap.entries()).map(([ngay, gio]) => ({ngay, gio}));
          const mergedTotal = mergedDays.reduce((sum, d) => sum + d.gio, 0);
          timesheetMap.set(empId, {days: mergedDays, tong_gio: mergedTotal});
        } else {
          timesheetMap.set(empId, {days, tong_gio: total});
        }
      }
    });

    const overtimeDocs = await OvertimeRequest.find({
      trang_thai: 'Da duyet',
      nhan_vien_id: {$in: employeeIdList},
      ngay: {$gte: startDate, $lte: endDate},
    }).lean();

    const overtimeMap = new Map();
    overtimeDocs.forEach((doc) => {
      const key = String(doc.nhan_vien_id);
      if (!overtimeMap.has(key)) overtimeMap.set(key, []);
      overtimeMap.get(key).push(doc);
    });

    const leaveDocs = await YeuCauNghiPhep.find({
      trang_thai: 'Da duyet',
      nhan_vien_id: { $in: employeeIdList },
      ngay_bat_dau: { $lte: endDate },
      ngay_ket_thuc: { $gte: startDate },
    }).populate('loai_ngay_nghi_id', 'ten co_luong');

    const leavesMap = new Map();
    leaveDocs.forEach((leave) => {
      const key = String(leave.nhan_vien_id);
      if (!leavesMap.has(key)) leavesMap.set(key, []);
      leavesMap.get(key).push(leave);
    });

    const reviewDocs = await PerformanceReview.find({
      nhan_vien_id: { $in: employeeIdList },
      trang_thai: 'Completed',
      den_ngay: { $gte: startDate, $lte: endDate },
      da_chuyen_payroll: { $ne: true },
    })
      .select('nhan_vien_id tu_ngay den_ngay xep_loai thuong_hieu_suat diem_tong')
      .lean();

    const reviewMap = new Map();
    reviewDocs.forEach((review) => {
      const key = String(review.nhan_vien_id);
      if (!reviewMap.has(key)) reviewMap.set(key, []);
      reviewMap.get(key).push(review);
    });

    const totals = { gross: 0, deductions: 0, net: 0, tax: 0 };

    const previewEntries = employees.map((emp) => {
      const empId = String(emp._id);
      const allowanceItems = (emp.luong || [])
        .filter((item) => {
          const name = normalizeText(item.ten_luong || '');
          return name && !name.includes('luong');
        })
        .map((item) => ({
          ten: item.ten_luong || 'Khoản thu',
          so_tien: Math.round(decimalToNumber(item.so_tien)),
          ghi_chu: item.ghi_chu,
        }))
        .filter((item) => item.so_tien > 0);

      const baseSalaryItem = (emp.luong || []).find((item) =>
        normalizeText(item.ten_luong || '').includes('luong'),
      );
      const luongCoBan = Math.round(decimalToNumber(baseSalaryItem?.so_tien));
      const hourlyRate = luongCoBan > 0 ? luongCoBan / WORKING_DAYS_IN_MONTH / HOURS_PER_DAY : 0;
      const dailyRate = luongCoBan > 0 ? luongCoBan / WORKING_DAYS_IN_MONTH : 0;

      const timesheetInfo = timesheetMap.get(empId);
      let totalHours = timesheetInfo?.tong_gio || 0;
      let overtimeHours = 0;
      const approvedOt = overtimeMap.get(empId) || [];
      const otBreakdown = [];
      const otItems = [];
      if (approvedOt.length > 0) {
        approvedOt.forEach((item) => {
          const hours = Number(item.so_gio) || 0;
          const multiplier = Number(item.he_so) || 1.5;
          overtimeHours += hours;
          otBreakdown.push({
            request_id: item._id,
            type: item.loai_ngay,
            hours,
            he_so: multiplier,
          });
          const amount =
            hours > 0 && hourlyRate > 0 ? Math.round(hours * hourlyRate * multiplier) : 0;
          if (amount > 0) {
            otItems.push({
              ten: `OT ${formatOtLabel(item)} (${hours.toFixed(2)}h x${multiplier})`,
              so_tien: amount,
              ghi_chu: item.ghi_chu_quan_ly || 'Yeu cau tang ca da duyet',
            });
          }
        });
      } else if (timesheetInfo?.days) {
        timesheetInfo.days.forEach((day) => {
          const overtime = Math.max(0, day.gio - HOURS_PER_DAY);
          overtimeHours += overtime;
        });
        if (overtimeHours > 0 && hourlyRate > 0) {
          const fallbackAmount = Math.round(overtimeHours * hourlyRate * 1.5);
          otBreakdown.push({
            type: 'timesheet_auto',
            hours: overtimeHours,
            he_so: 1.5,
          });
          otItems.push({
            ten: `OT tu dong (${overtimeHours.toFixed(2)}h x1.5)`,
            so_tien: fallbackAmount,
            ghi_chu: 'Tu dong tinh 150% dua tren bang cong',
          });
        }
      }

      const leaveList = leavesMap.get(empId) || [];
      const leaveItems = [];
      let totalLeaveDays = 0;
      leaveList.forEach((leave) => {
        const paid = leave.loai_ngay_nghi_id?.co_luong !== false ? true : false;
        const effectiveStart = leave.ngay_bat_dau < startDate ? startDate : leave.ngay_bat_dau;
        const effectiveEnd = leave.ngay_ket_thuc > endDate ? endDate : leave.ngay_ket_thuc;
        const dayDiff =
          (new Date(effectiveEnd).setHours(0, 0, 0, 0) -
            new Date(effectiveStart).setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24) +
          1;
        const overlapDays = Math.max(0, dayDiff);
        if (!paid && overlapDays > 0) {
          totalLeaveDays += overlapDays;
          const deductionAmount = dailyRate > 0 ? Math.round(overlapDays * dailyRate) : 0;
          if (deductionAmount > 0) {
            leaveItems.push({
              ten: `Nghỉ ${leave.loai_ngay_nghi_id?.ten || ''}`.trim(),
              so_tien: deductionAmount,
              ghi_chu: `${overlapDays} ngày (${new Date(effectiveStart).toLocaleDateString('vi-VN')} - ${new Date(effectiveEnd).toLocaleDateString('vi-VN')})`,
            });
          }
        }
      });

      const performanceReviews = reviewMap.get(empId) || [];
      const performanceBonuses = performanceReviews
        .map((review) => {
          const amount = Math.round(Number(review.thuong_hieu_suat) || 0);
          if (!amount) return null;
          const label = review.xep_loai
            ? `Thưởng hiệu suất (${review.xep_loai})`
            : 'Thưởng hiệu suất';
          const dateRange = formatDateRangeVN(review.tu_ngay, review.den_ngay);
          return {
            ten: label,
            so_tien: amount,
            ghi_chu: dateRange || 'Theo kết quả đánh giá hiệu suất',
            reference_type: 'performance_review',
            reference_id: review._id,
          };
        })
        .filter(Boolean);

      const uniqueWorkdays = new Set((timesheetInfo?.days || []).map((d) => d.ngay)).size || 0;

      const baseEntry = {
        nhan_vien_id: emp._id,
        ma_nhan_vien: emp.ma_nhan_vien,
        ho_ten: `${emp.ho_dem || ''} ${emp.ten || ''}`.trim(),
        luong_co_ban: luongCoBan,
        so_nguoi_phu_thuoc: emp.nguoi_phu_thuoc?.length || 0,
        phu_cap: allowanceItems,
        thuong: performanceBonuses,
        ot: otItems,
        khoan_khau_tru: leaveItems,
        metadata: {
          tong_gio_timesheet: totalHours,
          tong_gio_ot: overtimeHours,
          so_ngay_nghi: totalLeaveDays,
          so_ngay_cong: uniqueWorkdays,
          chi_tiet_ot: otBreakdown,
          performance_reviews: performanceReviews.map((review) => ({
            review_id: review._id,
            xep_loai: review.xep_loai,
            thuong_hieu_suat: review.thuong_hieu_suat,
            tu_ngay: review.tu_ngay,
            den_ngay: review.den_ngay,
          })),
        },
      };

      const calculatedPayload = {
        nhan_vien_id: emp._id,
        luong_co_ban: luongCoBan,
        so_nguoi_phu_thuoc: baseEntry.so_nguoi_phu_thuoc,
        phu_cap: allowanceItems,
        thuong: performanceBonuses,
        ot: otItems,
        khoan_khau_tru: leaveItems,
      };

      const calculated = calculatePayrollEntry(calculatedPayload, normalizedSettings, {
        employee: emp,
        dependents: baseEntry.so_nguoi_phu_thuoc,
        timesheet: timesheetInfo,
        overtime: otBreakdown,
        so_ngay_cong: uniqueWorkdays,
        workdays_in_month: WORKING_DAYS_IN_MONTH,
      });

      totals.gross += calculated.tong_thu_nhap || 0;
      totals.deductions += calculated.tong_khau_tru || 0;
      totals.net += calculated.luong_thuc_nhan || 0;
      totals.tax += calculated.thue_tncn || 0;

      return { ...baseEntry, calculated };
    });

    const summary = previewEntries.reduce(
      (acc, entry) => {
        acc.totalEmployees += 1;
        acc.totalOtHours += entry.metadata?.tong_gio_ot || 0;
        acc.totalLeaveDays += entry.metadata?.so_ngay_nghi || 0;
        return acc;
      },
      { totalEmployees: 0, totalOtHours: 0, totalLeaveDays: 0 },
    );

    summary.totalGross = roundVnd(totals.gross);
    summary.totalDeductions = roundVnd(totals.deductions);
    summary.totalNet = roundVnd(totals.net);
    summary.totalTax = roundVnd(totals.tax);

    res.json({ data: previewEntries, summary, settings: normalizedSettings });
  } catch (err) {
    console.error('Error preview payroll data:', err);
    res.status(500).json({ msg: 'Không thể tổng hợp dữ liệu', error: err.message });
  }
};

exports.createPayrollRun = async (req, res) => {
  try {
    const {
      ky_luong,
      ngay_bat_dau,
      ngay_ket_thuc,
      loai_ky = 'Thang',
      settings = {},
      entries = [],
      currency = 'VND',
      ghi_chu,
    } = req.body;

    if (!ky_luong) {
      return res.status(400).json({ msg: 'Thiếu thông tin kỳ lương' });
    }
    if (!ngay_bat_dau || !ngay_ket_thuc) {
      return res.status(400).json({ msg: 'Thiếu khoảng thời gian tính lương' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ msg: 'Cần ít nhất 1 nhân viên để tính lương' });
    }

    const startDate = new Date(ngay_bat_dau);
    const endDate = new Date(ngay_ket_thuc);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ msg: 'Ngày tính lương không hợp lệ' });
    }
    if (endDate < startDate) {
      return res.status(400).json({ msg: 'Ngày kết thúc phải lớn hơn ngày bắt đầu' });
    }

    const anyMissingEmployeeId = entries.some((e) => !e.nhan_vien_id);
    if (anyMissingEmployeeId) {
      return res.status(400).json({ msg: 'Thiếu mã nhân viên trong danh sách tính lương' });
    }

    const salaryConfig = await ensureSalaryConfig();
    const configSettings = mapSalaryConfigToSettings(salaryConfig);
    const normalizedSettings = normalizeSettings({ ...configSettings, ...settings });

    const employeeIds = [...new Set(entries.map((e) => String(e.nhan_vien_id)))];
    const employees = await NhanVien.find({ _id: { $in: employeeIds } })
      .select('ma_nhan_vien ho_dem ten nguoi_phu_thuoc')
      .lean();
    const employeeMap = new Map(employees.map((emp) => [String(emp._id), emp]));

    if (employees.length !== employeeIds.length) {
      const missing = employeeIds.filter((id) => !employeeMap.has(id));
      return res.status(400).json({
        msg: 'Không tìm thấy thông tin nhân viên',
        missing,
      });
    }

    const computedEntries = entries.map((entry) => {
      const employee = employeeMap.get(String(entry.nhan_vien_id));
      const payload = {
        ...entry,
        nhan_vien_id: entry.nhan_vien_id,
      };
      return calculatePayrollEntry(payload, normalizedSettings, {
        employee,
        dependents: entry.so_nguoi_phu_thuoc,
        so_ngay_cong: entry.so_ngay_cong ?? entry.metadata?.so_ngay_cong ?? 0,
        workdays_in_month: WORKING_DAYS_IN_MONTH,
      });
    });

    const aggregated = computedEntries.reduce((acc, item) => {
      acc.gross += item.tong_thu_nhap;
      acc.deductions += item.tong_khau_tru;
      acc.net += item.luong_thuc_nhan;
      acc.tax += item.thue_tncn;
      return acc;
    }, { gross: 0, deductions: 0, net: 0, tax: 0 });

    const runPayload = {
      ky_luong,
      loai_ky,
      ngay_bat_dau: startDate,
      ngay_ket_thuc: endDate,
      currency,
      settings: normalizedSettings,
      entries: computedEntries,
      tong_so_nhan_vien: computedEntries.length,
      tong_thu_nhap: roundVnd(aggregated.gross),
      tong_khau_tru: roundVnd(aggregated.deductions),
      tong_thue_tncn: roundVnd(aggregated.tax),
      tong_net: roundVnd(aggregated.net),
      nguoi_tao_id: req.user?.nhan_vien_id || null,
      ghi_chu,
    };

    const doc = new PayrollRun(runPayload);
    appendAuditLog(doc, 'create', req.user, 'Tạo bảng lương');
    await doc.save();
    await linkPerformanceBonusesToReviews(doc);
    res.status(201).json(doc);
    sendPayslipEmails(doc, 'created').catch(() => {});
  } catch (err) {
    console.error('Error creating payroll run:', err);
    res.status(400).json({ msg: err.message || 'Không thể tạo bảng lương' });
  }
};

exports.listPayrollRuns = async (req, res) => {
  try {
    const { page, limit, skip, q, sort } = parseListParams(req.query);
    const filter = {};
    if (q) {
      filter.ky_luong = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (req.query.trang_thai) {
      filter.trang_thai = req.query.trang_thai;
    }
    if (req.query.loai_ky) {
      filter.loai_ky = req.query.loai_ky;
    }

    const [items, total] = await Promise.all([
      PayrollRun.find(filter)
        .sort(buildSort(sort, '-ngay_tao'))
        .skip(skip)
        .limit(limit)
        .select('ky_luong loai_ky ngay_bat_dau ngay_ket_thuc trang_thai tong_so_nhan_vien tong_thu_nhap tong_net tong_thue_tncn currency'),
      PayrollRun.countDocuments(filter),
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
    console.error('Error listing payroll runs:', err);
    res.status(500).json({ msg: 'Không thể tải danh sách bảng lương', error: err.message });
  }
};

exports.deletePayrollRun = async (req, res) => {
  try {
    const doc = await PayrollRun.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: 'Khong tim thay bang luong' });
    }
    return res.json({ msg: 'Da xoa bang luong' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Khong tim thay bang luong' });
    }
    res.status(500).json({ msg: 'Khong the xoa bang luong', error: err.message });
  }
};

exports.getPayrollRun = async (req, res) => {
  try {
    const doc = await PayrollRun.findById(req.params.id)
      .populate('entries.nhan_vien_id', 'ma_nhan_vien ho_dem ten');
    if (!doc) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    res.json(doc);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    res.status(500).json({ msg: 'Không thể tải bảng lương', error: err.message });
  }
};

exports.updateRunStatus = async (req, res) => {
  try {
    const { trang_thai } = req.body;
    console.log('updateRunStatus - req.body:', req.body);
    console.log('updateRunStatus - trang_thai:', trang_thai);
    console.log('updateRunStatus - RUN_STATUSES:', RUN_STATUSES);
    if (!RUN_STATUSES.includes(trang_thai)) {
      console.log('ERROR: Trạng thái không hợp lệ!');
      return res.status(400).json({ msg: 'Trạng thái không hợp lệ' });
    }
    const doc = await PayrollRun.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    console.log('Current trang_thai:', doc.trang_thai);
    if (doc.trang_thai === 'Da_chi') {
      return res.status(400).json({ msg: 'Kỳ lương đã được khóa, không thể thay đổi' });
    }
    if (doc.trang_thai === trang_thai) {
      return res.json(doc);
    }
    const transitions = {
      Draft: ['Cho_duyet'],
      Nhap: ['Cho_duyet', 'Da_duyet'],
      Cho_duyet: ['Da_duyet'],
      Da_duyet: ['Da_chi'],
      Da_chi: [],
    };
    const allowed = transitions[doc.trang_thai] || [];
    console.log('Allowed transitions:', allowed);
    console.log('Requested transition to:', trang_thai);
    if (!allowed.includes(trang_thai)) {
      console.log('ERROR: Cannot transition from', doc.trang_thai, 'to', trang_thai);
      return res.status(400).json({ msg: 'Không thể chuyển sang trạng thái này' });
    }
    doc.trang_thai = trang_thai;
    if (trang_thai === 'Da_duyet') {
      doc.approved_at = new Date();
      doc.approved_by = req.user?.nhan_vien_id || null;
    }
    if (trang_thai === 'Da_chi') {
      doc.locked_at = new Date();
      doc.locked_by = req.user?.nhan_vien_id || null;
    }
    appendAuditLog(doc, 'update_status', req.user, `Chuyển trạng thái sang ${trang_thai}`);
    await doc.save();
    res.json(doc);
    if (trang_thai === 'Da_chi') {
      sendPayslipEmails(doc, 'paid').catch(() => {});
    }
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    res.status(400).json({ msg: 'Không thể cập nhật trạng thái', error: err.message });
  }
};

exports.updateEntryStatus = async (req, res) => {
  try {
    const { trang_thai, ghi_chu } = req.body;
    console.log('updateEntryStatus - trang_thai:', trang_thai);
    console.log('updateEntryStatus - ENTRY_STATUSES:', ENTRY_STATUSES);
    if (!ENTRY_STATUSES.includes(trang_thai)) {
      console.log('ERROR: Trạng thái không hợp lệ!');
      return res.status(400).json({ msg: 'Trạng thái phiếu lương không hợp lệ' });
    }
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    if (run.trang_thai === 'Da_chi') {
      return res.status(400).json({ msg: 'Kỳ lương đã khóa, không thể cập nhật phiếu' });
    }
    const entry = run.entries.id(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ msg: 'Không tìm thấy phiếu lương' });
    }
    entry.trang_thai = trang_thai;
    if (ghi_chu !== undefined) {
      entry.ghi_chu = ghi_chu;
    }
    appendAuditLog(
      run,
      'entry_status',
      req.user,
      `Cập nhật trạng thái phiếu của ${entry.ma_nhan_vien || entry.nhan_vien_id} sang ${trang_thai}`,
    );
    await run.save();
    res.json(entry);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương hoặc phiếu lương' });
    }
    res.status(400).json({ msg: 'Không thể cập nhật phiếu lương', error: err.message });
  }
};

exports.exportPayrollRun = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    const rows = run.entries.map((entry, idx) => ({
      so_thu_tu: idx + 1,
      ma_nhan_vien: entry.ma_nhan_vien,
      ho_ten: entry.ho_ten,
      luong_co_ban: entry.luong_co_ban,
      tong_phu_cap: entry.tong_phu_cap,
      tong_thuong: entry.tong_thuong,
      tong_ot: entry.tong_ot,
      tong_thu_nhap: entry.tong_thu_nhap,
      bhxh: entry.bhxh,
      bhyt: entry.bhyt,
      bhtn: entry.bhtn,
      kpcd: entry.kpcd,
      tong_khau_tru_khac: entry.tong_khau_tru_khac,
      tong_khau_tru: entry.tong_khau_tru,
      thue_tncn: entry.thue_tncn,
      luong_thuc_nhan: entry.luong_thuc_nhan,
      trang_thai: entry.trang_thai,
    }));
    const fields = [
      { label: 'STT', value: 'so_thu_tu' },
      { label: 'Mã nhân viên', value: 'ma_nhan_vien' },
      { label: 'Họ tên', value: 'ho_ten' },
      { label: 'Lương cơ bản', value: 'luong_co_ban' },
      { label: 'Phụ cấp', value: 'tong_phu_cap' },
      { label: 'Thưởng', value: 'tong_thuong' },
      { label: 'OT', value: 'tong_ot' },
      { label: 'Tổng thu nhập', value: 'tong_thu_nhap' },
      { label: 'BHXH', value: 'bhxh' },
      { label: 'BHYT', value: 'bhyt' },
      { label: 'BHTN', value: 'bhtn' },
      { label: 'KPCĐ', value: 'kpcd' },
      { label: 'Khấu trừ khác', value: 'tong_khau_tru_khac' },
      { label: 'Thuế TNCN', value: 'thue_tncn' },
      { label: 'Tổng khấu trừ', value: 'tong_khau_tru' },
      { label: 'Lương thực nhận', value: 'luong_thuc_nhan' },
      { label: 'Trạng thái', value: 'trang_thai' },
    ];
    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const safeName = run.ky_luong ? run.ky_luong.replace(/[\\/:*?"<>|]/g, '_') : run._id;
    res.setHeader('Content-Disposition', `attachment; filename="payroll-${safeName}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('Error exporting payroll run:', err);
    res.status(500).json({ msg: 'Không thể xuất bảng lương', error: err.message });
  }
};

exports.listMyPayslips = async (req, res) => {
  if (!req.user?.nhan_vien_id) {
    return res.status(400).json({ msg: 'Tài khoản không gắn với nhân viên' });
  }
  try {
    const employeeId = String(req.user.nhan_vien_id);
    const runs = await PayrollRun.find({ 'entries.nhan_vien_id': employeeId })
      .sort('-ngay_bat_dau')
      .select('ky_luong loai_ky ngay_bat_dau ngay_ket_thuc currency trang_thai entries');

    const data = [];
    runs.forEach((runDoc) => {
      const run = runDoc.toObject();
      const matchingEntries = (run.entries || []).filter(
        (entry) => String(entry.nhan_vien_id) === employeeId,
      );
      matchingEntries.forEach((entry) => {
        data.push({
          run_id: run._id,
          ky_luong: run.ky_luong,
          loai_ky: run.loai_ky,
          ngay_bat_dau: run.ngay_bat_dau,
          ngay_ket_thuc: run.ngay_ket_thuc,
          currency: run.currency || 'VND',
          trang_thai_run: run.trang_thai,
          entry,
        });
      });
    });

    res.json({ data });
  } catch (err) {
    console.error('Error loading payslips:', err);
    res.status(500).json({ msg: 'Không thể tải phiếu lương', error: err.message });
  }
};

exports.exportPayrollTemplate = async (req, res) => {
  try {
    const { template } = req.params;
    const doc = await PayrollRun.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }
    let fields;
    let rows;
    const safeName = doc.ky_luong ? doc.ky_luong.replace(/[\\/:*?"<>|]/g, '_') : doc._id;
    if (template === 'bhxh') {
      fields = [
        { label: 'STT', value: 'so_thu_tu' },
        { label: 'Mã nhân viên', value: 'ma_nhan_vien' },
        { label: 'Họ tên', value: 'ho_ten' },
        { label: 'Lương đóng BHXH', value: 'luong_co_ban' },
        { label: 'BHXH (8%)', value: 'bhxh' },
        { label: 'BHYT (1.5%)', value: 'bhyt' },
        { label: 'BHTN (1%)', value: 'bhtn' },
      ];
      rows = doc.entries.map((entry, index) => ({
        so_thu_tu: index + 1,
        ma_nhan_vien: entry.ma_nhan_vien,
        ho_ten: entry.ho_ten,
        luong_co_ban: entry.luong_co_ban,
        bhxh: entry.bhxh,
        bhyt: entry.bhyt,
        bhtn: entry.bhtn,
      }));
    } else if (template === 'thue') {
      fields = [
        { label: 'STT', value: 'so_thu_tu' },
        { label: 'Mã nhân viên', value: 'ma_nhan_vien' },
        { label: 'Họ tên', value: 'ho_ten' },
        { label: 'Thu nhập tính thuế', value: 'thu_nhap_tinh_thue' },
        { label: 'Thuế TNCN', value: 'thue_tncn' },
        { label: 'Lương thực nhận', value: 'luong_thuc_nhan' },
      ];
      rows = doc.entries.map((entry, index) => ({
        so_thu_tu: index + 1,
        ma_nhan_vien: entry.ma_nhan_vien,
        ho_ten: entry.ho_ten,
        thu_nhap_tinh_thue: entry.thu_nhap_tinh_thue,
        thue_tncn: entry.thue_tncn,
        luong_thuc_nhan: entry.luong_thuc_nhan,
      }));
    } else {
      return res.status(400).json({ msg: 'Mẫu xuất không hợp lệ' });
    }
    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payroll-${template}-${safeName}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    console.error('Error exporting payroll template:', err);
    res.status(500).json({ msg: 'Không thể xuất biểu mẫu', error: err.message });
  }
};


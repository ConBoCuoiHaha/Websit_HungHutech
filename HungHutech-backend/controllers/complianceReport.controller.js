const { Parser } = require('json2csv');
const NhanVien = require('../schemas/nhanVien.model');
const TrangThaiLaoDong = require('../schemas/trangThaiLaoDong.model');
const ComplianceReminderLog = require('../schemas/complianceReminderLog.model');
const ComplianceReportLog = require('../schemas/complianceReportLog.model');
const { getUpcomingReminders } = require('../services/complianceReminderService');
const {parseListParams} = require('../utils/pagination');

const DEFAULT_CONTRIBUTIONS = {
  bhxh_nv: 0.08,
  bhxh_dn: 0.175,
  bhyt_nv: 0.015,
  bhyt_dn: 0.03,
  bhtn_nv: 0.01,
  bhtn_dn: 0.01,
};

const COMPLIANCE_REPORTS = [
  {
    id: '01PLI',
    name: 'Bao cao 01/PLI - Tinh hinh thay doi lao dong',
    frequency: 'Dinh ky 6 thang (05/6) va 12 thang (05/12)',
    description: 'Thong ke lao dong tang/giam gui So LDTBXH theo mau 01/PLI (Nghi dinh 145/2020).',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'loai_bien_dong', label: 'Loai bien dong' },
      { key: 'ho_ten', label: 'Ho ten' },
      { key: 'ma_nhan_vien', label: 'Ma nhan vien' },
      { key: 'gioi_tinh', label: 'Gioi tinh' },
      { key: 'ngay_sinh', label: 'Ngay sinh' },
      { key: 'quoc_tich', label: 'Quoc tich' },
      { key: 'so_giay_to', label: 'So giay to' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'chuc_danh', label: 'Chuc danh' },
      { key: 'ngay_hieu_luc', label: 'Ngay hieu luc' },
    ],
  },
  {
    id: 'D02TS',
    name: 'Bao cao D02-TS - Tham gia dieu chinh BHXH',
    frequency: 'Hang thang (truoc ngay 28)',
    description: 'Tong hop lao dong tham gia BHXH va muc dong thuc te.',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'ho_ten', label: 'Ho ten' },
      { key: 'ma_nhan_vien', label: 'Ma nhan vien' },
      { key: 'so_bhxh', label: 'So BHXH' },
      { key: 'so_cmnd', label: 'CMND/CCCD' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'ngay_vao_lam', label: 'Ngay vao lam' },
      { key: 'muc_luong_dong', label: 'Muc dong thuc te' },
      { key: 'bhxh_nv', label: 'BHXH (NLD 8%)' },
      { key: 'bhyt_nv', label: 'BHYT (NLD 1.5%)' },
      { key: 'bhtn_nv', label: 'BHTN (NLD 1%)' },
      { key: 'tong_khau_tru', label: 'Tong khau tru NLD' },
      { key: 'bhxh_dn', label: 'BHXH (DN 17.5%)' },
      { key: 'bhyt_dn', label: 'BHYT (DN 3%)' },
      { key: 'bhtn_dn', label: 'BHTN (DN 1%)' },
      { key: 'tong_dong_dn', label: 'Tong dong DN' },
    ],
  },
  {
    id: 'LDNU',
    name: 'Bao cao su dung lao dong nuoc ngoai',
    frequency: '06 thang/lan (04/01, 04/07)',
    description: 'Thong ke lao dong quoc tich khac Viet Nam va tinh trang giay phep lao dong.',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'ho_ten', label: 'Ho ten' },
      { key: 'quoc_tich', label: 'Quoc tich' },
      { key: 'so_ho_chieu', label: 'So ho chieu' },
      { key: 'so_giay_phep', label: 'So giay phep lao dong' },
      { key: 'ngay_cap', label: 'Ngay cap' },
      { key: 'han_giay_phep', label: 'Han giay phep' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'chuc_danh', label: 'Chuc danh' },
      { key: 'ngay_bat_dau', label: 'Ngay bat dau' },
      { key: 'ngay_ket_thuc', label: 'Ngay ket thuc' },
    ],
  },
  {
    id: 'BHTN',
    name: 'Bao cao tham gia BHTN',
    frequency: 'Hang nam (truoc 14/01)',
    description: 'Tong hop nhan vien tham gia BHTN va so tien dong 1%.',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'ho_ten', label: 'Ho ten' },
      { key: 'ma_nhan_vien', label: 'Ma nhan vien' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'ngay_vao_lam', label: 'Ngay vao lam' },
      { key: 'muc_luong_bhtn', label: 'Muc dong BHTN' },
      { key: 'tien_bhtn', label: 'Tien BHTN (1%)' },
      { key: 'trang_thai', label: 'Trang thai' },
    ],
  },
  {
    id: 'ATLD',
    name: 'Bao cao an toan ve sinh lao dong',
    frequency: 'Hang nam (truoc 09/01)',
    description: 'Tong hop cong tac an toan, tap huan va tai nan lao dong theo phong ban.',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'tong_nhan_vien', label: 'Tong nhan vien' },
      { key: 'so_nguoi_da_tap_huan', label: 'Da tap huan ATVSLD' },
      { key: 'so_tai_nan', label: 'So tai nan' },
      { key: 'ghi_chu', label: 'Ghi chu' },
    ],
  },
  {
    id: 'YTLD',
    name: 'Bao cao y te lao dong',
    frequency: '06 thang/lan (04/07, 09/01)',
    description: 'Thong ke tinh trang suc khoe va kha nang lam viec cua nhan vien.',
    fields: [
      { key: 'stt', label: 'STT' },
      { key: 'ho_ten', label: 'Ho ten' },
      { key: 'phong_ban', label: 'Phong ban' },
      { key: 'ngay_kham', label: 'Ngay kham gan nhat' },
      { key: 'ket_qua', label: 'Ket qua danh gia' },
      { key: 'ghi_chu', label: 'Ghi chu' },
    ],
  },
];

const reportMap = COMPLIANCE_REPORTS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const normalizeDate = (value, endOfDay = false) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

const decimalToNumber = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value.toString) {
    const parsed = parseFloat(value.toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const detectTerminationStatuses = async () => {
  const statuses = await TrangThaiLaoDong.find({})
    .select('_id ten')
    .lean();
  return statuses
    .filter((status) => /ngh|tho.i|terminate|ket thuc|resign|leave/i.test(status.ten || ''))
    .map((status) => status._id);
};

const build01PLI = async (fromDate, toDate) => {
  const from = normalizeDate(fromDate) || new Date('2000-01-01T00:00:00Z');
  const to = normalizeDate(toDate, true) || new Date();

  const populateOptions = [
    { path: 'thong_tin_cong_viec.phong_ban_id', select: 'ten' },
    { path: 'thong_tin_cong_viec.chuc_danh_id', select: 'ten_chuc_danh' },
  ];

  const hires = await NhanVien.find({
    'thong_tin_cong_viec.ngay_vao_lam': { $gte: from, $lte: to },
  })
    .populate(populateOptions)
    .lean();

  const terminationIds = await detectTerminationStatuses();
  let leavers = [];
  if (terminationIds.length > 0) {
    leavers = await NhanVien.find({
      'thong_tin_cong_viec.trang_thai_lao_dong_id': { $in: terminationIds },
      ngay_cap_nhat: { $gte: from, $lte: to },
    })
      .populate(populateOptions)
      .lean();
  }

  const rows = [];
  const pushRow = (nv, loai, ngayHieuLuc) => {
    rows.push({
      stt: rows.length + 1,
      loai_bien_dong: loai,
      ho_ten: `${nv.ho_dem || ''} ${nv.ten || ''}`.trim(),
      ma_nhan_vien: nv.ma_nhan_vien || '',
      gioi_tinh: nv.gioi_tinh || '',
      ngay_sinh: formatDate(nv.ngay_sinh),
      quoc_tich: nv.quoc_tich || 'Việt Nam',
      so_giay_to: nv.thong_tin_ca_nhan?.cmnd_cccd || '',
      phong_ban: nv.thong_tin_cong_viec?.phong_ban_id?.ten || '',
      chuc_danh: nv.thong_tin_cong_viec?.chuc_danh_id?.ten_chuc_danh || '',
      ngay_hieu_luc: formatDate(ngayHieuLuc),
    });
  };

  hires.forEach((nv) => {
    pushRow(nv, 'Tăng', nv.thong_tin_cong_viec?.ngay_vao_lam || nv.ngay_tao);
  });
  leavers.forEach((nv) => {
    pushRow(nv, 'Giảm', nv.ngay_cap_nhat || to);
  });

  return rows;
};

const toRate = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  if (num > 1) return num / 100;
  if (num < 0) return fallback;
  return num;
};

const buildD02TS = async (fromDate, toDate, options = {}) => {
  const to = normalizeDate(toDate, true) || new Date();
  const populateOptions = [
    { path: 'thong_tin_cong_viec.phong_ban_id', select: 'ten' },
  ];

  const mergedContributions = {
    ...DEFAULT_CONTRIBUTIONS,
    ...(options.contributions || {}),
  };

  Object.keys(mergedContributions).forEach((key) => {
    mergedContributions[key] = toRate(
      mergedContributions[key],
      DEFAULT_CONTRIBUTIONS[key],
    );
  });

  const employees = await NhanVien.find({
    'thong_tin_cong_viec.ngay_vao_lam': { $lte: to },
  })
    .populate(populateOptions)
    .lean();

  const rows = employees.map((nv, index) => {
    const insurance = nv.bao_hiem || {};
    const salary =
      decimalToNumber(insurance.muc_luong_bhxh) ||
      decimalToNumber((insurance.muc_luong_bhyt)) ||
      decimalToNumber(
        ((nv.luong || []).find((item) => item.ten_luong === 'Luong co ban') ||
          (nv.luong || [])[0])?.so_tien,
      );

    const rates = {
      bhxh_nv: toRate(insurance.ti_le_bhxh_nv, mergedContributions.bhxh_nv),
      bhxh_dn: toRate(insurance.ti_le_bhxh_dn, mergedContributions.bhxh_dn),
      bhyt_nv: toRate(insurance.ti_le_bhyt_nv, mergedContributions.bhyt_nv),
      bhyt_dn: toRate(insurance.ti_le_bhyt_dn, mergedContributions.bhyt_dn),
      bhtn_nv: toRate(insurance.ti_le_bhtn_nv, mergedContributions.bhtn_nv),
      bhtn_dn: toRate(insurance.ti_le_bhtn_dn, mergedContributions.bhtn_dn),
    };

    const bhxhNv = Math.round(salary * rates.bhxh_nv);
    const bhytNv = Math.round(salary * rates.bhyt_nv);
    const bhtnNv = Math.round(salary * rates.bhtn_nv);
    const bhxhDn = Math.round(salary * rates.bhxh_dn);
    const bhytDn = Math.round(salary * rates.bhyt_dn);
    const bhtnDn = Math.round(salary * rates.bhtn_dn);

    return {
      stt: index + 1,
      ho_ten: `${nv.ho_dem || ''} ${nv.ten || ''}`.trim(),
      ma_nhan_vien: nv.ma_nhan_vien || '',
      so_bhxh: insurance.so_bhxh || nv.custom_fields?.so_bhxh || '',
      so_cmnd: nv.thong_tin_ca_nhan?.cmnd_cccd || '',
      phong_ban: nv.thong_tin_cong_viec?.phong_ban_id?.ten || '',
      ngay_vao_lam: formatDate(nv.thong_tin_cong_viec?.ngay_vao_lam),
      muc_luong_dong: salary,
      bhxh_nv: bhxhNv,
      bhyt_nv: bhytNv,
      bhtn_nv: bhtnNv,
      tong_khau_tru: bhxhNv + bhytNv + bhtnNv,
      bhxh_dn: bhxhDn,
      bhyt_dn: bhytDn,
      bhtn_dn: bhtnDn,
      tong_dong_dn: bhxhDn + bhytDn + bhtnDn,
    };
  });

  return rows;
};


const buildLDNU = async (fromDate, toDate) => {
  const from = normalizeDate(fromDate) || new Date('2000-01-01T00:00:00Z');
  const to = normalizeDate(toDate, true) || new Date();
  const populateOptions = [
    { path: 'thong_tin_cong_viec.phong_ban_id', select: 'ten' },
    { path: 'thong_tin_cong_viec.chuc_danh_id', select: 'ten_chuc_danh' },
  ];
  const employees = await NhanVien.find({
    quoc_tich: { $nin: [null, '', 'Viet Nam', 'Việt Nam'] },
    'thong_tin_cong_viec.ngay_vao_lam': { $lte: to },
  })
    .populate(populateOptions)
    .lean();
  return employees.map((nv, index) => ({
    stt: index + 1,
    ho_ten: `${nv.ho_dem || ''} ${nv.ten || ''}`.trim(),
    quoc_tich: nv.quoc_tich || 'Khac',
    so_ho_chieu: nv.thong_tin_ca_nhan?.so_ho_chieu || '',
    so_giay_phep: nv.thong_tin_ca_nhan?.so_giay_phep_lao_dong || nv.custom_fields?.so_giay_phep || '',
    ngay_cap: formatDate(nv.thong_tin_ca_nhan?.ngay_cap_cmnd),
    han_giay_phep: formatDate(nv.thong_tin_ca_nhan?.ngay_het_han_gplx),
    phong_ban: nv.thong_tin_cong_viec?.phong_ban_id?.ten || '',
    chuc_danh: nv.thong_tin_cong_viec?.chuc_danh_id?.ten_chuc_danh || '',
    ngay_bat_dau: formatDate(nv.thong_tin_cong_viec?.ngay_vao_lam),
    ngay_ket_thuc: formatDate(nv.thong_tin_cong_viec?.ngay_nghi_viec || nv.ngay_cap_nhat),
  }));
};

const buildBHTN = async (fromDate, toDate, options = {}) => {
  const to = normalizeDate(toDate, true) || new Date();
  const populateOptions = [
    { path: 'thong_tin_cong_viec.phong_ban_id', select: 'ten' },
    { path: 'thong_tin_cong_viec.trang_thai_lao_dong_id', select: 'ten' },
  ];
  const mergedContributions = {
    ...DEFAULT_CONTRIBUTIONS,
    ...(options.contributions || {}),
  };
  const rate = toRate(mergedContributions.bhtn_nv, DEFAULT_CONTRIBUTIONS.bhtn_nv);
  const employees = await NhanVien.find({
    'thong_tin_cong_viec.ngay_vao_lam': { $lte: to },
  })
    .populate(populateOptions)
    .lean();
  return employees.map((nv, index) => {
    const insurance = nv.bao_hiem || {};
    const salary =
      decimalToNumber(insurance.muc_luong_bhtn) ||
      decimalToNumber(insurance.muc_luong_bhxh) ||
      decimalToNumber(
        ((nv.luong || []).find((item) => item.ten_luong === 'Luong co ban') ||
          (nv.luong || [])[0])?.so_tien,
      );
    const tienBhtn = Math.round(salary * rate);
    return {
      stt: index + 1,
      ho_ten: `${nv.ho_dem || ''} ${nv.ten || ''}`.trim(),
      ma_nhan_vien: nv.ma_nhan_vien || '',
      phong_ban: nv.thong_tin_cong_viec?.phong_ban_id?.ten || '',
      ngay_vao_lam: formatDate(nv.thong_tin_cong_viec?.ngay_vao_lam),
      muc_luong_bhtn: salary,
      tien_bhtn: tienBhtn,
      trang_thai: nv.thong_tin_cong_viec?.trang_thai_lao_dong_id?.ten || 'Dang lam viec',
    };
  });
};

const buildATLD = async () => {
  const employees = await NhanVien.find({ da_xoa: { $ne: true } })
    .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
    .lean();
  const deptMap = new Map();
  employees.forEach((nv) => {
    const dept =
      nv.thong_tin_cong_viec?.phong_ban_id?.ten ||
      nv.thong_tin_cong_viec?.phong_ban_id ||
      'Khac';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { name: dept, count: 0 });
    }
    deptMap.get(dept).count += 1;
  });
  const rows = Array.from(deptMap.values()).map((dept, index) => ({
    stt: index + 1,
    phong_ban: dept.name,
    tong_nhan_vien: dept.count,
    so_nguoi_da_tap_huan: dept.count,
    so_tai_nan: 0,
    ghi_chu: '',
  }));
  return rows;
};

const buildYTLD = async () => {
  const employees = await NhanVien.find({ da_xoa: { $ne: true } })
    .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
    .lean();
  return employees.map((nv, index) => {
    const dept = nv.thong_tin_cong_viec?.phong_ban_id?.ten || 'Khac';
    const lastCheck =
      nv.custom_fields?.ngay_kham_suc_khoe ||
      nv.custom_fields?.health_check_date ||
      nv.ngay_cap_nhat ||
      nv.ngay_tao;
    const result =
      nv.custom_fields?.ket_qua_suc_khoe ||
      nv.custom_fields?.health_status ||
      'Dat';
    return {
      stt: index + 1,
      ho_ten: `${nv.ho_dem || ''} ${nv.ten || ''}`.trim(),
      phong_ban: dept,
      ngay_kham: formatDate(lastCheck),
      ket_qua: result,
      ghi_chu: nv.custom_fields?.ghi_chu_suc_khoe || '',
    };
  });
};

const buildReport = async (type, filters) => {
  switch (type) {
    case '01PLI':
      return build01PLI(filters.from_date, filters.to_date);
    case 'D02TS':
      return buildD02TS(filters.from_date, filters.to_date, {
        contributions: filters.contributions,
      });
    case 'LDNU':
      return buildLDNU(filters.from_date, filters.to_date);
    case 'BHTN':
      return buildBHTN(filters.from_date, filters.to_date, {
        contributions: filters.contributions,
      });
    case 'ATLD':
      return buildATLD(filters.from_date, filters.to_date);
    case 'YTLD':
      return buildYTLD(filters.from_date, filters.to_date);
    default:
      throw new Error('Loai bao cao khong ho tro');
  }
};

exports.getDefinitions = (req, res) => {
  res.json({ data: COMPLIANCE_REPORTS });
};

exports.previewReport = async (req, res) => {
  try {
    const { type, from_date, to_date } = req.body;
    const definition = reportMap[type];
    if (!definition) {
      return res.status(400).json({ msg: 'Loại báo cáo không hợp lệ' });
    }

    const rows = await buildReport(type, { from_date, to_date });
    res.json({
      meta: {
        report: definition,
        total: rows.length,
        from_date,
        to_date,
      },
      data: rows,
    });
  } catch (err) {
    console.error('previewReport error', err);
    res.status(500).json({ msg: 'Không thể tạo báo cáo', error: err.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type, from_date, to_date } = req.body;
    const definition = reportMap[type];
    if (!definition) {
      return res.status(400).json({ msg: 'Loại báo cáo không hợp lệ' });
    }

    const rows = await buildReport(type, { from_date, to_date });
    const fields = definition.fields.map((item) => ({ label: item.label, value: item.key }));
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    try {
      await ComplianceReportLog.create({
        type,
        report_name: definition.name,
        requested_by: req.user?.nhan_vien_id || null,
        params: {from_date, to_date, contributions: req.body?.contributions || null},
        total_rows: rows.length,
        format: 'csv',
        exported_at: new Date(),
      });
    } catch (logErr) {
      console.error('log export error', logErr);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('exportReport error', err);
    res.status(500).json({ msg: 'Không thể xuất báo cáo', error: err.message });
  }
};
exports.getReminderSchedule = async (req, res) => {
  try {
    const reminders = getUpcomingReminders(new Date());
    if (!reminders.length) {
      return res.json({ data: [] });
    }
    const conditions = reminders.map((item) => ({
      report_id: item.report_id,
      period_key: item.period_key,
    }));
    const logs = await ComplianceReminderLog.find({ $or: conditions }).lean();
    const logMap = new Map(
      logs.map((log) => [`${log.report_id}-${log.period_key}`, log]),
    );
    const data = reminders.map((item) => {
      const key = `${item.report_id}-${item.period_key}`;
      const log = logMap.get(key);
      return {
        report_id: item.report_id,
        report_name: item.report_name,
        period_key: item.period_key,
        due_date: item.due_date.toISOString(),
        days_left: item.days_left,
        lead_days: item.lead_days,
        last_sent_at: log?.sent_at || null,
        pending: !log,
      };
    });
    res.json({ data });
  } catch (err) {
    console.error('getReminderSchedule error', err);
    res.status(500).json({ msg: 'Cannot compute reminder schedule', error: err.message });
  }
};
exports.markReminderSent = async (req, res) => {
  try {
    const { report_id, period_key, due_date, note } = req.body || {};
    const definition = reportMap[report_id];
    if (!definition) {
      return res.status(400).json({ msg: 'Loai bao cao khong hop le' });
    }
    if (!period_key) {
      return res.status(400).json({ msg: 'Thieu period_key' });
    }
    let due = null;
    if (due_date) {
      due = new Date(due_date);
      if (Number.isNaN(due.getTime())) {
        return res.status(400).json({ msg: 'Ngay han khong hop le' });
      }
    }
    const log = await ComplianceReminderLog.findOneAndUpdate(
      { report_id, period_key },
      {
        $set: {
          report_name: definition.name,
          sent_at: new Date(),
          due_date: due,
          manual: true,
          manual_by: req.user?.nhan_vien_id || null,
          notes: note || '',
        },
      },
      { upsert: true, new: true },
    );
    res.json({ data: log, msg: 'Da ghi nhan nhac han' });
  } catch (err) {
    console.error('markReminderSent error', err);
    res.status(500).json({ msg: 'Khong the ghi nhan nhac han', error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const {page, limit, skip} = parseListParams(req.query);
    const query = {};
    if (req.query.type) query.type = req.query.type;
    const [items, total] = await Promise.all([
      ComplianceReportLog.find(query)
        .populate('requested_by', 'ma_nhan_vien ho_dem ten')
        .sort('-exported_at')
        .skip(skip)
        .limit(limit)
        .lean(),
      ComplianceReportLog.countDocuments(query),
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
    console.error('getHistory error', err);
    res.status(500).json({msg: 'Khong the tai lich su bao cao', error: err.message});
  }
};


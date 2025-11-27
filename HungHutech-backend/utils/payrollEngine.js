const DEFAULT_TAX_BRACKETS = [
  { max: 5000000, rate: 0.05 },
  { max: 10000000, rate: 0.10 },
  { max: 18000000, rate: 0.15 },
  { max: 32000000, rate: 0.20 },
  { max: 52000000, rate: 0.25 },
  { max: 80000000, rate: 0.30 },
  { max: Infinity, rate: 0.35 },
];
// Giữ lại alias cũ để tránh lỗi tham chiếu
const TAX_BRACKETS = DEFAULT_TAX_BRACKETS;

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return num;
}

function roundVnd(value) {
  return Math.round(toNumber(value));
}

function sumAmounts(items = []) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item = {}) => sum + toNumber(item.so_tien), 0);
}

function buildTaxBrackets(config = {}) {
  const {
    bac5,
    bac10,
    bac15,
    bac20,
    bac25,
    bac30,
    bac35,
  } = config || {};

  const brackets = [
    { max: toNumber(bac5) || DEFAULT_TAX_BRACKETS[0].max, rate: 0.05 },
    { max: toNumber(bac10) || DEFAULT_TAX_BRACKETS[1].max, rate: 0.10 },
    { max: toNumber(bac15) || DEFAULT_TAX_BRACKETS[2].max, rate: 0.15 },
    { max: toNumber(bac20) || DEFAULT_TAX_BRACKETS[3].max, rate: 0.20 },
    { max: toNumber(bac25) || DEFAULT_TAX_BRACKETS[4].max, rate: 0.25 },
    { max: toNumber(bac30) || DEFAULT_TAX_BRACKETS[5].max, rate: 0.30 },
    { max: toNumber(bac35) || Infinity, rate: 0.35 },
  ];
  // đảm bảo tăng dần
  let last = 0;
  return brackets.map((b) => {
    const max = b.max > last ? b.max : last;
    last = max;
    return { max, rate: b.rate };
  });
}

function calculateTax(taxableIncome, taxConfig) {
  const TAX_BRACKETS = buildTaxBrackets(taxConfig);
  let remaining = Math.max(toNumber(taxableIncome), 0);
  let consumedThreshold = 0;
  const breakdown = [];
  let total = 0;

  TAX_BRACKETS.forEach((bracket, index) => {
    if (remaining <= 0) return;
    const currentCap = bracket.max === Infinity ? Infinity : bracket.max - consumedThreshold;
    const taxableForBracket = bracket.max === Infinity
      ? remaining
      : Math.min(remaining, currentCap);
    if (taxableForBracket <= 0) return;

    const taxForBracket = taxableForBracket * bracket.rate;
    breakdown.push({
      bac: index + 1,
      muc_chiu_thue: roundVnd(taxableForBracket),
      thue_suat: bracket.rate,
      tien_thue: roundVnd(taxForBracket),
    });
    total += taxForBracket;
    remaining -= taxableForBracket;
    if (bracket.max !== Infinity) {
      consumedThreshold = bracket.max;
    }
  });

  return {
    amount: roundVnd(total),
    breakdown,
  };
}

function calculatePayrollEntry(rawEntry, settings, meta = {}) {
  const baseSalary = roundVnd(rawEntry.luong_co_ban);
  if (baseSalary <= 0) {
    throw new Error('Thiếu lương cơ bản hợp lệ cho nhân viên');
  }

  // Các ngưỡng cấu hình
  const workdayThreshold = toNumber(settings.khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi);
  const effectiveWorkdays = toNumber(meta.so_ngay_cong ?? meta.metadata?.so_ngay_cong ?? 0);
  const skipBhxhBhyt =
    workdayThreshold > 0 && effectiveWorkdays > 0 && effectiveWorkdays < workdayThreshold;
  const minBhxhBase = toNumber(settings.luong_co_ban_bhxh_bhyt);
  const minBhtnBase = toNumber(settings.luong_toi_thieu_vung_bhtn);

  const allowanceList = Array.isArray(rawEntry.phu_cap) ? rawEntry.phu_cap : [];
  const bonusList = Array.isArray(rawEntry.thuong) ? rawEntry.thuong : [];
  const overtimeList = Array.isArray(rawEntry.ot) ? rawEntry.ot : [];
  const extraDeductionList = Array.isArray(rawEntry.khoan_khau_tru) ? rawEntry.khoan_khau_tru : [];

  const totalAllowances = roundVnd(sumAmounts(allowanceList));
  const totalBonus = roundVnd(sumAmounts(bonusList));
  const totalOt = roundVnd(sumAmounts(overtimeList));
  const otherDeductions = roundVnd(sumAmounts(extraDeductionList));

  const grossIncome = roundVnd(baseSalary + totalAllowances + totalBonus + totalOt);

  const tiLeBhxh = toNumber(settings.ti_le_bhxh ?? 0.08);
  const tiLeBhyt = toNumber(settings.ti_le_bhyt ?? 0.015);
  const tiLeBhtn = toNumber(settings.ti_le_bhtn ?? 0.01);
  const tiLeKpcd = toNumber(settings.ti_le_kpcd ?? 0.01);
  const apDungKpcd = settings.ap_dung_kpcd !== false;

  const bhxhBase =
    minBhxhBase > 0
      ? Math.max(baseSalary, minBhxhBase)
      : baseSalary;
  const bhtnBase =
    minBhtnBase > 0
      ? Math.max(baseSalary, minBhtnBase)
      : baseSalary;

  const bhxh = skipBhxhBhyt ? 0 : roundVnd(bhxhBase * tiLeBhxh);
  const bhyt = skipBhxhBhyt ? 0 : roundVnd(bhxhBase * tiLeBhyt);
  const bhtn = roundVnd(bhtnBase * tiLeBhtn); // BHTN không phụ thuộc ngày công
  const kpcd = apDungKpcd ? roundVnd(baseSalary * tiLeKpcd) : 0;
  const mandatoryDeductions = bhxh + bhyt + bhtn + kpcd;

  const dependentsRaw =
    meta.dependents ??
    rawEntry.so_nguoi_phu_thuoc ??
    toNumber(meta.employee?.nguoi_phu_thuoc?.length || 0);
  const dependents = Math.max(Math.floor(toNumber(dependentsRaw)), 0);
  const giamTruBanThan = roundVnd(settings.giam_tru_ban_than ?? 11000000);
  const giamTruPhuThuoc = roundVnd((settings.giam_tru_phu_thuoc ?? 4400000) * dependents);

  const taxableBase = grossIncome - mandatoryDeductions - giamTruBanThan - giamTruPhuThuoc;
  const taxableIncome = taxableBase > 0 ? taxableBase : 0;
  const { amount: taxAmount, breakdown } = calculateTax(
    taxableIncome,
    settings.thue_tncn_bac,
  );

  const rawTotalDeductions = mandatoryDeductions + taxAmount + otherDeductions;
  const tongKhauTru = Math.min(roundVnd(rawTotalDeductions), grossIncome);
  const lamTron = toNumber(settings.lam_tron_luong_thuc_linh ?? 0);
  let netIncome = roundVnd(grossIncome - tongKhauTru);
  if (netIncome < 0) netIncome = 0;
  if (lamTron !== 0) {
    const factor = 10 ** Math.abs(lamTron);
    if (factor > 0) {
      netIncome =
        lamTron > 0
          ? Math.round(netIncome * factor) / factor
          : Math.round(netIncome / factor) * factor;
    }
  }

  return {
    nhan_vien_id: rawEntry.nhan_vien_id,
    ma_nhan_vien: meta.employee?.ma_nhan_vien || rawEntry.ma_nhan_vien || '',
    ho_ten:
      meta.employee
        ? `${meta.employee.ho_dem || ''} ${meta.employee.ten || ''}`.trim()
        : (rawEntry.ho_ten || ''),
    luong_co_ban: baseSalary,
    phu_cap: allowanceList,
    thuong: bonusList,
    ot: overtimeList,
    khoan_khau_tru: extraDeductionList,
    tong_phu_cap: totalAllowances,
    tong_thuong: totalBonus,
    tong_ot: totalOt,
    tong_khau_tru_khac: otherDeductions,
    tong_thu_nhap: grossIncome,
    bhxh,
    bhyt,
    bhtn,
    kpcd,
    tong_khau_tru_bat_buoc: mandatoryDeductions,
    giam_tru_ban_than: giamTruBanThan,
    giam_tru_phu_thuoc: giamTruPhuThuoc,
    so_nguoi_phu_thuoc: dependents,
    so_ngay_cong: effectiveWorkdays,
    thu_nhap_tinh_thue: roundVnd(taxableIncome),
    thue_tncn: taxAmount,
    chi_tiet_thue: breakdown,
    tong_khau_tru: roundVnd(tongKhauTru),
    luong_thuc_nhan: netIncome,
    trang_thai: rawEntry.trang_thai || 'Cho_duyet',
    ghi_chu: rawEntry.ghi_chu,
  };
}
module.exports = {
  DEFAULT_TAX_BRACKETS,
  TAX_BRACKETS,
  calculatePayrollEntry,
  roundVnd,
};

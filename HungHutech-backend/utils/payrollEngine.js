const TAX_BRACKETS = [
  { max: 5000000, rate: 0.05 },
  { max: 10000000, rate: 0.10 },
  { max: 18000000, rate: 0.15 },
  { max: 32000000, rate: 0.20 },
  { max: 52000000, rate: 0.25 },
  { max: 80000000, rate: 0.30 },
  { max: Infinity, rate: 0.35 },
];

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

function calculateTax(taxableIncome) {
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

  const bhxh = roundVnd(baseSalary * tiLeBhxh);
  const bhyt = roundVnd(baseSalary * tiLeBhyt);
  const bhtn = roundVnd(baseSalary * tiLeBhtn);
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
  const { amount: taxAmount, breakdown } = calculateTax(taxableIncome);

  const tongKhauTru = mandatoryDeductions + taxAmount + otherDeductions;
  const netIncome = roundVnd(grossIncome - tongKhauTru);

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
  TAX_BRACKETS,
  calculatePayrollEntry,
  roundVnd,
};

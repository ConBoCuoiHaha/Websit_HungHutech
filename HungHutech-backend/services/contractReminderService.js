const Contract = require('../schemas/contract.model');
const NhanVien = require('../schemas/nhanVien.model');
const { sendMail } = require('../utils/mailer');

const REMINDER_DAYS = [60, 30, 7];
const DEFAULT_INTERVAL_HOURS = 24;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(targetDate, baseDate) {
  const diff = startOfDay(targetDate).getTime() - startOfDay(baseDate).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const HR_EMAIL_FALLBACK = 'hugoboss.v6@gmail.com';

function getHrEmails() {
  const raw = process.env.HR_EMAIL || HR_EMAIL_FALLBACK;
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function buildRecipients(employee, managerMap) {
  const recipients = new Set();
  getHrEmails().forEach((email) => recipients.add(email));
  const workEmail = employee?.lien_he?.email_cong_viec;
  if (workEmail) recipients.add(workEmail);
  const managerIds = employee?.thong_tin_cong_viec?.quan_ly_truc_tiep_ids || [];
  managerIds.forEach((id) => {
    const manager = managerMap.get(String(id));
    const managerEmail = manager?.lien_he?.email_cong_viec;
    if (managerEmail) recipients.add(managerEmail);
  });
  return Array.from(recipients);
}

function formatEmployeeName(employee) {
  return `${employee?.ho_dem || ''} ${employee?.ten || ''}`.trim();
}

async function sendReminderEmail(contract, employee, recipients, daysLeft) {
  if (!recipients.length) return;
  const subject = `[Contract Alert] ${contract.so_hop_dong} hết hạn sau ${daysLeft} ngày`;
  const bodyLines = [
    `Xin chào,`,
    '',
    `Hợp đồng ${contract.so_hop_dong} của nhân viên ${formatEmployeeName(employee)} (${employee?.ma_nhan_vien || ''}) sẽ hết hạn vào ${new Date(contract.hieu_luc_den).toLocaleDateString('vi-VN')}.`,
    `Thời gian còn lại: ${daysLeft} ngày.`,
    '',
    'Vui lòng kiểm tra để gia hạn/ký lại theo đúng quy định.',
    '',
    'HungHutech HRM',
  ];
  await sendMail({
    to: recipients.join(','),
    subject,
    text: bodyLines.join('\n'),
  });
}

async function scanExpiringContracts() {
  const today = startOfDay(new Date());
  const maxDays = Math.max(...REMINDER_DAYS);
  const upperBound = new Date(today);
  upperBound.setDate(upperBound.getDate() + maxDays + 1);

  const contracts = await Contract.find({
    trang_thai: 'Da_ky',
    hieu_luc_den: { $ne: null, $gte: today, $lte: upperBound },
  })
    .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten lien_he thong_tin_cong_viec.quan_ly_truc_tiep_ids')
    .lean();

  if (!contracts.length) return;

  const managerIds = [];
  contracts.forEach((contract) => {
    const managers = contract.nhan_vien_id?.thong_tin_cong_viec?.quan_ly_truc_tiep_ids || [];
    managers.forEach((id) => managerIds.push(String(id)));
  });

  let managerMap = new Map();
  if (managerIds.length) {
    const uniqueManagerIds = [...new Set(managerIds)];
    const managers = await NhanVien.find({ _id: { $in: uniqueManagerIds } })
      .select('lien_he email_cong_viec')
      .lean();
    managerMap = new Map(managers.map((mgr) => [String(mgr._id), mgr]));
  }

  for (const contract of contracts) {
    const employee = contract.nhan_vien_id;
    if (!employee) continue;
    const daysLeft = daysBetween(contract.hieu_luc_den, today);
    if (!REMINDER_DAYS.includes(daysLeft)) continue;
    const alreadySent = (contract.reminder_log || []).some((log) => log.days_before === daysLeft);
    if (alreadySent) continue;
    const recipients = buildRecipients(employee, managerMap);
    if (!recipients.length) continue;
    await sendReminderEmail(contract, employee, recipients, daysLeft);
    await Contract.findByIdAndUpdate(contract._id, {
      $push: {
        reminder_log: {
          days_before: daysLeft,
          recipients,
          sent_at: new Date(),
        },
      },
    }).catch(() => {});
  }
}

function startContractReminderJob() {
  if (process.env.DISABLE_CONTRACT_REMINDER === 'true') return;
  const intervalHours = Number(process.env.CONTRACT_REMINDER_INTERVAL_HOURS || DEFAULT_INTERVAL_HOURS);
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;
  scanExpiringContracts().catch((err) => console.error('Contract reminder error:', err));
  setInterval(() => {
    scanExpiringContracts().catch((err) => console.error('Contract reminder error:', err));
  }, intervalMs);
}

module.exports = {
  startContractReminderJob,
  scanExpiringContracts,
};

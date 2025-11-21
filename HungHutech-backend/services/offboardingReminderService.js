const Offboarding = require('../schemas/offboarding.model');
const { sendMail } = require('../utils/mailer');

const HR_EMAIL_FALLBACK = 'hugoboss.v6@gmail.com';
const REMINDER_DAYS = [30, 14, 7, 3, 1];
const DEFAULT_INTERVAL_HOURS = 12;

const getHrEmails = () =>
  (process.env.HR_EMAIL || HR_EMAIL_FALLBACK)
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (a, b) => {
  const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const buildRecipients = (employee) => {
  const recipients = new Set(getHrEmails());
  const workEmail = employee?.lien_he?.email_cong_viec;
  const personalEmail = employee?.lien_he?.email_khac;
  if (workEmail) recipients.add(workEmail);
  else if (personalEmail) recipients.add(personalEmail);
  return Array.from(recipients);
};

const formatEmployeeName = (employee) =>
  `${employee?.ho_dem || ''} ${employee?.ten || ''}`.trim();

async function sendReminder(record, employee, daysLeft) {
  const recipients = buildRecipients(employee);
  if (!recipients.length) return;
  const subject = `[Offboarding] ${employee?.ma_nhan_vien || ''} - ${formatEmployeeName(
    employee,
  )} dự kiến nghỉ sau ${daysLeft} ngày`;
  const dueDate = record.last_working_day
    ? new Date(record.last_working_day).toLocaleDateString('vi-VN')
    : 'Chưa xác định';
  const body = [
    `Xin chào,`,
    '',
    `Nhân viên ${formatEmployeeName(employee)} (${employee?.ma_nhan_vien || ''}) dự kiến làm việc ngày cuối vào ${dueDate}.`,
    `Thời gian còn lại: ${daysLeft} ngày.`,
    '',
    'Vui lòng kiểm tra checklist offboarding và hoàn tất bàn giao đúng hạn.',
    '',
    'HungHutech HRM',
  ];
  await sendMail({
    to: recipients.join(','),
    subject,
    text: body.join('\n'),
  });
  return recipients;
}

async function scanOffboardingReminders() {
  const today = startOfDay(new Date());
  const maxDays = Math.max(...REMINDER_DAYS);
  const upperBound = new Date(today);
  upperBound.setDate(upperBound.getDate() + maxDays + 1);

  const records = await Offboarding.find({
    status: { $in: ['Pending', 'InProgress'] },
    last_working_day: { $ne: null, $gte: today, $lte: upperBound },
  })
    .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten lien_he')
    .lean();

  for (const record of records) {
    const employee = record.nhan_vien_id;
    if (!employee) continue;
    const daysLeft = daysBetween(record.last_working_day, today);
    if (!REMINDER_DAYS.includes(daysLeft)) continue;
    const alreadySent =
      record.reminder_log?.some((log) => log.days_before === daysLeft) || false;
    if (alreadySent) continue;
    try {
      const recipients = await sendReminder(record, employee, daysLeft);
      if (!recipients?.length) continue;
      await Offboarding.findByIdAndUpdate(record._id, {
        $push: {
          reminder_log: {
            days_before: daysLeft,
            recipients,
            sent_at: new Date(),
          },
        },
      }).catch(() => {});
    } catch (err) {
      console.error('offboarding reminder error:', err);
    }
  }
}

function startOffboardingReminderJob() {
  if (process.env.DISABLE_OFFBOARDING_REMINDER === 'true') return;
  const intervalHours =
    Number(process.env.OFFBOARDING_REMINDER_INTERVAL_HOURS || DEFAULT_INTERVAL_HOURS) || DEFAULT_INTERVAL_HOURS;
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;
  scanOffboardingReminders().catch((err) =>
    console.error('offboarding reminder error:', err),
  );
  setInterval(() => {
    scanOffboardingReminders().catch((err) =>
      console.error('offboarding reminder error:', err),
    );
  }, intervalMs);
}

module.exports = {
  startOffboardingReminderJob,
  scanOffboardingReminders,
};

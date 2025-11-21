const ComplianceReminderLog = require('../schemas/complianceReminderLog.model');
const { sendMail } = require('../utils/mailer');

const REPORT_DEFINITIONS = [
  {
    id: '01PLI',
    name: 'Báo cáo 01/PLI - Tình hình thay đổi lao động',
    type: 'fixed',
    leadDays: 15,
    dates: [
      { month: 6, day: 5, label: 'H1' },
      { month: 12, day: 5, label: 'H2' },
    ],
  },
  {
    id: 'D02TS',
    name: 'Thông báo biến động lao động BHXH (D02-TS)',
    type: 'monthly',
    day: 2,
    leadDays: 7,
  },
  {
    id: 'LDNU',
    name: 'Báo cáo sử dụng lao động nước ngoài',
    type: 'fixed',
    leadDays: 20,
    dates: [
      { month: 1, day: 4, label: 'Yearly' },
      { month: 7, day: 4, label: 'MidYear' },
    ],
  },
  {
    id: 'TNLĐ',
    name: 'Báo cáo tổng hợp tình hình tai nạn lao động',
    type: 'fixed',
    leadDays: 20,
    dates: [
      { month: 7, day: 4, label: 'H1' },
      { month: 1, day: 9, label: 'Yearly' },
    ],
  },
  {
    id: 'ATLD',
    name: 'Báo cáo an toàn vệ sinh lao động',
    type: 'fixed',
    leadDays: 20,
    dates: [{ month: 1, day: 9, label: 'Yearly' }],
  },
  {
    id: 'YTLD',
    name: 'Báo cáo y tế lao động',
    type: 'fixed',
    leadDays: 20,
    dates: [
      { month: 7, day: 4, label: 'H1' },
      { month: 1, day: 9, label: 'Yearly' },
    ],
  },
  {
    id: 'BHTN',
    name: 'Báo cáo tham gia bảo hiểm thất nghiệp',
    type: 'fixed',
    leadDays: 15,
    dates: [{ month: 1, day: 14, label: 'Yearly' }],
  },
];

const DEFAULT_LEAD_DAYS = 10;
const DEFAULT_REMINDER_INTERVAL_HOURS = 24;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function buildFixedDueDates(def, today) {
  const year = today.getFullYear();
  return def.dates.map((item) => {
    const due = new Date(year, item.month - 1, item.day);
    while (due < today) {
      due.setFullYear(due.getFullYear() + 1);
    }
    return { due, label: item.label || `${item.month}-${item.day}` };
  });
}

function buildMonthlyDueDate(def, today) {
  const due = new Date(today.getFullYear(), today.getMonth(), def.day);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  return [
    {
      due,
      label: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`,
    },
  ];
}

function getRecipients() {
  const raw = process.env.HR_EMAIL || HR_EMAIL_FALLBACK;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function generatePeriodKey(reportId, due, label) {
  return `${reportId}-${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(
    due.getDate(),
  ).padStart(2, '0')}-${label}`;
}

function getUpcomingReminders(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const reminders = [];
  REPORT_DEFINITIONS.forEach((def) => {
    const leadDays = def.leadDays || DEFAULT_LEAD_DAYS;
    const dueDates = def.type === 'monthly' ? buildMonthlyDueDate(def, today) : buildFixedDueDates(def, today);
    dueDates.forEach((dueInfo) => {
      const diff = daysBetween(dueInfo.due, today);
      if (diff < 0 || diff > leadDays) return;
      reminders.push({
        report_id: def.id,
        report_name: def.name,
        due_date: new Date(dueInfo.due),
        days_left: diff,
        lead_days: leadDays,
        label: dueInfo.label,
        period_key: generatePeriodKey(def.id, dueInfo.due, dueInfo.label),
      });
    });
  });
  reminders.sort((a, b) => a.due_date.getTime() - b.due_date.getTime());
  return reminders;
}

async function sendReminder(reminder, recipients) {
  if (!recipients.length) return;
  const subject = `[Compliance] ${reminder.report_name} - Sắp đến hạn ${reminder.due_date.toLocaleDateString(
    'vi-VN',
  )}`;
  const body = [
    `Xin chào,`,
    '',
    `Báo cáo "${reminder.report_name}" sắp đến hạn nộp vào ngày ${reminder.due_date.toLocaleDateString('vi-VN')}.`,
    'Vui lòng chuẩn bị và nộp đúng hạn theo quy định.',
    '',
    'HungHutech HRM',
  ];
  await sendMail({
    to: recipients.join(','),
    subject,
    text: body.join('\n'),
  });
}

async function markReminderSent(reminder) {
  await ComplianceReminderLog.findOneAndUpdate(
    { report_id: reminder.report_id, period_key: reminder.period_key },
    {
      $set: {
        report_name: reminder.report_name,
        sent_at: new Date(),
      },
    },
    { upsert: true },
  );
}

async function scanComplianceDeadlines() {
  const reminders = getUpcomingReminders(new Date());
  if (!reminders.length) return;
  const recipients = getRecipients();
  if (!recipients.length) return;

  const query = {
    $or: reminders.map((item) => ({
      report_id: item.report_id,
      period_key: item.period_key,
    })),
  };
  const existingLogs = await ComplianceReminderLog.find(query).lean();
  const logMap = new Map(
    existingLogs.map((log) => [`${log.report_id}-${log.period_key}`, log]),
  );

  for (const reminder of reminders) {
    const key = `${reminder.report_id}-${reminder.period_key}`;
    if (logMap.has(key)) continue;
    try {
      await sendReminder(reminder, recipients);
      await markReminderSent(reminder);
    } catch (err) {
      console.error('Compliance reminder email error:', err);
    }
  }
}

function startComplianceReminderJob() {
  if (process.env.DISABLE_COMPLIANCE_REMINDER === 'true') return;
  const intervalHours = Number(process.env.COMPLIANCE_REMINDER_INTERVAL_HOURS || DEFAULT_REMINDER_INTERVAL_HOURS);
  const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;
  scanComplianceDeadlines().catch((err) => console.error('Compliance reminder error:', err));
  setInterval(() => {
    scanComplianceDeadlines().catch((err) => console.error('Compliance reminder error:', err));
  }, intervalMs);
}

module.exports = {
  startComplianceReminderJob,
  scanComplianceDeadlines,
  getUpcomingReminders,
};

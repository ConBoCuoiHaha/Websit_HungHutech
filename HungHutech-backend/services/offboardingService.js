const Offboarding = require('../schemas/offboarding.model');
const { sendMail } = require('../utils/mailer');

const HR_EMAIL_FALLBACK = 'hugoboss.v6@gmail.com';

const getHrEmails = () =>
  (process.env.HR_EMAIL || HR_EMAIL_FALLBACK)
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

const DEFAULT_TASKS = [
  { name: 'HR Payroll - Tính lương cuối cùng & phê duyệt thanh toán', department: 'HR Payroll' },
  { name: 'HR C&B - Chốt sổ BHXH/BHYT và báo giảm lao động', department: 'HR C&B' },
  { name: 'IT - Thu hồi tài sản, khóa tài khoản truy cập', department: 'IT' },
  { name: 'Kế toán - Đối soát công nợ/ứng trừ tiền nghỉ việc', department: 'Kế toán' },
];

const buildTasks = (lastWorkingDay) =>
  DEFAULT_TASKS.map((task) => ({
    ...task,
    due_date: lastWorkingDay || new Date(),
  }));

async function createOffboardingRequest({ nhan_vien_id, last_working_day, reason, requested_by }) {
  return Offboarding.create({
    nhan_vien_id,
    last_working_day,
    reason,
    requested_by: requested_by || null,
    tasks: buildTasks(last_working_day),
  });
}

function formatEmployeeName(employee) {
  return `${employee?.ho_dem || ''} ${employee?.ten || ''}`.trim();
}

async function notifyOffboarding(record, employee) {
  const recipients = getHrEmails();
  if (employee?.lien_he?.email_cong_viec) recipients.push(employee.lien_he.email_cong_viec);
  if (!recipients.length) return;

  await sendMail({
    to: recipients.join(','),
    subject: `[Offboarding] ${employee?.ma_nhan_vien || ''} - ${formatEmployeeName(employee)}`,
    text: `Hệ thống vừa tạo yêu cầu offboarding tự động (ID: ${record._id}). Vui lòng kiểm tra checklist và thực hiện bàn giao.`,
  });
}

async function ensureOffboardingForEmployee(employee, { lastWorkingDay, reason, requested_by } = {}) {
  if (!employee?._id) return null;
  const existing = await Offboarding.findOne({
    nhan_vien_id: employee._id,
    status: { $in: ['Pending', 'InProgress'] },
  });
  if (existing) return existing;

  const record = await createOffboardingRequest({
    nhan_vien_id: employee._id,
    last_working_day: lastWorkingDay,
    reason,
    requested_by,
  });
  await notifyOffboarding(record, employee);
  return record;
}

module.exports = {
  DEFAULT_TASKS,
  buildTasks,
  createOffboardingRequest,
  ensureOffboardingForEmployee,
  notifyOffboarding,
};



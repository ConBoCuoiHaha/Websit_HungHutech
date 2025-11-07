const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  getEmployeesForPurge,
  purgeEmployee,
  getCandidatesForPurge,
  purgeCandidate,
  getPurgeLogs
} = require('../controllers/maintenance.controller.js');
const { autoCheckoutOverdueRecords } = require('../utils/autoCheckout');

// All maintenance routes require admin role
router.use(allowRoles('admin'));

// Employee purge routes
router.get('/employees/purgeable', getEmployeesForPurge);

router.post(
  '/employees/:id/purge',
  [
    param('id').isMongoId().withMessage('ID nhân viên không hợp lệ'),
    body('ly_do').notEmpty().withMessage('Vui lòng cung cấp lý do xóa')
  ],
  handleValidation,
  purgeEmployee
);

// Candidate purge routes
router.get('/candidates/purgeable', getCandidatesForPurge);

router.post(
  '/candidates/:id/purge',
  [
    param('id').isMongoId().withMessage('ID ứng viên không hợp lệ'),
    body('ly_do').notEmpty().withMessage('Vui lòng cung cấp lý do xóa')
  ],
  handleValidation,
  purgeCandidate
);

// Audit logs
router.get('/logs', getPurgeLogs);

// Admin: trigger auto-checkout immediately
router.post('/auto-checkout', async (req, res) => {
  try {
    await autoCheckoutOverdueRecords();
    res.json({ success: true, msg: 'Đã auto-checkout các bản ghi mở đến 17:30' });
  } catch (e) {
    console.error('maintenance auto-checkout error', e);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: e.message });
  }
});

module.exports = router;

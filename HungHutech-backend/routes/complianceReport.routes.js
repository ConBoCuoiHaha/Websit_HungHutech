const express = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const controller = require('../controllers/complianceReport.controller');

const router = express.Router();

router.get('/definitions', controller.getDefinitions);
router.get('/reminders', controller.getReminderSchedule);
router.get('/history', controller.getHistory);

const commonValidators = [
  body('type')
    .isString()
    .isIn(['01PLI', 'D02TS', 'LDNU', 'BHTN', 'ATLD', 'YTLD'])
    .withMessage('Loại báo cáo không hợp lệ'),
  body('from_date').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
  body('to_date').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  body('contributions').optional().isObject().withMessage('Tỷ lệ đóng phải là object hợp lệ'),
];

router.post(
  '/preview',
  commonValidators,
  handleValidation,
  controller.previewReport,
);

router.post(
  '/export',
  commonValidators,
  handleValidation,
  controller.exportReport,
);

router.post(
  '/reminders/mark',
  [
    body('report_id').isString().notEmpty(),
    body('period_key').isString().notEmpty(),
    body('due_date').optional().isISO8601(),
    body('note').optional().isString(),
  ],
  handleValidation,
  controller.markReminderSent,
);

module.exports = router;

const express = require('express');
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const controller = require('../controllers/offboarding.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/upcoming', controller.upcoming);
router.get('/:id', [param('id').isMongoId()], handleValidation, controller.getById);

router.post(
  '/',
  [
    body('nhan_vien_id').isMongoId().withMessage('nhan_vien_id khong hop le'),
    body('last_working_day').optional().isISO8601().withMessage('Ngay khong hop le'),
  ],
  handleValidation,
  controller.create,
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId(),
    body('status').isString(),
  ],
  handleValidation,
  controller.updateStatus,
);

router.patch(
  '/:id/tasks/:taskId',
  [param('id').isMongoId(), param('taskId').isMongoId()],
  handleValidation,
  controller.updateTask,
);

module.exports = router;

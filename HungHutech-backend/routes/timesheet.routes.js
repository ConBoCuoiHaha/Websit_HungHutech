const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheet,
  updateTimesheetStatus,
  approveTimesheet,
} = require('../controllers/timesheet.controller');

router
  .route('/')
  .post(
    [
      body('nhan_vien_id').isMongoId(),
      body('tuan_bat_dau').isISO8601(),
      body('entries').isArray().optional(),
    ],
    handleValidation,
    createTimesheet,
  )
  .get([query('nhan_vien_id').optional().isMongoId()], handleValidation, getAllTimesheets);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getTimesheetById)
  .put([param('id').isMongoId()], handleValidation, updateTimesheet);

router
  .route('/:id/status')
  .put([param('id').isMongoId(), body('trang_thai').isIn(['Cho duyet', 'Da duyet', 'Bi tu choi'])], handleValidation, updateTimesheetStatus);

router
  .route('/:id/approve')
  .put(
    [
      param('id').isMongoId(),
      body('trang_thai').isIn(['Da duyet', 'Bi tu choi']),
      body('ghi_chu').optional().isString(),
    ],
    handleValidation,
    approveTimesheet,
  );

module.exports = router;


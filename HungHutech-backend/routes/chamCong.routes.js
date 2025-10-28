const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const {
  clockIn,
  clockOut,
  getAttendanceHistory,
  getAllAttendance,
  updateAttendanceRecord,
} = require('../controllers/chamCong.controller.js');

// Dành cho quản lý/admin - Get all attendance
router.get('/', getAllAttendance);

// Dành cho nhân viên
router.post('/clock-in', [body('nhan_vien_id').isMongoId()], handleValidation, clockIn);
router.post('/clock-out', [body('nhan_vien_id').isMongoId()], handleValidation, clockOut);

// Dành cho nhân viên và quản lý
router.get(
  '/history/:nhan_vien_id',
  [param('nhan_vien_id').isMongoId(), query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  handleValidation,
  getAttendanceHistory,
);

// Dành cho quản lý/admin
router.put('/:id', [param('id').isMongoId()], handleValidation, updateAttendanceRecord);

module.exports = router;


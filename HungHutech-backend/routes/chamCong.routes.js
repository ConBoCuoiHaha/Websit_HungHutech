const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../middlewares/auth');
const {
  clockIn,
  clockOut,
  getAttendanceHistory,
  getAllAttendance,
  updateAttendanceRecord,
} = require('../controllers/chamCong.controller.js');
const NhanVien = require('../schemas/nhanVien.model');

// Manager/Admin - list attendance (with optional department filter)
router.get('/', allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const { phong_ban_id } = req.query;
    if (phong_ban_id) {
      const emps = await NhanVien.find({ 'thong_tin_cong_viec.phong_ban_id': phong_ban_id }).select('_id');
      req.employeeIdsForDept = emps.map((e) => e._id);
    }
    return getAllAttendance(req, res);
  } catch (e) {
    next(e);
  }
});

// Employee
router.post('/clock-in', [body('nhan_vien_id').isMongoId()], handleValidation, clockIn);
router.post('/clock-out', [body('nhan_vien_id').isMongoId()], handleValidation, clockOut);

// Employee/Manager
router.get(
  '/history/:nhan_vien_id',
  [param('nhan_vien_id').isMongoId(), query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  handleValidation,
  (req, res, next) => {
    // Allow: admin/manager any; employee only their own record
    const user = req.user || {};
    const role = user.role;
    const selfId = (user.nhan_vien_id || '').toString();
    const paramId = (req.params.nhan_vien_id || '').toString();
    if (role === 'admin' || role === 'manager' || (selfId && selfId === paramId)) {
      return getAttendanceHistory(req, res);
    }
    return res.status(403).json({ msg: 'Không có quyền truy cập' });
  },
);

// Manager/Admin
router.put('/:id', allowRoles('admin', 'manager'), [param('id').isMongoId()], handleValidation, updateAttendanceRecord);

module.exports = router;

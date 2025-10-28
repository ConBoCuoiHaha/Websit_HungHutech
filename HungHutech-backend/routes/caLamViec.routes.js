const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createCaLamViec,
  getAllCaLamViec,
  getCaLamViecById,
  updateCaLamViec,
  deleteCaLamViec
} = require('../controllers/caLamViec.controller.js');

router.route('/')
  .post([
    allowRoles('admin', 'manager'),
    body('ten_ca').isString().notEmpty().withMessage('Tên ca làm việc là bắt buộc'),
    body('gio_bat_dau').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ bắt đầu không hợp lệ (HH:mm)'),
    body('gio_ket_thuc').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ kết thúc không hợp lệ (HH:mm)'),
    body('thoi_gian_nghi').optional().isInt({ min: 0 }).withMessage('Thời gian nghỉ phải là số nguyên dương'),
    body('trang_thai').optional().isIn(['Kích hoạt', 'Không kích hoạt']).withMessage('Trạng thái không hợp lệ')
  ], handleValidation, createCaLamViec)
  .get(getAllCaLamViec);

router.route('/:id')
  .get([param('id').isMongoId()], handleValidation, getCaLamViecById)
  .put([
    allowRoles('admin', 'manager'),
    param('id').isMongoId(),
    body('ten_ca').optional().isString().notEmpty(),
    body('gio_bat_dau').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('gio_ket_thuc').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('thoi_gian_nghi').optional().isInt({ min: 0 }),
    body('trang_thai').optional().isIn(['Kích hoạt', 'Không kích hoạt'])
  ], handleValidation, updateCaLamViec)
  .delete([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, deleteCaLamViec);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const {
  createYeuCauNghiPhep,
  getAllYeuCauNghiPhep,
  getYeuCauNghiPhepById,
  updateYeuCauStatus,
  cancelYeuCau,
} = require('../controllers/yeuCauNghiPhep.controller.js');

// Dành cho nhân viên và quản lý
router
  .route('/')
  .post(
    [
      body('nhan_vien_id').isMongoId(),
      body('loai_ngay_nghi_id').isMongoId(),
      body('ngay_bat_dau').isISO8601(),
      body('ngay_ket_thuc').isISO8601(),
      body('so_ngay').isFloat({ gt: 0 }),
    ],
    handleValidation,
    createYeuCauNghiPhep,
  )
  .get(
    [
      query('nhan_vien_id').optional().isMongoId(),
      query('trang_thai').optional().isString(),
      query('from').optional().isISO8601(),
      query('to').optional().isISO8601(),
    ],
    handleValidation,
    getAllYeuCauNghiPhep,
  );

// Dành cho nhân viên và quản lý
router.route('/:id').get([param('id').isMongoId()], handleValidation, getYeuCauNghiPhepById);

// Dành cho quản lý
router
  .route('/:id/status')
  .put(
    [
      param('id').isMongoId(),
      body('trang_thai').isIn(['Cho duyet', 'Da duyet', 'Bi tu choi', 'Da huy']),
      body('nguoi_duyet_id').optional().isMongoId(),
    ],
    handleValidation,
    updateYeuCauStatus,
  );

// Dành cho nhân viên
router.route('/:id/cancel').put([param('id').isMongoId()], handleValidation, cancelYeuCau);

module.exports = router;


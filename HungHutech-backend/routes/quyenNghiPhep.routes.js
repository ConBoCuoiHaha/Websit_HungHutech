const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createQuyenNghiPhep,
    getAllQuyenNghiPhep,
    getQuyenNghiPhepById,
    updateQuyenNghiPhep,
    deleteQuyenNghiPhep
} = require('../controllers/quyenNghiPhep.controller.js');

router.route('/')
    .post([
      allowRoles('admin','manager'),
      body('nhan_vien_id').isMongoId(),
      body('loai_ngay_nghi_id').isMongoId(),
      body('so_ngay_duoc_huong').isFloat({ min: 0 }),
      body('nam').isInt({ min: 1900 }),
    ], handleValidation, createQuyenNghiPhep)
    .get([
      query('nhan_vien_id').optional().isMongoId(),
      query('nam').optional().isInt(),
    ], handleValidation, getAllQuyenNghiPhep);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getQuyenNghiPhepById)
    .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateQuyenNghiPhep)
    .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteQuyenNghiPhep);

module.exports = router;

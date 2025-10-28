const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createLoaiNgayNghi,
    getAllLoaiNgayNghi,
    getLoaiNgayNghiById,
    updateLoaiNgayNghi,
    deleteLoaiNgayNghi
} = require('../controllers/loaiNgayNghi.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten').isString().notEmpty()], handleValidation, createLoaiNgayNghi)
  .get(getAllLoaiNgayNghi);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getLoaiNgayNghiById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateLoaiNgayNghi)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteLoaiNgayNghi);

module.exports = router;

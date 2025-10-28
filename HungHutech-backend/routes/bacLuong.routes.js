const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createBacLuong,
    getAllBacLuong,
    getBacLuongById,
    updateBacLuong,
    deleteBacLuong
} = require('../controllers/bacLuong.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten_bac_luong').isString().notEmpty()], handleValidation, createBacLuong)
  .get(getAllBacLuong);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getBacLuongById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateBacLuong)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteBacLuong);

module.exports = router;

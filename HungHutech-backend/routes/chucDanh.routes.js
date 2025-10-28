const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createChucDanh,
    getAllChucDanh,
    getChucDanhById,
    updateChucDanh,
    deleteChucDanh
} = require('../controllers/chucDanh.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten_chuc_danh').isString().notEmpty()], handleValidation, createChucDanh)
  .get(getAllChucDanh);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getChucDanhById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateChucDanh)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteChucDanh);

module.exports = router;

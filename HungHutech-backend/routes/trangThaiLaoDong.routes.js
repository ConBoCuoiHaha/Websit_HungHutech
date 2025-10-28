const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createTrangThaiLaoDong,
    getAllTrangThaiLaoDong,
    getTrangThaiLaoDongById,
    updateTrangThaiLaoDong,
    deleteTrangThaiLaoDong
} = require('../controllers/trangThaiLaoDong.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten').isString().notEmpty()], handleValidation, createTrangThaiLaoDong)
  .get(getAllTrangThaiLaoDong);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getTrangThaiLaoDongById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateTrangThaiLaoDong)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteTrangThaiLaoDong);

module.exports = router;

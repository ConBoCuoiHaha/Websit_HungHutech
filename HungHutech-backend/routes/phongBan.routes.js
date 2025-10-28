const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createPhongBan,
    getAllPhongBan,
    getPhongBanById,
    updatePhongBan,
    deletePhongBan
} = require('../controllers/phongBan.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten').isString().notEmpty()], handleValidation, createPhongBan)
  .get(getAllPhongBan);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getPhongBanById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updatePhongBan)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deletePhongBan);

module.exports = router;

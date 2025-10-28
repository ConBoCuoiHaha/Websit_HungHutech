const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
    createDiaDiem,
    getAllDiaDiem,
    getDiaDiemById,
    updateDiaDiem,
    deleteDiaDiem
} = require('../controllers/diaDiem.controller.js');

router.route('/')
  .post([allowRoles('admin','manager'), body('ten').isString().notEmpty()], handleValidation, createDiaDiem)
  .get(getAllDiaDiem);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getDiaDiemById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateDiaDiem)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteDiaDiem);

module.exports = router;

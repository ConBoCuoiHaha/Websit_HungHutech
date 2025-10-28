const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const { createKPI, getAllKPIs, getKPIById, updateKPI, deleteKPI } = require('../controllers/kpi.controller');

router
  .route('/')
  .post([allowRoles('admin','manager'), body('ten').isString().notEmpty()], handleValidation, createKPI)
  .get([query('q').optional().isString()], handleValidation, getAllKPIs);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getKPIById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateKPI)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteKPI);

module.exports = router;


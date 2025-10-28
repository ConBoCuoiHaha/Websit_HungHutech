const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createVacancy,
  getAllVacancies,
  getVacancyById,
  updateVacancy,
  deleteVacancy,
} = require('../controllers/vacancy.controller');

router
  .route('/')
  .post([
    allowRoles('admin','manager'),
    body('tieu_de').isString().notEmpty(),
    body('hiring_manager_id').isMongoId(),
  ], handleValidation, createVacancy)
  .get([
    query('q').optional().isString(),
  ], handleValidation, getAllVacancies);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getVacancyById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateVacancy)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteVacancy);

module.exports = router;


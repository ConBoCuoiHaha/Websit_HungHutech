const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} = require('../controllers/application.controller');

router
  .route('/')
  .post([
    allowRoles('admin','manager'),
    body('vacancy_id').isMongoId(),
    body('candidate_id').isMongoId(),
  ], handleValidation, createApplication)
  .get([
    query('vacancy_id').optional().isMongoId(),
    query('candidate_id').optional().isMongoId(),
  ], handleValidation, getAllApplications);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getApplicationById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateApplication)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteApplication);

module.exports = router;


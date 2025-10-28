const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidate.controller');

router
  .route('/')
  .post([allowRoles('admin','manager'), body('ho_ten').isString().notEmpty(), body('email').isEmail()], handleValidation, createCandidate)
  .get([query('q').optional().isString()], handleValidation, getAllCandidates);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getCandidateById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateCandidate)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteCandidate);

module.exports = router;


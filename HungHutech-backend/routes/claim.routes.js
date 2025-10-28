const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const { createClaim, getAllClaims, getClaimById, updateClaim, deleteClaim } = require('../controllers/claim.controller');

router
  .route('/')
  .post([
    body('nhan_vien_id').isMongoId(),
    body('items').isArray().optional(),
  ], handleValidation, createClaim)
  .get([query('nhan_vien_id').optional().isMongoId()], handleValidation, getAllClaims);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getClaimById)
  .put([param('id').isMongoId()], handleValidation, updateClaim)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteClaim);

module.exports = router;


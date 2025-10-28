const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require('../controllers/performanceReview.controller');

router
  .route('/')
  .post([
    allowRoles('admin','manager'),
    body('nhan_vien_id').isMongoId(),
    body('nguoi_danh_gia_id').isMongoId(),
    body('tu_ngay').isISO8601(),
    body('den_ngay').isISO8601(),
  ], handleValidation, createReview)
  .get([query('nhan_vien_id').optional().isMongoId()], handleValidation, getAllReviews);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getReviewById)
  .put([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, updateReview)
  .delete([allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, deleteReview);

module.exports = router;


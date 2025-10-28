const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require('../controllers/activity.controller');

router
  .route('/')
  .post(
    [allowRoles('admin', 'manager'), body('project_id').isMongoId(), body('ten').isString().notEmpty()],
    handleValidation,
    createActivity,
  )
  .get([query('project_id').optional().isMongoId()], handleValidation, getAllActivities);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getActivityById)
  .put([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, updateActivity)
  .delete([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, deleteActivity);

module.exports = router;


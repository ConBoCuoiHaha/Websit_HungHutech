const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');

router
  .route('/')
  .post([allowRoles('admin', 'manager'), body('ten').isString().notEmpty()], handleValidation, createProject)
  .get(getAllProjects);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getProjectById)
  .put([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, updateProject)
  .delete([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, deleteProject);

module.exports = router;


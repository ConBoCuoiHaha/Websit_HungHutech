const express = require('express');
const router = express.Router();
const {body, param} = require('express-validator');
const {handleValidation} = require('../utils/validator');
const {allowRoles} = require('../utils/authHandler');
const {
  createVacancy,
  getAllVacancies,
  getVacancyById,
  updateVacancy,
  deleteVacancy,
  publishToChannels,
  getJobBoards,
} = require('../controllers/vacancy.controller');

router
  .route('/')
  .post(
    [
      allowRoles('admin', 'manager'),
      body('tieu_de').isString().notEmpty(),
      body('hiring_manager_id').isMongoId(),
    ],
    handleValidation,
    createVacancy,
  )
  .get(getAllVacancies);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getVacancyById)
  .put(
    [allowRoles('admin', 'manager'), param('id').isMongoId()],
    handleValidation,
    updateVacancy,
  )
  .delete(
    [allowRoles('admin', 'manager'), param('id').isMongoId()],
    handleValidation,
    deleteVacancy,
  );

router.get(
  '/channels/list',
  allowRoles('admin', 'manager'),
  getJobBoards,
);

router.post(
  '/:id/publish',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId(),
    body('channels').isArray({min: 1}),
  ],
  handleValidation,
  publishToChannels,
);

module.exports = router;

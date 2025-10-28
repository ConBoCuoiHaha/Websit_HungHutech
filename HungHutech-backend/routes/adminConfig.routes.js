const express = require('express');
const router = express.Router();
const adminConfigController = require('../controllers/adminConfig.controller');
const { auth } = require('../utils/authHandler');

// Helper để tạo routes cho mỗi entity
const createRoutes = (controller, basePath) => {
  const entityRouter = express.Router();

  entityRouter.get('/', controller.getAll);
  entityRouter.get('/:id', controller.getById);
  entityRouter.post('/', controller.create);
  entityRouter.put('/:id', controller.update);
  entityRouter.delete('/:id', controller.delete);
  entityRouter.patch('/:id/toggle-active', controller.toggleActive);

  return entityRouter;
};

// Apply auth middleware cho tất cả routes
router.use(auth);

// Register routes cho từng entity
router.use('/employment-statuses', createRoutes(adminConfigController.employmentStatus));
router.use('/job-categories', createRoutes(adminConfigController.jobCategory));
router.use('/nationalities', createRoutes(adminConfigController.nationality));
router.use('/skills', createRoutes(adminConfigController.skill));
router.use('/education-levels', createRoutes(adminConfigController.educationLevel));
router.use('/languages', createRoutes(adminConfigController.language));

module.exports = router;

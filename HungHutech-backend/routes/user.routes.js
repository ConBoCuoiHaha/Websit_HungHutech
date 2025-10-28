const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, allowRoles } = require('../utils/authHandler');

// All routes require authentication
router.use(auth);

// Admin-only routes for user management
router.get('/', allowRoles('admin'), userController.getAll);
router.get('/:id', allowRoles('admin', 'manager'), userController.getById);
router.post('/', allowRoles('admin'), userController.create);
router.put('/:id', allowRoles('admin'), userController.update);
router.delete('/:id', allowRoles('admin'), userController.delete);

// Change password (any authenticated user can change their own password)
router.put('/:id/change-password', userController.changePassword);

module.exports = router;

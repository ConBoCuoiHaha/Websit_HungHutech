const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeDocument.controller');
const { allowRoles } = require('../utils/authHandler');
router.get('/my', controller.listMyDocuments);

router.get('/', allowRoles('admin', 'manager'), controller.listDocuments);
router.get('/:id', allowRoles('admin', 'manager'), controller.getDocument);
router.post('/', allowRoles('admin', 'manager'), controller.createDocument);
router.put('/:id', allowRoles('admin', 'manager'), controller.updateDocument);
router.delete('/:id', allowRoles('admin', 'manager'), controller.deleteDocument);

module.exports = router;

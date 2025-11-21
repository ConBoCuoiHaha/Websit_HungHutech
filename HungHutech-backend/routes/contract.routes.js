const express = require('express');

const router = express.Router();
const controller = require('../controllers/contract.controller');
const { allowRoles } = require('../utils/authHandler');

router.get('/', allowRoles('admin', 'manager'), controller.listContracts);
router.get('/expiring', allowRoles('admin', 'manager'), controller.listExpiringContracts);
router.get('/:id', allowRoles('admin', 'manager'), controller.getContract);
router.post('/', allowRoles('admin', 'manager'), controller.createContract);
router.put('/:id', allowRoles('admin', 'manager'), controller.updateContract);
router.patch('/:id/status', allowRoles('admin', 'manager'), controller.changeStatus);
router.delete('/:id', allowRoles('admin', 'manager'), controller.deleteContract);

module.exports = router;

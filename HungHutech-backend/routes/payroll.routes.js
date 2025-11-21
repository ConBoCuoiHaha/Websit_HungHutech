const express = require('express');

const router = express.Router();
const controller = require('../controllers/payroll.controller');
const { allowRoles } = require('../utils/authHandler');

const canManagePayroll = allowRoles('admin', 'manager');

router.post('/runs/preview', canManagePayroll, controller.previewPayrollData);
router.get('/runs', canManagePayroll, controller.listPayrollRuns);
router.post('/runs', canManagePayroll, controller.createPayrollRun);
router.get('/runs/:id', canManagePayroll, controller.getPayrollRun);
router.patch('/runs/:id/status', canManagePayroll, controller.updateRunStatus);
router.patch('/runs/:id/entries/:entryId/status', canManagePayroll, controller.updateEntryStatus);
router.get('/runs/:id/export', canManagePayroll, controller.exportPayrollRun);
router.get('/runs/:id/export-template/:template', canManagePayroll, controller.exportPayrollTemplate);
router.get('/my/payslips', controller.listMyPayslips);

module.exports = router;

const express = require('express');
const router = express.Router();
const payrollConfirmationController = require('../controllers/payrollConfirmation.controller');
const { auth: protect, allowRoles: authorize } = require('../middlewares/auth');

// API 1: Send confirmations to employees (Admin/Manager only)
router.post(
  '/runs/:runId/send-confirmations',
  protect,
  authorize('admin', 'manager'),
  payrollConfirmationController.sendConfirmations
);

// API 2: Get my pending payrolls (Employee)
router.get(
  '/entries/my-pending',
  protect,
  payrollConfirmationController.getMyPendingPayrolls
);

// API 3: Employee confirm payroll
router.post(
  '/entries/:entryId/confirm',
  protect,
  payrollConfirmationController.confirmPayroll
);

// API 4: Employee reject payroll
router.post(
  '/entries/:entryId/reject',
  protect,
  payrollConfirmationController.rejectPayroll
);

// API 5: Get confirmations (Admin/Manager only)
router.get(
  '/runs/:runId/confirmations',
  protect,
  authorize('admin', 'manager'),
  payrollConfirmationController.getConfirmations
);

// API 6: Resolve rejection (Admin/Manager only)
router.put(
  '/entries/:entryId/resolve-rejection',
  protect,
  authorize('admin', 'manager'),
  payrollConfirmationController.resolveRejection
);

module.exports = router;

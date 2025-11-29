const express = require('express');
const router = express.Router();
const biometricController = require('../controllers/biometric.controller');
const { auth: protect } = require('../middlewares/auth');

// API 1: Register biometric device (Employee only)
router.post(
  '/register',
  protect,
  biometricController.registerBiometric
);

// API 2: Verify biometric signature (Employee only)
router.post(
  '/verify',
  protect,
  biometricController.verifyBiometric
);

// API 3: Get biometric registration status (Employee only)
router.get(
  '/status',
  protect,
  biometricController.getBiometricStatus
);

// API 4: Unregister biometric device (Employee only)
router.delete(
  '/unregister',
  protect,
  biometricController.unregisterBiometric
);

module.exports = router;

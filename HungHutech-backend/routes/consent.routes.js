const express = require('express');
const controller = require('../controllers/consent.controller');

const router = express.Router();

router.get('/purposes', controller.getPurposes);
router.get('/my', controller.getMyConsents);
router.post('/', controller.saveConsents);
router.get('/tracking', controller.listAllConsents);
router.get('/overview', controller.getConsentOverview);

module.exports = router;

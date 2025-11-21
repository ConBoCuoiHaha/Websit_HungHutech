const express = require('express');
const {
  listDailySummaries,
  recalculateRange,
  getViolations,
  getMySummaries,
} = require('../controllers/timeRuleEngine.controller');
const {auth} = require('../middlewares/auth');

const router = express.Router();

router.use(auth);

router.get('/daily', listDailySummaries);
router.post('/recalculate', recalculateRange);
router.get('/violations', getViolations);
router.get('/my', getMySummaries);

module.exports = router;

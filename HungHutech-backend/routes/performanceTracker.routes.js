const express = require('express');
const router = express.Router();
const performanceTrackerController = require('../controllers/performanceTracker.controller');
const { auth } = require('../utils/authHandler');

// Apply auth middleware
router.use(auth);

// Tracker routes
router.get('/', performanceTrackerController.getAll);
router.get('/statistics', performanceTrackerController.getStatistics);
router.get('/:id', performanceTrackerController.getById);
router.post('/', performanceTrackerController.create);
router.put('/:id', performanceTrackerController.update);
router.delete('/:id', performanceTrackerController.delete);

// Goal routes
router.post('/:id/goals', performanceTrackerController.addGoal);
router.put('/goals/:goalId', performanceTrackerController.updateGoal);
router.delete('/goals/:goalId', performanceTrackerController.deleteGoal);

// Overall review
router.put('/:id/overall-review', performanceTrackerController.updateOverallReview);

module.exports = router;

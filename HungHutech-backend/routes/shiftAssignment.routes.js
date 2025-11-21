const express = require('express');
const {
  listAssignments,
  bulkAssign,
  deleteAssignment,
} = require('../controllers/shiftAssignment.controller');
const {auth} = require('../middlewares/auth');

const router = express.Router();

router.use(auth);

router.get('/', listAssignments);
router.post('/', bulkAssign);
router.delete('/:id', deleteAssignment);

module.exports = router;

const express = require('express');

const router = express.Router();
const controller = require('../controllers/profileRequest.controller');
const { allowRoles } = require('../utils/authHandler');

router.post('/', controller.createRequest);
router.get('/my', controller.getMyRequests);
router.get('/', allowRoles('admin', 'manager'), controller.listRequests);
router.patch('/:id/status', allowRoles('admin', 'manager'), controller.updateStatus);

module.exports = router;

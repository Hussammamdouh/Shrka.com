const express = require('express');
const router = express.Router();
const joinRequestController = require('../controllers/joinRequest.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/', requireAuth, joinRequestController.submitJoinRequest);
router.get('/my', requireAuth, joinRequestController.listMyJoinRequests);

module.exports = router; 
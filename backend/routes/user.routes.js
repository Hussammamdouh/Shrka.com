const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const companyController = require('../controllers/company.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.put('/profile/password', requireAuth, userController.changePassword);
router.put('/profile/avatar', requireAuth, userController.updateAvatar);
router.get('/companies', requireAuth, companyController.listUserCompanies);

module.exports = router; 
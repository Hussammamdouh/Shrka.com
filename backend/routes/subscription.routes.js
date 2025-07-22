const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const checkRoleLevel = require('../middlewares/checkRoleLevel.middleware');
const checkCompanySubscription = require('../middlewares/checkCompanySubscription.middleware');
const validate = require('../middlewares/validate.middleware');
const { startSubscriptionSchema } = require('../validators/subscription.validator');
const { ROLES } = require('../constants/roles');

// Only Superadmin can start subscription
router.post('/start', requireAuth, checkCompanyRole('companyId', ROLES.SUPERADMIN), validate(startSubscriptionSchema), subscriptionController.startSubscription);

// Get subscription status
router.get('/status/:companyId', requireAuth, checkCompanyRole('companyId', ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.SUPERVISOR, ROLES.SALESMAN), subscriptionController.getSubscriptionStatus);

// Admin: list all subscriptions
router.get('/', requireAuth, checkRoleLevel('companyId', ROLES.SUPERADMIN, 5), subscriptionController.listSubscriptions);

module.exports = router; 
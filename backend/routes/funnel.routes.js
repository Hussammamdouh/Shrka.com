const express = require('express');
const router = express.Router();
const funnelController = require('../controllers/funnel.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const validate = require('../middlewares/validate.middleware');
const { createFunnelSchema } = require('../validators/funnel.validator');

router.post('/', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), validate(createFunnelSchema), funnelController.createOrUpdateFunnel);
router.get('/:companyId', requireAuth, funnelController.getFunnel);
router.get('/analytics', requireAuth, funnelController.funnelAnalytics);

module.exports = router; 
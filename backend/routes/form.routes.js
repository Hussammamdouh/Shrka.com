const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const validate = require('../middlewares/validate.middleware');
const { createFormSchema, submitFormSchema } = require('../validators/form.validator');
const checkCompanySubscription = require('../middlewares/checkCompanySubscription.middleware');

router.post('/', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), validate(createFormSchema), formController.createOrUpdateForm);
router.get('/:companyId', requireAuth, formController.listForms);
router.post('/:formId/submit', requireAuth, validate(submitFormSchema), formController.submitForm);
router.get('/submissions/lead/:leadId', requireAuth, formController.getSubmissionsByLead);
router.get('/submissions/user/:userId', requireAuth, formController.getSubmissionsByUser);
router.get('/export/csv', requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'superadmin', 'supervisor']), formController.exportFormSubmissionsToCsv);

module.exports = router; 
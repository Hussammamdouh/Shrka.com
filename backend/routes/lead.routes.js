const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const validate = require('../middlewares/validate.middleware');
const { createLeadSchema, assignLeadSchema, updateStageSchema } = require('../validators/lead.validator');
const checkCompanySubscription = require('../middlewares/checkCompanySubscription.middleware');
const Lead = require('../models/lead.model'); // Added missing import for Lead model

router.post('/', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager', 'Supervisor'), validate(createLeadSchema), leadController.createLead);
router.put('/:leadId/assign', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager'), validate(assignLeadSchema), leadController.assignLead);
router.put('/:leadId/stage', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager', 'Supervisor'), validate(updateStageSchema), leadController.updateStage);
router.post('/:leadId/notes', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager', 'Supervisor', 'Salesman'), leadController.addNote);
router.post('/:leadId/attachments', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager', 'Supervisor', 'Salesman'), leadController.addAttachment);
router.post('/import', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager'), leadController.importLeads);
router.get('/export', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin', 'Sales Manager'), leadController.exportLeads);
router.get('/export/csv', requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'superadmin', 'supervisor']), leadController.exportLeadsToCsv);
router.get('/:leadId', requireAuth, leadController.getLead);
router.get('/', requireAuth, checkCompanySubscription, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const leads = await Lead.find({ companyId: req.company._id, ...filters })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Lead.countDocuments({ companyId: req.company._id, ...filters });
    res.json({ success: true, data: { leads, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 
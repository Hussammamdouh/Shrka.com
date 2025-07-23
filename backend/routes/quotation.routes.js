const express = require('express');
const router = express.Router({ mergeParams: true });
const quotationController = require('../controllers/quotation.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const checkPermission = require('../middlewares/checkPermission.middleware');
const checkCompanySubscription = require('../middlewares/checkCompanySubscription.middleware');
const Quotation = require('../models/quotation.model'); // Added missing import

// Only Admin or Supervisor can create; Only Supervisor/Admin can approve/reject
const createOnly = [requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'supervisor'])];
const approveOnly = [requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'supervisor'])];

router.get('/', requireAuth, checkCompanySubscription, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const quotations = await Quotation.find({ companyId: req.company._id, ...filters })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Quotation.countDocuments({ companyId: req.company._id, ...filters });
    res.json({ success: true, data: { quotations, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
});
router.get('/:quotationId', requireAuth, checkCompanySubscription, quotationController.getQuotation);
router.post('/', ...createOnly, quotationController.createQuotation);
router.patch('/:quotationId/status', ...approveOnly, quotationController.updateQuotationStatus);
router.get('/export/csv', requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'superadmin', 'supervisor']), quotationController.exportQuotationsToCsv);

module.exports = router; 
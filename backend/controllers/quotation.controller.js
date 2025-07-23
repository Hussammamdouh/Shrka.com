const quotationService = require('../services/quotation.service');
const { createQuotationSchema, updateQuotationStatusSchema } = require('../validators/quotation.validator');
const validate = require('../middlewares/validate.middleware');
const { exportToCsv } = require('../utils/csv-export.util');

// List quotations for a company or lead
exports.listQuotations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.leadId) filter.leadId = req.query.leadId;
    const quotations = await quotationService.getQuotations(req.company._id, filter);
    res.json({ success: true, data: quotations });
  } catch (err) {
    next(err);
  }
};

// Get single quotation
exports.getQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.company._id, req.params.quotationId);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

// Create quotation
exports.createQuotation = [
  validate(createQuotationSchema),
  async (req, res, next) => {
    try {
      const quotation = await quotationService.createQuotation(req.company._id, req.user._id, req.body);
      res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }
];

// Approve or reject quotation
exports.updateQuotationStatus = [
  validate(updateQuotationStatusSchema),
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      const quotation = await quotationService.updateQuotationStatus(
        req.company._id,
        req.params.quotationId,
        status,
        notes,
        req.user._id
      );
      if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }
];

exports.exportQuotationsToCsv = async (req, res, next) => {
  try {
    const quotations = await require('../models/quotation.model').find({ companyId: req.company._id });
    const fields = [
      { label: 'Quotation ID', value: '_id' },
      { label: 'Lead ID', value: 'leadId' },
      { label: 'Status', value: 'status' },
      { label: 'Subtotal', value: 'subtotal' },
      { label: 'Tax Total', value: 'taxTotal' },
      { label: 'Total', value: 'total' },
      { label: 'Created At', value: 'createdAt' },
    ];
    exportToCsv(res, 'quotations.csv', quotations, fields);
  } catch (err) {
    next(err);
  }
}; 
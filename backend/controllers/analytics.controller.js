const Lead = require('../models/lead.model');
const SalesFunnel = require('../models/salesFunnel.model');
const Quotation = require('../models/quotation.model');
const FormSubmission = require('../models/formSubmission.model');

// GET /analytics/:companyId
exports.companyAnalytics = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // 1. Count of leads by funnel stage
    const leadsByStage = await Lead.aggregate([
      { $match: { companyId: require('mongoose').Types.ObjectId(companyId), ...dateFilter } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    // 2. Quotations: total, by status, total value
    const quotationsAgg = await Quotation.aggregate([
      { $match: { companyId: require('mongoose').Types.ObjectId(companyId), ...dateFilter } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' },
      }},
    ]);
    const totalQuotations = quotationsAgg.reduce((sum, q) => sum + q.count, 0);
    const totalQuotationValue = quotationsAgg.reduce((sum, q) => sum + q.totalValue, 0);
    const quotationsByStatus = {};
    quotationsAgg.forEach(q => { quotationsByStatus[q._id] = { count: q.count, totalValue: q.totalValue }; });

    // 3. Form submissions per form
    const formSubmissions = await FormSubmission.aggregate([
      { $match: { companyId: require('mongoose').Types.ObjectId(companyId), ...dateFilter } },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
    ]);

    // 4. Lead conversion rates (leads with status 'converted' / total leads)
    const totalLeads = await Lead.countDocuments({ companyId, ...dateFilter });
    const convertedLeads = await Lead.countDocuments({ companyId, status: 'converted', ...dateFilter });
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    res.json({
      success: true,
      data: {
        leadsByStage,
        quotations: {
          total: totalQuotations,
          byStatus: quotationsByStatus,
          totalValue: totalQuotationValue,
        },
        formSubmissions,
        leadConversion: {
          totalLeads,
          convertedLeads,
          conversionRate,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}; 
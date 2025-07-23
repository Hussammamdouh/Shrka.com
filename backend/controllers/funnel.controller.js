const SalesFunnel = require('../models/salesFunnel.model');
const { createFunnelSchema } = require('../validators/funnel.validator');
const { AppError, catchAsync } = require('../utils/error.util');
const Lead = require('../models/lead.model');

exports.createOrUpdateFunnel = catchAsync(async (req, res) => {
  const { error } = createFunnelSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const { companyId, stages } = req.body;
  // Prevent duplicate stage names
  const names = stages.map(s => s.name.toLowerCase());
  if (new Set(names).size !== names.length) throw new AppError('Duplicate stage names are not allowed', 400, 'DUPLICATE_STAGE');
  let funnel = await SalesFunnel.findOneAndUpdate(
    { companyId },
    { stages },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: funnel, message: 'Funnel saved' });
});

exports.getFunnel = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const funnel = await SalesFunnel.findOne({ companyId });
  if (!funnel) return res.status(404).json({ success: false, message: 'Funnel not found', data: null });
  res.json({ success: true, data: funnel, message: 'Funnel fetched' });
});

exports.funnelAnalytics = catchAsync(async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) throw new AppError('companyId is required', 400);
  const funnel = await SalesFunnel.findOne({ companyId });
  if (!funnel) throw new AppError('Funnel not found', 404);
  const stages = funnel.stages.map(s => s.name);
  const stageCounts = await Lead.aggregate([
    { $match: { companyId: require('mongoose').Types.ObjectId(companyId) } },
    { $group: { _id: '$currentStage', count: { $sum: 1 } } }
  ]);
  const counts = {};
  stages.forEach(stage => {
    counts[stage] = stageCounts.find(s => s._id === stage)?.count || 0;
  });
  // Conversion rate: leads in last stage / leads in first stage
  const firstStage = stages[0];
  const lastStage = stages[stages.length - 1];
  const conversionRate = counts[firstStage] ? (counts[lastStage] / counts[firstStage]) * 100 : 0;
  res.json({ success: true, data: { stages, counts, conversionRate }, message: 'Funnel analytics' });
}); 
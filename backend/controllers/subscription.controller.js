const Subscription = require('../models/subscription.model');
const { startSubscriptionSchema } = require('../validators/subscription.validator');
const { AppError, catchAsync } = require('../utils/error.util');
const { ROLES } = require('../constants/roles');

exports.startSubscription = catchAsync(async (req, res) => {
  const { error } = startSubscriptionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  // Only Superadmin can subscribe
  if (req.companyRole !== ROLES.SUPERADMIN) throw new AppError('Only Superadmin can subscribe', 403, 'FORBIDDEN');
  const sub = await Subscription.create({ ...req.body, subscribedBy: req.user._id, status: 'active' });
  res.status(201).json({ success: true, data: sub, message: 'Subscription started' });
});

exports.getSubscriptionStatus = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const sub = await Subscription.findOne({ companyId, status: 'active', endDate: { $gte: new Date() } });
  res.json({ success: true, data: { active: !!sub, subscription: sub }, message: 'Subscription status fetched' });
});

exports.listSubscriptions = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const subs = await Subscription.find()
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Subscription.countDocuments();
  res.json({ success: true, data: subs, message: 'Subscriptions fetched', page: Number(page), limit: Number(limit), total });
}); 
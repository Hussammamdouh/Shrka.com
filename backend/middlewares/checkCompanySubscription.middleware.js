const Subscription = require('../models/subscription.model');
const { AppError } = require('../utils/error.util');

const checkCompanySubscription = async (req, res, next) => {
  const companyId = req.params.companyId || req.body.companyId;
  if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required', data: null });
  const sub = await Subscription.findOne({ companyId, status: 'active', endDate: { $gte: new Date() } });
  if (!sub) return res.status(402).json({ success: false, message: 'Company subscription inactive', data: null, errorCode: 'SUBSCRIPTION_INACTIVE' });
  next();
};

module.exports = checkCompanySubscription; 
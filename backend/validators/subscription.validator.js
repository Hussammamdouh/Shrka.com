const Joi = require('joi');

const startSubscriptionSchema = Joi.object({
  companyId: Joi.string().required(),
  planType: Joi.string().valid('monthly', 'annual').required(),
  amountPaid: Joi.number().required(),
  paymentMethod: Joi.string().valid('stripe', 'manual').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

module.exports = { startSubscriptionSchema }; 
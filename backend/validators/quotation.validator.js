const Joi = require('joi');

const productItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
});

const createQuotationSchema = Joi.object({
  leadId: Joi.string().required(),
  products: Joi.array().items(productItemSchema).min(1).required(),
  notes: Joi.string().allow('').trim(),
});

const updateQuotationStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  notes: Joi.string().allow('').trim(),
});

module.exports = {
  createQuotationSchema,
  updateQuotationStatusSchema,
}; 
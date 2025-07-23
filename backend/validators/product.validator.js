const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('').trim(),
  category: Joi.string().allow('').trim(),
  price: Joi.number().min(0).required(),
  taxRate: Joi.number().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().allow('').trim(),
  category: Joi.string().allow('').trim(),
  price: Joi.number().min(0),
  taxRate: Joi.number().min(0),
  isActive: Joi.boolean(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
}; 
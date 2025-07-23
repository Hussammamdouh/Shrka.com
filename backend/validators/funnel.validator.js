const Joi = require('joi');

const stageSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  order: Joi.number().integer().min(1).required()
});

const createFunnelSchema = Joi.object({
  companyId: Joi.string().required(),
  stages: Joi.array().items(stageSchema).min(1).required()
});

module.exports = { createFunnelSchema }; 
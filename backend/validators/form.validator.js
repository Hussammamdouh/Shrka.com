const Joi = require('joi');

const fieldSchema = Joi.object({
  label: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('text', 'dropdown', 'checkbox', 'textarea', 'date').required(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string()).optional()
});

const createFormSchema = Joi.object({
  companyId: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  fields: Joi.array().items(fieldSchema).min(1).required(),
  linkedToStage: Joi.string().optional()
});

const submitFormSchema = Joi.object({
  leadId: Joi.string().required(),
  responses: Joi.object().required()
});

module.exports = { createFormSchema, submitFormSchema }; 
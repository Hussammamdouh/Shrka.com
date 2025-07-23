const Joi = require('joi');

const createLeadSchema = Joi.object({
  companyId: Joi.string().required(),
  contact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    whatsapp: Joi.string().optional()
  }).required(),
  assignedTo: Joi.string().optional(),
  status: Joi.string().valid('New', 'In Progress', 'Closed Won', 'Closed Lost').optional(),
  currentStage: Joi.string().optional()
});

const assignLeadSchema = Joi.object({
  assignedTo: Joi.string().required(),
  reason: Joi.string().optional()
});

const updateStageSchema = Joi.object({
  currentStage: Joi.string().required()
});

module.exports = { createLeadSchema, assignLeadSchema, updateStageSchema }; 
const Joi = require('joi');

const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  industry: Joi.string().max(100).optional(),
  description: Joi.string().max(255).optional()
});

const inviteUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  userId: Joi.string().optional(),
  role: Joi.string().valid('Admin', 'Sales Manager', 'Supervisor', 'Salesman').required(),
});

const assignRoleSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid('Admin', 'Sales Manager', 'Supervisor', 'Salesman').required(),
});

const updateSettingsSchema = Joi.object({
  logo: Joi.string().uri().optional(),
  address: Joi.string().max(255).optional(),
  settings: Joi.object().optional(),
  metadata: Joi.object().optional(),
});
module.exports = { createCompanySchema, inviteUserSchema, assignRoleSchema, updateSettingsSchema }; 
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
module.exports = { createCompanySchema, inviteUserSchema, assignRoleSchema }; 
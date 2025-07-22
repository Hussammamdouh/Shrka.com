const companyService = require('../services/company.service');
const UserCompanyRole = require('../models/userCompanyRole.model');
const { createCompanySchema, inviteUserSchema, assignRoleSchema } = require('../validators/company.validator');
const { AppError, catchAsync } = require('../utils/error.util');

exports.createCompany = catchAsync(async (req, res) => {
  const { error } = createCompanySchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const company = await companyService.createCompany({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: company, message: 'Company created' });
});

exports.inviteUser = catchAsync(async (req, res) => {
  const { error } = inviteUserSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const user = await companyService.inviteUser({ ...req.body, companyId: req.params.companyId, invitedBy: req.user._id });
  res.json({ success: true, data: user, message: 'User invited' });
});

exports.listUserCompanies = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = { userId: req.user._id };
  if (search) query['companyId.name'] = { $regex: search, $options: 'i' };
  const roles = await UserCompanyRole.find(query)
    .populate({ path: 'companyId', match: search ? { name: { $regex: search, $options: 'i' } } : {} })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const filtered = roles.filter(r => r.companyId);
  res.json({
    success: true,
    data: filtered.map(r => ({ company: r.companyId, role: r.role })),
    message: 'Companies fetched',
    page: Number(page),
    limit: Number(limit),
    total: filtered.length
  });
});

exports.assignRole = catchAsync(async (req, res) => {
  const { error } = assignRoleSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const userRole = await companyService.assignRole({ ...req.body, companyId: req.params.companyId, assignedBy: req.user._id });
  res.json({ success: true, data: userRole, message: 'Role assigned' });
});

exports.updateCompany = catchAsync(async (req, res) => {
  const company = await companyService.updateCompany({ companyId: req.params.companyId, updates: req.body, updatedBy: req.user._id });
  res.json({ success: true, data: company, message: 'Company updated' });
});

exports.deleteCompany = catchAsync(async (req, res) => {
  const company = await companyService.deleteCompany({ companyId: req.params.companyId, deletedBy: req.user._id });
  res.json({ success: true, data: company, message: 'Company deleted' });
});

exports.removeUser = catchAsync(async (req, res) => {
  const result = await companyService.removeUser({ companyId: req.params.companyId, userId: req.body.userId, removedBy: req.user._id });
  res.json({ success: true, data: result, message: 'User removed from company' });
});

exports.updateSettings = catchAsync(async (req, res) => {
  const company = await companyService.updateSettings({ companyId: req.params.companyId, settings: req.body.settings, updatedBy: req.user._id });
  res.json({ success: true, data: company, message: 'Company settings updated' });
});

exports.approveJoinRequest = catchAsync(async (req, res) => {
  const reqDoc = await companyService.approveJoinRequest({ requestId: req.params.requestId, approvedBy: req.user._id });
  res.json({ success: true, data: reqDoc, message: 'Join request approved' });
});

exports.rejectJoinRequest = catchAsync(async (req, res) => {
  const reqDoc = await companyService.rejectJoinRequest({ requestId: req.params.requestId, rejectedBy: req.user._id });
  res.json({ success: true, data: reqDoc, message: 'Join request rejected' });
});

// TODO: approveJoinRequest, rejectJoinRequest for Phase 3 
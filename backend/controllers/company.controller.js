const companyService = require('../services/company.service');
const UserCompanyRole = require('../models/userCompanyRole.model');
const { createCompanySchema, inviteUserSchema, assignRoleSchema } = require('../validators/company.validator');
const { AppError, catchAsync } = require('../utils/error.util');
const logger = require('../utils/logger.util');

exports.createCompany = catchAsync(async (req, res) => {
  const { error } = createCompanySchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const company = await companyService.createCompany({ ...req.body, createdBy: req.user._id });
  // Assign creator as Superadmin if not already assigned
  const existingRole = await UserCompanyRole.findOne({
    userId: req.user._id,
    companyId: company._id
  });
  if (!existingRole) {
    await UserCompanyRole.create({
      userId: req.user._id,
      companyId: company._id,
      role: 'Superadmin'
    });
  }
  res.status(201).json({ success: true, data: company, message: 'Company created' });
});

exports.inviteUser = catchAsync(async (req, res) => {
  const { error } = inviteUserSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const user = await companyService.inviteUser({ ...req.body, companyId: req.params.companyId, invitedBy: req.user._id });
  logger.info(`Invite sent: user ${user.email} invited to company ${req.params.companyId} by ${req.user._id}`);
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

exports.listCompanyUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const companyId = req.params.companyId;
  const users = await UserCompanyRole.find({ companyId })
    .populate('userId', 'name email roles')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await UserCompanyRole.countDocuments({ companyId });
  res.json({
    success: true,
    data: users.map(r => ({ user: r.userId, role: r.role })),
    message: 'Company users fetched',
    page: Number(page),
    limit: Number(limit),
    total
  });
});

exports.listCompanyInvites = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const companyId = req.params.companyId;
  const JoinRequest = require('../models/joinRequest.model');
  const invites = await JoinRequest.find({ companyId })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await JoinRequest.countDocuments({ companyId });
  res.json({
    success: true,
    data: invites,
    message: 'Company invites fetched',
    page: Number(page),
    limit: Number(limit),
    total
  });
});

exports.assignRole = catchAsync(async (req, res) => {
  const { error } = assignRoleSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const userRole = await companyService.assignRole({ ...req.body, companyId: req.params.companyId, assignedBy: req.user._id });
  logger.info(`Role assigned: user ${req.body.userId} assigned role ${req.body.role} in company ${req.params.companyId} by ${req.user._id}`);
  res.json({ success: true, data: userRole, message: 'Role assigned' });
});

exports.updateCompany = catchAsync(async (req, res) => {
  const company = await companyService.updateCompany({ companyId: req.params.companyId, updates: req.body, updatedBy: req.user._id });
  res.json({ success: true, data: company, message: 'Company updated' });
});

exports.deactivateCompany = catchAsync(async (req, res) => {
  const company = await require('../models/company.model').findById(req.params.companyId);
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  if (!company.isActive) throw new AppError('Company already deactivated', 400, 'ALREADY_DEACTIVATED');
  company.isActive = false;
  await company.save();
  await require('../models/auditLog.model').logAudit({ action: 'company_deactivated', actorId: req.user._id, companyId: company._id });
  res.json({ success: true, data: company, message: 'Company deactivated' });
});

exports.reactivateCompany = catchAsync(async (req, res) => {
  const company = await require('../models/company.model').findById(req.params.companyId);
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  if (company.isActive) throw new AppError('Company already active', 400, 'ALREADY_ACTIVE');
  company.isActive = true;
  await company.save();
  await require('../models/auditLog.model').logAudit({ action: 'company_reactivated', actorId: req.user._id, companyId: company._id });
  res.json({ success: true, data: company, message: 'Company reactivated' });
});

exports.deleteCompany = catchAsync(async (req, res) => {
  const company = await require('../models/company.model').findById(req.params.companyId);
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  if (company.isActive) throw new AppError('Deactivate company before deletion', 400, 'DEACTIVATE_FIRST');
  // Optionally check retention period here
  await company.deleteOne();
  await require('../models/auditLog.model').logAudit({ action: 'company_deleted', actorId: req.user._id, companyId: company._id });
  res.json({ success: true, data: null, message: 'Company deleted' });
});

exports.removeUser = catchAsync(async (req, res) => {
  const result = await companyService.removeUser({ companyId: req.params.companyId, userId: req.body.userId, removedBy: req.user._id });
  res.json({ success: true, data: result, message: 'User removed from company' });
});

exports.updateSettings = catchAsync(async (req, res) => {
  const company = await companyService.updateSettings({ companyId: req.params.companyId, settings: req.body, updatedBy: req.user._id });
  await require('../models/auditLog.model').logAudit({ action: 'company_settings_updated', actorId: req.user._id, companyId: req.params.companyId, metadata: req.body });
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

exports.getCompanyById = catchAsync(async (req, res) => {
  const company = await require('../models/company.model').findById(req.params.companyId);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found', data: null });
  res.json({ success: true, data: company, message: 'Company fetched' });
});

exports.listAllCompanies = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const companies = await require('../models/company.model').find()
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await require('../models/company.model').countDocuments();
  res.json({ success: true, data: companies, message: 'All companies fetched', page: Number(page), limit: Number(limit), total });
});

exports.addUserToCompany = catchAsync(async (req, res) => {
  // Accepts { email, userId, role }
  const { error } = require('../validators/company.validator').inviteUserSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const user = await companyService.inviteUser({ ...req.body, companyId: req.params.companyId, invitedBy: req.user._id });
  res.json({ success: true, data: user, message: 'User added to company' });
});

exports.updateUserPermissions = catchAsync(async (req, res) => {
  const { companyId, userId } = req.params;
  const { permissions } = req.body;
  const assignerRole = await UserCompanyRole.findOne({ userId: req.user._id, companyId });
  if (!assignerRole || (assignerRole.role !== 'Superadmin' && assignerRole.role !== 'Admin')) {
    throw new AppError('Only Superadmin or Admin can update permissions', 403, 'FORBIDDEN');
  }
  const userRole = await UserCompanyRole.findOneAndUpdate(
    { userId, companyId },
    { permissions },
    { new: true }
  );
  if (!userRole) throw new AppError('User not in company', 404, 'USER_NOT_IN_COMPANY');
  await require('../models/auditLog.model').logAudit({
    action: 'permissions_updated',
    actorId: req.user._id,
    companyId,
    targetId: userId,
    metadata: { permissions }
  });
  res.json({ success: true, data: userRole, message: 'User permissions updated' });
});

// TODO: approveJoinRequest, rejectJoinRequest for Phase 3 
// TODO: Add checkCompanySubscription to all business endpoints (company, leads, products, etc.) 
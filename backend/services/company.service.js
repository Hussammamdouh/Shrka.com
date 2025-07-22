const Company = require('../models/company.model');
const User = require('../models/user.model');
const UserCompanyRole = require('../models/userCompanyRole.model');
const AuditLog = require('../models/auditLog.model');
const { AppError } = require('../utils/error.util');

exports.createCompany = async ({ name, industry, createdBy }) => {
  const company = await Company.create({ name, industry, createdBy });
  await UserCompanyRole.create({ userId: createdBy, companyId: company._id, role: 'Superadmin' });
  await AuditLog.logAudit({ action: 'company_created', actorId: createdBy, companyId: company._id });
  return company;
};

exports.inviteUser = async ({ companyId, email, userId, role, invitedBy }) => {
  let user = null;
  if (email) user = await User.findOne({ email });
  if (!user && userId) user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  const existing = await UserCompanyRole.findOne({ userId: user._id, companyId });
  if (existing) throw new AppError('User already in company', 409);
  await UserCompanyRole.create({ userId: user._id, companyId, role });
  await AuditLog.logAudit({ action: 'user_invited', actorId: invitedBy, companyId, targetId: user._id, metadata: { role } });
  return user;
};

exports.assignRole = async ({ companyId, userId, role, assignedBy }) => {
  const userRole = await UserCompanyRole.findOneAndUpdate(
    { userId, companyId },
    { role },
    { new: true }
  );
  if (!userRole) throw new AppError('User not in company', 404);
  await AuditLog.logAudit({ action: 'role_assigned', actorId: assignedBy, companyId, targetId: userId, metadata: { role } });
  return userRole;
};

exports.updateCompany = async ({ companyId, updates, updatedBy }) => {
  const company = await Company.findByIdAndUpdate(companyId, updates, { new: true });
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  await AuditLog.logAudit({ action: 'company_updated', actorId: updatedBy, companyId });
  return company;
};

exports.deleteCompany = async ({ companyId, deletedBy }) => {
  const company = await Company.findByIdAndDelete(companyId);
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  await UserCompanyRole.deleteMany({ companyId });
  await AuditLog.logAudit({ action: 'company_deleted', actorId: deletedBy, companyId });
  return company;
};

exports.removeUser = async ({ companyId, userId, removedBy }) => {
  const result = await UserCompanyRole.findOneAndDelete({ companyId, userId });
  if (!result) throw new AppError('User not in company', 404, 'USER_NOT_IN_COMPANY');
  await AuditLog.logAudit({ action: 'user_removed', actorId: removedBy, companyId, targetId: userId });
  return result;
};

exports.updateSettings = async ({ companyId, settings, updatedBy }) => {
  const company = await Company.findByIdAndUpdate(companyId, { $set: { settings } }, { new: true });
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  await AuditLog.logAudit({ action: 'company_settings_updated', actorId: updatedBy, companyId });
  return company;
};

exports.approveJoinRequest = async ({ requestId, approvedBy }) => {
  const JoinRequest = require('../models/joinRequest.model');
  const reqDoc = await JoinRequest.findById(requestId);
  if (!reqDoc || reqDoc.status !== 'pending') throw new AppError('Request not found or already handled', 404, 'REQUEST_NOT_FOUND');
  reqDoc.status = 'approved';
  reqDoc.reviewedBy = approvedBy;
  reqDoc.reviewedAt = new Date();
  await reqDoc.save();
  await UserCompanyRole.create({ userId: reqDoc.userId, companyId: reqDoc.companyId, role: 'Salesman' });
  await AuditLog.logAudit({ action: 'join_request_approved', actorId: approvedBy, companyId: reqDoc.companyId, targetId: reqDoc.userId });
  return reqDoc;
};

exports.rejectJoinRequest = async ({ requestId, rejectedBy }) => {
  const JoinRequest = require('../models/joinRequest.model');
  const reqDoc = await JoinRequest.findById(requestId);
  if (!reqDoc || reqDoc.status !== 'pending') throw new AppError('Request not found or already handled', 404, 'REQUEST_NOT_FOUND');
  reqDoc.status = 'rejected';
  reqDoc.reviewedBy = rejectedBy;
  reqDoc.reviewedAt = new Date();
  await reqDoc.save();
  await AuditLog.logAudit({ action: 'join_request_rejected', actorId: rejectedBy, companyId: reqDoc.companyId, targetId: reqDoc.userId });
  return reqDoc;
};

// TODO: Implement approveJoinRequest, rejectJoinRequest for Phase 3 
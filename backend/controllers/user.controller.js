const User = require('../models/user.model');
const AuditLog = require('../models/auditLog.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { AppError, catchAsync } = require('../utils/error.util');

exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  res.json({ success: true, data: user, message: 'Profile fetched' });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
  await AuditLog.logAudit({ action: 'profile_updated', actorId: req.user._id });
  res.json({ success: true, data: user, message: 'Profile updated' });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await comparePassword(oldPassword, user.password))) {
    throw new AppError('Old password incorrect', 400, 'OLD_PASSWORD_INCORRECT');
  }
  user.password = await hashPassword(newPassword);
  await user.save();
  await AuditLog.logAudit({ action: 'password_changed', actorId: req.user._id });
  res.json({ success: true, data: null, message: 'Password changed' });
});

exports.updateAvatar = catchAsync(async (req, res) => {
  const { avatarUrl } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true });
  await AuditLog.logAudit({ action: 'avatar_updated', actorId: req.user._id });
  res.json({ success: true, data: user, message: 'Avatar updated' });
}); 
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token.util');
const { AppError, catchAsync } = require('../utils/error.util');
const { sendMail } = require('../utils/mailer.util');
const AuditLog = require('../models/auditLog.model');
const BlacklistedToken = require('../models/blacklistedToken.model');
const crypto = require('crypto');
const logger = require('../utils/logger.util');
const { randomUUID } = require('crypto');

const logEvent = async (user, event, req, meta = {}) => {
  await AuditLog.create({
    user: user?._id,
    event,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    meta,
  });
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (await User.findOne({ email })) throw new AppError('Email already in use', 409);
  const hashed = await hashPassword(password);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await User.create({
    name,
    email,
    password: hashed,
    phone,
    emailVerificationCode: code,
    emailVerificationExpires: Date.now() + 15 * 60 * 1000,
  });
  await sendMail(
    user.email,
    'Verify your email',
    `<p>Your verification code is: <b>${code}</b></p><p>This code expires in 15 minutes.</p>`
  );
  await AuditLog.logAudit({ action: 'user_registered', actorId: user._id });
  res.status(201).json({ message: 'User registered. Please verify your email.' });
});

exports.verifyEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email, emailVerificationCode: code, emailVerificationExpires: { $gt: Date.now() } });
  if (!user) throw new AppError('Invalid or expired code', 400);
  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  await AuditLog.logAudit({ action: 'email_verified', actorId: user._id });
  res.json({ message: 'Email verified. You can now log in.' });
});

exports.resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.emailVerified) return res.json({ message: 'Email already verified.' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationCode = code;
  user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  await sendMail(
    user.email,
    'Verify your email',
    `<p>Your verification code is: <b>${code}</b></p><p>This code expires in 15 minutes.</p>`
  );
  res.json({ message: 'Verification code resent.' });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn(`Failed login attempt for email: ${email} from IP: ${req.ip} UA: ${req.headers['user-agent']}`);
    await AuditLog.logAudit({ action: 'login_failed', actorId: null, metadata: { email, ip: req.ip } });
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  if (user.isBlocked) {
    logger.warn(`Blocked user login attempt: ${email} from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'login_blocked', actorId: user._id, metadata: { ip: req.ip } });
    throw new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED');
  }
  if (user.lockUntil && user.lockUntil > Date.now()) {
    logger.warn(`Locked user login attempt: ${email} from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'login_locked', actorId: user._id, metadata: { ip: req.ip } });
    throw new AppError('Account is locked. Try again later.', 403, 'ACCOUNT_LOCKED');
  }
  if (!user.emailVerified) {
    logger.warn(`Unverified email login attempt: ${email} from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'login_unverified', actorId: user._id, metadata: { ip: req.ip } });
    throw new AppError('Please verify your email before logging in.', 403, 'EMAIL_NOT_VERIFIED');
  }
  if (!(await comparePassword(password, user.password))) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME;
      await AuditLog.logAudit({ action: 'account_locked', actorId: user._id, metadata: { ip: req.ip } });
      logger.warn(`Account locked due to failed attempts: ${email} from IP: ${req.ip}`);
    }
    await user.save();
    await AuditLog.logAudit({ action: 'login_failed', actorId: user._id, metadata: { ip: req.ip } });
    logger.warn(`Failed login attempt for email: ${email} from IP: ${req.ip}`);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  // Session management: create a new session with UUID refresh token
  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = randomUUID();
  user.sessions.push({ refreshToken, userAgent: req.headers['user-agent'] });
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  await AuditLog.logAudit({ action: 'user_login', actorId: user._id, metadata: { ip: req.ip } });
  logger.info(`User login: [REDACTED] from IP: ${req.ip}`);
  res.json({ success: true, data: { accessToken, user: { id: user._id, name: user.name, email: user.email, roles: user.roles } }, message: 'Login successful' });
});

exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    logger.warn(`Refresh token missing from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'refresh_failed', actorId: null, metadata: { ip: req.ip } });
    throw new AppError('No refresh token', 401);
  }
  // Check blacklist
  const blacklisted = await BlacklistedToken.findOne({ token: refreshToken });
  if (blacklisted) {
    logger.warn(`Blacklisted refresh token used from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'refresh_failed_blacklisted', actorId: null, metadata: { ip: req.ip } });
    throw new AppError('Token is blacklisted', 401);
  }
  const user = await User.findOne({ 'sessions.refreshToken': refreshToken });
  if (!user) {
    logger.warn(`Invalid refresh token used from IP: ${req.ip}`);
    await AuditLog.logAudit({ action: 'refresh_failed_invalid', actorId: null, metadata: { ip: req.ip } });
    throw new AppError('Invalid refresh token', 401);
  }
  // Rotate refresh token
  const newAccessToken = signAccessToken({ id: user._id });
  const newRefreshToken = randomUUID();
  const session = user.sessions.find(s => s.refreshToken === refreshToken);
  if (session) session.refreshToken = newRefreshToken;
  user.refreshToken = newRefreshToken;
  await user.save();
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  await AuditLog.logAudit({ action: 'token_refreshed', actorId: user._id, metadata: { ip: req.ip } });
  logger.info(`Refresh token rotated for user: ${user.email} from IP: ${req.ip}`);
  res.json({ accessToken: newAccessToken });
});

exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const user = await User.findOne({ 'sessions.refreshToken': refreshToken });
    if (user) {
      await BlacklistedToken.create({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
      user.sessions = user.sessions.filter(s => s.refreshToken !== refreshToken);
      user.refreshToken = null;
      await user.save();
      await logEvent(user, 'logout', req);
      logger.info(`User logout: ${user.email} from IP: ${req.ip}`);
    }
    res.clearCookie('refreshToken');
  }
  res.json({ message: 'Logged out successfully' });
});

// Admin/IT Support: List users
exports.listUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password -refreshToken -resetPasswordCode -resetPasswordExpires -emailVerificationCode -emailVerificationExpires');
  res.json(users);
});

// Admin/IT Support: Block/unblock user
exports.blockUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isBlocked = true;
  await user.save();
  await logEvent(user, 'blocked', req);
  res.json({ message: 'User blocked.' });
});

exports.unblockUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isBlocked = false;
  await user.save();
  await logEvent(user, 'unblocked', req);
  res.json({ message: 'User unblocked.' });
});

// Session management: List sessions
exports.listSessions = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.sessions || []);
});

// Session management: Revoke session
exports.revokeSession = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id);
  user.sessions = user.sessions.filter(s => s.refreshToken !== refreshToken);
  await BlacklistedToken.create({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  logger.info(`Session revoked for user: ${user.email} from IP: ${req.ip}`);
  res.json({ message: 'Session revoked.' });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    user.resetPasswordCode = code;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();
    await sendMail(
      user.email,
      'Your Password Reset Code',
      `<p>Your password reset code is: <b>${code}</b></p><p>This code expires in 15 minutes.</p>`
    );
  }
  res.json({ message: 'If that email is registered, a reset code has been sent.' });
});

exports.verifyResetCode = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email, resetPasswordCode: code, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) throw new AppError('Invalid or expired code', 400);
  res.json({ message: 'Code verified. You may now reset your password.' });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email, resetPasswordCode: code, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) throw new AppError('Invalid or expired code', 400);
  user.password = await hashPassword(newPassword);
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful. You can now log in.' });
}); 
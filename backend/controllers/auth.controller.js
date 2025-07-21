const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token.util');
const { AppError, catchAsync } = require('../utils/error.util');
const { sendMail } = require('../utils/mailer.util');
const AuditLog = require('../models/auditLog.model');
const BlacklistedToken = require('../models/blacklistedToken.model');
const crypto = require('crypto');

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
  await logEvent(user, 'register', req);
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
  await logEvent(user, 'email_verified', req);
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
    await logEvent(null, 'login_failed', req, { email });
    throw new AppError('Invalid credentials', 401);
  }
  if (user.isBlocked) throw new AppError('Account is blocked', 403);
  if (user.lockUntil && user.lockUntil > Date.now()) throw new AppError('Account is locked. Try again later.', 403);
  if (!user.emailVerified) throw new AppError('Please verify your email before logging in.', 403);
  if (!(await comparePassword(password, user.password))) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME;
      await logEvent(user, 'account_locked', req);
    }
    await user.save();
    await logEvent(user, 'login_failed', req);
    throw new AppError('Invalid credentials', 401);
  }
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  // Session management: create a new session
  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = signRefreshToken({ id: user._id });
  user.sessions.push({ refreshToken, userAgent: req.headers['user-agent'] });
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  await logEvent(user, 'login', req);
  res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, roles: user.roles } });
});

exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) throw new AppError('No refresh token', 401);
  // Check blacklist
  const blacklisted = await BlacklistedToken.findOne({ token: refreshToken });
  if (blacklisted) throw new AppError('Token is blacklisted', 401);
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== refreshToken) throw new AppError('Invalid refresh token', 401);
  const newAccessToken = signAccessToken({ id: user._id });
  const newRefreshToken = signRefreshToken({ id: user._id });
  user.refreshToken = newRefreshToken;
  // Update session
  const session = user.sessions.find(s => s.refreshToken === refreshToken);
  if (session) session.refreshToken = newRefreshToken;
  await user.save();
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  await logEvent(user, 'refresh_token', req);
  res.json({ accessToken: newAccessToken });
});

exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      // Blacklist the token
      await BlacklistedToken.create({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
      user.refreshToken = null;
      user.sessions = user.sessions.filter(s => s.refreshToken !== refreshToken);
      await user.save();
      await logEvent(user, 'logout', req);
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
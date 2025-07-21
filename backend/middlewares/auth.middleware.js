const { verifyAccessToken } = require('../utils/token.util');
const User = require('../models/user.model');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyAccessToken(token);
      req.user = await User.findById(payload.id).select('-password');
    } catch (err) {
      // ignore error, user remains undefined
    }
  }
  next();
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || !req.user.roles.global.includes(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireRole }; 
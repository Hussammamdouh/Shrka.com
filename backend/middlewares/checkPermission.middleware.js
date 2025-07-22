const UserCompanyRole = require('../models/userCompanyRole.model');
const { AppError } = require('../utils/error.util');

const checkPermission = (companyIdParam, permission) => async (req, res, next) => {
  const companyId = req.params[companyIdParam] || req.body[companyIdParam];
  if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required', data: null });
  const userId = req.user._id;
  const userRole = await UserCompanyRole.findOne({ userId, companyId });
  if (!userRole || !(userRole.permissions && userRole.permissions.includes(permission))) {
    return res.status(403).json({ success: false, message: 'Forbidden: missing permission', data: null, errorCode: 'INSUFFICIENT_PERMISSION' });
  }
  next();
};

module.exports = checkPermission; 
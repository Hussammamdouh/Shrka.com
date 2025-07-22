const UserCompanyRole = require('../models/userCompanyRole.model');
const { AppError } = require('../utils/error.util');
const { ROLE_LEVELS } = require('../constants/roles');

const checkRoleLevel = (companyIdParam, role, minLevel = 1) => async (req, res, next) => {
  const companyId = req.params[companyIdParam] || req.body[companyIdParam];
  if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required', data: null });
  const userId = req.user._id;
  const userRole = await UserCompanyRole.findOne({ userId, companyId });
  if (!userRole || userRole.role !== role || userRole.level < minLevel) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role or level', data: null, errorCode: 'INSUFFICIENT_ROLE_LEVEL' });
  }
  req.companyRole = userRole.role;
  req.companyRoleLevel = userRole.level;
  next();
};

module.exports = checkRoleLevel; 
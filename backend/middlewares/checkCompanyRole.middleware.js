const UserCompanyRole = require('../models/userCompanyRole.model');
const { AppError } = require('../utils/error.util');

const checkCompanyRole = (companyIdParam, ...roles) => async (req, res, next) => {
  const companyId = req.params[companyIdParam] || req.body[companyIdParam] || req[companyIdParam];
  if (!companyId) return res.status(400).json({ message: 'Company ID required' });
  const userId = req.user._id;
  const userRole = await UserCompanyRole.findOne({ userId, companyId });
  if (!userRole || !roles.includes(userRole.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient company role' });
  }
  req.companyRole = userRole.role;
  next();
};

module.exports = checkCompanyRole; 
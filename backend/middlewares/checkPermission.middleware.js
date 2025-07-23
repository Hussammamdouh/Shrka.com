const UserCompanyRole = require('../models/userCompanyRole.model');
const { AppError } = require('../utils/error.util');
const canPerformAction = require('./canPerformAction');

const checkPermission = (companyIdParam, permission, leadStage) => async (req, res, next) => {
  const companyId = req.params[companyIdParam] || req.body[companyIdParam];
  const userId = req.user._id;
  const ok = await canPerformAction(userId, companyId, permission, leadStage);
  if (!ok) return res.status(403).json({ success: false, message: 'Forbidden: missing permission', data: null, errorCode: 'INSUFFICIENT_PERMISSION' });
  next();
};

module.exports = checkPermission; 
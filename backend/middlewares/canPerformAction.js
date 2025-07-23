const UserCompanyRole = require('../models/userCompanyRole.model');
const { ROLE_LEVELS } = require('../constants/roles');

const canPerformAction = async (userId, companyId, actionType, leadStage) => {
  const userRole = await UserCompanyRole.findOne({ userId, companyId });
  if (!userRole) return false;
  // Example: check for stage-specific permission
  if (userRole.permissions && userRole.permissions.includes(actionType)) return true;
  // Example: check for level-based permission (customize as needed)
  if (userRole.level >= (ROLE_LEVELS[userRole.role] || 1)) return true;
  // TODO: Add more granular checks for stage, form, etc.
  return false;
};

module.exports = canPerformAction; 
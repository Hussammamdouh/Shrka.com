const AuditLog = require('../models/auditLog.model');
const { AppError, catchAsync } = require('../utils/error.util');

exports.listAuditLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, action, actorId, companyId, targetId, from, to } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (actorId) filter.actorId = actorId;
  if (companyId) filter.companyId = companyId;
  if (targetId) filter.targetId = targetId;
  if (from || to) filter.timestamp = {};
  if (from) filter.timestamp.$gte = new Date(from);
  if (to) filter.timestamp.$lte = new Date(to);
  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await AuditLog.countDocuments(filter);
  res.json({ success: true, data: logs, message: 'Audit logs fetched', page: Number(page), limit: Number(limit), total });
}); 
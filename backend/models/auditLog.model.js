const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  metadata: Object,
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ companyId: 1, action: 1 });

auditLogSchema.statics.logAudit = async function({ action, actorId, companyId, targetId, metadata }) {
  return this.create({ action, actorId, companyId, targetId, metadata });
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 
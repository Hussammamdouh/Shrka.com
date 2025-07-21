const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: String, required: true },
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
  meta: Object,
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 
const mongoose = require('mongoose');
const { ROLES, PERMISSIONS } = require('../constants/roles');

const userCompanyRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  role: { type: String, enum: Object.values(ROLES), required: true },
  level: { type: Number, default: 1 },
  permissions: [{ type: String, enum: PERMISSIONS }],
  lastAssignedAt: { type: Date },
}, { timestamps: true });

userCompanyRoleSchema.index({ userId: 1, companyId: 1 }, { unique: true });
userCompanyRoleSchema.index({ companyId: 1 });
userCompanyRoleSchema.index({ userId: 1 });

module.exports = mongoose.model('UserCompanyRole', userCompanyRoleSchema); 
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  phone: { type: String },
  roles: {
    global: { type: [String], default: [] },
    // companyRoles: [{ companyId, roles: [String] }] // For future extension
  },
  refreshToken: { type: String }, // Store latest refresh token (optional, for logout)
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  emailVerificationExpires: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isBlocked: { type: Boolean, default: false },
  sessions: [{
    refreshToken: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 
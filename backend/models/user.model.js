const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
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
  passwordHistory: [{
    password: { type: String },
    changedAt: { type: Date, default: Date.now }
  }],
  companyRoles: [{
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    roles: [String]
  }],
  sessions: [{
    refreshToken: String,
    userAgent: String,
    ip: String,
    location: String, // Placeholder for future geo lookup
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 
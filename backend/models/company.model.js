const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: { type: String },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logo: { type: String },
  address: { type: String },
  settings: { type: Object },
  metadata: { type: Object }
}, { timestamps: { createdAt: true, updatedAt: false } });

companySchema.index({ createdBy: 1 });

module.exports = mongoose.model('Company', companySchema); 
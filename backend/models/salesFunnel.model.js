const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const salesFunnelSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  stages: [stageSchema]
}, { timestamps: true });

salesFunnelSchema.index({ companyId: 1 });

module.exports = mongoose.model('SalesFunnel', salesFunnelSchema); 
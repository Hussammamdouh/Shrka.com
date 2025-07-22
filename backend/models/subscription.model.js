const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  subscribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'expired', 'canceled'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  planType: { type: String, enum: ['monthly', 'annual'], required: true },
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['stripe', 'manual'], required: true },
}, { timestamps: true });

subscriptionSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema); 
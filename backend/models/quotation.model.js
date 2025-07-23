const mongoose = require('mongoose');

const quotationProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: { type: [quotationProductSchema], required: true },
  subtotal: { type: Number, required: true },
  taxTotal: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: { type: String },
}, { timestamps: true });

quotationSchema.index({ companyId: 1 });
quotationSchema.index({ leadId: 1 });
quotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema); 
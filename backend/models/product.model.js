const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true, index: true },
  price: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema); 
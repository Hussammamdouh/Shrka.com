const Quotation = require('../models/quotation.model');
const Product = require('../models/product.model');
const AuditLog = require('../models/auditLog.model');

async function calculateTotals(products) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error('Product not found');
    const lineSubtotal = item.unitPrice * item.quantity;
    subtotal += lineSubtotal;
    taxTotal += lineSubtotal * (product.taxRate || 0) / 100;
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

async function createQuotation(companyId, userId, data) {
  const { subtotal, taxTotal, total } = await calculateTotals(data.products);
  return await Quotation.create({
    companyId,
    leadId: data.leadId,
    createdBy: userId,
    products: data.products,
    subtotal,
    taxTotal,
    total,
    notes: data.notes,
    status: 'pending',
  });
}

async function getQuotations(companyId, filter = {}) {
  return await Quotation.find({ companyId, ...filter }).populate('leadId').populate('createdBy');
}

async function getQuotationById(companyId, quotationId) {
  return await Quotation.findOne({ _id: quotationId, companyId }).populate('leadId').populate('createdBy');
}

async function updateQuotationStatus(companyId, quotationId, status, notes, userId) {
  const quotation = await Quotation.findOne({ _id: quotationId, companyId });
  if (!quotation) return null;
  quotation.status = status;
  if (notes !== undefined) quotation.notes = notes;
  await quotation.save();
  // Audit log
  await AuditLog.create({
    companyId,
    userId,
    action: `quotation_${status}`,
    entity: 'Quotation',
    entityId: quotationId,
    details: { status, notes },
  });
  return quotation;
}

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
}; 
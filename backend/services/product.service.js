const Product = require('../models/product.model');

async function createProduct(companyId, data) {
  return await Product.create({ ...data, companyId });
}

async function getProducts(companyId, filter = {}) {
  return await Product.find({ companyId, ...filter });
}

async function getProductById(companyId, productId) {
  return await Product.findOne({ _id: productId, companyId });
}

async function updateProduct(companyId, productId, data) {
  return await Product.findOneAndUpdate(
    { _id: productId, companyId },
    { $set: data },
    { new: true }
  );
}

async function deleteProduct(companyId, productId) {
  return await Product.findOneAndDelete({ _id: productId, companyId });
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
}; 
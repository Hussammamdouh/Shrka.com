const productService = require('../services/product.service');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const validate = require('../middlewares/validate.middleware');

// List products for a company
exports.listProducts = async (req, res, next) => {
  try {
    const products = await productService.getProducts(req.company._id);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// Get single product
exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.company._id, req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Create product
exports.createProduct = [
  validate(createProductSchema),
  async (req, res, next) => {
    try {
      const product = await productService.createProduct(req.company._id, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
];

// Update product
exports.updateProduct = [
  validate(updateProductSchema),
  async (req, res, next) => {
    try {
      const product = await productService.updateProduct(req.company._id, req.params.productId, req.body);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
];

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.company._id, req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}; 
const express = require('express');
const router = express.Router({ mergeParams: true });
const productController = require('../controllers/product.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const checkPermission = require('../middlewares/checkPermission.middleware');
const checkCompanySubscription = require('../middlewares/checkCompanySubscription.middleware');
const Product = require('../models/product.model'); // Added missing import

// Only Admin or Superadmin can manage products
const adminOnly = [requireAuth, checkCompanySubscription, checkCompanyRole(['admin', 'superadmin'])];

router.get('/', requireAuth, checkCompanySubscription, productController.listProducts);
router.get('/:productId', requireAuth, checkCompanySubscription, productController.getProduct);
router.post('/', ...adminOnly, productController.createProduct);
router.put('/:productId', ...adminOnly, productController.updateProduct);
router.delete('/:productId', ...adminOnly, productController.deleteProduct);

module.exports = router; 
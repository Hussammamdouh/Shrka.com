const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const rateLimiter = require('../middlewares/rateLimiter.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } = require('../validators/auth.validator');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.post('/register', rateLimiter, validate(registerSchema), authController.register);
router.post('/login', rateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validate(verifyResetCodeSchema), authController.verifyEmail);
router.post('/resend-verification', validate(forgotPasswordSchema), authController.resendVerification);

// Admin/IT Support user management
router.get('/admin/users', requireAuth, requireRole('it_support'), authController.listUsers);
router.post('/admin/users/:userId/block', requireAuth, requireRole('it_support'), authController.blockUser);
router.post('/admin/users/:userId/unblock', requireAuth, requireRole('it_support'), authController.unblockUser);
router.post('/admin/users/:userId/unlock', requireAuth, requireRole('it_support'), authController.adminUnlockUser);

// Session management
router.get('/sessions', requireAuth, authController.listSessions);
router.post('/sessions/revoke', requireAuth, authController.revokeSession);

module.exports = router; 
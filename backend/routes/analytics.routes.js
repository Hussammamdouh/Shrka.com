const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const auditLogController = require('../controllers/auditLog.controller');
const { requireRole } = require('../middlewares/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

// TODO: Implement real analytics logic in Phase 5
router.get('/leads-by-stage', requireAuth, (req, res) => res.json({ success: true, data: [], message: 'Stub: leads by stage' }));
router.get('/form-submissions', requireAuth, (req, res) => res.json({ success: true, data: [], message: 'Stub: form submissions' }));
router.get('/assigned-leads', requireAuth, (req, res) => res.json({ success: true, data: [], message: 'Stub: assigned leads' }));
router.get('/audit-logs', requireAuth, requireRole('it_support'), auditLogController.listAuditLogs);
router.get('/:companyId', requireAuth, analyticsController.companyAnalytics);

module.exports = router; 
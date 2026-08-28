const express = require('express');
const {
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  getAdminAnalytics,
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Protect all admin endpoints: requires valid JWT token AND "admin" role
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/reports', getAdminReports);
router.get('/reports/:id', getAdminReportById);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/analytics', getAdminAnalytics);

module.exports = router;

const express = require('express');
const rateLimit = require('express-rate-limit');
const { createReport, getMyReports, getReportById, updateReport, deleteReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, uploadImages, resizeAndCompressImage, resizeAndCompressMultipleImages } = require('../middleware/upload');

const router = express.Router();

// Rate limiter for report creation: 5 requests per 15 minutes per IP
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many reports submitted from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect all routes with JWT token authentication
router.use(authenticateToken);

// Citizen report operations
router.post('/', reportLimiter, uploadImage, resizeAndCompressImage, createReport);
router.get('/my', getMyReports);
router.get('/:id', getReportById);
router.patch('/:id', uploadImages, resizeAndCompressMultipleImages, updateReport);
router.delete('/:id', deleteReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  submitFeedback,
  getUserFeedback,
  exportFeedbackToExcel
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.post('/', protect, submitFeedback);
router.get('/', protect, getUserFeedback);
router.get('/export', protect, exportFeedbackToExcel);

module.exports = router; 
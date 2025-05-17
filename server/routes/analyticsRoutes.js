const express = require('express');
const router = express.Router();
const { 
  getUserAnalytics,
  updateStudyTime
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.get('/', protect, getUserAnalytics);
router.put('/study-time', protect, updateStudyTime);

module.exports = router; 
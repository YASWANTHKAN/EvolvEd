const asyncHandler = require('express-async-handler');
const Feedback = require('../models/feedbackModel');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  try {
    const { rating, category, comment } = req.body;
    
    if (!rating || !category || !comment) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }
    
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('User not authenticated');
    }
    
    // Get user agent info for additional context
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    
    const feedback = await Feedback.create({
      user: req.user.id,
      rating,
      category,
      comment,
      device,
      browser
    });
    
    if (feedback) {
      console.log('Feedback created successfully:', feedback._id);
      res.status(201).json(feedback);
    } else {
      res.status(400);
      throw new Error('Invalid feedback data');
    }
  } catch (error) {
    console.error('Error in submitFeedback:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || 'Server error while submitting feedback'
      });
    }
  }
});

// @desc    Get all feedback for current user
// @route   GET /api/feedback
// @access  Private
const getUserFeedback = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('User not authenticated');
    }
    
    const feedback = await Feedback.find({ user: req.user.id });
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error in getUserFeedback:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || 'Server error while fetching feedback'
      });
    }
  }
});

// @desc    Export all feedback to Excel (admin only)
// @route   GET /api/feedback/export
// @access  Private/Admin
const exportFeedbackToExcel = asyncHandler(async (req, res) => {
  try {
    // TODO: Add admin check here
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('User not authenticated');
    }
    
    const feedback = await Feedback.find({}).populate('user', 'name email');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feedback');
    
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Comment', key: 'comment', width: 50 },
      { header: 'Device', key: 'device', width: 15 },
      { header: 'Browser', key: 'browser', width: 15 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add the data
    feedback.forEach(item => {
      worksheet.addRow({
        date: item.createdAt.toISOString().substring(0, 10),
        user: item.user.name,
        email: item.user.email,
        rating: item.rating,
        category: item.category,
        comment: item.comment,
        device: item.device,
        browser: item.browser
      });
    });
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `feedback_export_${Date.now()}.xlsx`;
    const filepath = path.join(uploadsDir, filename);
    
    await workbook.xlsx.writeFile(filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
      
      // Delete the file after download
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });
  } catch (error) {
    console.error('Error in exportFeedbackToExcel:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || 'Server error while exporting feedback'
      });
    }
  }
});

// Helper functions to detect device and browser from user agent
const detectDevice = (userAgent) => {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  if (/ipad/i.test(userAgent)) return 'iPad';
  return 'Desktop';
};

const detectBrowser = (userAgent) => {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
  return 'Unknown';
};

module.exports = {
  submitFeedback,
  getUserFeedback,
  exportFeedbackToExcel
}; 
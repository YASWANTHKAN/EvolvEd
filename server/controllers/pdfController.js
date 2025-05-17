const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { 
  extractTextFromPDF, 
  extractTextFromPDFFile 
} = require('../utils/pdfUtils');
const { generateSummary } = require('../services/mistralService');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Configure multer for file upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
}).single('pdf');

/**
 * Handle PDF file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with extracted text or error
 */
const uploadPDF = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filePath = req.file.path;
      const text = await extractTextFromPDFFile(filePath);
      
      // Clean up the uploaded file
      await unlinkAsync(filePath);
      
      return res.status(200).json({
        success: true,
        text: text,
        message: 'PDF text extraction successful'
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      return res.status(500).json({
        error: 'Failed to process PDF',
        details: error.message
      });
    }
  });
};

/**
 * Generate a summary from PDF text using Mistral-7B
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with summary or error
 */
const summarizePDF = async (req, res) => {
  try {
    const { text, options } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    // Default options if not provided
    const summaryOptions = {
      length: options?.length || 'medium',
      style: options?.style || 'academic',
      focus: options?.focus || 'key points'
    };
    
    // Generate prompt for the model
    const prompt = `Please summarize the following text in a ${summaryOptions.length} length ${summaryOptions.style} style, focusing on ${summaryOptions.focus}:\n\n${text}`;
    
    // Generate summary using Mistral
    const summary = await generateSummary(prompt);
    
    return res.status(200).json({
      success: true,
      summary,
      message: 'Summary generated successfully'
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: 'Failed to generate summary',
      details: error.message
    });
  }
};

module.exports = {
  uploadPDF,
  summarizePDF
}; 

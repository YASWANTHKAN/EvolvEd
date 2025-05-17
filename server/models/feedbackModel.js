const mongoose = require('mongoose');

const feedbackSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['UI/UX', 'Features', 'Content', 'Performance', 'Other']
  },
  comment: {
    type: String,
    required: [true, 'Please provide feedback comments'],
    trim: true
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema); 
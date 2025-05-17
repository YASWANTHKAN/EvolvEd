const mongoose = require('mongoose');

// Define a schema for daily study records
const dailyStudySchema = mongoose.Schema({
  date: {
    type: String, // Store as YYYY-MM-DD
    required: true
  },
  minutes: {
    type: Number,
    required: true,
    default: 0
  }
});

// Main analytics schema
const studyAnalyticsSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  totalStudyTime: {
    type: Number, // In seconds
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  studyHistory: [dailyStudySchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
studyAnalyticsSchema.index({ user: 1 });

module.exports = mongoose.model('StudyAnalytics', studyAnalyticsSchema); 
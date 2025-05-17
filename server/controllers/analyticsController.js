const asyncHandler = require('express-async-handler');
const StudyAnalytics = require('../models/studyAnalyticsModel');

// @desc    Get user analytics
// @route   GET /api/analytics
// @access  Private
const getUserAnalytics = asyncHandler(async (req, res) => {
  // Find analytics for the user
  let analytics = await StudyAnalytics.findOne({ user: req.user.id });
  
  // If no analytics exist for this user, create a new record
  if (!analytics) {
    analytics = await StudyAnalytics.create({
      user: req.user.id,
      totalStudyTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      studyHistory: []
    });
  }
  
  res.status(200).json(analytics);
});

// @desc    Update user analytics
// @route   PUT /api/analytics/study-time
// @access  Private
const updateStudyTime = asyncHandler(async (req, res) => {
  const { minutes, date } = req.body;
  
  if (!minutes || !date) {
    res.status(400);
    throw new Error('Please provide minutes and date');
  }
  
  // Find analytics for the user
  let analytics = await StudyAnalytics.findOne({ user: req.user.id });
  
  // If no analytics exist for this user, create a new record
  if (!analytics) {
    analytics = await StudyAnalytics.create({
      user: req.user.id,
      totalStudyTime: minutes * 60, // Convert to seconds
      currentStreak: 1, // Starting with 1 for today
      longestStreak: 1,
      studyHistory: [{ date, minutes }]
    });
    
    return res.status(201).json(analytics);
  }
  
  // Update the total study time
  analytics.totalStudyTime += minutes * 60; // Convert to seconds
  
  // Find if there's an entry for this date
  const dayIndex = analytics.studyHistory.findIndex(day => day.date === date);
  
  if (dayIndex >= 0) {
    // Update existing entry
    analytics.studyHistory[dayIndex].minutes += minutes;
  } else {
    // Add new entry
    analytics.studyHistory.push({ date, minutes });
  }
  
  // Calculate streak
  calculateStreak(analytics);
  
  // Update last updated timestamp
  analytics.lastUpdated = Date.now();
  
  // Save and return the updated analytics
  await analytics.save();
  
  res.status(200).json(analytics);
});

// Helper function to calculate streak
const calculateStreak = (analytics) => {
  if (!analytics.studyHistory || analytics.studyHistory.length === 0) {
    analytics.currentStreak = 0;
    return;
  }
  
  // Sort history by date (newest to oldest)
  const sortedHistory = [...analytics.studyHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  
  // Get today's date and yesterday's date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format dates as YYYY-MM-DD for comparison
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Check if studied today or yesterday to maintain streak
  const hasStudiedToday = sortedHistory.some(item => item.date === todayStr);
  const hasStudiedYesterday = sortedHistory.some(item => item.date === yesterdayStr);
  
  // If neither studied today nor yesterday, the streak is broken unless today is the first day
  if (!hasStudiedToday && !hasStudiedYesterday) {
    // Check if the last study date was within the past 48 hours
    const lastStudyDate = new Date(sortedHistory[0]?.date);
    const hoursSinceLastStudy = (today - lastStudyDate) / (1000 * 60 * 60);
    
    if (hoursSinceLastStudy > 48) {
      analytics.currentStreak = 0;
      return;
    }
  }
  
  // Create a set of all study dates for faster lookup
  const studyDates = new Set(sortedHistory.map(item => item.date));
  
  // Calculate consecutive days
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Start counting from today or yesterday, whichever has a study record
  if (!hasStudiedToday && hasStudiedYesterday) {
    checkDate = yesterday;
  }
  
  // Count consecutive days
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (studyDates.has(dateStr)) {
      currentStreak++;
      // Move to the previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Break the streak when a day is missed
    }
  }
  
  // Update current streak
  analytics.currentStreak = currentStreak;
  
  // Update longest streak if current streak is longer
  if (currentStreak > analytics.longestStreak) {
    analytics.longestStreak = currentStreak;
  }
};

module.exports = {
  getUserAnalytics,
  updateStudyTime
}; 
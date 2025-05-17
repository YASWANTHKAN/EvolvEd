import axios from 'axios';
import config from '../../config';

const API_URL = `${config.API_URL}/api/analytics`;

// Get user analytics
const getUserAnalytics = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Update study time
const updateStudyTime = async (studyData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + '/study-time', studyData, config);
  return response.data;
};

const analyticsService = {
  getUserAnalytics,
  updateStudyTime,
};

export default analyticsService; 
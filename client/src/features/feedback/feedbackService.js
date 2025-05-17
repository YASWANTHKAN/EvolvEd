import axios from 'axios';
import config from "../../config";

const API_URL = `${config.API_URL}/api/feedback`;
// Base API URL for feedback


// Submit feedback
const submitFeedback = async (feedbackData, token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  try {
    const response = await axios.post(API_URL, feedbackData, config);
    return response.data;
  } catch (error) {
    console.error('Feedback submission error:', error.response?.data || error.message);
    throw error;
  }
};

// Get user feedback
const getUserFeedback = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  try {
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    console.error('Get feedback error:', error.response?.data || error.message);
    throw error;
  }
};

// Export feedback as Excel (admin only)
const exportFeedback = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob'
  };

  try {
    const response = await axios.get(`${API_URL}export`, config);
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'feedback_export.xlsx';
    
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export feedback error:', error.response?.data || error.message);
    throw error;
  }
};

const feedbackService = {
  submitFeedback,
  getUserFeedback,
  exportFeedback
};

export default feedbackService; 
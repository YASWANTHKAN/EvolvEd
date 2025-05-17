const axios = require('axios');

// Test function to submit feedback
const testSubmitFeedback = async () => {
  try {
    // You'll need to replace this with a valid token from a logged-in user
    const token = 'YOUR_AUTH_TOKEN';
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const feedbackData = {
      rating: 5,
      category: 'UI/UX',
      comment: 'This is a test feedback'
    };
    
    console.log('Attempting to submit feedback...');
    const response = await axios.post('http://localhost:5001/api/feedback', feedbackData, config);
    
    console.log('Feedback submitted successfully:');
    console.log(response.data);
  } catch (error) {
    console.error('Error submitting feedback:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error setting up request:', error.message);
    }
  }
};

// Test function to get user feedback
const testGetFeedback = async () => {
  try {
    // You'll need to replace this with a valid token from a logged-in user
    const token = 'YOUR_AUTH_TOKEN';
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    console.log('Attempting to get feedback...');
    const response = await axios.get('http://localhost:5001/api/feedback', config);
    
    console.log('Feedback retrieved successfully:');
    console.log(response.data);
  } catch (error) {
    console.error('Error getting feedback:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
  }
};

console.log('Starting feedback API tests...');

// Uncomment the test you want to run
// testSubmitFeedback();
// testGetFeedback(); 
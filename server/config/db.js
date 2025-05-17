const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGO_URI is properly set or still using placeholder values
    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('your_mongodb_username')) {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      // In development mode, we'll mock the connection for testing the frontend
      console.log('Using mock database for development. Frontend functionality only.');
      console.log('To connect to a real MongoDB database, update the MONGO_URI in your .env file.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Don't exit the process in development to allow frontend testing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 
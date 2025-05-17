require('dotenv').config();
const mongoose = require('mongoose');

// Test MongoDB connection
console.log('Attempting to connect to MongoDB...');
console.log('URI being used:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!');
    console.log('Connection state:', mongoose.connection.readyState);
    // Test a simple query
    return mongoose.connection.db.admin().listDatabases();
  })
  .then(result => {
    console.log('Available databases:');
    result.databases.forEach(db => {
      console.log('-', db.name);
    });
    return mongoose.connection.close();
  })
  .then(() => console.log('Connection closed.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

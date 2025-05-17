const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const mongoose = require('mongoose');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Test MongoDB connection
setTimeout(() => {
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  console.log('MongoDB URI being used:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@'));
}, 2000);

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/pdf', require('./routes/pdfRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Serve client build folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
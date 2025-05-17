const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Mock user for frontend testing when database is not connected
const mockUsers = {
  testuser: {
    _id: '60d0fe4f5311236168a109ca',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$CwTycUXWue0Thq9StjUM0uQxTmLsN57kBXQXZF5PbHjimke0LMnpe', // password: 123456
  }
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if MONGO_URI is using placeholder values or not connected to DB
  if (process.env.MONGO_URI.includes('your_mongodb_username')) {
    // For testing the frontend without a database connection
    const token = generateToken('60d0fe4f5311236168a109ca');
    
    res.status(201).json({
      _id: '60d0fe4f5311236168a109ca',
      name,
      email,
      token,
    });
    return;
  }

  // For actual database use
  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if MONGO_URI is using placeholder values or not connected to DB
  if (process.env.MONGO_URI.includes('your_mongodb_username')) {
    // For testing the frontend without a database connection
    if (email === 'test@example.com' && password === '123456') {
      res.json({
        _id: '60d0fe4f5311236168a109ca',
        name: 'Test User',
        email: 'test@example.com',
        token: generateToken('60d0fe4f5311236168a109ca'),
      });
    } else {
      res.status(400);
      throw new Error('Invalid credentials');
    }
    return;
  }

  // For actual database use
  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Check if MONGO_URI is using placeholder values or not connected to DB
  if (process.env.MONGO_URI.includes('your_mongodb_username')) {
    res.status(200).json({
      _id: '60d0fe4f5311236168a109ca',
      name: 'Test User',
      email: 'test@example.com',
    });
    return;
  }

  // For actual database use
  res.status(200).json(req.user);
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
}; 
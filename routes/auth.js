const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, address, city, state, zipCode } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || ''
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
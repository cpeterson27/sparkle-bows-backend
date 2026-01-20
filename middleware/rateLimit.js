// middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

// General API rate limiter - increased limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // ✅ INCREASED from 100 to 200 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiter - more lenient for refresh token
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // ✅ INCREASED from 5 to 20 requests per window
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ Don't count successful requests
});

// Refresh token limiter - very lenient since it's called often
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // ✅ NEW: Allow 50 refresh token requests
  message: "Too many refresh attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

module.exports = { generalLimiter, authLimiter, refreshTokenLimiter };
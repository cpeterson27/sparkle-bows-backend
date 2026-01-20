// middleware/rateLimit.js - PRODUCTION READY
const rateLimit = require("express-rate-limit");

// General API rate limiter - reasonable limits for normal usage
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute
  message: "Too many requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain safe endpoints
    return req.path.startsWith('/api/products') || 
           req.path.startsWith('/api/reviews');
  }
});

// Auth-specific rate limiter - prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Refresh token limiter - very lenient
const refreshTokenLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 refresh attempts per minute
  message: "Too many refresh attempts.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Cart limiter - separate from general API
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 cart updates per minute
  message: "Too many cart updates.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { 
  generalLimiter, 
  authLimiter, 
  refreshTokenLimiter,
  cartLimiter 
};
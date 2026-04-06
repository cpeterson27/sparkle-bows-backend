// middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

// Shared config to avoid repetition
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // 🔥 Fix for ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
};

// General API rate limiter
const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests, please slow down.",
  skip: (req) => {
    return (
      req.path.startsWith("/api/products") ||
      req.path.startsWith("/api/reviews")
    );
  },
});

// Auth limiter (login/register)
const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true,
});

// Refresh token limiter
const refreshTokenLimiter = rateLimit({
  ...baseConfig,
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many refresh attempts.",
  skipSuccessfulRequests: true,
});

// Cart limiter
const cartLimiter = rateLimit({
  ...baseConfig,
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: "Too many cart updates.",
});

const contactLimiter = rateLimit({
  ...baseConfig,
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many contact requests. Please try again later.",
});

module.exports = {
  generalLimiter,
  authLimiter,
  refreshTokenLimiter,
  cartLimiter,
  contactLimiter,
};

const rateLimit = require("express-rate-limit");

const isDevelopment = process.env.NODE_ENV !== "production";

// General API rate limiter (applies to all routes you choose to mount it on)
const generalLimiter = isDevelopment
  ? (req, res, next) => next() // Skip in development
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        message: "Too many requests from this IP, please try again after 15 minutes.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Stricter limiter for auth endpoints
const authLimiter = isDevelopment
  ? (req, res, next) => next() // Skip in development
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: {
        message: "Too many auth attempts from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = { generalLimiter, authLimiter };

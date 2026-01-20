// app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

const logger = require("./logger");
const morganMiddleware = require("./middleware/morganLogger");
const { generalLimiter, authLimiter } = require("./middleware/rateLimit");

// Import route modules
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const uploadRoutes = require("./routes/upload");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const stripeRoutes = require("./routes/stripe");

const app = express();

// ------------------------
// SECURITY + CORS
// ------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // allow cloud-hosted images
      },
    },
  })
);

// ✅ FIXED: Allow both localhost and Render frontend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://sparkle-bows-frontend.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ------------------------
// RATE LIMITING
// ------------------------
app.use("/api", generalLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/refresh-token", authLimiter);

// ------------------------
// BODY + COOKIE PARSING
// ------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(mongoSanitize());
app.use(morganMiddleware);

// ------------------------
// ROUTES
// ------------------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stripe", stripeRoutes);

// ------------------------
// HEALTH CHECK
// ------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend running",
    timestamp: new Date().toISOString(),
  });
});

// ✅ REMOVED: No static serving - frontend is deployed separately

// ------------------------
// 404 HANDLER
// ------------------------
app.use("/api/*", (req, res) => {
  logger.warn(`404 - API route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "API route not found", path: req.path });
});

// ------------------------
// GLOBAL ERROR HANDLER
// ------------------------
app.use((err, req, res, next) => {
  logger.error("Server error", { message: err.message, stack: err.stack });
  const isDev = process.env.NODE_ENV === "development";
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Something went wrong!",
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;
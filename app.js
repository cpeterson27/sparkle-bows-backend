require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const logger = require("./logger");
const morganMiddleware = require("./middleware/morganLogger");
const { generalLimiter, authLimiter, refreshTokenLimiter, cartLimiter } = require("./middleware/rateLimit");
const userRoutes = require("./routes/user");          // ✅ NEW
const validationRoutes = require("./routes/validation");

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.FRONTEND_CUSTOM_DOMAIN || "https://www.sparklebows.shop",
  "https://sparkle-bows-frontend.onrender.com",
].filter(Boolean);

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
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: allowedOrigins,
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
app.use("/api/auth/refresh-token", refreshTokenLimiter);
app.use("/api/cart", cartLimiter);

// ------------------------
// ⚠️ CRITICAL: Stripe webhook MUST come BEFORE body parsers
// ------------------------
app.use("/api/stripe/webhook", require("./routes/stripeWebhook"));

// ------------------------
// BODY + COOKIE PARSING + SANITIZATION
// ------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(mongoSanitize());
app.use(morganMiddleware);

// ------------------------
// ROUTES
// Keep these mounts explicit so production and local environments expose
// the same API surface during storefront auth and checkout flows.
// ------------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/uploads", require("./routes/upload"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/stripe", require("./routes/stripe"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/checkout", require("./routes/checkout"));
app.use("/api/user", userRoutes);           // ✅ NEW - Handles /api/user/address
app.use("/api/leads", require("./routes/leads"));
app.use("/api", validationRoutes); 

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
// force deploy Fri Mar 20 21:12:14 CDT 2026

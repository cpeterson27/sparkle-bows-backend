const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();

app.use((req, res, next) => {
  console.log('Incoming Request Headers:', req.headers);
  next();
});

// CORS Configuration - FIXED FOR PRODUCTION
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "User-Agent",
      "Host",
      "Connection",
      "Accept-Encoding",
      "Accept-Language",
      "Cache-Control",
      "Pragma",
      "Upgrade-Insecure-Requests",
      "Sec-Fetch-Dest",
      "Sec-Fetch-Mode",
      "Sec-Fetch-Site",
      "Sec-Fetch-User",
      "Sec-Ch-Ua",
      "Sec-Ch-Ua-Mobile",
      "Sec-Ch-Ua-Platform",
      "Sec-Purpose",
      "DNT",
      "Upgrade",
      "Referer",
      "TE",
      "If-Modified-Since",
      "If-None-Match",
      "If-Range",
      "Range",
    ],
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Root route for testing
app.get("/", (req, res) => {
  res.json({ 
    message: "✨ Sparkle Bows Backend API ✨",
    status: "running",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      auth: "/api/auth"
    }
  });
});

// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running!" });
});

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/productRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// FIXED: Use PORT from environment variable
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}/ws`);
});
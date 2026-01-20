// server.js
require("dotenv").config();
const fs = require("fs");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const logger = require("./logger");

const app = require("./app"); // import the app

// ------------------------------------
// MONGODB CONNECTION
// ------------------------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("✅ MongoDB connected");
    startServer();
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error", { error: err.message });
    process.exit(1);
  });

// ------------------------------------
// SERVER START + WEBSOCKETS
// ------------------------------------
function startServer() {
  const PORT = process.env.PORT || 3001;
  const NODE_ENV = process.env.NODE_ENV || "development";

  let server;

  if (
    NODE_ENV === "production" &&
    process.env.SSL_KEY_PATH &&
    process.env.SSL_CERT_PATH
  ) {
    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, "utf8");
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, "utf8");
    const credentials = { key: privateKey, cert: certificate };

    server = https.createServer(credentials, app);
    logger.info("🔒 HTTPS server enabled");
  } else {
    server = http.createServer(app);
    logger.info("⚠️ Running in HTTP mode (development)");
  }

  // ------------------------------------
  // WEBSOCKET SETUP
  // ------------------------------------
  const wss = new WebSocket.Server({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    logger.info("📡 WebSocket client connected", { ip: clientIp });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      } catch (err) {
        logger.error("WebSocket message error", { error: err.message });
      }
    });

    ws.on("close", () => {
      logger.info("📡 WebSocket client disconnected", { ip: clientIp });
    });

    ws.on("error", (err) => {
      logger.error("WebSocket error", {
        message: err.message,
        stack: err.stack,
        ip: clientIp,
      });
    });
  });

  server.listen(PORT, () => {
    const protocol = NODE_ENV === "production" ? "https" : "http";
    logger.info(`🚀 Server running on ${protocol}://localhost:${PORT}`);
    logger.info(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
    logger.info(`🌍 Environment: ${NODE_ENV}`);
  });

  // ------------------------------------
  // GRACEFUL SHUTDOWN
  // ------------------------------------
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      logger.info("HTTP server closed");
      wss.clients.forEach((client) => client.close());
      wss.close(() => {
        logger.info("WebSocket server closed");
        process.exit(0);
      });
    });

    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // ------------------------------------
  // GLOBAL ERROR HANDLING
  // ------------------------------------
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { reason, promise });
    process.exit(1);
  });
}

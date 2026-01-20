const jwt = require("jsonwebtoken");
const logger = require("../logger");

const JWT_SECRET = process.env.JWT_SECRET;

// ------------------------------------
// VERIFY JWT TOKEN
// ------------------------------------
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.warn("Expired token attempt", { error: error.message });
      return res.status(401).json({ error: "Token expired" });
    }
    logger.warn("Invalid token attempt", { error: error.message });
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ------------------------------------
// VERIFY ADMIN ACCESS
// ------------------------------------
const verifyAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (req.user.role !== "admin") {
    logger.warn(`Non-admin user attempted admin action: ${req.user.email}`);
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ------------------------------------
// OPTIONAL AUTH (doesn't fail if no token)
// ------------------------------------
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, JWT_SECRET);
    }
  } catch (error) {
    logger.debug("Optional auth failed", { error: error.message });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, optionalAuth, auth: verifyToken };

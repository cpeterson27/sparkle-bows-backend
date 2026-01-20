const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const logger = require("../logger");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error("FATAL: JWT_SECRET or JWT_REFRESH_SECRET not defined");
  process.exit(1);
}

// Helper: create access token
function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._0_id ? user._0_id : user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
}

// Helper: create refresh token
function createRefreshToken(user) {
  return jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

// Cookie options — correct for cross‑origin cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true on HTTPS prod
  sameSite: "none", // MUST be "none" for cross‑site
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ------------------------------------
// REGISTER / SIGNUP
// ------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, address, city, state, zipCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: "User with that email already exists",
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      address,
      city,
      state,
      zipCode,
      role: "user",
    });

    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await RefreshToken.create({ token: refreshToken, userId: user._id });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
      },
    });
  } catch (error) {
    logger.error("Registration error", { error: error.message });
    return res.status(500).json({ message: "Registration failed" });
  }
});

// ------------------------------------
// LOGIN
// ------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await RefreshToken.create({ token: refreshToken, userId: user._id });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    return res.status(500).json({ message: "Login failed" });
  }
});

// ------------------------------------
// REFRESH TOKEN
// ------------------------------------
router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId,
      revoked: false,
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = createAccessToken(user);

    return res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
      },
    });
  } catch (error) {
    logger.warn("Token refresh failed", { error: error.message });
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

// ------------------------------------
// GET CURRENT USER (ME)
// ------------------------------------
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token && req.cookies.refreshToken) {
      try {
        const decoded = jwt.verify(
          req.cookies.refreshToken,
          JWT_REFRESH_SECRET,
        );

        const refreshTokenDoc = await RefreshToken.findOne({
          token: req.cookies.refreshToken,
          userId: decoded.userId,
          revoked: false,
        });

        if (!refreshTokenDoc) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
        );

        res.json({
          message: "Token refreshed",
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
          },
        });
        return;
      } catch (refreshErr) {
        console.warn("Refresh token verification failed", refreshErr);
        return res.status(401).json({ message: "Invalid refresh token" });
      }
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
    });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// ------------------------------------
// UPDATE PROFILE
// ------------------------------------
router.patch("/update-profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, address, city, state, zipCode } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (zipCode !== undefined) user.zipCode = zipCode;

    await user.save();

    const newAccessToken = createAccessToken(user);

    return res.json({
      message: "Profile updated successfully",
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Profile update error", { error: error.message });
    return res.status(500).json({ message: "Profile update failed" });
  }
});

// ------------------------------------
// LOGOUT
// ------------------------------------
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.updateOne({ token: refreshToken }, { revoked: true });
    }
    res.clearCookie("refreshToken", cookieOptions);
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error", { error: error.message });
    return res.status(500).json({ message: "Logout failed" });
  }
});

module.exports = router;

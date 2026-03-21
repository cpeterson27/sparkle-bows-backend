const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const logger = require("../logger");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const TWO_FACTOR_PENDING_EXPIRES_IN = "10m";
const TWO_FACTOR_ISSUER = "Sparkle Bows";
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const FRONTEND_URL =
  readEnv("FRONTEND_CUSTOM_DOMAIN") ||
  readEnv("FRONTEND_URL") ||
  "https://www.sparklebows.shop";

function readEnv(name) {
  return typeof process.env[name] === "string" ? process.env[name].trim() : "";
}

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error("FATAL: JWT_SECRET or JWT_REFRESH_SECRET not defined");
  process.exit(1);
}

function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function createRefreshToken(user) {
  return jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function createPendingTwoFactorToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      type: "two_factor_pending",
    },
    JWT_SECRET,
    { expiresIn: TWO_FACTOR_PENDING_EXPIRES_IN }
  );
}

function toBase32(buffer) {
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  while (bits.length % 5 !== 0) {
    bits += "0";
  }

  for (let index = 0; index < bits.length; index += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5), 2)];
  }

  return output;
}

function fromBase32(input) {
  const normalized = input.replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";

  for (const character of normalized) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTwoFactorSecret() {
  return toBase32(crypto.randomBytes(20));
}

function generateTotp(secret, offset = 0) {
  const key = fromBase32(secret);
  const step = 30;
  const counter = Math.floor(Date.now() / 1000 / step) + offset;
  const buffer = Buffer.alloc(8);

  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter & 0xffffffff, 4);

  const digest = crypto.createHmac("sha1", key).update(buffer).digest();
  const offsetByte = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offsetByte] & 0x7f) << 24) |
    ((digest[offsetByte + 1] & 0xff) << 16) |
    ((digest[offsetByte + 2] & 0xff) << 8) |
    (digest[offsetByte + 3] & 0xff);

  return String(code % 1000000).padStart(6, "0");
}

function verifyTotp(secret, code) {
  const normalizedCode = String(code || "").replace(/\D/g, "");
  if (normalizedCode.length !== 6 || !secret) return false;

  return [-1, 0, 1].some((offset) => generateTotp(secret, offset) === normalizedCode);
}

function generateRecoveryCodes() {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase()
  );
}

function hashRecoveryCode(code) {
  return crypto
    .createHash("sha256")
    .update(String(code || "").replace(/[^A-Z0-9]/gi, "").toUpperCase())
    .digest("hex");
}

async function consumeRecoveryCode(user, code) {
  const hashedCode = hashRecoveryCode(code);
  const recoveryCodes = user.twoFactorRecoveryCodes || [];
  const nextRecoveryCodes = recoveryCodes.filter((value) => value !== hashedCode);

  if (nextRecoveryCodes.length === recoveryCodes.length) {
    return false;
  }

  user.twoFactorRecoveryCodes = nextRecoveryCodes;
  await user.save();
  return true;
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    authProvider: user.authProvider || "local",
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    addresses: user.addresses || [],
  };
}

function buildFrontendAuthRedirect(params = {}) {
  const redirectUrl = new URL("/", FRONTEND_URL);
  redirectUrl.searchParams.set("oauth", "1");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      redirectUrl.searchParams.set(key, String(value));
    }
  });
  return redirectUrl.toString();
}

async function createSessionResponse(user, res) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  await RefreshToken.create({ token: refreshToken, userId: user._id });
  res.cookie("refreshToken", refreshToken, cookieOptions);
  return accessToken;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      addresses: [],
      role: "user",
    });

    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await RefreshToken.create({ token: refreshToken, userId: user._id });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        message: "Two-factor verification required",
        requiresTwoFactor: true,
        twoFactorToken: createPendingTwoFactorToken(user),
        user: serializeUser(user),
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await RefreshToken.create({ token: refreshToken, userId: user._id });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.json({
      message: "Login successful",
      accessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId,
      revoked: false,
    });
    if (!tokenDoc) return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = createAccessToken(user);

    return res.json({
      accessToken: newAccessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.warn("Token refresh failed", { error: error.message });
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.get("/google/start", async (req, res) => {
  const clientId = readEnv("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_OAUTH_CLIENT_SECRET");
  const redirectUri = readEnv("GOOGLE_OAUTH_REDIRECT_URI");

  if (!clientId || !clientSecret || !redirectUri) {
    return res.redirect(
      buildFrontendAuthRedirect({
        error: "google_not_configured",
        provider: "google",
      })
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/google/callback", async (req, res) => {
  const clientId = readEnv("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_OAUTH_CLIENT_SECRET");
  const redirectUri = readEnv("GOOGLE_OAUTH_REDIRECT_URI");

  if (!clientId || !clientSecret || !redirectUri) {
    return res.redirect(
      buildFrontendAuthRedirect({
        error: "google_not_configured",
        provider: "google",
      })
    );
  }

  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(
        buildFrontendAuthRedirect({
          error,
          provider: "google",
        })
      );
    }

    if (!code) {
      return res.redirect(
        buildFrontendAuthRedirect({
          error: "missing_google_code",
          provider: "google",
        })
      );
    }

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token: providerAccessToken } = tokenResponse.data;
    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${providerAccessToken}`,
        },
      }
    );

    const profile = profileResponse.data;
    if (!profile?.email) {
      return res.redirect(
        buildFrontendAuthRedirect({
          error: "google_email_missing",
          provider: "google",
        })
      );
    }

    let user =
      (profile.sub && (await User.findOne({ googleId: profile.sub }))) ||
      (await User.findOne({ email: profile.email.toLowerCase() }));

    if (!user) {
      user = new User({
        name: profile.name || profile.email.split("@")[0],
        email: profile.email.toLowerCase(),
        password: crypto.randomBytes(24).toString("hex"),
        addresses: [],
        role: "user",
        authProvider: "google",
        googleId: profile.sub || "",
      });
      await user.save();
    } else {
      user.googleId = profile.sub || user.googleId;
      if (!user.authProvider || user.authProvider === "local") {
        user.authProvider = "google";
      }
      await user.save();
    }

    await createSessionResponse(user, res);
    return res.redirect(
      buildFrontendAuthRedirect({
        provider: "google",
      })
    );
  } catch (error) {
    logger.error("Google OAuth callback error", { error: error.message });
    return res.redirect(
      buildFrontendAuthRedirect({
        error: "google_oauth_failed",
        provider: "google",
      })
    );
  }
});

router.get("/me", async (req, res) => {
  try {
    let token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token && req.cookies.refreshToken) {
      try {
        const decoded = jwt.verify(req.cookies.refreshToken, JWT_REFRESH_SECRET);

        const refreshTokenDoc = await RefreshToken.findOne({
          token: req.cookies.refreshToken,
          userId: decoded.userId,
          revoked: false,
        });
        if (!refreshTokenDoc) return res.status(401).json({ message: "Invalid refresh token" });

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: "User not found" });

        token = createAccessToken(user);

        return res.json({
          message: "Token refreshed",
          token,
          user: serializeUser(user),
        });
      } catch (refreshErr) {
        console.warn("Refresh token verification failed", refreshErr);
        return res.status(401).json({ message: "Invalid refresh token" });
      }
    }

    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    return res.json(serializeUser(user));
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.patch("/update-profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) return res.status(400).json({ message: "Email already in use" });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const newAccessToken = createAccessToken(user);

    return res.json({
      message: "Profile updated successfully",
      token: newAccessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error("Profile update error", { error: error.message });
    return res.status(500).json({ message: "Profile update failed" });
  }
});

router.patch("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    const newAccessToken = createAccessToken(user);

    return res.json({
      message: "Password updated successfully",
      accessToken: newAccessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error("Password update error", { error: error.message });
    return res.status(500).json({ message: "Password update failed" });
  }
});

router.post("/2fa/setup", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("+twoFactorTempSecret +twoFactorSecret +twoFactorRecoveryCodes");
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = generateTwoFactorSecret();
    user.twoFactorTempSecret = secret;
    await user.save();

    return res.json({
      manualEntryKey: secret,
      otpAuthUrl: `otpauth://totp/${encodeURIComponent(TWO_FACTOR_ISSUER)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(TWO_FACTOR_ISSUER)}&algorithm=SHA1&digits=6&period=30`,
    });
  } catch (error) {
    logger.error("2FA setup error", { error: error.message });
    return res.status(500).json({ message: "Could not start two-factor setup" });
  }
});

router.post("/2fa/enable", verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.userId).select("+twoFactorTempSecret +twoFactorSecret +twoFactorRecoveryCodes");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ message: "Start setup before enabling two-factor authentication" });
    }

    if (!verifyTotp(user.twoFactorTempSecret, code)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const recoveryCodes = generateRecoveryCodes();
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
    await user.save();

    const accessToken = createAccessToken(user);

    return res.json({
      message: "Two-factor authentication enabled",
      accessToken,
      user: serializeUser(user),
      recoveryCodes,
    });
  } catch (error) {
    logger.error("2FA enable error", { error: error.message });
    return res.status(500).json({ message: "Could not enable two-factor authentication" });
  }
});

router.post("/2fa/disable", verifyToken, async (req, res) => {
  try {
    const { password, code } = req.body;
    const user = await User.findById(req.user.userId).select("+password +twoFactorSecret +twoFactorTempSecret +twoFactorRecoveryCodes");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Two-factor authentication is not enabled" });
    }

    if (!password || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const validTotp = verifyTotp(user.twoFactorSecret, code);
    const validRecoveryCode = validTotp ? false : await consumeRecoveryCode(user, code);

    if (!validTotp && !validRecoveryCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    const accessToken = createAccessToken(user);

    return res.json({
      message: "Two-factor authentication disabled",
      accessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error("2FA disable error", { error: error.message });
    return res.status(500).json({ message: "Could not disable two-factor authentication" });
  }
});

router.post("/2fa/recovery-codes/regenerate", verifyToken, async (req, res) => {
  try {
    const { password, code } = req.body;
    const user = await User.findById(req.user.userId).select("+password +twoFactorSecret +twoFactorRecoveryCodes");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Two-factor authentication is not enabled" });
    }

    if (!password || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const validTotp = verifyTotp(user.twoFactorSecret, code);
    const validRecoveryCode = validTotp ? false : await consumeRecoveryCode(user, code);

    if (!validTotp && !validRecoveryCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const recoveryCodes = generateRecoveryCodes();
    user.twoFactorRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
    await user.save();

    return res.json({
      message: "Recovery codes regenerated",
      recoveryCodes,
    });
  } catch (error) {
    logger.error("2FA recovery code regeneration error", { error: error.message });
    return res.status(500).json({ message: "Could not regenerate recovery codes" });
  }
});

router.post("/2fa/verify", async (req, res) => {
  try {
    const { twoFactorToken, code } = req.body;

    if (!twoFactorToken) {
      return res.status(400).json({ message: "Two-factor token is required" });
    }

    const decoded = jwt.verify(twoFactorToken, JWT_SECRET);
    if (decoded.type !== "two_factor_pending") {
      return res.status(401).json({ message: "Invalid two-factor session" });
    }

    const user = await User.findById(decoded.userId).select("+twoFactorSecret +twoFactorRecoveryCodes");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Two-factor authentication is not enabled" });
    }

    const validTotp = verifyTotp(user.twoFactorSecret, code);
    const validRecoveryCode = validTotp ? false : await consumeRecoveryCode(user, code);

    if (!validTotp && !validRecoveryCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await RefreshToken.create({ token: refreshToken, userId: user._id });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.json({
      message: "Two-factor verification successful",
      accessToken,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error("2FA verify error", { error: error.message });
    return res.status(401).json({ message: "Two-factor verification failed" });
  }
});

router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      RefreshToken.deleteMany({ userId }),
      Cart.deleteMany({ userId }),
      Order.updateMany({ userId }, { $set: { userId: null } }),
      User.findByIdAndDelete(userId),
    ]);

    res.clearCookie("refreshToken", cookieOptions);

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    logger.error("Account deletion error", { error: error.message });
    return res.status(500).json({ message: "Account deletion failed" });
  }
});

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

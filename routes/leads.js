// routes/leads.js
const express = require("express");
const fetch = require("node-fetch");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Klaviyo API constants ───────────────────────────────
const KLAVIYO_API_PROFILES = "https://a.klaviyo.com/api/profiles";
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

// ─── Helper: create a Klaviyo profile ─────────────────────
async function createKlaviyoProfile(email, source = "website") {
  if (!KLAVIYO_PRIVATE_KEY) {
    logger.warn("Klaviyo private key missing");
    return false;
  }

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const payload = {
      data: [
        {
          type: "profile",
          attributes: {
            email,
            metadata: { source },
          },
        },
      ],
    };

    const res = await fetch(KLAVIYO_API_PROFILES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        REVISION: today,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("❌ KLAVIYO ERROR RESPONSE (profile):", { response: text });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("❌ KLAVIYO fetch error (profile):", { error: err.message });
    return false;
  }
}

// ─── POST /api/leads ─────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { email, source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let lead = await Lead.findOne({ email: normalizedEmail });

    if (!lead) {
      lead = await Lead.create({
        email: normalizedEmail,
        source,
        vipSubscribed: false,
      });
    }

    if (!lead.vipSubscribed) {
      const profileCreated = await createKlaviyoProfile(lead.email, source);
      if (profileCreated) {
        lead.vipSubscribed = true;
        await lead.save();
      }
    }

    // ─── Notify owner ─────────────────────────────
    try {
      await sendOwnerNotification({
        subject: "New VIP signup",
        customerName: "VIP Customer",
        customerEmail: lead.email,
      });
    } catch (err) {
      logger.error("Owner email failed", { error: err.message });
    }

    logger.info("VIP lead captured", { email: lead.email });

    return res.status(201).json({
      message: "Lead captured",
      lead,
    });
  } catch (error) {
    logger.error("Lead route error", { error: error.message });
    return res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/leads/status ─────────────────────────────
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.json({ vipSubscribed: false });
    }

    const lead = await Lead.findOne({
      email: email.toLowerCase().trim(),
    });

    return res.json({
      vipSubscribed: !!lead?.vipSubscribed,
    });
  } catch (err) {
    logger.error("VIP status error", { error: err.message });
    return res.json({ vipSubscribed: false });
  }
});

module.exports = router;
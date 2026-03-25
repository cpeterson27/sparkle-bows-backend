// routes/leads.js
const express = require("express");
const fetch = require("node-fetch");
const Lead = require("../models/Lead");
const { sendVipSignupNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

const KLAVIYO_API_PROFILES = "https://a.klaviyo.com/api/profiles";
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

// ─── Helper: create or update a Klaviyo profile ───────────
async function createKlaviyoProfile(email, firstName = "", source = "website") {
  if (!KLAVIYO_PRIVATE_KEY) {
    logger.warn("Klaviyo private key missing — skipping Klaviyo sync");
    return false;
  }

  try {
    const payload = {
      data: {
        type: "profile",
        attributes: {
          email,
          ...(firstName && { first_name: firstName }),
          properties: { source },
        },
      },
    };

    const res = await fetch(KLAVIYO_API_PROFILES, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        revision: "2023-12-15",
      },
      body: JSON.stringify(payload),
    });

    // 201 = created, 409 = profile already exists — both are success
    if (res.status === 201 || res.status === 409) {
      return true;
    }

    const text = await res.text();
    logger.error("Klaviyo error response", { status: res.status, body: text });
    return false;
  } catch (err) {
    logger.error("Klaviyo fetch error", { error: err.message });
    return false;
  }
}

// ─── POST /api/leads ──────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { email, firstName = "", source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let lead = await Lead.findOne({ email: normalizedEmail });

    if (!lead) {
      lead = await Lead.create({
        email: normalizedEmail,
        firstName,
        source,
        vipSubscribed: false,
      });
    }

    if (!lead.vipSubscribed) {
      const profileCreated = await createKlaviyoProfile(
        lead.email,
        firstName || lead.firstName,
        source
      );
      if (profileCreated) {
        lead.vipSubscribed = true;
        await lead.save();
      }
    }

    // Notify owner — uses its own lightweight template, not the order template
    try {
      await sendVipSignupNotification({
        email: lead.email,
        firstName: firstName || lead.firstName || "Unknown",
        source,
      });
    } catch (err) {
      logger.error("VIP owner notification failed", { error: err.message });
    }

    logger.info("VIP lead captured", { email: lead.email });

    return res.status(201).json({ message: "Lead captured", lead });
  } catch (error) {
    logger.error("Lead route error", { error: error.message });
    return res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/leads/status ────────────────────────────────
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.json({ vipSubscribed: false });
    }

    const lead = await Lead.findOne({ email: email.toLowerCase().trim() });

    return res.json({ vipSubscribed: !!lead?.vipSubscribed });
  } catch (err) {
    logger.error("VIP status error", { error: err.message });
    return res.json({ vipSubscribed: false });
  }
});

module.exports = router;
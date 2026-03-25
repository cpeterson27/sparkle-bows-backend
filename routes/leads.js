const express = require("express");
const Lead = require("../models/Lead");
const { sendVipSignupNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─────────────────────────────────────────────
// ✅ KLAVIYO TRACK EVENT (ASYNC, NON-BLOCKING)
// ─────────────────────────────────────────────
async function sendToKlaviyo(email, firstName = "", source = "website") {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key) {
    logger.warn("Klaviyo private key missing, skipping event");
    return;
  }

  try {
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${key}`,
        revision: "2024-02-15", // REQUIRED
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: {
              data: { type: "metric", attributes: { name: "VIP Signup" } },
            },
            profile: {
              data: { type: "profile", attributes: { email, first_name: firstName } },
            },
            properties: { source },
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("Klaviyo event failed", { status: res.status, body: text, email });
    } else {
      logger.info("Klaviyo event sent", { email });
    }
  } catch (err) {
    logger.error("Klaviyo fetch error", { error: err.message, email });
  }
}

// ─────────────────────────────────────────────
// 🚀 POST /api/leads
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { email, firstName = "", source = "website" } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let lead = await Lead.findOne({ email: normalizedEmail });

    if (!lead) {
      lead = await Lead.create({
        email: normalizedEmail,
        firstName,
        source,
        vipSubscribed: false, // start as false, mark true after Klaviyo
      });
    }

    // ✅ Respond immediately
    res.status(201).json({ message: "Lead captured", lead });

    // ✅ Send Klaviyo event async
    sendToKlaviyo(normalizedEmail, firstName, source).then(async () => {
      // Mark vipSubscribed if Klaviyo succeeded
      lead.vipSubscribed = true;
      await lead.save();
      logger.info("Lead vipSubscribed updated", { email: normalizedEmail });
    }).catch(err => {
      logger.error("Failed to update vipSubscribed after Klaviyo", { error: err.message, email: normalizedEmail });
    });

    // ✅ Send owner notification async
    sendVipSignupNotification({ email: normalizedEmail, firstName, source })
      .then(() => logger.info("Owner notification sent", { email: normalizedEmail }))
      .catch(err => logger.error("Owner notification failed", { error: err.message, email: normalizedEmail }));

  } catch (err) {
    logger.error("Lead route error", { error: err.message, email: normalizedEmail });
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// ─────────────────────────────────────────────
// 🔍 GET /api/leads/status
// ─────────────────────────────────────────────
router.get("/status", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ vipSubscribed: false });

  try {
    const lead = await Lead.findOne({ email: email.toLowerCase().trim() });
    return res.json({ vipSubscribed: !!lead?.vipSubscribed });
  } catch (err) {
    logger.error("VIP status error", { error: err.message, email });
    return res.json({ vipSubscribed: false });
  }
});

module.exports = router;
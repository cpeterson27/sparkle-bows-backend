const express = require("express");
const Lead = require("../models/Lead");
const { sendVipSignupNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─────────────────────────────────────────────
// ✅ KLAVIYO TRACK EVENT (THIS WORKS RELIABLY)
// ─────────────────────────────────────────────
async function sendToKlaviyo(email, firstName, source) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;

  if (!key) {
    logger.warn("Klaviyo key missing");
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
              data: {
                type: "metric",
                attributes: {
                  name: "VIP Signup",
                },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email,
                  first_name: firstName || "",
                },
              },
            },
            properties: {
              source: source || "website",
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ KLAVIYO ERROR RESPONSE:");
      console.log(text);
    } else {
      console.log("✅ Klaviyo event sent:", email);
    }
  } catch (err) {
    console.log("❌ Klaviyo fetch error:", err.message);
  }
}

// ─────────────────────────────────────────────
// 🚀 POST /api/leads
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { email, firstName, source = "website" } = req.body;

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
        vipSubscribed: true,
      });
    }

    // ✅ Send to Klaviyo (non-blocking)
    sendToKlaviyo(normalizedEmail, firstName, source);

    // ✅ Send owner notification (FIXED)
    try {
      await sendVipSignupNotification({
        email: normalizedEmail,
        firstName,
        source,
      });
    } catch (err) {
      logger.error("Failed to send VIP signup notification", {
        error: err.message,
      });
    }

    logger.info("VIP lead captured", { email: normalizedEmail });

    return res.status(201).json({
      message: "Lead captured",
      lead,
    });
  } catch (error) {
    logger.error("Lead route error", { error: error.message });
    return res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────
// 🔍 GET /api/leads/status
// ─────────────────────────────────────────────
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
      vipSubscribed: !!lead,
    });
  } catch (err) {
    logger.error("VIP status error", { error: err.message });
    return res.json({ vipSubscribed: false });
  }
});

module.exports = router;
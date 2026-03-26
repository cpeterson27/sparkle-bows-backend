// routes/leads.js
const express = require("express");
const Lead = require("../models/Lead");
const { sendVipNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

const KLAVIYO_LIST_ID = "XShYDk";
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

// ────────────────────────────────
// 1️⃣ Add profile to Klaviyo VIP list
// ────────────────────────────────
async function addToKlaviyoList(email, firstName = "") {
  if (!KLAVIYO_PRIVATE_KEY) {
    logger.warn("Klaviyo API key missing, skipping VIP push");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const payload = {
      data: [
        {
          type: "profile",
          attributes: {
            email,
            ...(firstName && { first_name: firstName }),
          },
        },
      ],
    };

    const res = await fetch(
      `https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          revision: "2023-12-15",
        },
        body: JSON.stringify(payload),
      }
    );

    clearTimeout(timeout);

    if ([200, 204, 409].includes(res.status)) {
      logger.info("Klaviyo list add success", { email });
      return true;
    }

    const text = await res.text();
    logger.error("Klaviyo list add error", { status: res.status, body: text });
    return false;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      logger.error("Klaviyo request timed out", { email });
    } else {
      logger.error("Klaviyo fetch error", { error: err.message });
    }
    return false;
  }
}

// ────────────────────────────────
// 2️⃣ Track VIP Signup Event in Klaviyo
// ────────────────────────────────
async function sendKlaviyoEvent(email, firstName = "", source = "website") {
  if (!KLAVIYO_PRIVATE_KEY) {
    logger.warn("Klaviyo API key missing, skipping event");
    return;
  }

  try {
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        revision: "2024-02-15",
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
    logger.error("Klaviyo event fetch error", { error: err.message, email });
  }
}

// ────────────────────────────────
// POST /api/leads
// ────────────────────────────────
router.post("/", async (req, res) => {
  const { email, firstName = "", source = "website" } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find or create lead
    let lead = await Lead.findOne({ email: normalizedEmail });
    if (!lead) {
      lead = await Lead.create({
        email: normalizedEmail,
        firstName,
        source,
        vipSubscribed: false,
      });
    }

    // Respond immediately
    res.status(201).json({ message: "Lead captured", lead });

    // ────────────────
    // Async tasks: run in parallel safely
    // ────────────────
    (async () => {
      try {
        const listAddPromise = lead.vipSubscribed
          ? Promise.resolve(false)
          : addToKlaviyoList(lead.email, firstName || lead.firstName);

        const eventPromise = sendKlaviyoEvent(normalizedEmail, firstName || lead.firstName, source);

        // Run both promises and wait for all to settle
        const results = await Promise.allSettled([listAddPromise, eventPromise]);

        // Update vipSubscribed only if list add succeeded
        const listAddResult = results[0];
        if (listAddResult.status === "fulfilled" && listAddResult.value && !lead.vipSubscribed) {
          lead.vipSubscribed = true;
          await lead.save();
          logger.info("Lead vipSubscribed updated", { email: lead.email });
        }

        // Send VIP owner notification regardless of list/event outcome
        try {
          await sendVipNotification({ email: normalizedEmail, firstName, source });
          logger.info("VIP owner notification sent", { email: normalizedEmail });
        } catch (err) {
          logger.error("Failed to send VIP owner notification", { error: err.message, email: normalizedEmail });
        }
      } catch (err) {
        logger.error("Async lead post tasks failed", { error: err.message, email: normalizedEmail });
      }
    })();
  } catch (err) {
    logger.error("Lead route error", { error: err.message, email: normalizedEmail });
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  }
});

// ────────────────────────────────
// GET /api/leads/status
// ────────────────────────────────
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

// ────────────────────────────────
// POST /api/leads/test-email - SMTP Test
// ────────────────────────────────
router.post("/test-email", async (req, res) => {
  const { email = process.env.GMAIL_USER || process.env.OWNER_EMAIL } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const result = await sendVipNotification({
      email,
      firstName: "Test",
      source: "test-endpoint",
    });

    if (result.success) {
      return res.json({ success: true, message: "Test email sent successfully!" });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    logger.error("Test email endpoint error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

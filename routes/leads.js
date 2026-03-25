const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Helper: create a Klaviyo profile ─────────────────────
async function createKlaviyoProfile(email) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;

  if (!key) {
    logger.warn("Klaviyo key missing");
    return false;
  }

  try {
    const res = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${key}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email: email,
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ KLAVIYO ERROR RESPONSE (profile):");
      console.log(text);
      return false;
    }

    return true;
  } catch (err) {
    console.log("❌ KLAVIYO fetch error (profile):", err.message);
    return false;
  }
}

// ─── Helper: subscribe a profile to a list ───────────────
async function subscribeKlaviyoList(email) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!key || !listId) {
    logger.warn("Klaviyo key or list ID missing");
    return false;
  }

  try {
    const res = await fetch(
      `https://a.klaviyo.com/api/lists/${listId}/subscribe/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Klaviyo-API-Key ${key}`,
        },
        body: JSON.stringify({
          profiles: [{ email }],
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ KLAVIYO ERROR RESPONSE (list subscribe):");
      console.log(text);
      return false;
    }

    console.log("✅ Klaviyo subscribed:", email);
    return true;
  } catch (err) {
    console.log("❌ KLAVIYO fetch error (list subscribe):", err.message);
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
      const profileCreated = await createKlaviyoProfile(lead.email);

      if (profileCreated) {
        const subscribed = await subscribeKlaviyoList(lead.email);
        if (subscribed) {
          lead.vipSubscribed = true;
          await lead.save();
        }
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
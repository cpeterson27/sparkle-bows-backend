// routes/leads.js
const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");
const fetch = require("node-fetch");

const router = express.Router();

// ─── Helper: subscribe a profile to VIP list with explicit consent ───────────
async function subscribeToKlaviyoVIP(email, firstName, optedIn = true) {
  const key = process.env.KLAVIYO_PRIVATE_KEY; // pk_ key
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!key || !listId) {
    logger.warn("Klaviyo key or list ID missing — skipping subscription");
    return false;
  }

  const profileAttributes = { email, first_name: firstName || "" };

  // ✅ Explicit marketing consent
  if (optedIn) {
    profileAttributes.subscriptions = {
      email: { marketing: { consent: "SUBSCRIBED" } },
    };
  }

  try {
    const res = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Klaviyo-API-Key ${key}`,
          "Revision": new Date().toISOString().split("T")[0], // REQUIRED by Klaviyo YYYY-MM-DD
        },
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              list_id: listId,
              profiles: { data: [{ type: "profile", attributes: profileAttributes }] },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      logger.error("Klaviyo VIP subscription failed", {
        status: res.status,
        response: text,
        email,
      });
      return false;
    }

    logger.info("Klaviyo VIP subscription successful", { email });
    return true;
  } catch (err) {
    logger.error("Klaviyo VIP subscription error", { error: err.message, email });
    return false;
  }
}

// ─── POST /api/leads ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { firstName = "", email, source = "website" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();
    let lead = await Lead.findOne({ email: normalizedEmail });

    if (lead) {
      // ✅ Already a lead — subscribe if not yet subscribed
      if (!lead.vipSubscribed) {
        const subscribed = await subscribeToKlaviyoVIP(lead.email, lead.firstName, true);
        if (subscribed) {
          lead.vipSubscribed = true;
          await lead.save();
        }
      }
      return res.json({ message: "Already on the list", lead });
    }

    // ✅ Create new lead
    lead = await Lead.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      source,
      vipSubscribed: false, // will update after successful subscription
    });

    // ✅ Subscribe to VIP list with explicit consent
    const subscribed = await subscribeToKlaviyoVIP(lead.email, lead.firstName, true);
    if (subscribed) {
      lead.vipSubscribed = true;
      await lead.save();
    }

    // ✅ Notify site owner
    try {
      await sendOwnerNotification({
        subject: "New VIP signup",
        customerName: lead.firstName || "Someone",
        customerEmail: lead.email,
      });
    } catch (emailErr) {
      logger.error("Owner VIP notification failed", { error: emailErr.message });
    }

    logger.info("New VIP lead captured", { email: lead.email });
    return res.status(201).json({ message: "Lead captured", lead });
  } catch (error) {
    logger.error("Lead capture failed", { error: error.message });
    return res.status(500).json({ error: "Could not save lead" });
  }
});

module.exports = router;
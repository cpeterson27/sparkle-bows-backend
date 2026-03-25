// routes/leads.js
const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Helper: subscribe profile to Klaviyo VIP list ─────────────────────────────
async function subscribeToKlaviyoVIP(firstName, email) {
  try {
    const privateKey = process.env.KLAVIYO_PRIVATE_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;

    if (!privateKey || !listId) {
      logger.warn("Klaviyo env vars not set — skipping sync");
      return;
    }

    // ✅ Bulk subscription endpoint ensures profile is added + subscribed
    const res = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Klaviyo-API-Key ${privateKey}`,
          revision: "2024-02-15",
        },
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              list_id: listId,
              profiles: {
                data: [
                  {
                    type: "profile",
                    attributes: {
                      email,
                      first_name: firstName || "",
                    },
                  },
                ],
              },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      logger.error("Klaviyo VIP subscription failed", {
        status: res.status,
        body: errText,
        email,
      });
      return;
    }

    logger.info("Klaviyo VIP subscription successful", { email });
  } catch (err) {
    logger.error("Klaviyo VIP subscription error", { error: err.message, email });
  }
}

// ─── POST /api/leads ───────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { firstName = "", email, source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let lead = await Lead.findOne({ email: normalizedEmail });

    // ✅ If already a lead, subscribe to VIP list if not already subscribed
    if (lead) {
      if (!lead.vipSubscribed) {
        await subscribeToKlaviyoVIP(lead.firstName, lead.email);
        lead.vipSubscribed = true;
        await lead.save();
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

    // ✅ Subscribe to Klaviyo VIP list
    await subscribeToKlaviyoVIP(lead.firstName, lead.email);

    // ✅ Mark as subscribed locally
    lead.vipSubscribed = true;
    await lead.save();

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
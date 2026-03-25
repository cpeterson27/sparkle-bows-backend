const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Helper: subscribe profile to Klaviyo VIP list ─────────
async function subscribeToKlaviyoVIP(email, firstName) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!key || !listId) {
    logger.warn("Klaviyo key or list ID missing — skipping subscription");
    return false;
  }

  try {
    const res = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`, // ✅ FIXED AUTH
          Revision: "2024-02-15",
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
                      first_name: firstName || "", // ✅ FIXED FIELD
                      subscriptions: {
                        email: {
                          marketing: { consent: "SUBSCRIBED" },
                        },
                      },
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
    logger.error("Klaviyo VIP subscription error", {
      error: err.message,
      email,
    });
    return false;
  }
}

// ─── POST /api/leads ───────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { firstName = "", email, source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let lead = await Lead.findOne({ email: normalizedEmail });

    // ─── EXISTING LEAD ───────────────────────────────
    if (lead) {
      if (!lead.vipSubscribed) {
        const subscribed = await subscribeToKlaviyoVIP(
          lead.email,
          lead.firstName
        );

        if (subscribed) {
          lead.vipSubscribed = true;
          await lead.save();
        }
      }

      return res.json({ message: "Already on the list", lead });
    }

    // ─── NEW LEAD ───────────────────────────────
    lead = await Lead.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      source,
      vipSubscribed: false,
    });

    const subscribed = await subscribeToKlaviyoVIP(
      lead.email,
      lead.firstName
    );

    if (subscribed) {
      lead.vipSubscribed = true;
      await lead.save();
    }

    // ─── OWNER EMAIL NOTIFICATION ───────────────────────────────
    try {
      await sendOwnerNotification({
        subject: "New VIP signup",
        customerName: lead.firstName || "Someone",
        customerEmail: lead.email,
      });
    } catch (emailErr) {
      logger.error("Owner VIP notification failed", {
        error: emailErr.message,
      });
    }

    logger.info("New VIP lead captured", { email: lead.email });

    return res.status(201).json({
      message: "Lead captured",
      lead,
    });
  } catch (error) {
    logger.error("Lead capture failed", {
      error: error.message,
    });

    return res.status(500).json({
      error: "Could not save lead",
    });
  }
});

// ─── GET /api/leads/status?email= ───────────────────────────────
// (needed for your frontend getVipStatus)
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ vipSubscribed: false });

    const lead = await Lead.findOne({
      email: email.toLowerCase().trim(),
    });

    return res.json({
      vipSubscribed: !!lead?.vipSubscribed,
    });
  } catch (err) {
    logger.error("VIP status check failed", err);
    return res.json({ vipSubscribed: false });
  }
});

module.exports = router;
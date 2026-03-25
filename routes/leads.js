const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Helper: subscribe to Klaviyo VIP list ─────────────────────
async function subscribeToKlaviyoVIP(email, firstName) {
  const key = process.env.KLAVIYO_PRIVATE_KEY; // your pk_ key
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!key || !listId) {
    logger.warn("Klaviyo key or list ID missing");
    return false;
  }

  try {
    const res = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Klaviyo-API-Key ${key}`,
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
                      email: email,

                      // ✅ CORRECT FIELD (this was your bug)
                      properties: {
                        first_name: firstName || "",
                      },

                      subscriptions: {
                        email: {
                          marketing: {
                            consent: "SUBSCRIBED",
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ KLAVIYO ERROR RESPONSE:");
      console.log(text);
      return false;
    }

    logger.info("✅ Klaviyo success", { email });
    return true;
  } catch (err) {
    logger.error("❌ Klaviyo fetch error", { error: err.message });
    return false;
  }
}

// ─── POST /api/leads ───────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { firstName = "", email, source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let lead = await Lead.findOne({ email: normalizedEmail });

    // ─── EXISTING LEAD ─────────────────────────────
    if (lead) {
      if (!lead.vipSubscribed) {
        const subscribed = await subscribeToKlaviyoVIP(
          lead.email,
          lead.firstName,
        );

        if (subscribed) {
          lead.vipSubscribed = true;
          await lead.save();
        }
      }

      return res.json({ message: "Already on the list", lead });
    }

    // ─── NEW LEAD ─────────────────────────────
    lead = await Lead.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      source,
      vipSubscribed: false,
    });

    const subscribed = await subscribeToKlaviyoVIP(lead.email, lead.firstName);

    if (subscribed) {
      lead.vipSubscribed = true;
      await lead.save();
    }

    // ─── EMAIL NOTIFICATION (this part still works)
    try {
      await sendOwnerNotification({
        subject: "New VIP signup",
        customerName: lead.firstName || "Someone",
        customerEmail: lead.email,
      });
    } catch (err) {
      logger.error("Owner email failed", { error: err.message });
    }

    logger.info("New VIP lead captured", { email: lead.email });

    return res.status(201).json({
      message: "Lead captured",
      lead,
    });
  } catch (error) {
    logger.error("Lead route error", { error: error.message });
    return res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/leads/status?email=... ───────────────────────────
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

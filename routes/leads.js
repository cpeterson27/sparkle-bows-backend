const express = require("express");
const Lead = require("../models/Lead");
const { sendOwnerNotification } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

// ─── Helper: add profile to Klaviyo list ──────────────────────────────────────
async function addToKlaviyo(firstName, email) {
  try {
    const privateKey = process.env.KLAVIYO_PRIVATE_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;

    if (!privateKey || !listId) {
      logger.warn("Klaviyo env vars not set — skipping sync");
      return;
    }

    // 1. Create or update the profile with email marketing consent
    const profileRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${privateKey}`,
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            first_name: firstName || "",
            subscriptions: {
              email: {
                marketing: {
                  consent: "SUBSCRIBED",
                },
              },
            },
          },
        },
      }),
    });

    let profileId;

    if (profileRes.status === 409) {
      const conflictData = await profileRes.json();
      profileId = conflictData?.errors?.[0]?.meta?.duplicate_profile_id;
    } else if (profileRes.ok) {
      const profileData = await profileRes.json();
      profileId = profileData?.data?.id;
    } else {
      const err = await profileRes.text();
      logger.error("Klaviyo profile creation failed", {
        status: profileRes.status,
        err,
      });
      return;
    }

    if (!profileId) {
      logger.error("Klaviyo: could not determine profile ID");
      return;
    }

    // 2. Add profile to list
    const listRes = await fetch(
      `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Klaviyo-API-Key ${privateKey}`,
          revision: "2024-02-15",
        },
        body: JSON.stringify({
          data: [{ type: "profile", id: profileId }],
        }),
      }
    );

    if (listRes.ok || listRes.status === 204) {
      logger.info("Klaviyo: profile added to VIP list", { email, profileId });
    } else {
      const err = await listRes.text();
      logger.error("Klaviyo list add failed", { status: listRes.status, err });
    }
  } catch (err) {
    logger.error("Klaviyo sync error", { error: err.message });
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
    const existingLead = await Lead.findOne({ email: normalizedEmail });

    if (existingLead) {
      await addToKlaviyo(firstName.trim(), normalizedEmail);
      return res.json({ message: "Already on the list", lead: existingLead });
    }

    const lead = await Lead.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      source,
    });

    await addToKlaviyo(lead.firstName, lead.email);

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
    return res.status(201).json({ message: "Lead captured", lead });
  } catch (error) {
    logger.error("Lead capture failed", { error: error.message });
    return res.status(500).json({ error: "Could not save lead" });
  }
});

module.exports = router;
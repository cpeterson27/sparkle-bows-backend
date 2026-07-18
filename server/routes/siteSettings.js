const express = require("express");
const SiteSettings = require("../models/siteSettingsModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

function toPublicPayload(settings) {
  return {
    siteName: settings.siteName,
    siteUrl: settings.siteUrl,
    defaultTitle: settings.defaultTitle,
    defaultDescription: settings.defaultDescription,
    defaultKeywords: settings.defaultKeywords,
    defaultOgImage: settings.defaultOgImage,
    organizationName: settings.organizationName,
    googleAnalyticsId: settings.googleAnalyticsId,
    googleTagManagerId: settings.googleTagManagerId,
  };
}

router.get("/public", async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json(toPublicPayload(settings));
  } catch (err) {
    console.error("Error fetching public site settings:", err);
    res.status(500).json({ error: "Could not load site settings" });
  }
});

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json(toPublicPayload(settings));
  } catch (err) {
    console.error("Error fetching site settings:", err);
    res.status(500).json({ error: "Could not load site settings" });
  }
});

router.put("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();

    const fields = [
      "siteName",
      "siteUrl",
      "defaultTitle",
      "defaultDescription",
      "defaultKeywords",
      "defaultOgImage",
      "organizationName",
      "googleAnalyticsId",
      "googleTagManagerId",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    await settings.save();
    res.json(toPublicPayload(settings));
  } catch (err) {
    console.error("Error updating site settings:", err);
    res.status(500).json({ error: "Could not update site settings" });
  }
});

module.exports = router;

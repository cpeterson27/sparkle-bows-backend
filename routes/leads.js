const express = require("express");
const Lead = require("../models/Lead");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { firstName = "", email, source = "website" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingLead = await Lead.findOne({ email: normalizedEmail });

    if (existingLead) {
      return res.json({ message: "Lead already exists", lead: existingLead });
    }

    const lead = await Lead.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      source,
    });

    return res.status(201).json({ message: "Lead captured", lead });
  } catch (error) {
    return res.status(500).json({ error: "Could not save lead" });
  }
});

module.exports = router;

const express = require("express");
const { sendEmail } = require("../services/emailService");
const logger = require("../logger");

const router = express.Router();

function normalizeInput(value = "") {
  return String(value).trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", async (req, res) => {
  const name = normalizeInput(req.body?.name);
  const email = normalizeInput(req.body?.email).toLowerCase();
  const subject = normalizeInput(req.body?.subject);
  const message = normalizeInput(req.body?.message);
  const supportEmail = process.env.OWNER_EMAIL || "sparklebowshop@gmail.com";

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      error: "Name, email, subject, and message are required.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  if (subject.length > 120) {
    return res.status(400).json({ error: "Subject is too long." });
  }

  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({
      error: "Message must be between 10 and 5000 characters.",
    });
  }

  const emailResult = await sendEmail({
    to: supportEmail,
    subject: `Customer contact: ${subject}`,
    replyTo: email,
    html: `
      <h1 style="margin:0 0 16px 0;">New customer message</h1>
      <p style="margin:0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 16px 0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;white-space:pre-wrap;">${escapeHtml(message)}</div>
    `,
    text: [
      "New customer message",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\n"),
  });

  if (!emailResult?.success) {
    logger.error("Contact form email failed", {
      email,
      subject,
      error: emailResult?.error,
    });
    return res.status(502).json({
      error: "We could not send your message right now. Please try again shortly.",
    });
  }

  logger.info("Contact form message sent", {
    email,
    subject,
    provider: emailResult.provider || null,
  });

  return res.status(201).json({
    success: true,
    message: "Your message was sent successfully.",
  });
});

module.exports = router;

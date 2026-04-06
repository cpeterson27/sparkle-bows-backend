const express = require("express");
const { sendEmail } = require("../services/emailService");
const logger = require("../logger");
const { validateFormProtection } = require("../utils/formProtection");

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

function getSupportRecipients() {
  return [...new Set([
    process.env.OWNER_EMAIL,
    "sparklebowshop@gmail.com",
  ].filter(Boolean))];
}

router.post("/", async (req, res) => {
  const protection = validateFormProtection(req.body, { minElapsedMs: 1500 });
  if (!protection.valid) {
    logger.warn("Contact form blocked by protection", {
      code: protection.code,
      ip: req.ip,
    });
    return res.status(protection.status).json({ error: protection.error });
  }

  const name = normalizeInput(req.body?.name);
  const email = normalizeInput(req.body?.email).toLowerCase();
  const subject = normalizeInput(req.body?.subject);
  const message = normalizeInput(req.body?.message);
  const supportRecipients = getSupportRecipients();

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
    to: supportRecipients,
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
    recipients: supportRecipients,
    provider: emailResult.provider || null,
  });

  const confirmationResult = await sendEmail({
    to: email,
    subject: "We received your message",
    html: `
      <h1 style="margin:0 0 16px 0;">Thank you for contacting Sparkle Bows</h1>
      <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px 0;">
        We received your message and will get back to you as soon as possible.
      </p>
      <p style="margin:0 0 12px 0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;white-space:pre-wrap;">${escapeHtml(message)}</div>
      <p style="margin:16px 0 0 0;">Sparkle Bows Support</p>
    `,
    text: [
      "Thank you for contacting Sparkle Bows.",
      `Subject: ${subject}`,
      "",
      "We received your message and will get back to you as soon as possible.",
      "",
      message,
      "",
      "Sparkle Bows Support",
    ].join("\n"),
  });

  if (!confirmationResult?.success) {
    logger.warn("Contact confirmation email failed", {
      email,
      subject,
      error: confirmationResult?.error,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Your message was sent successfully.",
  });
});

module.exports = router;

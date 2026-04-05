// services/emailService.js
const { Resend } = require("resend");
const logger = require("../logger");

const resend = new Resend(process.env.RESEND_API_KEY);
const defaultFromEmail =
  process.env.EMAIL_FROM || "Sparkle Bows <hello@mail.sparklebows.shop>";
const supportEmail = process.env.OWNER_EMAIL || "sparklebowshop@gmail.com";
const unsubscribeMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  "Unsubscribe me from Sparkle Bows VIP",
)}`;

// -------------------------
// HELPERS
// -------------------------
const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// -------------------------
// SEND HELPER
// -------------------------
async function sendEmail({ to, subject, html, text, from, replyTo }) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || defaultFromEmail,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
    });

    if (error) {
      logger.error("Resend error", { error, to, subject });
      return { success: false, error };
    }

    logger.info("Email sent via Resend", { to, subject, id: data.id });
    return { success: true, data };
  } catch (err) {
    logger.error("Failed to send email", { error: err.message, to, subject });
    return { success: false, error: err.message };
  }
}

// -------------------------
// ORDER EMAIL HTML
// -------------------------
function getOrderConfirmationHTML(order) {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;"><strong>${item.name}</strong></td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Order Confirmation</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#fdf2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);padding:40px 30px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:32px;font-weight:bold;">✨ Sparkle & Twirl Bows ✨</h1>
            <p style="margin:10px 0 0 0;color:white;font-size:16px;">Handmade with love by a 7-year-old ballerina!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px 20px 30px;text-align:center;">
            <div style="display:inline-block;background-color:#dcfce7;color:#166534;padding:12px 24px;border-radius:24px;font-weight:bold;margin-bottom:20px;">✓ Order Confirmed</div>
            <h2 style="margin:0 0 10px 0;color:#1f2937;font-size:28px;">Thank You for Your Order! 🎀</h2>
            <p style="margin:0;color:#6b7280;font-size:16px;">Hi ${order.customerName.split(" ")[0]}, we're excited to make your bows!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 30px 30px 30px;">
            <div style="background:linear-gradient(135deg,#fce7f3 0%,#e9d5ff 100%);border:2px solid #ec4899;border-radius:12px;padding:20px;text-align:center;">
              <p style="margin:0 0 5px 0;color:#6b7280;font-size:14px;">Order Number</p>
              <p style="margin:0;color:#ec4899;font-size:24px;font-weight:bold;font-family:monospace;">#${order._id.toString().slice(-8).toUpperCase()}</p>
              <p style="margin:10px 0 0 0;color:#6b7280;font-size:14px;">${formatDate(order.createdAt)}</p>
            </div>
          </td>
        </tr>
        ${order.isGift ? `
        <tr>
          <td style="padding:0 30px 30px 30px;">
            <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;">
              <p style="margin:0 0 8px 0;color:#92400e;font-weight:bold;">🎁 This is a Gift Order</p>
              ${order.giftMessage ? `<p style="margin:0;color:#92400e;font-style:italic;">"${order.giftMessage}"</p>` : ""}
            </div>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:0 30px 30px 30px;">
            <h3 style="margin:0 0 16px 0;color:#1f2937;font-size:20px;">Order Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead><tr style="background-color:#f9fafb;">
                <th style="padding:12px;text-align:left;color:#6b7280;font-weight:600;font-size:14px;">Item</th>
                <th style="padding:12px;text-align:center;color:#6b7280;font-weight:600;font-size:14px;">Qty</th>
                <th style="padding:12px;text-align:right;color:#6b7280;font-weight:600;font-size:14px;">Price</th>
              </tr></thead>
              <tbody>${itemsHTML}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 30px 30px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;color:#6b7280;">Subtotal</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${formatCurrency(order.subtotal)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Shipping</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${order.shippingCost === 0 ? '<span style="color:#10b981;font-weight:bold;">FREE</span>' : formatCurrency(order.shippingCost)}</td></tr>
              ${order.tax > 0 ? `<tr><td style="padding:8px 0;color:#6b7280;">Sales Tax</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${formatCurrency(order.tax)}</td></tr>` : ""}
              <tr style="border-top:2px solid #e5e7eb;">
                <td style="padding:16px 0 0 0;color:#1f2937;font-size:18px;font-weight:bold;">Total</td>
                <td style="padding:16px 0 0 0;text-align:right;color:#ec4899;font-size:24px;font-weight:bold;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 30px 40px 30px;text-align:center;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:24px;font-weight:bold;font-size:16px;">View Order Details</a>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Questions? Reply to this email!</p>
            <p style="margin:0 0 16px 0;color:#ec4899;font-weight:bold;">sparklebowshop@gmail.com</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Sparkle & Twirl Bows. Made with 💖 by a 7-year-old ballerina!</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// -------------------------
// VIP EMAIL HTML
// -------------------------
function getVipLeadHTML(lead) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New VIP Lead</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:white;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);padding:20px;text-align:center;"><h1 style="margin:0;color:white;font-size:24px;">⭐ NEW VIP SUBSCRIBER!</h1></td></tr>
        <tr><td style="padding:30px;">
          <div style="background-color:#fdf4ff;border-left:4px solid #ec4899;padding:16px;border-radius:8px;">
            <p style="margin:0 0 8px 0;color:#6b21a8;font-weight:bold;font-size:16px;">Someone just joined the VIP list! 🎀</p>
            <p style="margin:0 0 6px 0;color:#6b21a8;"><strong>Email:</strong> ${lead.email}</p>
            ${lead.firstName ? `<p style="margin:0 0 6px 0;color:#6b21a8;"><strong>Name:</strong> ${lead.firstName}</p>` : ""}
            <p style="margin:0;color:#6b21a8;"><strong>Source:</strong> ${lead.source || "website"}</p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);color:white;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">View in Admin Panel</a>
          </div>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Sparkle & Twirl Bows</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getVipLeadText(lead) {
  return [
    "NEW VIP SUBSCRIBER",
    "",
    "Someone just joined the VIP list.",
    `Email: ${lead.email}`,
    `Name: ${lead.firstName || "Not provided"}`,
    `Source: ${lead.source || "website"}`,
    "",
    `View in Admin Panel: ${process.env.FRONTEND_URL}/admin`,
  ].join("\n");
}

function getVipWelcomeHTML({ firstName = "" }) {
  const greetingName = firstName ? ` ${firstName}` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Sparkle Bows VIP</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#fff7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7fb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #fbcfe8;">
        <tr>
          <td style="background:linear-gradient(135deg,#ec4899 0%,#fb7185 55%,#f59e0b 100%);padding:32px 28px;text-align:center;">
            <p style="margin:0 0 10px 0;color:#fff1f2;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Sparkle Bows VIP</p>
            <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;">You're officially in.</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;color:#334155;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;">Hi${greetingName},</p>
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;">
              Thanks for joining the Sparkle Bows VIP list. You're on the list for first access to new drops, restock updates, and subscriber-only offers.
            </p>
            <div style="background-color:#fff1f2;border:1px solid #fecdd3;border-radius:14px;padding:20px 22px;margin:24px 0;">
              <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#9f1239;letter-spacing:0.04em;text-transform:uppercase;">What you'll get</p>
              <ul style="padding-left:20px;margin:0;color:#475569;font-size:15px;line-height:1.8;">
                <li>Early access to new arrivals</li>
                <li>Restock alerts on customer favorites</li>
                <li>Exclusive subscriber discounts</li>
              </ul>
            </div>
            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;">
              We’ll keep it thoughtful and low-volume. No spam, and you can unsubscribe any time.
            </p>
            <div style="text-align:center;">
              <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:9999px;font-weight:700;font-size:15px;">Visit Sparkle Bows</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Questions? Just reply to this email or contact ${supportEmail}.</p>
            <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;">If you no longer want VIP emails, <a href="${unsubscribeMailto}" style="color:#9f1239;">click here to unsubscribe</a>.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">Sparkle Bows • ${supportEmail} • © ${new Date().getFullYear()} Sparkle Bows</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getVipWelcomeText({ firstName = "" }) {
  return [
    `Hi${firstName ? ` ${firstName}` : ""},`,
    "",
    "Thanks for joining the Sparkle Bows VIP list.",
    "You're on the list for:",
    "- Early access to new arrivals",
    "- Restock alerts on customer favorites",
    "- Exclusive subscriber discounts",
    "",
    "Visit the shop:",
    `${process.env.FRONTEND_URL}`,
    "",
    `Questions? Reply to this email or contact ${supportEmail}.`,
    `To unsubscribe from VIP emails, email ${supportEmail} with the subject: Unsubscribe me from Sparkle Bows VIP`,
    "",
    "Sparkle Bows",
  ].join("\n");
}

// -------------------------
// SEND FUNCTIONS
// -------------------------
async function sendOrderConfirmationEmail(order) {
  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed! 🎀 #${order._id.toString().slice(-8).toUpperCase()}`,
    html: getOrderConfirmationHTML(order),
  });
}

async function sendOwnerNotification(order) {
  return sendEmail({
    to: process.env.OWNER_EMAIL || "sparklebowshop@gmail.com",
    subject: `🎉 NEW ORDER #${order._id.toString().slice(-8).toUpperCase()} - ${formatCurrency(order.total)}`,
    html: getOrderConfirmationHTML(order),
  });
}

async function sendVipNotification({
  to,
  email,
  firstName = "",
  source = "website",
  subject,
  html,
  text,
  replyTo,
}) {
  return sendEmail({
    to,
    subject: subject || `⭐ New VIP Subscriber: ${email}`,
    html: html || getVipLeadHTML({ email, firstName, source }),
    text: text || getVipLeadText({ email, firstName, source }),
    replyTo,
  });
}

// -------------------------
// EXPORTS
// -------------------------
module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOwnerNotification,
  sendVipNotification,
  formatCurrency,
  formatDate,
  getOrderConfirmationHTML,
  getVipLeadHTML,
  getVipLeadText,
  getVipWelcomeHTML,
  getVipWelcomeText,
};

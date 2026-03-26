// services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../logger");
const fetch = require("node-fetch");

// -------------------------
// GMAIL TRANSPORTER (SSL 465)
// -------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

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
// ORDER CONFIRMATION HTML
// -------------------------
function getOrderConfirmationHTML(order) {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;"><strong>${item.name}</strong></td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCurrency(
        item.price * item.quantity
      )}</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Confirmation</title></head>
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
            <p style="margin:0;color:#6b7280;font-size:16px;">Hi ${
              order.customerName.split(" ")[0]
            }, we're excited to make your bows!</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 30px 30px 30px;">
            <div style="background:linear-gradient(135deg,#fce7f3 0%,#e9d5ff 100%);border:2px solid #ec4899;border-radius:12px;padding:20px;text-align:center;">
              <p style="margin:0 0 5px 0;color:#6b7280;font-size:14px;">Order Number</p>
              <p style="margin:0;color:#ec4899;font-size:24px;font-weight:bold;font-family:monospace;">#${order._id
                .toString()
                .slice(-8)
                .toUpperCase()}</p>
              <p style="margin:10px 0 0 0;color:#6b7280;font-size:14px;">${formatDate(
                order.createdAt
              )}</p>
            </div>
          </td>
        </tr>

        ${
          order.isGift
            ? `<tr>
            <td style="padding:0 30px 30px 30px;">
              <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;">
                <p style="margin:0 0 8px 0;color:#92400e;font-weight:bold;">🎁 This is a Gift Order</p>
                ${
                  order.giftMessage
                    ? `<p style="margin:0;color:#92400e;font-style:italic;">"${order.giftMessage}"</p>`
                    : ""
                }
              </div>
            </td>
          </tr>`
            : ""
        }

        <tr>
          <td style="padding:0 30px 30px 30px;">
            <h3 style="margin:0 0 16px 0;color:#1f2937;font-size:20px;">Order Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background-color:#f9fafb;">
                  <th style="padding:12px;text-align:left;color:#6b7280;font-weight:600;font-size:14px;">Item</th>
                  <th style="padding:12px;text-align:center;color:#6b7280;font-weight:600;font-size:14px;">Qty</th>
                  <th style="padding:12px;text-align:right;color:#6b7280;font-weight:600;font-size:14px;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 30px 30px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;color:#6b7280;">Subtotal</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${formatCurrency(
                order.subtotal
              )}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Shipping</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${
                order.shippingCost === 0
                  ? '<span style="color:#10b981;font-weight:bold;">FREE</span>'
                  : formatCurrency(order.shippingCost)
              }</td></tr>
              ${
                order.tax > 0
                  ? `<tr><td style="padding:8px 0;color:#6b7280;">Sales Tax</td><td style="padding:8px 0;text-align:right;color:#1f2937;">${formatCurrency(
                      order.tax
                    )}</td></tr>`
                  : ""
              }
              <tr style="border-top:2px solid #e5e7eb;"><td style="padding:16px 0 0 0;color:#1f2937;font-size:18px;font-weight:bold;">Total</td><td style="padding:16px 0 0 0;text-align:right;color:#ec4899;font-size:24px;font-weight:bold;">${formatCurrency(
                order.total
              )}</td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 30px 40px 30px;text-align:center;">
            <a href="${process.env.FRONTEND_URL}/orders/${
    order._id
  }" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:24px;font-weight:bold;font-size:16px;">View Order Details</a>
          </td>
        </tr>

        <tr>
          <td style="background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Questions? Reply to this email!</p>
            <p style="margin:0 0 16px 0;color:#ec4899;font-weight:bold;">${process.env.GMAIL_USER}</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Sparkle & Twirl Bows. Made with 💖 by a 7-year-old ballerina!</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

// -------------------------
// OWNER NOTIFICATION HTML
// -------------------------
function getOwnerNotificationHTML(order) {
  const itemsList = order.items
    .map((i) => `• ${i.name} x${i.quantity} - ${formatCurrency(i.price * i.quantity)}`)
    .join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Order Received</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:white;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#1f2937;padding:20px;text-align:center;"><h1 style="margin:0;color:white;font-size:24px;">🎉 NEW ORDER RECEIVED!</h1></td></tr>
        <tr><td style="padding:30px;">
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          <pre style="background-color:#f9fafb;padding:16px;border-radius:4px;font-family:monospace;font-size:14px;">${itemsList}</pre>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
            <tr><td style="padding:8px 0;color:#6b7280;">Subtotal:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${formatCurrency(order.subtotal)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Shipping:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${formatCurrency(order.shippingCost)}</td></tr>
            ${
              order.tax > 0
                ? `<tr><td style="padding:8px 0;color:#6b7280;">Tax:</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${formatCurrency(
                    order.tax
                  )}</td></tr>`
                : ""
            }
            <tr style="border-top:2px solid #e5e7eb;"><td style="padding:12px 0 0 0;font-size:18px;font-weight:bold;">TOTAL:</td><td style="padding:12px 0 0 0;text-align:right;font-size:20px;font-weight:bold;color:#10b981;">${formatCurrency(
              order.total
            )}</td></tr>
          </table>
          <div style="text-align:center;margin-top:30px;">
            <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;background-color:#1f2937;color:white;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">View in Admin Panel</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

// -------------------------
// VIP LEAD HTML
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
        <tr><td style="background-color:#1f2937;padding:20px;text-align:center;"><h1 style="margin:0;color:white;font-size:24px;">🌟 NEW VIP LEAD!</h1></td></tr>
        <tr><td style="padding:30px;">
          <p><strong>Name:</strong> ${lead.firstName} ${lead.lastName || ""}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Source:</strong> ${lead.source || "Website"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

// -------------------------
// SEND EMAIL FUNCTIONS
// -------------------------
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Sparkle & Twirl Bows 🎀" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ EMAIL SENT:", info);
    logger.info("Email sent", { to, subject });
  } catch (err) {
    console.error("🚨 FULL EMAIL ERROR:", err); // 👈 THIS IS WHAT YOU NEED
    logger.error("Failed to send email", {
      to,
      subject,
      message: err.message,
      code: err.code,
      response: err.response,
      stack: err.stack,
    });
  }
}

async function sendOrderConfirmationEmail(order) {
  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed! 🎀 #${order._id.toString().slice(-8).toUpperCase()}`,
    html: getOrderConfirmationHTML(order),
  });
}

async function sendOwnerNotification(order) {
  return sendEmail({
    to: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
    subject: `🎉 NEW ORDER #${order._id.toString().slice(-8).toUpperCase()} - ${formatCurrency(
      order.total
    )}`,
    html: getOwnerNotificationHTML(order),
  });
}

// -------------------------
// VIP LEAD FUNCTION (GMAIL + KLAVIYO)
// -------------------------
async function sendVipNotification(lead) {
  try {
    await sendEmail({
      to: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
      subject: `🌟 New VIP Lead: ${lead.email}`,
      html: getVipLeadHTML(lead),
    });

    if (!process.env.KLAVIYO_API_KEY) {
      logger.warn("Klaviyo API key missing, skipping VIP push");
      return;
    }

    const payload = {
      profiles: [
        {
          email: lead.email,
          first_name: lead.firstName || "",
          last_name: lead.lastName || "",
        },
      ],
    };

    const res = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("Failed to push VIP lead to Klaviyo", { leadEmail: lead.email, body: text });
    } else {
      logger.info("VIP lead pushed to Klaviyo", { leadEmail: lead.email });
    }
  } catch (err) {
    logger.error("sendVipNotification error", { leadEmail: lead.email, error: err.message });
  }
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
  getOwnerNotificationHTML,
  getVipLeadHTML,
};

// ─────────────────────────────────────────────
// 🎉 END OF FILE
// ─────────────────────────────────────────────
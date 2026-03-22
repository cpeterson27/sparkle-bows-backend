const nodemailer = require("nodemailer");
const logger = require("../logger");

// -------------------------
// Email Transporter (Gmail with App Password)
// -------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER, // sparklebowshop@gmail.com
    pass: process.env.GMAIL_PASS, // 16-char app password
  },
});

// -------------------------
// Helper: Format Currency
// -------------------------
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// -------------------------
// Helper: Format Date
// -------------------------
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// -------------------------
// EMAIL TEMPLATE: Order Confirmation (Customer)
// -------------------------
function getOrderConfirmationHTML(order) {
  const itemsHTML = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
            <strong>${item.name}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf2f8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                    ✨ Sparkle & Twirl Bows ✨
                  </h1>
                  <p style="margin: 10px 0 0 0; color: white; font-size: 16px;">
                    Handmade with love by a 7-year-old ballerina!
                  </p>
                </td>
              </tr>

              <!-- Thank You Message -->
              <tr>
                <td style="padding: 40px 30px 20px 30px; text-align: center;">
                  <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 12px 24px; border-radius: 24px; font-weight: bold; margin-bottom: 20px;">
                    ✓ Order Confirmed
                  </div>
                  <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 28px;">
                    Thank You for Your Order! 🎀
                  </h2>
                  <p style="margin: 0; color: #6b7280; font-size: 16px;">
                    Hi ${order.customerName.split(" ")[0]}, we're so excited to make your bows!
                  </p>
                </td>
              </tr>

              <!-- Order Number -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border: 2px solid #ec4899; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 0; color: #ec4899; font-size: 24px; font-weight: bold; font-family: monospace;">
                      #${order._id.toString().slice(-8).toUpperCase()}
                    </p>
                    <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                      ${formatDate(order.createdAt)}
                    </p>
                  </div>
                </td>
              </tr>

              ${
                order.isGift
                  ? `
              <!-- Gift Message -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; color: #92400e; font-weight: bold;">
                      🎁 This is a Gift Order
                    </p>
                    ${
                      order.giftMessage
                        ? `<p style="margin: 0; color: #92400e; font-style: italic;">"${order.giftMessage}"</p>`
                        : ""
                    }
                  </div>
                </td>
              </tr>
              `
                  : ""
              }

              <!-- Order Items -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px;">Order Details</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px;">Item</th>
                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px;">Qty</th>
                        <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Order Totals -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                      <td style="padding: 8px 0; text-align: right; color: #1f2937;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Shipping</td>
                      <td style="padding: 8px 0; text-align: right; color: #1f2937;">
                        ${order.shippingCost === 0 ? '<span style="color: #10b981; font-weight: bold;">FREE</span>' : formatCurrency(order.shippingCost)}
                      </td>
                    </tr>
                    ${
                      order.tax > 0
                        ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Sales Tax</td>
                      <td style="padding: 8px 0; text-align: right; color: #1f2937;">${formatCurrency(order.tax)}</td>
                    </tr>
                    `
                        : ""
                    }
                    <tr style="border-top: 2px solid #e5e7eb;">
                      <td style="padding: 16px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">Total</td>
                      <td style="padding: 16px 0 0 0; text-align: right; color: #ec4899; font-size: 24px; font-weight: bold;">
                        ${formatCurrency(order.total)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                      📦 Shipping To:
                    </h3>
                    <p style="margin: 0; color: #1f2937; line-height: 1.6;">
                      <strong>${order.shippingAddress.name}</strong><br>
                      ${order.shippingAddress.line1}<br>
                      ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br>` : ""}
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                      ${order.shippingAddress.country}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- What's Next -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; text-align: center;">
                    What Happens Next? 🎀
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="33%" style="padding: 12px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
                        <strong style="color: #1f2937; font-size: 14px; display: block; margin-bottom: 4px;">Processing</strong>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">I'm making your bows!</p>
                      </td>
                      <td width="33%" style="padding: 12px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🚚</div>
                        <strong style="color: #1f2937; font-size: 14px; display: block; margin-bottom: 4px;">Shipping</strong>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">You'll get tracking info</p>
                      </td>
                      <td width="33%" style="padding: 12px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
                        <strong style="color: #1f2937; font-size: 14px; display: block; margin-bottom: 4px;">Delivered!</strong>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Enjoy your bows!</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 30px 40px 30px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
                     style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 24px; font-weight: bold; font-size: 16px;">
                    View Order Details
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                    Questions? Reply to this email!
                  </p>
                  <p style="margin: 0 0 16px 0; color: #ec4899; font-weight: bold;">
                    ${process.env.GMAIL_USER}
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Sparkle & Twirl Bows. Made with 💖 by a 7-year-old ballerina!
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// -------------------------
// EMAIL TEMPLATE: Owner Notification
// -------------------------
function getOwnerNotificationHTML(order) {
  const itemsList = order.items
    .map((item) => `• ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden;">
              
              <tr>
                <td style="background-color: #1f2937; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 24px;">🎉 NEW ORDER RECEIVED!</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937;">Order #${order._id.toString().slice(-8).toUpperCase()}</h2>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">
                      <strong>Customer:</strong> ${order.customerName}
                    </p>
                    <p style="margin: 8px 0 0 0; color: #92400e;">
                      <strong>Email:</strong> ${order.customerEmail}
                    </p>
                  </div>

                  <h3 style="margin: 0 0 12px 0; color: #1f2937;">Items:</h3>
                  <pre style="background-color: #f9fafb; padding: 16px; border-radius: 4px; font-family: monospace; font-size: 14px; overflow-x: auto;">${itemsList}</pre>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Shipping:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(order.shippingCost)}</td>
                    </tr>
                    ${
                      order.tax > 0
                        ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(order.tax)}</td>
                    </tr>
                    `
                        : ""
                    }
                    <tr style="border-top: 2px solid #e5e7eb;">
                      <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">TOTAL:</td>
                      <td style="padding: 12px 0 0 0; text-align: right; font-size: 20px; font-weight: bold; color: #10b981;">
                        ${formatCurrency(order.total)}
                      </td>
                    </tr>
                  </table>

                  <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h4 style="margin: 0 0 12px 0; color: #1e40af;">📦 Ship To:</h4>
                    <p style="margin: 0; color: #1e3a8a; line-height: 1.6;">
                      ${order.shippingAddress.name}<br>
                      ${order.shippingAddress.line1}<br>
                      ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br>` : ""}
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
                    </p>
                  </div>

                  ${
                    order.isGift
                      ? `
                  <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">🎁 THIS IS A GIFT ORDER</p>
                    ${order.giftMessage ? `<p style="margin: 8px 0 0 0; color: #92400e; font-style: italic;">"${order.giftMessage}"</p>` : ""}
                  </div>
                  `
                      : ""
                  }

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL}/admin" 
                       style="display: inline-block; background-color: #1f2937; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                      View in Admin Panel
                    </a>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// -------------------------
// EMAIL TEMPLATE: Tracking Number (Customer)
// -------------------------
function getTrackingEmailHTML(order) {
  const trackingURL =
    order.carrier === "USPS"
      ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}`
      : order.carrier === "UPS"
        ? `https://www.ups.com/track?tracknum=${order.trackingNumber}`
        : order.carrier === "FedEx"
          ? `https://www.fedex.com/fedextrack/?trknbr=${order.trackingNumber}`
          : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Order Has Shipped!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf2f8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 12px;">🚚</div>
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                    Your Order Has Shipped!
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <p style="margin: 0 0 24px 0; color: #1f2937; font-size: 18px;">
                    Hi ${order.customerName.split(" ")[0]}, your sparkly bows are on their way! ✨
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: bold; font-family: monospace;">
                      #${order._id.toString().slice(-8).toUpperCase()}
                    </p>
                    
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Tracking Number</p>
                    <p style="margin: 0; color: #3b82f6; font-size: 24px; font-weight: bold; font-family: monospace;">
                      ${order.trackingNumber}
                    </p>
                  </div>

                  ${
                    trackingURL
                      ? `
                  <a href="${trackingURL}" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 24px; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
                    Track Your Package →
                  </a>
                  `
                      : ""
                  }

                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: left; margin-top: 24px;">
                    <h3 style="margin: 0 0 12px 0; color: #1f2937;">Shipping Details:</h3>
                    <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                      <strong>Carrier:</strong> ${order.carrier || "USPS"}<br>
                      <strong>Ship To:</strong><br>
                      ${order.shippingAddress.name}<br>
                      ${order.shippingAddress.line1}<br>
                      ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br>` : ""}
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                    Questions about your order?
                  </p>
                  <p style="margin: 0; color: #ec4899; font-weight: bold;">
                    Reply to this email: ${process.env.GMAIL_USER}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// -------------------------
// SEND: Order Confirmation Email
// -------------------------
async function sendOrderConfirmationEmail(order) {
  try {
    const mailOptions = {
      from: `"Sparkle & Twirl Bows 🎀" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmed! 🎀 #${order._id.toString().slice(-8).toUpperCase()}`,
      html: getOrderConfirmationHTML(order),
    };

    await transporter.sendMail(mailOptions);
    logger.info("Order confirmation email sent", {
      orderId: order._id,
      email: order.customerEmail,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to send order confirmation email", {
      orderId: order._id,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

// -------------------------
// SEND: Owner Notification
// -------------------------
async function sendOwnerNotification(order) {
  try {
    const mailOptions = {
      from: `"Bow Shop Notification" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
      subject: `🎉 NEW ORDER #${order._id.toString().slice(-8).toUpperCase()} - $${order.total.toFixed(2)}`,
      html: getOwnerNotificationHTML(order),
    };

    await transporter.sendMail(mailOptions);
    logger.info("Owner notification email sent", {
      orderId: order._id,
      total: order.total,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to send owner notification email", {
      orderId: order._id,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

// -------------------------
// SEND: Tracking Number Email
// -------------------------
async function sendTrackingEmail(order) {
  try {
    const mailOptions = {
      from: `"Sparkle & Twirl Bows 🎀" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Your Order Has Shipped! 🚚 #${order._id.toString().slice(-8).toUpperCase()}`,
      html: getTrackingEmailHTML(order),
    };

    await transporter.sendMail(mailOptions);
    logger.info("Tracking email sent", {
      orderId: order._id,
      trackingNumber: order.trackingNumber,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to send tracking email", {
      orderId: order._id,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOwnerNotification,
  sendTrackingEmail,
};
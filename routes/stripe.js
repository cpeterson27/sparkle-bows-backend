const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");
const { calculateShipping } = require("../utils/shippingCalculator");
const logger = require("../logger");

const router = express.Router();
const STRIPE_TAX_PREVIEW_VERSION =
  process.env.STRIPE_TAX_PREVIEW_VERSION || "2025-09-30.preview";
const DEFAULT_PRODUCT_TAX_CODE = process.env.STRIPE_DEFAULT_PRODUCT_TAX_CODE;
const DEFAULT_SHIPPING_TAX_CODE = process.env.STRIPE_DEFAULT_SHIPPING_TAX_CODE;

function toCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function fromCents(amount) {
  return Number((Number(amount || 0) / 100).toFixed(2));
}

function buildAddress(address = {}) {
  return {
    line1: address.line1,
    line2: address.line2 || undefined,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country || "US",
  };
}

function buildShipFromDetails() {
  const country = process.env.STRIPE_SHIP_FROM_COUNTRY;
  if (!country) {
    return undefined;
  }

  return {
    address: {
      line1: process.env.STRIPE_SHIP_FROM_LINE1 || undefined,
      line2: process.env.STRIPE_SHIP_FROM_LINE2 || undefined,
      city: process.env.STRIPE_SHIP_FROM_CITY || undefined,
      state: process.env.STRIPE_SHIP_FROM_STATE || undefined,
      postal_code: process.env.STRIPE_SHIP_FROM_POSTAL_CODE || undefined,
      country,
    },
  };
}

function buildTaxBreakdown(taxCalculation) {
  return (taxCalculation.tax_breakdown || []).map((entry) => ({
    amount: fromCents(entry.amount),
    inclusive: !!entry.inclusive,
    taxType: entry.tax_rate_details?.tax_type || null,
    percentageDecimal: entry.tax_rate_details?.percentage_decimal || null,
    country: entry.tax_rate_details?.country || null,
    state: entry.tax_rate_details?.state || null,
    taxableAmount: fromCents(entry.taxable_amount),
    taxabilityReason: entry.taxability_reason || null,
  }));
}

function toMetadataString(value) {
  return value ? String(value) : "";
}

router.post("/create-payment-intent", optionalAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, shippingInfo, isGift, giftMessage } =
      req.body;

    /* ------------------ VALIDATION ------------------ */
    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (
      !shippingInfo?.line1 ||
      !shippingInfo?.city ||
      !shippingInfo?.state ||
      !shippingInfo?.postalCode
    ) {
      return res
        .status(400)
        .json({ error: "Complete shipping address required" });
    }

    /* ------------------ LOAD CART ------------------
     * 1. By userId if logged in
     * 2. By signed guestId cookie
     * 3. By unsigned guestId cookie (cross-domain cookie fallback)
     * 4. By refreshToken cookie userId (last resort)
     */
    const userId = req.user?.userId;
    const guestId = req.signedCookies?.guestId || req.cookies?.guestId;

    let cart;

    if (userId) {
      cart = await Cart.findOne({ userId }).populate("items.productId");
    }

    if (!cart && guestId) {
      cart = await Cart.findOne({ guestId }).populate("items.productId");
    }

    if (!cart && req.cookies?.refreshToken) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          req.cookies.refreshToken,
          process.env.JWT_REFRESH_SECRET,
        );
        if (decoded?.userId) {
          cart = await Cart.findOne({ userId: decoded.userId }).populate(
            "items.productId",
          );
        }
      } catch (_) {}
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    /* ------------------ VALIDATE INVENTORY ------------------ */
    let subtotal = 0;
    const orderItems = [];
    const taxLineItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId?._id);
      if (!product) {
        return res.status(400).json({ error: "Product no longer exists" });
      }
      if (product.inventory < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
      taxLineItems.push({
        amount: toCents(product.price * item.quantity),
        quantity: item.quantity,
        reference: product._id.toString(),
        tax_behavior: "exclusive",
        ...(product.stripeTaxCode || DEFAULT_PRODUCT_TAX_CODE
          ? { tax_code: product.stripeTaxCode || DEFAULT_PRODUCT_TAX_CODE }
          : {}),
      });
    }

    /* ------------------ SHIPPING ------------------ */
    const totalQty = orderItems.reduce((sum, i) => sum + i.quantity, 0);
    const shippingCost = calculateShipping(subtotal, totalQty);
    const stripeAddress = buildAddress(shippingInfo);
    const shipFromDetails = buildShipFromDetails();
    const taxCalculation = await stripe.tax.calculations.create(
      {
        currency: "usd",
        customer_details: {
          address: stripeAddress,
          address_source: "shipping",
        },
        line_items: taxLineItems,
        ...(shippingCost > 0
          ? {
              shipping_cost: {
                amount: toCents(shippingCost),
                tax_behavior: "exclusive",
                ...(DEFAULT_SHIPPING_TAX_CODE
                  ? { tax_code: DEFAULT_SHIPPING_TAX_CODE }
                  : {}),
              },
            }
          : {}),
        ...(shipFromDetails ? { ship_from_details: shipFromDetails } : {}),
      },
      {
        stripeVersion: STRIPE_TAX_PREVIEW_VERSION,
      },
    );
    const taxAmount = fromCents(taxCalculation.tax_amount_exclusive);
    const total = fromCents(taxCalculation.amount_total);
    const taxBreakdown = buildTaxBreakdown(taxCalculation);

    /* ------------------ STRIPE PAYMENT INTENT ------------------ */

    // -------------------------
    // Customer info
    // -------------------------
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail,
      address: stripeAddress,
    });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: taxCalculation.amount_total,
        currency: "usd",
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        hooks: {
          inputs: {
            tax: {
              calculation: taxCalculation.id,
            },
          },
        },
        shipping: {
          name: customerName,
          address: stripeAddress,
        },
        receipt_email: customerEmail,
        metadata: {
          orderType: "checkout",
          userId: toMetadataString(userId),
          guestId: toMetadataString(guestId),
          isGift: isGift ? "true" : "false",
          giftMessage: giftMessage || "",
        },
      },
      {
        stripeVersion: STRIPE_TAX_PREVIEW_VERSION,
      },
    );

    /* ------------------ CREATE ORDER ------------------ */
    const order = await Order.create({
      userId: userId || null,
      customerName,
      customerEmail,
      items: orderItems,
      subtotal,
      shippingCost,
      tax: taxAmount,
      total,
      status: "pending",
      shippingAddress: shippingInfo,
      stripePaymentIntentId: paymentIntent.id,
      stripeTaxCalculationId: taxCalculation.id,
      stripeTaxBreakdown: taxBreakdown,
      isGift: !!isGift,
      giftMessage: giftMessage || "",
    });

    logger.info("Stripe PI created", {
      paymentIntentId: paymentIntent.id,
      orderId: order._id,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      subtotal,
      shippingCost,
      tax: taxAmount,
      total,
    });
  } catch (err) {
    logger.error("Stripe create-payment-intent failed", {
      message: err.message,
      stack: err.stack,
    });
    if (
      err.code === "stripe_tax_inactive" ||
      err.code === "taxes_calculation_failed" ||
      err.code === "customer_tax_location_invalid"
    ) {
      return res.status(400).json({
        error:
          "We couldn't calculate taxes for this shipping address. Please review the address or contact support.",
      });
    }

    res.status(500).json({ error: "Could not create payment intent" });
  }
});

module.exports = router;

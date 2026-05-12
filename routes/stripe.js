const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");
const { getRatesForOrder, selectCheckoutRate } = require("../services/shippoService");
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
    state: address.state || undefined,
    postal_code: address.postalCode,
    country: address.country || "US",
  };
}

function buildShippingName(customerName, shippingInfo = {}) {
  return shippingInfo.name || customerName;
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

async function expireExistingPendingOrders({ userId, customerEmail }) {
  const filter = {
    status: "pending",
    ...(userId ? { userId } : { customerEmail }),
  };

  await Order.updateMany(filter, {
    $set: { status: "cancelled" },
  });
}

function validateShippingInfo(shippingInfo) {
  const country = String(shippingInfo?.country || "US").trim().toUpperCase();

  if (
    !shippingInfo?.line1 ||
    !shippingInfo?.city ||
    !shippingInfo?.postalCode ||
    !country
  ) {
    return "Complete shipping address required";
  }

  if ((country === "US" || country === "CA") && !shippingInfo?.state) {
    return "State or province is required for this shipping address";
  }

  if (country !== "US" && !shippingInfo?.phone) {
    return "Phone number is required for international shipping";
  }

  return null;
}

async function loadCheckoutCart(req) {
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

  return { cart, userId, guestId };
}

async function buildOrderItemsFromCart(cart) {
  if (!cart || cart.items.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  let subtotal = 0;
  const orderItems = [];
  const taxLineItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.productId?._id);
    if (!product) {
      const err = new Error("Product no longer exists");
      err.status = 400;
      throw err;
    }
    if (product.inventory < item.quantity) {
      const err = new Error(`Not enough stock for ${product.name}`);
      err.status = 400;
      throw err;
    }

    subtotal += product.price * item.quantity;
    orderItems.push({
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      cost: Number(product.materialCost || 0),
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

  return { subtotal, orderItems, taxLineItems };
}

function buildQuoteOrder({
  customerName,
  customerEmail,
  shippingInfo,
  orderItems,
}) {
  return {
    customerName,
    customerEmail,
    shippingAddress: shippingInfo,
    items: orderItems,
  };
}

router.post("/shipping-rates", optionalAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, shippingInfo } = req.body;
    const validationError = validateShippingInfo(shippingInfo);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { cart } = await loadCheckoutCart(req);
    const { subtotal, orderItems } = await buildOrderItemsFromCart(cart);
    const quoteOrder = buildQuoteOrder({
      customerName,
      customerEmail,
      shippingInfo,
      orderItems,
    });
    const { shipmentId, rates } = await getRatesForOrder(quoteOrder);

    res.json({ shipmentId, subtotal, rates });
  } catch (err) {
    logger.error("Shippo shipping rates failed", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Could not load shipping rates" });
  }
});

router.post("/create-payment-intent", optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      shippingInfo,
      selectedShippingRateId,
      selectedShippingRateKey,
      isGift,
      giftMessage,
    } = req.body;

    /* ------------------ VALIDATION ------------------ */
    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const validationError = validateShippingInfo(shippingInfo);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!selectedShippingRateId && !selectedShippingRateKey) {
      return res.status(400).json({ error: "Please select a shipping option" });
    }

    /* ------------------ LOAD CART ------------------
     * 1. By userId if logged in
     * 2. By signed guestId cookie
     * 3. By unsigned guestId cookie (cross-domain cookie fallback)
     * 4. By refreshToken cookie userId (last resort)
     */
    const { cart, userId, guestId } = await loadCheckoutCart(req);

    /* ------------------ VALIDATE INVENTORY ------------------ */
    const { subtotal, orderItems, taxLineItems } = await buildOrderItemsFromCart(cart);

    /* ------------------ SHIPPING ------------------ */
    const quoteOrder = buildQuoteOrder({
      customerName,
      customerEmail,
      shippingInfo,
      orderItems,
    });
    const selectedShipping = await selectCheckoutRate(quoteOrder, {
      id: selectedShippingRateId,
      rateKey: selectedShippingRateKey,
    });
    const shippingCost = selectedShipping.rate.amount;
    const stripeAddress = buildAddress(shippingInfo);
    const shippingName = buildShippingName(customerName, shippingInfo);
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
          name: shippingName,
          address: stripeAddress,
        },
        receipt_email: customerEmail,
        metadata: {
          orderType: "checkout",
          userId: toMetadataString(userId),
          guestId: toMetadataString(guestId),
          isGift: isGift ? "true" : "false",
          giftMessage: giftMessage || "",
          shippoShipmentId: selectedShipping.shipmentId,
          shippoRateId: selectedShipping.rate.id,
          shippingProvider: selectedShipping.rate.provider,
          shippingService: selectedShipping.rate.service,
        },
      },
      {
        stripeVersion: STRIPE_TAX_PREVIEW_VERSION,
      },
    );

    /* ------------------ CREATE ORDER ------------------ */
    await expireExistingPendingOrders({
      userId: userId || null,
      customerEmail: customerEmail.toLowerCase(),
    });

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
      shippoShipmentId: selectedShipping.shipmentId,
      shippoRateId: selectedShipping.rate.id,
      carrier: `${selectedShipping.rate.provider} ${selectedShipping.rate.service}`.trim(),
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
      shippingRate: selectedShipping.rate,
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

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    res.status(500).json({ error: "Could not create payment intent" });
  }
});

module.exports = router;

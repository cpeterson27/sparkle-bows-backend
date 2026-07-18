process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";

const mockStripe = {
  tax: {
    calculations: {
      create: jest.fn(),
    },
  },
  customers: {
    create: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
  },
  balanceTransactions: {
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock("stripe", () => jest.fn(() => mockStripe));
jest.mock("../logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock("../services/emailService", () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendOwnerNotification: jest.fn().mockResolvedValue({ success: true }),
  sendTrackingEmail: jest.fn().mockResolvedValue({ success: true }),
}));

const request = require("supertest");
const app = require("../app");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const {
  sendOrderConfirmationEmail,
  sendOwnerNotification,
} = require("../services/emailService");

describe("Stripe webhook route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes a successful payment intent once and updates related records", async () => {
    const product = await Product.create({
      name: "Webhook Bow",
      price: 10,
      category: "sparkle",
      inventory: 5,
      sales: 0,
      materialCost: 2,
    });

    await Cart.create({
      guestId: "guest_123",
      items: [{ productId: product._id, quantity: 2 }],
    });

    const order = await Order.create({
      customerName: "Webhook Customer",
      customerEmail: "webhook@example.com",
      items: [
        {
          productId: product._id,
          name: product.name,
          quantity: 2,
          price: 10,
          cost: 2,
        },
      ],
      subtotal: 20,
      shippingCost: 6.99,
      tax: 1.5,
      total: 28.49,
      status: "pending",
      shippingAddress: {
        line1: "123 Main St",
        city: "Dallas",
        state: "TX",
        postalCode: "75001",
        country: "US",
      },
      stripePaymentIntentId: "pi_success_123",
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_success_123",
          amount: 2849,
          metadata: {
            guestId: "guest_123",
          },
          charges: {
            data: [
              {
                id: "ch_123",
                amount_captured: 2849,
                balance_transaction: "txn_123",
              },
            ],
          },
        },
      },
    });
    mockStripe.balanceTransactions.retrieve.mockResolvedValue({ fee: 112 });

    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("stripe-signature", "sig_test_123")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_123" })));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe("processing");
    expect(updatedOrder.stripeChargeId).toBe("ch_123");
    expect(updatedOrder.stripeFee).toBe(1.12);
    expect(updatedOrder.customerNotified).toBe(true);
    expect(updatedOrder.ownerNotified).toBe(true);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.inventory).toBe(3);
    expect(updatedProduct.sales).toBe(2);

    const updatedCart = await Cart.findOne({ guestId: "guest_123" });
    expect(updatedCart.items).toHaveLength(0);

    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(sendOwnerNotification).toHaveBeenCalledTimes(1);
  });

  it("treats duplicate successful webhook deliveries as already processed", async () => {
    const product = await Product.create({
      name: "Processed Bow",
      price: 8,
      category: "sparkle",
      inventory: 7,
      sales: 1,
    });

    await Order.create({
      customerName: "Duplicate Customer",
      customerEmail: "duplicate@example.com",
      items: [
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          price: 8,
          cost: 1,
        },
      ],
      subtotal: 8,
      shippingCost: 6.99,
      tax: 1.05,
      total: 16.04,
      status: "processing",
      shippingAddress: {
        line1: "123 Main St",
        city: "Dallas",
        state: "TX",
        postalCode: "75001",
        country: "US",
      },
      stripePaymentIntentId: "pi_already_processed",
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_already_processed",
          metadata: { guestId: "guest_456" },
          charges: {
            data: [
              {
                id: "ch_dup",
                amount_captured: 1604,
              },
            ],
          },
        },
      },
    });

    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("stripe-signature", "sig_test_456")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_dup" })));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, message: "Already processed" });

    const unchangedProduct = await Product.findById(product._id);
    expect(unchangedProduct.inventory).toBe(7);
    expect(unchangedProduct.sales).toBe(1);
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(sendOwnerNotification).not.toHaveBeenCalled();
  });

  it("rejects webhook requests with invalid signatures", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("stripe-signature", "sig_bad")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_bad" })));

    expect(res.status).toBe(400);
    expect(res.text).toContain("Webhook Error: Invalid signature");
  });
});

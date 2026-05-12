process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_123";

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
jest.mock("../services/shippoService", () => ({
  getRatesForOrder: jest.fn(),
  selectCheckoutRate: jest.fn(),
}));
jest.mock("../logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const {
  getRatesForOrder,
  selectCheckoutRate,
} = require("../services/shippoService");

describe("Stripe payment intent route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRatesForOrder.mockResolvedValue({
      shipmentId: "shippo_shipment_123",
      rates: [
        {
          id: "shippo_rate_123",
          shipmentId: "shippo_shipment_123",
          rateKey: "USPS|usps_ground_advantage|8.75|USD",
          provider: "USPS",
          service: "Ground Advantage",
          serviceToken: "usps_ground_advantage",
          amount: 8.75,
          currency: "USD",
          estimatedDays: 3,
          durationTerms: "Delivery in 2 to 5 business days",
          attributes: ["CHEAPEST"],
        },
      ],
    });
    selectCheckoutRate.mockResolvedValue({
      shipmentId: "shippo_shipment_123",
      rate: {
        id: "shippo_rate_123",
        shipmentId: "shippo_shipment_123",
        rateKey: "USPS|usps_ground_advantage|8.75|USD",
        provider: "USPS",
        service: "Ground Advantage",
        serviceToken: "usps_ground_advantage",
        amount: 8.75,
        currency: "USD",
        estimatedDays: 3,
        durationTerms: "Delivery in 2 to 5 business days",
        attributes: ["CHEAPEST"],
      },
    });
  });

  it("returns Shippo shipping rates for the current guest cart", async () => {
    const product = await Product.create({
      name: "Test Sparkle Bow",
      price: 10,
      category: "sparkle",
      inventory: 10,
    });

    await Cart.create({
      guestId: "guest_rates",
      items: [{ productId: product._id, quantity: 2 }],
    });

    const res = await request(app)
      .post("/api/stripe/shipping-rates")
      .set("Cookie", "guestId=guest_rates")
      .send({
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        shippingInfo: {
          name: "Test Customer",
          line1: "123 Main St",
          city: "Dallas",
          state: "TX",
          postalCode: "75001",
          country: "US",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      shipmentId: "shippo_shipment_123",
      subtotal: 20,
      rates: [
        expect.objectContaining({
          id: "shippo_rate_123",
          amount: 8.75,
          provider: "USPS",
        }),
      ],
    });
    expect(getRatesForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        items: [
          expect.objectContaining({
            name: "Test Sparkle Bow",
            quantity: 2,
            price: 10,
          }),
        ],
      }),
    );
  });

  it("creates a payment intent and pending order for a guest cart", async () => {
    const product = await Product.create({
      name: "Test Sparkle Bow",
      price: 10,
      category: "sparkle",
      inventory: 10,
      materialCost: 2,
    });

    await Cart.create({
      guestId: "guest_123",
      items: [{ productId: product._id, quantity: 2 }],
    });

    mockStripe.tax.calculations.create.mockResolvedValue({
      id: "taxcalc_123",
      tax_amount_exclusive: 150,
      amount_total: 3025,
      tax_breakdown: [
        {
          amount: 150,
          inclusive: false,
          taxable_amount: 2000,
          tax_rate_details: {
            tax_type: "sales_tax",
            percentage_decimal: "7.5",
            country: "US",
            state: "TX",
          },
          taxability_reason: "standard_rated",
        },
      ],
    });
    mockStripe.customers.create.mockResolvedValue({ id: "cus_123" });
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: "pi_123",
      client_secret: "pi_123_secret_abc",
    });

    const res = await request(app)
      .post("/api/stripe/create-payment-intent")
      .set("Cookie", "guestId=guest_123")
      .send({
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        selectedShippingRateId: "shippo_rate_123",
        selectedShippingRateKey: "USPS|usps_ground_advantage|8.75|USD",
        shippingInfo: {
          name: "Test Customer",
          line1: "123 Main St",
          city: "Dallas",
          state: "TX",
          postalCode: "75001",
          country: "US",
        },
        isGift: true,
        giftMessage: "Happy birthday!",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      clientSecret: "pi_123_secret_abc",
      subtotal: 20,
      shippingCost: 8.75,
      tax: 1.5,
      total: 30.25,
      shippingRate: expect.objectContaining({
        id: "shippo_rate_123",
        amount: 8.75,
      }),
    });

    expect(mockStripe.tax.calculations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "usd",
        customer_details: expect.objectContaining({
          address_source: "shipping",
        }),
        shipping_cost: expect.objectContaining({
          amount: 875,
        }),
        line_items: [
          expect.objectContaining({
            amount: 2000,
            quantity: 2,
            reference: product._id.toString(),
            tax_behavior: "exclusive",
          }),
        ],
      }),
      expect.any(Object),
    );

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3025,
        currency: "usd",
        customer: "cus_123",
        receipt_email: "customer@example.com",
        metadata: expect.objectContaining({
          orderType: "checkout",
          userId: "",
          guestId: "guest_123",
          isGift: "true",
          giftMessage: "Happy birthday!",
          shippoShipmentId: "shippo_shipment_123",
          shippoRateId: "shippo_rate_123",
          shippingProvider: "USPS",
          shippingService: "Ground Advantage",
        }),
      }),
      expect.any(Object),
    );

    const order = await Order.findOne({ stripePaymentIntentId: "pi_123" });
    expect(order).not.toBeNull();
    expect(order.status).toBe("pending");
    expect(order.subtotal).toBe(20);
    expect(order.shippingCost).toBe(8.75);
    expect(order.tax).toBe(1.5);
    expect(order.total).toBe(30.25);
    expect(order.shippoShipmentId).toBe("shippo_shipment_123");
    expect(order.shippoRateId).toBe("shippo_rate_123");
    expect(order.carrier).toBe("USPS Ground Advantage");
    expect(order.isGift).toBe(true);
    expect(order.giftMessage).toBe("Happy birthday!");
    expect(order.stripeTaxCalculationId).toBe("taxcalc_123");
    expect(order.stripeTaxBreakdown).toHaveLength(1);
  });

  it("rejects checkout when cart inventory is insufficient", async () => {
    const product = await Product.create({
      name: "Low Stock Bow",
      price: 12,
      category: "sparkle",
      inventory: 1,
    });

    await Cart.create({
      guestId: "guest_low_stock",
      items: [{ productId: product._id, quantity: 2 }],
    });

    const res = await request(app)
      .post("/api/stripe/create-payment-intent")
      .set("Cookie", "guestId=guest_low_stock")
      .send({
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        selectedShippingRateId: "shippo_rate_123",
        shippingInfo: {
          line1: "123 Main St",
          city: "Dallas",
          state: "TX",
          postalCode: "75001",
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Not enough stock for Low Stock Bow" });
    expect(mockStripe.tax.calculations.create).not.toHaveBeenCalled();
    expect(await Order.countDocuments()).toBe(0);
  });
});

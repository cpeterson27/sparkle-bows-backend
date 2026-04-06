const axios = require("axios");

const SHIPPO_API_BASE = "https://api.goshippo.com";
const SHIPPO_API_VERSION = "2018-02-08";

function getShippoHeaders() {
  const token = (process.env.SHIPPO_API_TOKEN || "").trim();

  if (!token) {
    throw new Error("Shippo is not configured. Add SHIPPO_API_TOKEN to the backend environment.");
  }

  return {
    Authorization: `ShippoToken ${token}`,
    "Content-Type": "application/json",
    "SHIPPO-API-VERSION": SHIPPO_API_VERSION,
  };
}

function getEnvNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildFromAddress() {
  const country = (process.env.SHIPPO_FROM_COUNTRY || "US").trim();
  const line1 = (process.env.SHIPPO_FROM_LINE1 || "").trim();
  const city = (process.env.SHIPPO_FROM_CITY || "").trim();
  const state = (process.env.SHIPPO_FROM_STATE || "").trim();
  const zip = (process.env.SHIPPO_FROM_ZIP || "").trim();

  if (!line1 || !city || !state || !zip) {
    throw new Error(
      "Shippo origin address is incomplete. Set SHIPPO_FROM_LINE1, SHIPPO_FROM_CITY, SHIPPO_FROM_STATE, and SHIPPO_FROM_ZIP."
    );
  }

  return {
    name: (process.env.SHIPPO_FROM_NAME || "Sparkle Bows").trim(),
    company: (process.env.SHIPPO_FROM_COMPANY || "Sparkle Bows").trim(),
    street1: line1,
    street2: (process.env.SHIPPO_FROM_LINE2 || "").trim(),
    city,
    state,
    zip,
    country,
    phone: (process.env.SHIPPO_FROM_PHONE || "").trim() || undefined,
    email: (process.env.SHIPPO_FROM_EMAIL || process.env.OWNER_EMAIL || "").trim() || undefined,
  };
}

function buildToAddress(order) {
  const address = order.shippingAddress || {};

  if (!address.line1 || !address.city || !address.state || !address.postalCode) {
    throw new Error("Order is missing a complete shipping address.");
  }

  return {
    name: address.name || order.customerName,
    company: "",
    street1: address.line1,
    street2: address.line2 || "",
    city: address.city,
    state: address.state,
    zip: address.postalCode,
    country: address.country || "US",
    email: order.customerEmail || undefined,
  };
}

function buildParcel(order) {
  const itemCount = (order.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const weightOz =
    getEnvNumber("SHIPPO_BASE_WEIGHT_OZ", 4) +
    itemCount * getEnvNumber("SHIPPO_PER_ITEM_WEIGHT_OZ", 1.5);

  return {
    length: String(getEnvNumber("SHIPPO_PARCEL_LENGTH_IN", 10)),
    width: String(getEnvNumber("SHIPPO_PARCEL_WIDTH_IN", 8)),
    height: String(getEnvNumber("SHIPPO_PARCEL_HEIGHT_IN", 2)),
    distance_unit: "in",
    weight: String(Number(weightOz.toFixed(2))),
    mass_unit: "oz",
  };
}

async function createShipment(order) {
  const response = await axios.post(
    `${SHIPPO_API_BASE}/shipments`,
    {
      address_from: buildFromAddress(),
      address_to: buildToAddress(order),
      parcels: [buildParcel(order)],
      async: false,
      metadata: `Order ${order._id}`,
    },
    { headers: getShippoHeaders() },
  );

  return response.data;
}

function selectBestRate(shipment) {
  const rates = Array.isArray(shipment.rates) ? shipment.rates : [];
  if (!rates.length) {
    throw new Error("Shippo returned no rates for this order.");
  }

  const validRates = rates.filter((rate) => !rate.messages?.length);
  const candidateRates = validRates.length ? validRates : rates;

  return [...candidateRates].sort(
    (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
  )[0];
}

async function purchaseLabel(rateId, orderId) {
  const response = await axios.post(
    `${SHIPPO_API_BASE}/transactions`,
    {
      rate: rateId,
      async: false,
      label_file_type: "PDF_4x6",
      metadata: `Order ${orderId}`,
    },
    { headers: getShippoHeaders() },
  );

  return response.data;
}

async function buyLabelForOrder(order) {
  const shipment = await createShipment(order);
  const rate = selectBestRate(shipment);
  const transaction = await purchaseLabel(rate.object_id, order._id);

  if (transaction.status !== "SUCCESS") {
    const message =
      transaction.messages?.map((entry) => entry.text).filter(Boolean).join(" ") ||
      "Shippo did not return a successful label purchase.";
    throw new Error(message);
  }

  return {
    shipment,
    rate,
    transaction,
    purchasedLabelCost: Number(rate.amount || 0),
    purchasedLabelCurrency: String(rate.currency || "usd").toLowerCase(),
  };
}

module.exports = {
  buyLabelForOrder,
};

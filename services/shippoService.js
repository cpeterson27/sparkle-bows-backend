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

  if (!address.line1 || !address.city || !address.postalCode) {
    throw new Error("Order is missing a complete shipping address.");
  }

  const country = String(address.country || "US").trim().toUpperCase();
  if ((country === "US" || country === "CA") && !address.state) {
    throw new Error("Order is missing a state or province for the shipping address.");
  }

  return {
    name: address.name || order.customerName,
    company: "",
    street1: address.line1,
    street2: address.line2 || "",
    city: address.city,
    state: address.state || "",
    zip: address.postalCode,
    country,
    phone: address.phone || order.customerPhone || undefined,
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

function isInternationalShipment(order) {
  const fromCountry = String(process.env.SHIPPO_FROM_COUNTRY || "US").trim().toUpperCase();
  const toCountry = String(order.shippingAddress?.country || "US").trim().toUpperCase();
  return Boolean(toCountry && toCountry !== fromCountry);
}

async function createCustomsDeclaration(order) {
  const items = (order.items || []).map((item) => ({
    description: String(item.name || "Hair bow").slice(0, 95),
    quantity: Number(item.quantity || 1),
    net_weight: String(getEnvNumber("SHIPPO_PER_ITEM_WEIGHT_OZ", 1.5)),
    mass_unit: "oz",
    value_amount: String(Number(item.price || 0).toFixed(2)),
    value_currency: "USD",
    tariff_number: (process.env.SHIPPO_CUSTOMS_TARIFF_NUMBER || "").trim(),
    origin_country: (process.env.SHIPPO_CUSTOMS_ORIGIN_COUNTRY || "US").trim().toUpperCase(),
  }));

  const response = await axios.post(
    `${SHIPPO_API_BASE}/customs/declarations/`,
    {
      contents_type: "MERCHANDISE",
      non_delivery_option: "RETURN",
      certify: true,
      certify_signer: (process.env.SHIPPO_CUSTOMS_CERTIFY_SIGNER || process.env.SHIPPO_FROM_NAME || "Sparkle Bows").trim(),
      incoterm: (process.env.SHIPPO_CUSTOMS_INCOTERM || "DDU").trim().toUpperCase(),
      eel_pfc: (process.env.SHIPPO_CUSTOMS_EEL_PFC || "NOEEI_30_37_a").trim(),
      items,
      metadata: order._id ? `Order ${order._id}` : "Checkout quote",
    },
    { headers: getShippoHeaders() },
  );

  return response.data;
}

async function createShipment(order) {
  const payload = {
    address_from: buildFromAddress(),
    address_to: buildToAddress(order),
    parcels: [buildParcel(order)],
    async: false,
    metadata: order._id ? `Order ${order._id}` : "Checkout quote",
  };

  if (isInternationalShipment(order)) {
    const customsDeclaration = await createCustomsDeclaration(order);
    payload.customs_declaration = customsDeclaration.object_id;
  }

  const response = await axios.post(
    `${SHIPPO_API_BASE}/shipments/`,
    payload,
    { headers: getShippoHeaders() },
  );

  return response.data;
}

function rateHasErrors(rate) {
  return Array.isArray(rate.messages) && rate.messages.length > 0;
}

function buildRateKey(rate) {
  return [
    rate.provider || "",
    rate.servicelevel?.token || rate.servicelevel?.name || "",
    Number(rate.amount || 0).toFixed(2),
    String(rate.currency || "USD").toUpperCase(),
  ].join("|");
}

function formatRate(rate, shipmentId) {
  return {
    id: rate.object_id,
    shipmentId: shipmentId || rate.shipment || "",
    rateKey: buildRateKey(rate),
    provider: rate.provider || "Carrier",
    service: rate.servicelevel?.name || rate.servicelevel?.token || "Shipping",
    serviceToken: rate.servicelevel?.token || "",
    amount: Number(rate.amount || 0),
    currency: String(rate.currency || "USD").toUpperCase(),
    estimatedDays: rate.estimated_days ?? rate.days ?? null,
    durationTerms: rate.duration_terms || "",
    attributes: Array.isArray(rate.attributes) ? rate.attributes : [],
  };
}

function getUsableRates(shipment) {
  const rates = Array.isArray(shipment.rates) ? shipment.rates : [];
  if (!rates.length) {
    throw new Error("Shippo returned no rates for this order.");
  }

  const validRates = rates.filter(
    (rate) =>
      !rateHasErrors(rate) &&
      String(rate.currency || "").toUpperCase() === "USD" &&
      Number.isFinite(Number(rate.amount)),
  );

  if (!validRates.length) {
    throw new Error("Shippo did not return any usable USD shipping rates.");
  }

  return validRates.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
}

function selectBestRate(shipment) {
  return getUsableRates(shipment)[0];
}

async function getRatesForOrder(order) {
  const shipment = await createShipment(order);
  const rates = getUsableRates(shipment).map((rate) =>
    formatRate(rate, shipment.object_id),
  );

  return {
    shipmentId: shipment.object_id,
    rates,
    rawRates: getUsableRates(shipment),
  };
}

async function selectCheckoutRate(order, selectedRate) {
  const { shipmentId, rates, rawRates } = await getRatesForOrder(order);
  const selectedId = selectedRate?.id || selectedRate?.rateId;
  const selectedKey = selectedRate?.rateKey;
  const rawRate = rawRates.find(
    (rate) =>
      (selectedKey && buildRateKey(rate) === selectedKey) ||
      (selectedId && rate.object_id === selectedId),
  );

  if (!rawRate) {
    const err = new Error("Selected shipping option is no longer available. Please refresh shipping rates.");
    err.status = 400;
    throw err;
  }

  return {
    shipmentId,
    rate: formatRate(rawRate, shipmentId),
    rawRate,
    rates,
  };
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
  let shipment;
  let rate;

  if (order.shippoRateId) {
    const response = await axios.get(
      `${SHIPPO_API_BASE}/rates/${order.shippoRateId}`,
      { headers: getShippoHeaders() },
    );
    rate = response.data;
    shipment = { object_id: rate.shipment || order.shippoShipmentId || "" };
  } else {
    shipment = await createShipment(order);
    rate = selectBestRate(shipment);
  }

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
  getRatesForOrder,
  selectCheckoutRate,
};

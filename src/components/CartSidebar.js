import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  ArrowRight,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import StripeCheckoutForm from "./StripeCheckoutForm";
import ConfirmModal from "./ConfirmModal";
import api from "../api/axios.config";
import { trackBeginCheckout } from "../lib/analytics";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function CartSidebar({
  cart,
  cartTotal = 0,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  cartItemCount,
  user,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [checkoutTotals, setCheckoutTotals] = useState(null);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesSubtotal, setRatesSubtotal] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    name: user?.name || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    phone: user?.phone || "",
  });

  const defaultAddress =
    user?.addresses?.find((address) => address.isDefault) ||
    user?.addresses?.[0];
  const validCartItems = cart.filter((item) => item?.productId?._id);
  const selectedShippingAmount = Number(selectedShippingRate?.amount || 0);
  const estimatedTotal = cartTotal + selectedShippingAmount;
  const stripeOptions = useMemo(
    () => (clientSecret ? { clientSecret } : null),
    [clientSecret],
  );
  const cartRateSignature = useMemo(
    () =>
      validCartItems
        .map((item) => `${item.productId._id}:${item.quantity}`)
        .sort()
        .join("|"),
    [validCartItems],
  );

  useEffect(() => {
    setShippingForm({
      name: defaultAddress?.name || user?.name || "",
      line1: defaultAddress?.line1 || "",
      line2: defaultAddress?.line2 || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      postalCode: defaultAddress?.postalCode || "",
      country: defaultAddress?.country || "US",
      phone: user?.phone || "",
    });
  }, [defaultAddress, user?.name, user?.phone]);

  useEffect(() => {
    clearShippingRates();
  }, [cartRateSignature]);

  const clearShippingRates = () => {
    setShippingRates([]);
    setSelectedShippingRate(null);
    setRatesSubtotal(null);
    setCheckoutTotals(null);
    setClientSecret(null);
    setOrderId(null);
    setShowPayment(false);
  };

  const updateShippingField = (field, value) => {
    clearShippingRates();
    setShippingForm((current) => ({ ...current, [field]: value }));
  };

  const buildShippingInfo = () => ({
    name: shippingForm.name.trim(),
    line1: shippingForm.line1.trim(),
    line2: shippingForm.line2.trim(),
    city: shippingForm.city.trim(),
    state: shippingForm.state.trim(),
    postalCode: shippingForm.postalCode.trim(),
    country: (shippingForm.country || "US").trim().toUpperCase(),
    phone: shippingForm.phone.trim(),
  });

  const validateCheckoutDetails = () => {
    const country = (shippingForm.country || "US").trim().toUpperCase();

    if (!user) {
      return "Please sign in before checking out.";
    }

    if (
      !shippingForm.name ||
      !shippingForm.line1 ||
      !shippingForm.city ||
      !shippingForm.postalCode ||
      !country
    ) {
      return "Enter the full shipping details for the recipient before checkout.";
    }

    if ((country === "US" || country === "CA") && !shippingForm.state) {
      return "Enter the state or province before loading shipping options.";
    }

    if (country !== "US" && !shippingForm.phone) {
      return "Enter a phone number for international shipping.";
    }

    return "";
  };

  const handleLoadShippingRates = async () => {
    setError("");
    const validationError = validateCheckoutDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setRatesLoading(true);
    clearShippingRates();

    try {
      const res = await api.post("/api/stripe/shipping-rates", {
        customerName: user.name,
        customerEmail: user.email,
        shippingInfo: buildShippingInfo(),
      });
      const rates = Array.isArray(res.data?.rates) ? res.data.rates : [];

      if (!rates.length) {
        setError("No shipping options were returned for this address.");
        return;
      }

      setShippingRates(rates);
      setSelectedShippingRate(rates[0]);
      setRatesSubtotal(Number(res.data?.subtotal || cartTotal));
    } catch (ratesError) {
      console.error("Shipping rates error:", ratesError);
      setError(
        ratesError.response?.data?.error ||
          "Could not load shipping options. Please review the address and try again.",
      );
    } finally {
      setRatesLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    const validationError = validateCheckoutDetails();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    if (!selectedShippingRate) {
      setError("Choose a shipping option before continuing to payment.");
      setLoading(false);
      return;
    }

    try {
      trackBeginCheckout(cart, {
        total: estimatedTotal,
        cartTotal,
        shipping: selectedShippingAmount,
      });

      const res = await api.post("/api/stripe/create-payment-intent", {
        customerName: user.name,
        customerEmail: user.email,
        shippingInfo: buildShippingInfo(),
        selectedShippingRateId: selectedShippingRate.id,
        selectedShippingRateKey: selectedShippingRate.rateKey,
        isGift,
        giftMessage: giftMessage.trim(),
      });

      if (!res.data?.clientSecret) {
        setError("Failed to start checkout. Please try again.");
        return;
      }

      setClientSecret(res.data.clientSecret);
      setOrderId(res.data.orderId || null);
      setCheckoutTotals({
        subtotal: Number(res.data.subtotal || cartTotal),
        shippingCost: Number(res.data.shippingCost || 0),
        tax: Number(res.data.tax || 0),
        total: Number(res.data.total || estimatedTotal),
        shippingRate: res.data.shippingRate || selectedShippingRate,
      });
      setShowPayment(true);
    } catch (checkoutError) {
      console.error("Checkout error:", checkoutError);
      setError(
        checkoutError.response?.data?.error ||
          "Checkout failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/45 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-[#fcfaf7] shadow-2xl">
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                <ShoppingBag className="h-3.5 w-3.5" />
                Cart
              </div>
              <h2 className="mt-3 font-serif text-3xl text-slate-950">
                Your order
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {cartItemCount} item{cartItemCount === 1 ? "" : "s"} selected
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-rose-300 hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {validCartItems.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 font-serif text-3xl text-slate-950">
                Your cart is empty
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Add a few bows to start building a polished order.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : showPayment && clientSecret && stripeOptions ? (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                  Shipping to
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {shippingForm.name}
                  <br />
                  {shippingForm.line1}
                  {shippingForm.line2 ? `, ${shippingForm.line2}` : ""}
                  <br />
                  {shippingForm.city}, {shippingForm.state}{" "}
                  {shippingForm.postalCode}
                  <br />
                  {(shippingForm.country || "US").toUpperCase()}
                </p>
              </div>

              {isGift && giftMessage ? (
                <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Gift message
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {giftMessage}
                  </p>
                </div>
              ) : null}

              {checkoutTotals ? (
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                    Final total
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>${checkoutTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="text-right">
                        <span className="block">
                          {checkoutTotals.shippingCost === 0
                            ? "Free"
                            : `$${checkoutTotals.shippingCost.toFixed(2)}`}
                        </span>
                        {checkoutTotals.shippingRate ? (
                          <span className="block text-xs text-slate-400">
                            {checkoutTotals.shippingRate.provider}{" "}
                            {checkoutTotals.shippingRate.service}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sales tax</span>
                      <span>${checkoutTotals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                      <span>Total due</span>
                      <span>${checkoutTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeCheckoutForm
                  clientSecret={clientSecret}
                  onSuccess={() => {
                    onClose();
                    if (orderId) {
                      navigate(`/thank-you/${orderId}`);
                    }
                  }}
                />
              </Elements>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <input
                    id="gift-order"
                    type="checkbox"
                    checked={isGift}
                    onChange={(event) => setIsGift(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                  />
                  <div>
                    <label
                      htmlFor="gift-order"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                    >
                      <Gift className="h-4 w-4 text-rose-500" />
                      This order is a gift
                    </label>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Send the bow directly to the recipient and include a gift note for the package.
                    </p>
                  </div>
                </div>

                {isGift ? (
                  <div className="mt-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Gift note
                      </span>
                      <textarea
                        value={giftMessage}
                        onChange={(event) => setGiftMessage(event.target.value)}
                        maxLength={250}
                        className="h-28 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                        placeholder="Add a short message for the recipient."
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                  Shipping address
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Review the shipping details below. For gifts, enter the recipient’s name and delivery address here.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Recipient name
                    </span>
                    <input
                      type="text"
                      value={shippingForm.name}
                      onChange={(event) =>
                        updateShippingField("name", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Recipient full name"
                      autoComplete="shipping name"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Address line 1
                    </span>
                    <input
                      type="text"
                      value={shippingForm.line1}
                      onChange={(event) =>
                        updateShippingField("line1", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Street address"
                      autoComplete="shipping address-line1"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Address line 2
                    </span>
                    <input
                      type="text"
                      value={shippingForm.line2}
                      onChange={(event) =>
                        updateShippingField("line2", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Apartment, suite, unit, etc. (optional)"
                      autoComplete="shipping address-line2"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      City
                    </span>
                    <input
                      type="text"
                      value={shippingForm.city}
                      onChange={(event) =>
                        updateShippingField("city", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="City"
                      autoComplete="shipping address-level2"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      State / province
                    </span>
                    <input
                      type="text"
                      value={shippingForm.state}
                      onChange={(event) =>
                        updateShippingField("state", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="State or province"
                      autoComplete="shipping address-level1"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Postal code
                    </span>
                    <input
                      type="text"
                      value={shippingForm.postalCode}
                      onChange={(event) =>
                        updateShippingField("postalCode", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Postal code"
                      autoComplete="shipping postal-code"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Country
                    </span>
                    <input
                      type="text"
                      value={shippingForm.country}
                      onChange={(event) =>
                        updateShippingField("country", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="US"
                      autoComplete="shipping country"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Phone
                    </span>
                    <input
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(event) =>
                        updateShippingField("phone", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Required for international shipping"
                      autoComplete="shipping tel"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                      Shipping options
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Rates are quoted from Shippo for the delivery address above.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadShippingRates}
                    disabled={ratesLoading}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                  >
                    {ratesLoading
                      ? "Loading rates..."
                      : shippingRates.length
                        ? "Refresh rates"
                        : "Load rates"}
                  </button>
                </div>

                {shippingRates.length ? (
                  <div className="mt-5 space-y-3">
                    {shippingRates.map((rate) => {
                      const isSelected =
                        selectedShippingRate?.rateKey === rate.rateKey ||
                        selectedShippingRate?.id === rate.id;
                      return (
                        <label
                          key={rate.rateKey || rate.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-rose-300 bg-rose-50"
                              : "border-slate-200 bg-slate-50 hover:border-rose-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping-rate"
                            checked={isSelected}
                            onChange={() => setSelectedShippingRate(rate)}
                            className="mt-1 h-4 w-4 border-slate-300 text-rose-500 focus:ring-rose-400"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-950">
                              {rate.provider} {rate.service}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {rate.estimatedDays
                                ? `${rate.estimatedDays} business day${
                                    Number(rate.estimatedDays) === 1 ? "" : "s"
                                  }`
                                : rate.durationTerms || "Carrier delivery estimate"}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-slate-950">
                            ${Number(rate.amount || 0).toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    Enter the shipping address, then load live carrier rates before payment.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {validCartItems.map((item) => (
                  <article
                    key={item.productId._id}
                    className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.productId.images?.[0]?.url}
                        alt={item.productId.images?.[0]?.alt || item.productId.name}
                        className="h-24 w-24 rounded-2xl object-cover"
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {item.productId.category || "Signature bow"}
                            </p>
                            <h3 className="mt-1 font-semibold text-slate-950">
                              {item.productId.name}
                            </h3>
                            <p className="mt-2 text-sm font-medium text-slate-600">
                              ${Number(item.productId.price || 0).toFixed(2)} each
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setItemToRemove({
                                id: item.productId._id,
                                name: item.productId.name,
                              })
                            }
                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(item.productId._id, item.quantity - 1)
                              }
                              className="rounded-full p-2 text-slate-700 transition hover:bg-white"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-10 text-center text-sm font-semibold text-slate-950">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(item.productId._id, item.quantity + 1)
                              }
                              className="rounded-full p-2 text-slate-700 transition hover:bg-white"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-base font-semibold text-slate-950">
                            ${(Number(item.productId.price || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                  Order summary
                </p>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${Number(ratesSubtotal || cartTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="text-right">
                      {selectedShippingRate ? (
                        <>
                          <span className="block">
                            ${selectedShippingAmount.toFixed(2)}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {selectedShippingRate.provider}{" "}
                            {selectedShippingRate.service}
                          </span>
                        </>
                      ) : (
                        "Select a rate"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Estimated tax</span>
                    <span>Calculated after rate selection</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                    <span>Total before tax</span>
                    <span>
                      {selectedShippingRate
                        ? `$${estimatedTotal.toFixed(2)}`
                        : `$${cartTotal.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                    <p className="mt-2 font-semibold text-slate-950">Secure payment</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <Truck className="h-4 w-4 text-rose-500" />
                    <p className="mt-2 font-semibold text-slate-950">Tracked shipping</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <PackageCheck className="h-4 w-4 text-rose-500" />
                    <p className="mt-2 font-semibold text-slate-950">Gift-ready packaging</p>
                  </div>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || !selectedShippingRate}
                  className="mt-6 w-full rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                >
                  {loading
                    ? "Preparing checkout..."
                    : selectedShippingRate
                      ? "Proceed to secure checkout"
                      : "Select shipping to continue"}
                </button>

                {!user ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Sign in first so we can connect your order to your account.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {itemToRemove ? (
        <ConfirmModal
          title="Remove Item?"
          message={`Remove "${itemToRemove.name}" from this order?`}
          confirmText="Remove"
          cancelText="Keep item"
          confirmVariant="danger"
          onConfirm={() => {
            onRemoveItem(itemToRemove.id);
            setItemToRemove(null);
          }}
          onCancel={() => setItemToRemove(null)}
        />
      ) : null}
    </div>
  );
}

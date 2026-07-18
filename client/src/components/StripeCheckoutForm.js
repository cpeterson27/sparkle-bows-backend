import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#0f172a",
      fontFamily: "Manrope, system-ui, sans-serif",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

export default function StripeCheckoutForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed. Please try again.");
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess?.(result.paymentIntent);
      }
    } catch (submissionError) {
      console.error("Stripe error:", submissionError);
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
          Payment details
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <ShieldCheck className="h-4 w-4 text-rose-500" />
          <p className="mt-2 font-semibold text-slate-900">Secure checkout</p>
          <p className="mt-1 leading-6">
            Your card details are handled by Stripe.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-rose-500" />
          <p className="mt-2 font-semibold text-slate-900">Order tracking</p>
          <p className="mt-1 leading-6">
            You will receive updates as your order moves through fulfillment.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
      >
        {processing ? "Processing payment..." : "Complete secure payment"}
      </button>
    </form>
  );
}

import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import api from "../api/axios.config";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#32325d",
      "::placeholder": { color: "#a0aec0" },
    },
    invalid: {
      color: "#fa755a",
    },
  },
};

export default function StripeCheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) return;

    try {
      // Create payment intent on server
      const { data } = await api.post("/api/stripe/create-payment-intent");

      const clientSecret = data.clientSecret;

      // Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess(result.paymentIntent);
      }
    } catch (err) {
      console.error("Stripe error:", err);
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={CARD_ELEMENT_OPTIONS} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-pink-600 text-white py-2 font-bold rounded"
      >
        {processing ? "Processing…" : "Pay Now"}
      </button>
    </form>
  );
}

import React, { useState } from "react";
import { Heart, ShoppingCart, Plus, Minus } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "./StripeCheckoutForm"; // Stripe form component you added
import api from "../api/axios.config";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function CartSidebar({
  cart,
  cartTotal,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  cartItemCount,
  user,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Called when user clicks Checkout
  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    // Must be logged in before checking out
    if (!user) {
      setError("Please log in to checkout");
      setLoading(false);
      return;
    }

    try {
      // Ask backend for a Stripe PaymentIntent client secret
      const res = await api.post("/api/stripe/create-payment-intent");

      const { clientSecret } = res.data;
      if (!clientSecret) {
        setError("Failed to start checkout. Please try again.");
        setLoading(false);
        return;
      }

      setClientSecret(clientSecret);
      setShowPayment(true);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err.response?.data?.error || "Checkout failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-end"
      style={{ zIndex: 100000 }}
    >
      <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-pink-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-pink-600">Your Cart</h2>
            {cart.length > 0 && (
              <span className="absolute -top-2 left-14 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty!</p>
              <p className="text-sm text-gray-400 mt-2">
                Add some sparkly bows! ✨
              </p>
            </div>
          ) : showPayment && clientSecret ? (
            /* Stripe Payment Form */
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCheckoutForm
                cart={cart}
                cartTotal={cartTotal}
                onSuccess={() => {
                  /* you can optionally handle post‑success UI here */
                }}
              />
            </Elements>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-6 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.productId._id}
                    className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200"
                  >
                    <div className="flex gap-4 items-start">
                      {/* Thumbnail */}
                      <img
                        src={item.productId.images?.[0]?.url}
                        alt={
                          item.productId.images?.[0]?.alt ||
                          item.productId.name
                        }
                        className="w-20 h-20 rounded-lg object-cover"
                      />

                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-gray-800">
                          {item.productId.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.productId._id,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="text-pink-600 font-bold w-8 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.productId._id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onRemoveItem(item.productId._id)}
                            className="bg-red-300 hover:bg-red-400 text-white font-semibold text-sm px-3 py-1 rounded-full shadow transition-all ml-auto"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="text-gray-700 text-sm">
                          Item Total:{" "}
                          <span className="font-semibold">
                            ${(item.productId.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Grand Total & Checkout Button */}
              <div className="border-t-2 border-pink-300 pt-6">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800 mb-4">
                  <span>Grand Total:</span>
                  <span className="text-pink-600 text-2xl">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Checkout 💖"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

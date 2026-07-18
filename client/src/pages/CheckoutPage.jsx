import React from "react";
import { useNavigate } from "react-router-dom";
import StripeCheckoutForm from "../components/StripeCheckoutForm";
import { ShoppingCart } from "lucide-react";

export default function CheckoutPage({ cart, cartTotals, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();
  const { subtotal = 0, shippingCost = 0, tax = 0, grandTotal = 0 } = cartTotals || {};

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/shop")}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.productId._id} className="border-b pb-6 last:border-b-0">
                  <div className="flex gap-4">
                    <img
                      src={item.productId.images?.[0]?.url}
                      alt={item.productId.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.productId.name}</h3>
                      <p className="text-pink-600 font-bold">
                        ${item.productId.price?.toFixed(2)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => onUpdateQuantity(item.productId._id, item.quantity - 1)}
                          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId._id, item.quantity + 1)}
                          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.productId._id)}
                          className="ml-auto text-red-600 hover:text-red-700 font-bold text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${(item.productId.price * item.quantity)?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Total</h2>

            <div className="space-y-4 pb-6 border-b">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-4">
                <span>Total</span>
                <span className="text-pink-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Stripe Form */}
          <StripeCheckoutForm amount={grandTotal} cart={cart} />
        </div>
      </div>
    </div>
  );
}

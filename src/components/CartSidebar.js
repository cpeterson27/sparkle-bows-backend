import React, { useState } from 'react';
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api'; // Add this import

export default function CartSidebar({ cart, cartTotal, onClose, onUpdateQuantity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to checkout');
        setLoading(false);
        return;
      }

      // Send cart data to backend to create Stripe checkout session
      const response = await axios.post(
        `${API_URL}/api/checkout`,
        {
          items: cart.map(item => ({
            productId: item._id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end" style={{ zIndex: 100000 }}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-pink-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-pink-600">Your Cart</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty!</p>
              <p className="text-sm text-gray-400 mt-2">Add some sparkly bows! ✨</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item._id} className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200">
                    <div className="flex gap-4">
                      <img src={item.images[0]} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-pink-600 font-bold mb-2">${item.price} each</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-pink-600 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-gray-600 ml-auto">
                            ${(item.price * item.quantity).toFixed(2)}
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
              
              <div className="border-t-2 border-pink-300 pt-6">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800 mb-6">
                  <span>Total:</span>
                  <span className="text-pink-600 text-2xl">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Checkout 💖'}
                </button>
                <p className="text-xs text-gray-500 text-center">
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
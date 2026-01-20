import React, { useState, useContext } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import api from "../api/axios.config";
import { AuthContext } from "../context/AuthContext";

export default function LoginModal({ onClose, onLogin }) {
  const { loginUser } = useContext(AuthContext);

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup
        ? "/api/auth/signup"
        : "/api/auth/login";

      const body = isSignup
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      // First call signup/login to set cookie on server
      await api.post(endpoint, body, {
        withCredentials: true, // necessary to store refresh cookie
      });

      // Then authenticate in context (gets access token + user)
      await loginUser({
        email: formData.email,
        password: formData.password,
      });

      // Call optional callback after successful login/signup
      if (onLogin) onLogin();

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-4 border-pink-300 relative animate-in zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="cursor-pointer absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6 text-center">
          {isSignup ? "Create Account" : "Welcome Back!"}
        </h2>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
              required
              autoComplete="name"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
            required
            minLength={6}
            autoComplete="current-password"
          />

          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Street Address (optional)"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
                autoComplete="street-address"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
                  autoComplete="address-level2"
                />

                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border‑pink‑500 focus:outline-none transition-colors uppercase"
                  autoComplete="address-level1"
                />

                <input
                  type="text"
                  placeholder="Zip"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border‑pink‑500 focus:outline-none transition-colors"
                  autoComplete="postal-code"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Loading..."
              : isSignup
              ? "Sign Up 🎀"
              : "Log In ✨"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
          }}
          className="cursor-pointer w-full text-pink-600 hover:text-pink-700 font-bold mt-4 transition-colors"
        >
          {isSignup
            ? "Already have an account? Log In"
            : "Don't have an account? Sign Up"}
        </button>

        <button
          onClick={onClose}
          className="cursor-pointer w-full text-gray-500 hover:text-gray-700 mt-2 transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
}

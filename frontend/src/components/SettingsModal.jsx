import React, { useState, useContext } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function SettingsModal({ onClose }) {
  const { user, updateUserProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zipCode: user?.zipCode || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile(formData);
      // Call updateUserProfile from context
      const updatedUser = await updateUserProfile(formData);
      updateUserProfile(updatedUser);
      // Show success message
      setSuccess(true);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 10000000 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] w-full max-w-lg border-4 border-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-6 border-b-2 border-black">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-pink-600 uppercase italic">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="border-2 border-black rounded-full p-1 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-pink-300 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-bold text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-pink-300 rounded-xl p-3">
              <p className="text-green-700 font-black text-sm">
                ✨ Profile updated successfully!
              </p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold"
              required
            />
          </div>

          {/* Address Field */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, Apt 4"
              className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold"
            />
          </div>

          {/* City, State, Zip Row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-black text-xs uppercase mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-black text-xs uppercase mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NE"
                maxLength="2"
                className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-black text-xs uppercase mb-1">
                Zip
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="68134"
                maxLength="10"
                className="w-full px-3 py-2 border-2 border-pink-300 rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-500 text-white border-2 border-black py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[0_4px_0_#000] hover:translate-y-[1px] hover:shadow-[0_2px_0_#000] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById("modal-root");
  return modalRoot ? createPortal(modal, modalRoot) : null;
}

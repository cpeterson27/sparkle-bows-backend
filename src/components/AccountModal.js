import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Settings, Star, LogOut } from "lucide-react";
import { logoutUser as apiLogout } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import SettingsModal from "./SettingsModal";

export default function AccountModal({
  orders = [],
  userReviews = [],
  onClose,
  onUpdateReview,
  onDeleteReview,
}) {
  const { user, logoutUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("reviews");
  const [showSettings, setShowSettings] = useState(false);

  const handleLogoutClick = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error(err);
    }
    logoutUser();
    onClose();
  };

  const modal = (
    <>
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-lg border-4 border-pink-300 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="p-6 border-b-2 border-pink-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-pink-600 uppercase italic">
                My Account
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* USER INFO */}
            <div className="flex justify-between items-center bg-pink-50 p-4 rounded-2xl border-2 border-pink-300 mb-4">
              <div className="overflow-hidden">
                <p className="font-black">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="flex items-center gap-1 text-pink-600 text-[11px] font-black uppercase mt-1">
                  <MapPin size={12} />
                  {user?.address
                    ? `${user.address}${user.city ? `, ${user.city}` : ""}${user.state ? `, ${user.state}` : ""} ${user.zipCode || ""}`
                    : "Add Address"}
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="text-pink-600 hover:text-pink-700 transition-colors p-2 hover:bg-pink-100 rounded-full"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* TABS */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 py-2 font-black rounded-xl border-2 border-pink-300 ${
                  activeTab === "orders"
                    ? "bg-gray-200"
                    : "bg-white shadow-[0_4px_0_rgba(236,72,153,0.3)]"
                }`}
              >
                ORDERS
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-2 font-black rounded-xl border-2 border-pink-300 ${
                  activeTab === "reviews"
                    ? "bg-pink-500 text-white translate-y-1 shadow-none"
                    : "bg-white shadow-[0_4px_0_rgba(236,72,153,0.3)]"
                }`}
              >
                REVIEWS ({userReviews.length})
              </button>
            </div>
          </div>

          {/* SCROLL AREA — EXACTLY 3 REVIEWS TALL */}
          <div className="border-b-2 border-pink-200 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: "260px" }}>
            <div className="px-6 py-4 space-y-4">
              {activeTab === "orders" ? (
                orders.length === 0 ? (
                  <p className="text-center text-gray-400 font-bold italic">
                    No orders yet 🎀
                  </p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border-2 border-pink-300 rounded-xl p-3 font-bold"
                    >
                      Order #{order.id}
                    </div>
                  ))
                )
              ) : userReviews.length === 0 ? (
                <p className="text-center text-gray-400 font-bold italic">
                  No reviews yet ✨
                </p>
              ) : (
                userReviews.map((review) => (
                  <ReviewRow
                    key={review._id}
                    review={review}
                    onUpdateReview={onUpdateReview}
                    onDeleteReview={onDeleteReview}
                  />
                ))
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6">
            <button
              onClick={handleLogoutClick}
              className="w-full border-2 border-pink-300 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(236,72,153,0.3)] hover:bg-gray-50 active:translate-y-1 active:shadow-none"
            >
              <LogOut size={18} /> LOG OUT
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );

  const modalRoot = document.getElementById("modal-root");
  return modalRoot ? createPortal(modal, modalRoot) : null;
}

/* ================= REVIEW ROW ================= */

function ReviewRow({ review, onUpdateReview, onDeleteReview }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(review.text);
  const [rating, setRating] = useState(review.rating);

  return (
    <div className="border-2 border-pink-300 rounded-2xl p-4 bg-pink-50 shadow-[2px_2px_0_rgba(236,72,153,0.3)]">
      <p className="font-black text-pink-600 uppercase italic text-sm mb-1">
        {review.productName}
      </p>

      {/* STAR RATING */}
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <Star
            key={num}
            size={14}
            className="cursor-pointer"
            fill={num <= rating ? "#ec4899" : "none"}
            stroke="#ec4899"
            onClick={() => isEditing && setRating(num)}
          />
        ))}
      </div>

      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="w-full border-2 border-pink-300 rounded-xl p-2 text-sm mb-2"
        />
      ) : (
        <p className="text-sm font-bold italic mb-3">"{review.text}"</p>
      )}

      <div className="flex gap-2">
        {isEditing ? (
          <button
            onClick={() => {
              onUpdateReview(review._id, review.productId, text, rating);
              setIsEditing(false);
            }}
            className="px-4 py-1 border-2 border-pink-300 rounded-lg font-black text-[10px] bg-pink-500 text-white"
          >
            SAVE
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1 border-2 border-pink-300 rounded-lg font-black text-[10px]"
          >
            EDIT
          </button>
        )}
        <button
          onClick={() => onDeleteReview(review._id, review.productId)}
          className="px-4 py-1 border-2 border-pink-300 rounded-lg font-black text-[10px] text-gray-400"
        >
          DELETE
        </button>
      </div>
    </div>
  );
}
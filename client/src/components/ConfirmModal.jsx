// src/components/ConfirmModal.js
import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // "danger" | "primary"
  onConfirm,
  onCancel,
}) {
  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 z-[10000]"
      style={{ zIndex: 999999 }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center border-4 border-pink-300 relative animate-in zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="cursor-pointer absolute -top-4 -right-4 bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-pink-500" />
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>

        <p className="text-gray-700 text-lg mb-6">{message}</p>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className={`cursor-pointer font-bold px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 ${
              confirmVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {confirmText}
          </button>

          <button
            onClick={onCancel}
            className="bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-800 font-bold px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
}

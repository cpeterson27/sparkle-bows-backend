// src/components/ContactModal.js
import React, { useState } from "react";
import { createPortal } from "react-dom";
import emailjs from "@emailjs/browser";
import { X, Send, Sparkles } from "lucide-react";

export default function ContactModal({ onClose }) {
  const [formData, setFormData] = useState({
    from_name: "",
    from_email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await emailjs.send(
        "service_fpb3uf8",
        "template_bstlqom",
        formData,
        "KwTSsw-V2pEjvsn8I"
      );

      setSent(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send message. Please try again!");
      setSending(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 z-[10000]"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      {/* SUCCESS STATE */}
      {sent ? (
        <div
          className="bg-white rounded-3xl p-12 shadow-2xl max-w-md w-full text-center border-4 border-pink-300 animate-in zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-2xl font-bold text-pink-600 mb-2">
            Message Sent!
          </h3>
          <p className="text-gray-600">
            We'll get back to you soon! 💖
          </p>
        </div>
      ) : (
        /* FORM STATE */
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-4 border-pink-300 relative animate-in zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="cursor-pointer absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2 text-center">
              Contact Us! 💌
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Have questions about our sparkly bows? Send us a message!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-pink-600 font-bold mb-2">
                  Your Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.from_name}
                  onChange={(e) =>
                    setFormData({ ...formData, from_name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 outline-none"
                  placeholder="Princess Sparkle"
                />
              </div>

              <div>
                <label className="block text-pink-600 font-bold mb-2">
                  Your Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.from_email}
                  onChange={(e) =>
                    setFormData({ ...formData, from_email: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 outline-none"
                  placeholder="sparkle@example.com"
                />
              </div>

              <div>
                <label className="block text-pink-600 font-bold mb-2">
                  Your Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 outline-none h-32 resize-none"
                  placeholder="Tell us what's on your mind! ✨"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="cursor-pointer w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
}

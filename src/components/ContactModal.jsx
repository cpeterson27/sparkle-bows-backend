import React, { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Sparkles } from "lucide-react";
import { sendContactMessage } from "../api/contact";
import { AuthContext } from "../context/AuthContext";
import { trackGenerateLead } from "../lib/analytics";
import {
  createFormProtectionState,
  getProtectedFormPayload,
} from "../lib/formProtection";

export default function ContactModal({ onClose }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [formProtection, setFormProtection] = useState(createFormProtectionState);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      name: user?.name || current.name,
      email: user?.email || current.email,
    }));
  }, [user?.name, user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      await sendContactMessage(getProtectedFormPayload(formData, formProtection));
      trackGenerateLead({
        formName: "contact_modal",
        leadType: "contact",
      });
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (submissionError) {
      console.error("Error sending contact message:", submissionError);
      setError(
        submissionError.response?.data?.error ||
          "We could not send your message right now. Please try again.",
      );
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
          className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-12 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="mx-auto mb-4 h-16 w-16 text-rose-500" />
          <h3 className="mb-2 text-2xl font-semibold text-slate-950">
            Message Sent!
          </h3>
          <p className="text-sm leading-7 text-slate-600">
            Your note went straight to Sparkle Bows support. You can also expect a reply at the email address you entered.
          </p>
        </div>
      ) : (
        <div
          className="relative w-full max-w-xl rounded-[32px] border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-rose-300 hover:text-slate-950"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
              Contact Sparkle Bows
            </p>
            <h2 className="mt-4 font-serif text-4xl text-slate-950">How can we help?</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
              Contact us for order support, product questions, gifting guidance, or wholesale inquiries. Messages are delivered directly to the Sparkle Bows support inbox.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <input
                type="text"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                value={formProtection.website}
                onChange={(e) =>
                  setFormProtection((current) => ({
                    ...current,
                    website: e.target.value,
                  }))
                }
                className="hidden"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Your name
                  </span>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Your email
                  </span>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Subject
                  </span>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    placeholder="Question about my order"
                    maxLength={120}
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Message
                  </span>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="h-36 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    placeholder="Tell us what you need and we’ll get back to you as soon as we can."
                    minLength={10}
                    maxLength={5000}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                This message goes directly to your support inbox and includes the customer’s reply-to email so you can answer them professionally.
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
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

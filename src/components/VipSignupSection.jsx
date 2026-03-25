import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createLead } from "../api/leads";

// ✅ Handles VIP signup with consent compliance
export default function VipSignupSection({ user }) {
  const [form, setForm] = useState({ firstName: "", email: "", source: "homepage" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showSection, setShowSection] = useState(true);

  // ✅ Hide VIP section for logged-in subscribed users
  useEffect(() => {
    if (user?.vipSubscribed) {
      setShowSection(false);
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      // ✅ Ensure consent is tracked in backend/klaviyo
      await createLead(form);
      setSuccess(true);
      setForm({ firstName: "", email: "", source: "homepage" });
      setShowSection(false); // Hide section after successful subscription
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.error ||
          "We could not save your email right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!showSection) return null; // ✅ Hide for subscribed users

  return (
    <section className="border-y border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-300">
            VIP list
          </p>
          <h2 className="mt-4 font-serif text-4xl">Be the first to know.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            New collections, limited restocks, and exclusive offers — straight
            to your inbox. No spam, ever.
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>✦ Early access to new arrivals</p>
            <p>✦ Restock alerts on fan favorites</p>
            <p>✦ Exclusive discounts for subscribers</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-slate-800 bg-white p-7 text-slate-950 shadow-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
            Join the list
          </p>

          {success ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-lg font-semibold text-slate-950">You're in!</p>
              <p className="text-sm text-slate-500">
                Watch your inbox for early access and exclusive offers.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  placeholder="First name"
                  autoComplete="given-name"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="Email address"
                  autoComplete="email"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Join the list"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-xs text-slate-400">
                No spam. Unsubscribe any time.
              </p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
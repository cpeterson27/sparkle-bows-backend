import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createLead } from "../api/leads";

export default function VipSignupSection() {
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    source: "homepage",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createLead(form);
      setSuccess(true);
      setForm({
        firstName: "",
        email: "",
        source: "homepage",
      });
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.error ||
          "We could not save your email right now. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-y border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-300">
            VIP list
          </p>
          <h2 className="mt-4 font-serif text-4xl">
            Build repeat customers before the next collection drop.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Capture interest for launches, seasonal edits, and top-selling bow
            restocks. This helps the storefront work like a real sales engine,
            not just a catalog.
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>Early access to new collections</p>
            <p>Best-seller restock alerts</p>
            <p>Launch emails for seasonal releases</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-slate-800 bg-white p-7 text-slate-950 shadow-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
            Join the list
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              placeholder="First name"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Email address"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              You are on the list.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Join VIP list"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

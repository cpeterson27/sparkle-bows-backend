import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { createLead, getVipStatus } from "../api/leads";
import { trackGenerateLead } from "../lib/analytics";

export default function VipSignupSection({ user }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSection, setShowSection] = useState(true); // show by default
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.email) return;

    const checkVip = async () => {
      try {
        const status = await getVipStatus(user.email);
        if (status.vipSubscribed) setShowSection(false); // hide if already VIP
      } catch (err) {
        console.error("VIP status check failed", err);
        // keep section visible on error
      }
    };
    checkVip();
  }, [user]);

  if (!showSection) return null; // hide only if confirmed VIP

  const handleVipClick = async () => {
    setSaving(true);
    setError("");

    try {
      await createLead({
        email: user.email,
        firstName: user.firstName || "",
        source: "homepage",
      });
      trackGenerateLead({
        formName: "vip_signup",
        leadType: "vip",
      });

      setSuccess(true);
      setShowSection(false); // hide after signup
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to join VIP list right now. Please try again.",
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

        <div className="rounded-[32px] border border-slate-800 bg-white p-7 text-slate-950 shadow-xl flex flex-col items-center justify-center">
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
              {error && (
                <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
              )}
              <button
                onClick={handleVipClick}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? "Joining..." : "Join the VIP list"}
              </button>
              <p className="mt-4 text-xs text-slate-400 text-center">
                No spam. Unsubscribe any time.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

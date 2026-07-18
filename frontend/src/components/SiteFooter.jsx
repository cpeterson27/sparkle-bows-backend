import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter({ onShowContact }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.25fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-rose-300">
            Sparkle Bows
          </p>
          <h2 className="mt-4 max-w-md font-serif text-3xl text-white">
            A polished bow boutique built for thoughtful gifting and repeat customers.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Premium presentation, dependable fulfillment, and handmade quality
            that feels worthy of birthdays, holidays, photo days, and boutique
            shelves.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Shop
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <Link to="/" className="block transition hover:text-white">
              New arrivals
            </Link>
            <Link to="/" className="block transition hover:text-white">
              Best sellers
            </Link>
            <Link to="/" className="block transition hover:text-white">
              Gift-ready bows
            </Link>
            <Link to="/orders" className="block transition hover:text-white">
              Order history
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Business
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <Link to="/privacy" className="block transition hover:text-white">
              Privacy policy
            </Link>
            <Link to="/terms" className="block transition hover:text-white">
              Terms of service
            </Link>
            <Link to="/refunds" className="block transition hover:text-white">
              Refund policy
            </Link>
            <Link
              to="/shipping-policy"
              className="block transition hover:text-white"
            >
              Shipping policy
            </Link>
            <Link to="/profile" className="block transition hover:text-white">
              Customer profile
            </Link>
            <Link to="/settings" className="block transition hover:text-white">
              Account settings
            </Link>
            <button
              type="button"
              onClick={onShowContact}
              className="block text-left transition hover:text-white"
            >
              Contact support
            </button>
            <a
              href="mailto:sparklebowshop@gmail.com"
              className="block transition hover:text-white"
            >
              sparklebowshop@gmail.com
            </a>
            <p>Professional small-batch production</p>
            <p>Reliable packaging and fulfillment</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Built to support boutique growth, bookkeeping discipline, and premium customer trust.</p>
          <p>Copyright {new Date().getFullYear()} Sparkle Bows</p>
        </div>
      </div>
    </footer>
  );
}

import React, { useContext } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

function NavButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
    >
      {children}
    </button>
  );
}

export default function Header({
  cartItemCount,
  onShowLogin,
  onShowCart,
  onShowContact,
}) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToShop = () => {
    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        document
          .getElementById("shop-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return;
    }

    document
      .getElementById("shop-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-rose-100/80 bg-white/92 backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-slate-950 text-[11px] font-medium uppercase tracking-[0.22em] text-rose-100">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center sm:px-6 lg:px-8">
          Handmade statement bows for milestones, gifting, and boutique-quality everyday wear
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group flex items-center gap-4"
        >
        <img
        src="/favicon.ico"
        alt="Sparkle Bows Logo"
        className="h-11 w-11 rounded-2xl object-contain"
      />
          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500">
              Sparkle Bows
            </p>
            <p className="font-serif text-xl text-slate-950 transition group-hover:text-rose-600">
              Boutique Hair Accessories
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-8 lg:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
              }`
            }
          >
            Home
          </NavLink>
          <NavButton onClick={scrollToShop}>Shop</NavButton>
          <NavLink
            to="/collections/sparkle"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
              }`
            }
          >
            Collections
          </NavLink>
          <NavButton onClick={onShowContact}>Contact</NavButton>
          {user && (
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-600 hover:text-slate-950"
                }`
              }
            >
              Orders
            </NavLink>
          )}
          {user && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-600 hover:text-slate-950"
                }`
              }
            >
              Account
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 text-sm font-medium transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-600 hover:text-slate-950"
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-slate-950"
              title="Profile"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onShowLogin}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-slate-950"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onShowCart}
            className="relative inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-slate-950">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

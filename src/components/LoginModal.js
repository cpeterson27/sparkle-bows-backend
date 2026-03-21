import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import api from "../api/axios.config";
import { AuthContext } from "../context/AuthContext";

export default function LoginModal({ onClose, onLogin }) {
  const { loginUser, verifyTwoFactorLogin } = useContext(AuthContext);

  const [isSignup, setIsSignup] = useState(false);
  const [authStep, setAuthStep] = useState("credentials");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const oauthBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;
  const googleEnabled = process.env.REACT_APP_GOOGLE_OAUTH_ENABLED === "true";
  const appleEnabled = process.env.REACT_APP_APPLE_OAUTH_ENABLED === "true";

  const redirectToProvider = (provider) => {
    window.location.href = `${oauthBaseUrl}/api/auth/${provider}/start`;
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await api.post(
          "/api/auth/signup",
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          },
          { withCredentials: true },
        );
      }

      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      if (response?.requiresTwoFactor) {
        setTwoFactorToken(response.twoFactorToken);
        setAuthStep("twoFactor");
        return;
      }

      onLogin?.();
      onClose();
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyTwoFactorLogin({
        twoFactorToken,
        code: twoFactorCode,
      });
      onLogin?.();
      onClose();
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[36px] border border-slate-200 bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-300 hover:text-slate-950"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
            Sparkle Bows account
          </p>
          <h2 className="mt-4 font-serif text-4xl text-slate-950">
            {authStep === "twoFactor"
              ? "Enter your verification code"
              : isSignup
                ? "Create your account"
                : "Welcome back"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {authStep === "twoFactor"
              ? "Your account is protected with two-factor authentication. Enter the 6-digit code from your authenticator app."
              : "Sign in to track orders, manage saved addresses, and check out faster."}
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {authStep === "twoFactor" ? (
          <form onSubmit={handleTwoFactorSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Authenticator or recovery code
              </span>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(event) =>
                  setTwoFactorCode(event.target.value.trim().toUpperCase())
                }
                placeholder="123456 or recovery code"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-base text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify and sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthStep("credentials");
                setTwoFactorToken("");
                setTwoFactorCode("");
                setError("");
              }}
              className="w-full text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              Back to login
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => redirectToProvider("google")}
                disabled={!googleEnabled}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue with Google
              </button>
              <button
                type="button"
                disabled={!appleEnabled}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue with Apple
              </button>
              {!googleEnabled || !appleEnabled ? (
                <p className="text-center text-xs text-slate-500">
                  Provider sign-in buttons activate as soon as the matching
                  OAuth keys are added to your environment.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Or use email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
              {isSignup ? (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    Name
                  </span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    required
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                  required
                  minLength={6}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {loading
                  ? "Working..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

        {authStep !== "twoFactor" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setIsSignup((current) => !current);
                setError("");
              }}
              className="mt-5 w-full text-sm font-medium text-rose-600 transition hover:text-rose-700"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <KeyRound className="h-4 w-4" />
              Continue browsing
            </button>
          </>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
}

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthCallbackPage() {
  const { completeOAuthLogin } = useContext(AuthContext);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    const accessToken = params.get("accessToken") || params.get("token");
    const provider = params.get("provider");
    const error = params.get("error") || params.get("oauth_error");
    const status = params.get("oauth");

    if (error) {
      setMessage(
        provider === "google"
          ? "Google sign-in could not be completed. Please try again."
          : "Sign-in could not be completed.",
      );
      return;
    }

    if (!accessToken && status !== "success") {
      setMessage("Missing sign-in session.");
      return;
    }

    (async () => {
      try {
        await completeOAuthLogin(accessToken);
        navigate("/", { replace: true });
      } catch (completionError) {
        console.error("OAuth completion failed:", completionError);
        setMessage("We could not finish your sign-in. Please try again.");
      }
    })();
  }, [completeOAuthLogin, navigate, params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f3ee] px-4">
      <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
          Account sign-in
        </p>
        <h1 className="mt-4 font-serif text-4xl text-slate-950">{message}</h1>
      </div>
    </div>
  );
}

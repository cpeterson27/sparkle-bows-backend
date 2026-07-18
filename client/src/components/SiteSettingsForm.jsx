import React, { useEffect, useState } from "react";
import { Globe, Search, BarChart3, Save } from "lucide-react";
import api from "../api/axios.config";
import { useSiteSettings } from "../context/SiteSettingsContext";

const initialState = {
  siteName: "",
  siteUrl: "",
  organizationName: "",
  defaultTitle: "",
  defaultDescription: "",
  defaultKeywords: "",
  defaultOgImage: "",
  googleAnalyticsId: "",
  googleTagManagerId: "",
};

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div className="rounded-xl bg-rose-50 p-2 text-rose-500">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-5 px-6 py-6">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100";

export default function SiteSettingsForm() {
  const { refreshSettings } = useSiteSettings();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/site-settings");
        setForm((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Failed to load admin site settings:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatus("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.put("/api/site-settings", form);
      await refreshSettings();
      setStatus("Settings saved.");
    } catch (error) {
      console.error("Failed to save site settings:", error);
      setStatus("We couldn’t save those settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Loading site settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section
        icon={Globe}
        title="Brand Settings"
        subtitle="Global defaults for titles, canonical URLs, and organization markup."
      >
        <Field label="Site Name">
          <input
            className={inputClassName}
            name="siteName"
            value={form.siteName}
            onChange={handleChange}
          />
        </Field>
        <Field label="Organization Name">
          <input
            className={inputClassName}
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
          />
        </Field>
        <Field label="Primary Site URL" hint="Use the full canonical domain, like https://www.sparklebows.shop">
          <input
            className={inputClassName}
            name="siteUrl"
            value={form.siteUrl}
            onChange={handleChange}
          />
        </Field>
        <Field label="Default Social Image URL">
          <input
            className={inputClassName}
            name="defaultOgImage"
            value={form.defaultOgImage}
            onChange={handleChange}
          />
        </Field>
      </Section>

      <Section
        icon={Search}
        title="SEO Defaults"
        subtitle="Fallback values for pages that don’t have a custom title or description."
      >
        <Field label="Default Title">
          <input
            className={inputClassName}
            name="defaultTitle"
            value={form.defaultTitle}
            onChange={handleChange}
          />
        </Field>
        <Field label="Default Description">
          <textarea
            className={inputClassName}
            rows={4}
            name="defaultDescription"
            value={form.defaultDescription}
            onChange={handleChange}
          />
        </Field>
        <Field label="Default Keywords">
          <textarea
            className={inputClassName}
            rows={3}
            name="defaultKeywords"
            value={form.defaultKeywords}
            onChange={handleChange}
          />
        </Field>
      </Section>

      <Section
        icon={BarChart3}
        title="Analytics"
        subtitle="Optional IDs for Google Analytics 4 and Google Tag Manager."
      >
        <Field label="GA4 Measurement ID" hint="Example: G-XXXXXXXXXX">
          <input
            className={inputClassName}
            name="googleAnalyticsId"
            value={form.googleAnalyticsId}
            onChange={handleChange}
          />
        </Field>
        <Field label="GTM Container ID" hint="Example: GTM-XXXXXXX">
          <input
            className={inputClassName}
            name="googleTagManagerId"
            value={form.googleTagManagerId}
            onChange={handleChange}
          />
        </Field>
      </Section>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm text-slate-500">{status || "Save when you’re ready to publish your SEO and analytics settings."}</p>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.config";

const defaultSettings = {
  siteName: "Sparkle Bows",
  siteUrl: "https://www.sparklebows.shop",
  defaultTitle: "Sparkle Bows | Premium Handmade Boutique Hair Bows",
  defaultDescription:
    "Premium handmade boutique bows with polished presentation, gift-worthy packaging, and a storefront designed for serious growth.",
  defaultKeywords:
    "boutique bows, handmade hair bows, girls hair accessories, premium bow shop, sparkle bows",
  defaultOgImage: "",
  organizationName: "Sparkle Bows",
  googleAnalyticsId: "",
  googleTagManagerId: "",
};

const SiteSettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const { data } = await api.get("/api/site-settings/public");
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Failed to load site settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

import { useEffect } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export default function Seo({
  title,
  description,
  image,
  type = "website",
  keywords,
  jsonLd,
}) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const siteName = settings.siteName || "Sparkle Bows";
    const siteUrl = settings.siteUrl || window.location.origin;
    const pageTitle = title
      ? `${title} | ${siteName}`
      : settings.defaultTitle || "Sparkle Bows | Premium Handmade Boutique Hair Bows";
    const pageDescription =
      description ||
      settings.defaultDescription ||
      "Premium handmade boutique bows with polished presentation, gift-worthy packaging, and a storefront designed for serious growth.";
    const url = new URL(
      `${window.location.pathname}${window.location.search}`,
      siteUrl,
    ).toString();
    const imageUrl =
      image || settings.defaultOgImage || `${window.location.origin}/logo192.png`;

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: pageDescription,
    });
    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content:
        keywords ||
        settings.defaultKeywords ||
        "boutique bows, handmade hair bows, girls hair accessories, premium bow shop, sparkle bows",
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: pageTitle,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: pageDescription,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: url,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl,
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: pageTitle,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: pageDescription,
    });
    upsertLink("canonical", url);

    let script = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.dataset.seoJsonld = "true";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      if (script && !jsonLd) {
        script.remove();
      }
    };
  }, [
    description,
    image,
    jsonLd,
    keywords,
    settings.defaultDescription,
    settings.defaultKeywords,
    settings.defaultOgImage,
    settings.defaultTitle,
    settings.siteName,
    settings.siteUrl,
    title,
    type,
  ]);

  return null;
}

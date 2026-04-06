const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Sparkle Bows" },
    siteUrl: { type: String, default: "https://www.sparklebows.shop" },
    defaultTitle: {
      type: String,
      default: "Sparkle Bows | Premium Handmade Boutique Hair Bows",
    },
    defaultDescription: {
      type: String,
      default:
        "Premium handmade boutique bows with polished presentation, gift-worthy packaging, and a storefront designed for serious growth.",
    },
    defaultKeywords: {
      type: String,
      default:
        "boutique bows, handmade hair bows, girls hair accessories, premium bow shop, sparkle bows",
    },
    defaultOgImage: { type: String, default: "" },
    organizationName: { type: String, default: "Sparkle Bows" },
    googleAnalyticsId: { type: String, default: "" },
    googleTagManagerId: { type: String, default: "" },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);

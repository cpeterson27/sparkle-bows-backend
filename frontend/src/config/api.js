function normalizeUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

function getProductionDefault() {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    if (hostname === "www.sparklebows.shop" || hostname === "sparklebows.shop") {
      return `${protocol}//api.sparklebows.shop`;
    }
  }

  return "https://api.sparklebows.shop";
}

const configuredUrl = normalizeUrl(process.env.REACT_APP_API_URL);
const storefrontOrigins = new Set([
  "https://www.sparklebows.shop",
  "https://sparklebows.shop",
]);

const API_URL =
  configuredUrl && !storefrontOrigins.has(configuredUrl)
    ? configuredUrl
    : process.env.NODE_ENV === "production"
      ? getProductionDefault()
      : "http://localhost:3001";

export default API_URL;

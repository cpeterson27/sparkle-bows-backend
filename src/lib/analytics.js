let gaInitializedId = "";
let gtmInitializedId = "";

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function injectScriptOnce(id, src) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function injectInlineScriptOnce(id, content) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.text = content;
  document.head.appendChild(script);
}

function injectGtmNoScript(containerId) {
  if (!containerId || document.getElementById("gtm-noscript")) return;
  const noscript = document.createElement("noscript");
  noscript.id = "gtm-noscript";
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);
}

export function initializeAnalytics(settings = {}) {
  if (typeof window === "undefined") return;

  const gaId = (settings.googleAnalyticsId || "").trim();
  const gtmId = (settings.googleTagManagerId || "").trim();

  if (gaId && gaId !== gaInitializedId) {
    ensureDataLayer();
    injectScriptOnce("ga4-src", `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
    injectInlineScriptOnce(
      "ga4-inline",
      `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        window.gtag('js', new Date());
      `,
    );
    if (window.gtag) {
      window.gtag("config", gaId, { send_page_view: false });
    }
    gaInitializedId = gaId;
  }

  if (gtmId && gtmId !== gtmInitializedId) {
    ensureDataLayer();
    injectInlineScriptOnce(
      "gtm-inline",
      `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `,
    );
    injectGtmNoScript(gtmId);
    gtmInitializedId = gtmId;
  }
}

export function trackPageView({ title, path, location }) {
  if (typeof window === "undefined") return;

  const pagePath = path || `${window.location.pathname}${window.location.search}`;
  const pageLocation = location || window.location.href;
  const pageTitle = title || document.title;

  ensureDataLayer().push({
    event: "page_view",
    page_title: pageTitle,
    page_path: pagePath,
    page_location: pageLocation,
  });

  if (window.gtag && gaInitializedId) {
    window.gtag("event", "page_view", {
      page_title: pageTitle,
      page_path: pagePath,
      page_location: pageLocation,
      send_to: gaInitializedId,
    });
  }
}

export function trackPurchase(order) {
  if (typeof window === "undefined" || !order?._id) return;

  const storageKey = `purchase-tracked:${order._id}`;
  if (window.sessionStorage.getItem(storageKey) === "1") return;

  const items = (order.items || []).map((item) => ({
    item_id: item.productId?._id || item.productId || item.name,
    item_name: item.name || item.productId?.name || "Product",
    price: Number(item.price || item.productId?.price || 0),
    quantity: Number(item.quantity || 0),
  }));

  const payload = {
    transaction_id: order._id,
    currency: "USD",
    value: Number(order.total || 0),
    tax: Number(order.tax || 0),
    shipping: Number(order.shippingCost || 0),
    items,
  };

  ensureDataLayer().push({ event: "purchase", ecommerce: payload });

  if (window.gtag && gaInitializedId) {
    window.gtag("event", "purchase", payload);
  }

  window.sessionStorage.setItem(storageKey, "1");
}

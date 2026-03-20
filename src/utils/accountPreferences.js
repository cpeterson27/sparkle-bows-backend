const STORAGE_KEY = "sparkle-bows.accountPreferences";

export const defaultAccountPreferences = {
  notifications: {
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    smsNotifications: false,
  },
  privacy: {
    profileVisibility: "private",
    showOrders: false,
    showReviews: true,
  },
};

export function loadAccountPreferences() {
  if (typeof window === "undefined") {
    return defaultAccountPreferences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultAccountPreferences;
    }

    const parsed = JSON.parse(raw);

    return {
      notifications: {
        ...defaultAccountPreferences.notifications,
        ...(parsed.notifications || {}),
      },
      privacy: {
        ...defaultAccountPreferences.privacy,
        ...(parsed.privacy || {}),
      },
    };
  } catch (error) {
    console.error("Failed to load account preferences:", error);
    return defaultAccountPreferences;
  }
}

export function saveAccountPreferences(nextPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  } catch (error) {
    console.error("Failed to save account preferences:", error);
  }
}

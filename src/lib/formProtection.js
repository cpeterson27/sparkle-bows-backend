export function createFormProtectionState() {
  return {
    website: "",
    startedAt: Date.now(),
  };
}

export function getProtectedFormPayload(values = {}, protection = {}) {
  return {
    ...values,
    website: protection.website || "",
    formStartedAt: protection.startedAt || Date.now(),
  };
}

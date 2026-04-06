function normalizeString(value = "") {
  return String(value).trim();
}

function validateFormProtection(body = {}, options = {}) {
  const honeypotField = options.honeypotField || "website";
  const minElapsedMs = Number(options.minElapsedMs || 1500);
  const maxElapsedMs = Number(options.maxElapsedMs || 2 * 60 * 60 * 1000);
  const honeypotValue = normalizeString(body[honeypotField]);
  const startedAtValue = Number(body.formStartedAt);

  if (honeypotValue) {
    return {
      valid: false,
      status: 400,
      error: "We could not process this submission.",
      code: "honeypot_triggered",
    };
  }

  if (!Number.isFinite(startedAtValue)) {
    return {
      valid: false,
      status: 400,
      error: "This form session expired. Please try again.",
      code: "missing_form_timestamp",
    };
  }

  const elapsedMs = Date.now() - startedAtValue;

  if (elapsedMs < minElapsedMs) {
    return {
      valid: false,
      status: 400,
      error: "Please wait a moment and try again.",
      code: "submitted_too_quickly",
    };
  }

  if (elapsedMs > maxElapsedMs) {
    return {
      valid: false,
      status: 400,
      error: "This form session expired. Please refresh and try again.",
      code: "form_session_expired",
    };
  }

  return { valid: true };
}

module.exports = {
  validateFormProtection,
};

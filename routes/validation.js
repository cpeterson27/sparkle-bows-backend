const express = require("express");
const axios = require("axios");
const router = express.Router();
const logger = require("../logger");

// Address validation endpoint using Google Maps Geocoding API
router.post("/validate-address", async (req, res) => {
  try {
    const { line1, line2, city, state, postalCode, country } = req.body;

    // Basic validation
    if (!line1 || !city || !state || !postalCode) {
      return res.status(400).json({
        valid: false,
        message: "Missing required address fields",
      });
    }

    // Construct full address for Google Maps API
    const addressParts = [
      line1,
      line2 || "",
      city,
      state,
      postalCode,
      country || "US"
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(", ");

    // Call Google Maps Geocoding API
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: fullAddress,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    // Check if Google Maps found results
    if (!response.data.results || response.data.results.length === 0) {
      logger.warn("Address validation failed - no results", { address: fullAddress });
      return res.status(200).json({
        valid: false,
        message: "Address not found. Please check and try again.",
      });
    }

    // Check for errors from Google Maps API
    if (response.data.status !== "OK") {
      logger.error("Google Maps API error", { 
        status: response.data.status,
        error_message: response.data.error_message 
      });
      return res.status(200).json({
        valid: false,
        message: "Unable to validate address. Please verify manually.",
      });
    }

    // Get the first (best) result
    const result = response.data.results[0];
    const components = result.address_components;

    // Extract normalized address components
    const normalizedAddress = {
      line1: "",
      line2: line2 || "",
      city: "",
      state: "",
      postalCode: "",
      country: country || "US",
    };

    // Parse address components from Google's response
    let streetNumber = "";
    let route = "";

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (types.includes("route")) {
        route = component.long_name;
      }
      if (types.includes("locality")) {
        normalizedAddress.city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        normalizedAddress.state = component.short_name; // Use short_name for state abbreviation
      }
      if (types.includes("postal_code")) {
        normalizedAddress.postalCode = component.long_name;
      }
      if (types.includes("country")) {
        normalizedAddress.country = component.short_name;
      }
    });

    // Combine street number and route for line1
    normalizedAddress.line1 = `${streetNumber} ${route}`.trim() || line1;

    // Verify we got the essential components
    if (!normalizedAddress.city || !normalizedAddress.state || !normalizedAddress.postalCode) {
      logger.warn("Incomplete address from Google Maps", { 
        original: fullAddress,
        normalized: normalizedAddress 
      });
      return res.status(200).json({
        valid: false,
        message: "Address is incomplete. Please provide all required fields.",
      });
    }

    // Check if the normalized address is significantly different from input
    // This can indicate a typo or incorrect address
    const locationAccuracy = result.geometry.location_type;
    const partialMatch = result.partial_match || false;

    if (partialMatch || locationAccuracy === "APPROXIMATE") {
      logger.info("Address validation - partial match", {
        original: fullAddress,
        normalized: normalizedAddress,
        accuracy: locationAccuracy,
      });
      
      return res.json({
        valid: true,
        warning: "Address was corrected or approximated. Please verify it's correct.",
        message: "Address validated with corrections",
        normalizedAddress: normalizedAddress,
        formattedAddress: result.formatted_address,
      });
    }

    // Success - exact or rooftop match
    logger.info("Address validated successfully", {
      original: fullAddress,
      normalized: normalizedAddress,
      accuracy: locationAccuracy,
    });

    res.json({
      valid: true,
      message: "Address validated successfully",
      normalizedAddress: normalizedAddress,
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    });
  } catch (err) {
    // Handle specific Google Maps API errors
    if (err.response?.data?.error_message) {
      logger.error("Google Maps API error", {
        error: err.response.data.error_message,
        status: err.response.data.status,
      });
      
      return res.status(500).json({
        valid: false,
        message: "Address validation service error. Please try again.",
      });
    }

    // Handle network or other errors
    logger.error("Address validation failed", { 
      error: err.message,
      stack: err.stack,
    });
    
    res.status(500).json({
      valid: false,
      message: "Address validation service unavailable. Please verify manually.",
    });
  }
});

module.exports = router;
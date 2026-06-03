// lib/prompt-helpers.js

/**
 * Case-insensitive lookup for an object property.
 */
function getPropertyCaseInsensitive(obj, targetKey) {
  if (!obj || typeof obj !== "object") return undefined;
  const lowerTarget = String(targetKey).toLowerCase();
  const matchedKey = Object.keys(obj).find(
    (k) => k.toLowerCase() === lowerTarget
  );
  return matchedKey ? obj[matchedKey] : undefined;
}

/**
 * Extract Next Best Product / Next Best Action from a profile (case-insensitive).
 */
function extractNextBestFromProfile(profile) {
  const properties = profile?.properties || {};
  const nbp = getPropertyCaseInsensitive(properties, "Next Best Product");
  const nba = getPropertyCaseInsensitive(properties, "Next Best Action");
  return { nbp, nba, properties };
}

/**
 * Build the base recommendation guidance depending on audience.
 * audience: "customer" | "csAgent"
 */
function buildBaseRecommendationGuidance({ recommendationHint, audience }) {
  const trimmedHint = (recommendationHint || "").trim();
  if (trimmedHint.length > 0) {
    return trimmedHint;
  }

  if (audience === "csAgent") {
    return "suggest suitable products, services, or actions for the Customer Success Agent to recommend based on the customer’s profile and your knowledge of this industry";
  }

  // default: "customer"
  return "suggest suitable products or services based on the customer’s profile and your knowledge of this industry";
}

/**
 * Build full recommendation logic text for the prompt.
 * audience: "customer" | "csAgent"
 */
function buildRecommendationText({ nbp, nba, baseGuidance, audience }) {
  const hasNB = Boolean(nbp || nba);

  if (!hasNB) {
    if (audience === "csAgent") {
      return `
When the Customer Success Agent asks what the customer should do next or asks for a recommendation, ${baseGuidance}.
      `.trim();
    }

    return `
When the customer asks what they should do next or asks for a recommendation, ${baseGuidance}.
    `.trim();
  }

  // With Next Best fields present
  if (audience === "csAgent") {
    return `
When the Customer Success Agent asks what they should recommend or what the customer should do next, follow this logic:

- If they are asking what the customer should buy next or for a product recommendation, use the profile's "Next Best Product" value as your primary recommendation (if available). Explain briefly why it suits the customer, and suggest one or two alternative options the agent could consider.
- If they are asking what the customer should do next (not only what to buy), use the profile's "Next Best Action" value as your primary suggested action (if available). Explain why it is appropriate and how the agent might position it to the customer.
- In all cases, also ${baseGuidance}.
    `.trim();
  }

  // audience === "customer"
  return `
When the customer asks what they should do next or asks for a recommendation, follow this logic:

- If they are asking what to buy next or for a product recommendation, use the profile's "Next Best Product" value as your primary recommendation (if available), briefly explaining why it suits them, and then you may add one or two alternative options.
- If they are asking what they should do next (not just what to buy), use the profile's "Next Best Action" value as your primary suggestion (if available), explaining why it is appropriate for them.
- In all cases, also ${baseGuidance}.
  `.trim();
}

module.exports = {
  getPropertyCaseInsensitive,
  extractNextBestFromProfile,
  buildBaseRecommendationGuidance,
  buildRecommendationText
};


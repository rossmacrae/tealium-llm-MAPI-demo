// mcp-server/tools/fetch-profile/index.js

const axios = require("axios");

async function run({
  attributeId,
  attributeValue,
  includeContext,
  profileApiUrl: tealiumApiUrl
}) {
  if (!includeContext) {
    return { profile: "This customer does not wish to share their details." };
  }

  if (!tealiumApiUrl) {
    throw new Error("❌ Missing required Tealium profile API URL.");
  }

  try {
    const response = await axios.get(tealiumApiUrl, {
      params: { attributeId, attributeValue }
    });

    return { profile: response.data };
  } catch (err) {
    console.error("❌ fetch-profile call failed:", err.response?.data || err.message);
    return { profile: "⚠️ Profile fetch failed. Using fallback data." };
  }
}

module.exports = { run };
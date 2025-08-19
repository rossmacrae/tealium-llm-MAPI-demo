const axios = require('axios');

async function run({
  attributeId,
  attributeValue,
  includeContext,
  profileApiUrl: tealiumApiUrl,   // 🧠 actual Tealium API (renamed for clarity)
  proxyApiUrl = "http://localhost:3001/api/visitor"  // ✅ default fallback, but no longer needed or used!
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

    const profile = response.data;
    return { profile };

  } catch (err) {
    console.error("❌ fetch-profile proxy call failed:", err.response?.data || err.message);
    return { profile: "⚠️ Profile fetch failed. Using fallback data." };
  }
}

module.exports = { run };

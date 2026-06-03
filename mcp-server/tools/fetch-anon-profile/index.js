// mcp-server/tools/fetch-anon-profile/index.js

const axios = require("axios");

async function run({
  profileApiUrl: tealiumApiUrl,
  tealiumVisitorId
}) {
  if (!tealiumApiUrl) {
    throw new Error("❌ Missing required Tealium anonymous profile API URL.");
  }

  if (!tealiumVisitorId) {
    throw new Error("❌ Missing required tealiumVisitorId.");
  }

  const baseUrl = tealiumApiUrl.replace(/\/+$/, "");
  const encodedVisitorId = encodeURIComponent(tealiumVisitorId);
  const finalUrl = `${baseUrl}/${encodedVisitorId}`;

  try {
    const response = await axios.get(finalUrl);
    return { profile: response.data };
  } catch (err) {
    console.error(
      "❌ fetch-anon-profile call failed:",
      err.response?.data || err.message
    );
    return { profile: "⚠️ Anonymous profile fetch failed. Using fallback data." };
  }
}

module.exports = { run };
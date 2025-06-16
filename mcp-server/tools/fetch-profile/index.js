const axios = require('axios');

async function run({ attributeId, attributeValue, includeContext }) {
  // If context sharing is off, return a stub profile
  if (!includeContext) {
//    console.log("ℹ️ includeContext is false — skipping fetch.");
    return { profile: "This customer does not wish to share their details." };
  }

  // Otherwise, fetch real profile
  const response = await axios.get('http://localhost:3001/api/visitor', {
    params: { attributeId, attributeValue }
  });

  const profile = response.data;
//  console.log("✅ fetch-profile fetched:", profile);
  return { profile };
}

module.exports = { run };


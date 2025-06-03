const axios = require('axios');

async function run({ attributeId, attributeValue }) {
  const response = await axios.get('http://localhost:3001/api/visitor', {
    params: { attributeId, attributeValue }
  });
  console.log("---- about to fetch the profile ----");
  const profile = response.data; // ✅ define profile
  console.log("✅ fetch-profile fetched:", profile);
  console.log("^^^^ that is the profile I just fetched");
  return { profile }; // ✅ now profile is defined and returned properly
}

module.exports = { run };


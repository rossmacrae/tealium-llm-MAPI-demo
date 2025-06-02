const axios = require('axios');

async function run({ attributeId, attributeValue }) {
  const response = await axios.get('http://localhost:3001/api/visitor', {
    params: { attributeId, attributeValue }
  });

  return {
    profile: response.data
  };
}

module.exports = { run };


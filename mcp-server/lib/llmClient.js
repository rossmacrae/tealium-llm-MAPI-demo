const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function callLLM({ model, messages }) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8000', // Required by OpenRouter
        'X-Title': 'TealTel Chat Agent'
      }
    }
  );

  const message = response.data.choices[0].message;
  return {
    role: message.role,
    content: message.content.trim()
  };
}

module.exports = { callLLM };


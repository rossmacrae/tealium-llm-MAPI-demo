const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


module.exports = {
  async run({
    model,
    basePrompt,
    history,
  }) 
  
  {

    const messages = [
      { role: "system", content: basePrompt },
      ...(Array.isArray(history) ? history : [])
    ];


    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model, messages },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8000",
          "X-Title": "Tealium Chat App"
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();

    return {
      llmReply: content
    };
  }
};


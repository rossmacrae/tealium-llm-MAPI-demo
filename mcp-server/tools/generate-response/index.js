const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


module.exports = {
  async run({
    model,
    isConcise,
    basePrompt,
    history,
    interpretedMessage,
    profileSummary,
    upgradeSuggestion
  }) {
    const today = new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const lengthConstraint = isConcise
      ? "IMPORTANT: Respond concisely, ideally under 60 words.\n"
      : "You may be detailed, but keep responses under 1000 characters.\n";

    const fullSystemPrompt = `
${lengthConstraint}
${basePrompt}

Today’s date is ${today}.

Here is what we know about the customer:
${profileSummary}

The customer has just said something, and this is our interpretation of their message:
${interpretedMessage}

Here is what we recommend offering or suggesting:
${upgradeSuggestion}
`.trim();

    const messages = [
      { role: "system", content: fullSystemPrompt },
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


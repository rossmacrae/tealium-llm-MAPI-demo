const axios = require('axios');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'anthropic/claude-3-haiku'; // You can switch to 'anthropic/claude-3-haiku' if desired

module.exports = {
  manifest: require('./manifest.json'),

  run: async ({ userMessage }) => {
    const prompt = `
You are a sentiment analysis assistant. Based on the user message below, identify:
- Sentiment (positive, neutral, or negative)
- Intent (what does the user want to do?)
- Topic (e.g., billing, upgrade, support, number plate)

If the user is asking about the riskiness, appropriateness, or rating of a number plate (e.g., "FKNFAST", "BAD4U"), set the intent to "evaluate_plate" and the topic to "number plate".

User message examples:
- "Can you rate the plate 'L8RLOS3R'?" → intent: evaluate_plate, topic: number plate
- "Is 'EV1L' an okay plate to use?" → intent: evaluate_plate, topic: number plate
- "Tell me how risky this plate is: FKNFAST" → intent: evaluate_plate, topic: number plate


User message:
"${userMessage}"

Respond in JSON like:
{
  "sentiment": "...",
  "intent": "...",
  "topic": "..."
}
`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: MODEL,
          messages: [
            { role: 'system', content: prompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8000',
            'X-Title': 'Tealium Chat App'
          }
        }
      );

      const reply = response.data.choices?.[0]?.message?.content;
      return JSON.parse(reply);
    } catch (err) {
      console.error("❌ interpret-message failed:", err.response?.data || err.message);
      return {
        sentiment: "unknown",
        intent: "unknown",
        topic: "unknown"
      };
    }
  }
};


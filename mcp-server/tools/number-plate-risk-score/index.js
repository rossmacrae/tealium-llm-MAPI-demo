const axios = require('axios');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'anthropic/claude-3-haiku';

module.exports = {
  manifest: require('./manifest.json'),

  run: async ({ plate_text, context, industry }) => {
    const systemPrompt = `
You are a content safety evaluator for personalised number plates. Your job is to assess a proposed plate text for riskiness.

Return:
- A risk score between 1 (completely safe) and 100 (extremely high risk of being offensive or problematic).
- A reason explaining the score, including any hidden meanings, inappropriate language, cultural issues, or ambiguous interpretations.

Evaluate based on:
- Offensive or suggestive words (including leetspeak, reversed words, or phonetic spellings)
- Cultural sensitivity (e.g., slurs, political, racial, or violent implications)
- Sexual, profane, or aggressive language
- Potential for public complaints

Be cautious and detailed.

Respond in JSON like:
{
  "score": 84,
  "reason": "Contains hidden profanity ('FKN') and an aggressive tone ('FAST')"
}

Plate to evaluate: "${plate_text}"
Industry context: ${industry || "n/a"}
Use case context: ${context || "n/a"}
`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8000',
            'X-Title': 'Tealium Plate Risk Demo'
          }
        }
      );

      const reply = response.data.choices?.[0]?.message?.content;
      return JSON.parse(reply);
    } catch (err) {
      console.error("❌ number-plate-risk-score failed:", err.response?.data || err.message);
      return {
        score: -1,
        reason: "Failed to evaluate plate risk"
      };
    }
  }
};

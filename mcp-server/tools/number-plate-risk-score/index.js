const axios = require('axios');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// const MODEL = 'anthropic/claude-3-haiku';
const MODEL = 'openai/gpt-4o';  // or 'anthropic/claude-3-sonnet'

module.exports = {
  manifest: require('./manifest.json'),

  run: async ({ plate_text, context, industry }) => {
    const systemPrompt = `
You are a content safety evaluator for personalised number plates. Your task is to assess a proposed plate's riskiness by decoding it (if needed), then evaluating the decoded version for inappropriate, offensive, or controversial meaning.

Return:
- A risk score between 1 (completely safe) and 100 (extremely high risk of being offensive or problematic)
- A reason explaining the score
- The decoded version of the plate (if applicable)

Evaluation Rules:

1. Decode the plate using common leetspeak substitutions (e.g., 1 → I, 3 → E, 4 → A, 5 → S, 7 → T, 0 → O, etc.).
2. Look for decoded combinations that resemble known words, including phonetic or stylized variants.
3. Assign moderate to high scores if the plate appears to:
   - Reference drugs, sex, violence, politics, hate speech, or profanity
   - Use leetspeak in a way that appears to intentionally bypass content filters
   - Use acronyms, slang, or cultural terms with problematic meanings
4. If the decoded meaning is ambiguous or could be misinterpreted, err on the side of caution.
5. Only assign a low score when the decoded meaning is clearly innocent or stylized without offense.

Tone:
- Be cautious and socially aware
- Treat borderline or culturally loaded terms as higher risk, even if not explicitly profane
- Consider how a general audience might reasonably interpret the plate

Respond in JSON like:
{
  "score": 18,
  "reason": "Styalized spelling with no clear offencive meaning"
}

Plate to evaluate: "${plate_text}"

`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: MODEL,
          messages: [{ role: 'system', content: systemPrompt }]
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

      // ✅ Strip markdown formatting if present
      const cleanedReply = reply.replace(/```json|```/g, '').trim();
      const { score, reason } = JSON.parse(cleanedReply);

      // 🎨 Add dynamic icon and level
      function getRiskIcon(score) {
        if (score <= 25) return '🟢';
        if (score <= 50) return '🟠';
        return '🔴';
      }

      function getRiskLevel(score) {
        if (score <= 25) return 'Low';
        if (score <= 50) return 'Moderate';
        return 'High';
      }

      return {
        score,
        reason,
        icon: getRiskIcon(score),
        level: getRiskLevel(score)
      };

    } catch (err) {
      console.error("❌ number-plate-risk-score failed:", err.response?.data || err.message);
      return {
        score: -1,
        reason: "Failed to evaluate plate risk"
      };
    }
  }
};


const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

module.exports = {
  async run({ profileSummary, history, model, isConcise }) {
    const today = new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const wordLimit = isConcise
      ? "IMPORTANT: Your response MUST be concise — no more than 60 words.\n\n"
      : "";
    const charLimit = isConcise
      ? ""
      : "IMPORTANT: You may be verbose, but keep your response under 1000 characters\n\n";

    const systemPrompt = `
${wordLimit}${charLimit}
Your name is Terry. You are a friendly and helpful Customer Service Representative at TealTel, a modern telecommunications company.

Today’s date is ${today}.

Your role is to assist customers by responding to their questions, offering plan advice, and helping them make the most of their current services. Be polite, clear, and always personalize your replies based on their customer profile and past messages.

- Only use plain text in your response.

Adjust your tone and intent based on the following:
- If the customer is in a high churn risk category, be especially proactive and reassuring.
- If the customer is in a low churn category with a long tenure or high loyalty tier, be warm and appreciative.
- If the customer is new or has a short tenure, be welcoming and helpful.
- If the customer is on a prepaid plan, suggest they consider a postpaid plan.

Please respond to the user.

- Address the customer by their first name.
- Refer to your company as "TealTel".
- Sign off in a friendly tone, e.g. "— Terry @ TealTel".

Interpret the user's sentiment, intent and topic in a single word each.
After your reply, on a new line, include a valid JSON object with exactly these 3 keys:
{
  "sentiment": "sentiment-value",
  "intent": "intent-value",
  "topic": "topic-value"
}
1. Your JSON block must be complete and valid, with a closing curly brace "}".
2. Do not include any explanation, prefix, or suffix — just the JSON.
3. Do not wrap the JSON in backticks or code blocks. Just include the raw JSON object on its own line.
4. Apart from the closing curly brace, do not output anything after the JSON block
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Visitor Profile:\n${profileSummary}` },
      ...history
    ];

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8000',
        'X-Title': 'Tealium Chat App'
      }
    });

    const content = response.data.choices[0].message.content.trim();

    const match = content.match(/({[^}]*"sentiment"[^}]*"intent"[^}]*"topic"[^}]*})/i);
    const jsonBlock = match?.[1]?.trim();

    let sentiment = "unknown";
    let intent = "unknown";
    let topic = "unknown";

    if (jsonBlock) {
      try {
        const metadata = JSON.parse(jsonBlock);
        sentiment = metadata.sentiment || sentiment;
        intent = metadata.intent || intent;
        topic = metadata.topic || topic;
      } catch (err) {
        console.warn("⚠️ Failed to parse JSON block from LLM:", err);
      }
    }

    return {
      llmReply: content.replace(jsonBlock, '').trim(),
      sentiment,
      intent,
      topic
    };
  }
};


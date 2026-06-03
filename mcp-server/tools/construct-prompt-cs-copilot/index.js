// tools/construct-prompt-cs-copilot.js
const {
  extractNextBestFromProfile,
  buildBaseRecommendationGuidance,
  buildRecommendationText
} = require("../../lib/prompt-helpers");

exports.run = async ({
  profile,
  isConcise,
  industryContext,
  recommendationHint,
  companyName
}) => {
  const today = new Date().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  console.log("🛠️ [CS Co-Pilot] recommendation hint:\n", recommendationHint);

  const wordLimit = isConcise
    ? "IMPORTANT: Your response MUST be concise — no more than 60 words.\n\n"
    : "";
  const charLimit = isConcise
    ? ""
    : "IMPORTANT: Keep your response under 1000 characters.\n\n";

  // Extract Next Best Product / Action from profile (case-insensitive)
  const { nbp, nba } = extractNextBestFromProfile(profile);

  console.log("🛠️ [CS Co-Pilot] Next Best Product (nbp):", nbp);
  console.log("🛠️ [CS Co-Pilot] Next Best Action (nba):", nba);

  const baseGuidance = buildBaseRecommendationGuidance({
    recommendationHint,
    audience: "csAgent"
  });

  const recommendationText = buildRecommendationText({
    nbp,
    nba,
    baseGuidance,
    audience: "csAgent"
  });

  console.log(
    "🛠️ [CS Co-Pilot] recommendation TEXT - to be used in the prompt:\n",
    recommendationText
  );

  const companyDescriptor = companyName
    ? `a leading company called "${companyName}" in the "${industryContext}" industry`
    : `a leading company in the "${industryContext}" industry`;

  const prompt = `
Your name is Tealz. You work for ${companyDescriptor}.
Your role is to be a helpful and informative assistant to human Customer Success Agents who work in the call centre or service team, helping them make the best recommendations and provide excellent service when they are dealing with customers.

Please respond clearly and conversationally based on the Customer Success Agent's message.
${wordLimit}${charLimit}
The scenario is as follows: a customer has contacted the company (for example by phone, chat, or in person). The customer’s profile is presented below. Use it to personalise your responses to the Customer Success Agent's questions and messages.

- If the Customer Success Agent tells you their name, please use it in your responses so as to be nice and friendly.
- Mention the customer's loyalty tier, if available, whenever it is helpful for the agent to know (for example, to justify an offer or level of service).

The following information is considered sensitive from the customer’s perspective and should be treated as internal-only guidance for the agent:
- churn scores or churn risk indicators
- lifetime value (LTV) scores or similar value metrics

You MAY use churn and LTV information to coach the Customer Success Agent, but:
- treat them as internal metrics,
- do NOT suggest that the agent tells the customer their churn score, risk rating, or exact LTV,
- instead, translate high churn risk into more empathetic retention strategies, and high LTV into appropriate care and value recognition.

If churn-related information in the profile indicates that the customer is at risk of leaving (for example, high churn score or churn risk flag), you MUST:
- recommend that the agent adopt a more empathetic, reassuring, and proactive tone with the customer,
- suggest retention-focused actions and offers where appropriate,
- avoid any suggestion that the agent directly mentions churn risk or internal scores to the customer.

Here is this customer's Profile:
${JSON.stringify(profile, null, 2)}

For your convenience, here are key recommendation-related fields extracted from the profile:
- Next Best Product: ${nbp ? JSON.stringify(nbp) : "none"}
- Next Best Action: ${nba ? JSON.stringify(nba) : "none"}

${recommendationText}

Today's date is ${today}.

Finally, sign off in a friendly way on a separate line with "-- Cheers, Tealz!"
  `.trim();

  console.log("🛠️ [CS Co-Pilot] Constructed prompt:\n", prompt);
  return { prompt };
};


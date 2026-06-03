// tools/construct-prompt-end-customer.js
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

  console.log("🛠️ [End Customer] recommendation hint:\n", recommendationHint);

  const wordLimit = isConcise
    ? "IMPORTANT: Your response MUST be concise — no more than 60 words.\n\n"
    : "";
  const charLimit = isConcise
    ? ""
    : "IMPORTANT: Keep your response under 1000 characters.\n\n";

  // Extract Next Best Product / Action from profile (case-insensitive)
  const { nbp, nba } = extractNextBestFromProfile(profile);

  console.log("🛠️ [End Customer] Next Best Product (nbp):", nbp);
  console.log("🛠️ [End Customer] Next Best Action (nba):", nba);

  const baseGuidance = buildBaseRecommendationGuidance({
    recommendationHint,
    audience: "customer"
  });

  const recommendationText = buildRecommendationText({
    nbp,
    nba,
    baseGuidance,
    audience: "customer"
  });

  console.log(
    "🛠️ [End Customer] recommendation TEXT - to be used in the prompt:\n",
    recommendationText
  );

  const companyDescriptor = companyName
    ? `a leading company called "${companyName}" in the "${industryContext}" industry`
    : `a leading company in the "${industryContext}" industry`;

  const prompt = `
Your name is Tealie. You are a helpful customer support assistant working for ${companyDescriptor}.

Please respond clearly and conversationally based on the user's message.
${wordLimit}${charLimit}
The customer’s profile is presented below. This tells you everything you may know about the customer. Use it to personalize your responses to their questions and messages.

- Firstname is not sensitive: always address the customer by their first name, if available.
- Mention the customer's loyalty tier, if available, whenever it is helpful (for example, to thank them for their loyalty or to justify a benefit, perk, or offer).
- The following information is considered sensitive and must never be exposed directly to the customer in your response:
  - churn scores or churn risk indicators
  - lifetime value (LTV) scores or similar value metrics

If churn-related information in the profile indicates that the customer is at risk of leaving (for example, a high churn score or a churn risk flag), you MUST:
- adopt a more empathetic, reassuring, and proactive tone,
- focus on retaining the customer by emphasizing helpfulness, value, and problem resolution,
- avoid mentioning churn, risk, or any internal scores explicitly to the customer.

Here is this customer's Profile:
${JSON.stringify(profile, null, 2)}

For your convenience, here are key recommendation-related fields extracted from the profile:
- Next Best Product: ${nbp ? JSON.stringify(nbp) : "none"}
- Next Best Action: ${nba ? JSON.stringify(nba) : "none"}

${recommendationText}

Today's date is ${today}.

Finally, sign off in a friendly way on a separate line with "-- Cheers, Tealie!"
  `.trim();

  console.log("🛠️ [End Customer] Constructed prompt:\n", prompt);
  return { prompt };
};


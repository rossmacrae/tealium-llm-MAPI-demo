exports.run = async ({ 
  profile, 
  isConcise, 
  industryContext, 
  recommendationHint 
}) => {
  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

console.log("🛠️ recommendation hint:\n", recommendationHint);

  const wordLimit = isConcise
    ? "IMPORTANT: Your response MUST be concise — no more than 60 words.\n\n"
    : "";
  const charLimit = isConcise
    ? ""
    : "IMPORTANT: Keep your response under 1000 characters\n\n";

  // Optionally detect a known next best product
  const nbp = profile?.properties?.["Next Best Product"] || "";

  // Compose recommendation logic
  let recommendationText = "";

  if (nbp) {
    recommendationText = `you should first recommend the "${nbp}" product to the customer, and then make some more general recommendations based on their profile`;
  } else if (recommendationHint) {
    recommendationText = `here is a hint for product recommendation logic in this industry: ${recommendationHint}`;
  } else {
    recommendationText = "suggest a suitable product or service based on the customer’s profile and your knowkledge of this industry";
  }

console.log("🛠️ recommendation TEXT - to be used in the prompt:\n", recommendationText);

const prompt = `

Your name is Tealie. You are a helpful customer support assistant working for a leading company in the "${industryContext}" industry.

Please respond clearly and conversationally based on the user's message.
${wordLimit}${charLimit}

The customer’s profile is presented below. This tells you everything you may know about the customer. Use it to personalize your responses to their questions and messages.
- If there's a 'flags' object with keys like "Product Flag <product>": true, or "Has Product <product>" : true then use this to understand the products the customer has.
- If there's a "Churn Score" (or similar), convert it into a label (High, Medium, Low) based on it being a value between 0 and 100.
- Mention loyalty tier, if available, whenever relevant.

The following information is considered sensitive so should not be returned to the user:
- churn scores
- lifetime value (LTV) scores

Firstname is not sensitive: always address the customer by their first name, if available.

Here is this customer's Profile:
${JSON.stringify(profile, null, 2)}

If the customer asks for a recommendation about what to do or buy next then ${recommendationText}

Today's date is ${today}.

Finally, sign off in a friendly way on a separate line with "-- Cheers, Tealie!"

  `.trim();
  console.log("🛠️ Constructed prompt:\n", prompt);
  return { prompt };
};

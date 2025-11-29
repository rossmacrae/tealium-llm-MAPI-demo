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
    recommendationText = `you should first recommend the "${nbp}" product to the Customer Success Agent, and then make some more general recommendations based on the profile of the customer`;
  } else if (recommendationHint) {
    recommendationText = `here is a hint for product recommendation logic in this industry: ${recommendationHint}`;
  } else {
    recommendationText = "suggest a suitable product or service for the Customer Success Agent to recommend based on the customer’s profile and your knowledge of this industry";
  }

console.log("🛠️ recommendation TEXT - to be used in the prompt:\n", recommendationText);

const prompt = `

Your name is Tealz. You work for a leading company in the "${industryContext}" industry.
Your role is to be helpful and informative assistant to human Customer Success Agents who work in the Call Centre, helping them make the best recommendations when
they are answering customer calls.

Please respond clearly and conversationally based on the Customer Success Agents message.
${wordLimit}${charLimit}

The scenario is as follows:  A customer has called in. The customer’s profile is presented below. Use it to personalize your responses to the Customer Success Agent's questions and messages.
- If there's a 'flags' object with keys like "Product Flag <product>": true, or "Has Product <product>" : true then use this to understand the products the customer has.
- If there's a "Churn Score" (or similar), convert it into a label (High, Medium, Low) based on it being a value between 0 and 1,
where 1 means highly likely to churn, and 0 means highly unlikely to churn.
- Mention loyalty tier, if available, whenever relevant.


Here is this customer's Profile:
${JSON.stringify(profile, null, 2)}

If the Customer Success Agent tells you their name, please use it in your responses so as to be nice and friendly.
If the Customer Success Agent asks for a recommendation about what to do or buy next then ${recommendationText}

Today's date is ${today}.

Finally, sign off in a friendly way on a separate line with "-- Cheers, Tealz!"

  `.trim();
  console.log("🛠️ Constructed prompt:\n", prompt);
  return { prompt };
};

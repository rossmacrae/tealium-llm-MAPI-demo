module.exports = {
  run: async ({ profile }) => {
    const planType = profile?.properties?.["Customer Plan Type"] || "unknown";

console.log("🧪 Full profile properties:\n", profile.properties);
console.log(`🧪 Extracted Plan Type: "${planType}"`);

    let suggestion = "No upgrade suggestion needed.";
    if (planType.toLowerCase() === "prepaid") {
      suggestion = "Suggest the Premium Postpaid Plan for better value if the customer is on a prepaid plan.";
    }

    console.log(`Suggestion: ${suggestion}`);
    return { suggestion };
  }
};


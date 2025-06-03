module.exports = {
  run: async ({ profile }) => {
    const planType = profile?.properties?.["Customer Plan Type"] || "unknown";

// console.log("🧪 Full profile properties:\n", profile.properties);
console.log(`🧪 Extracted Plan Type: "${planType}"`);

    let suggestion = "If the customer is on a postpaid plan reasure them that they are on the optimum plan type.";
    if (planType.toLowerCase() === "prepaid") {
      suggestion = "If the customer is on a prepaid plan suggest that they consider a postpaid plan.";
    }

//    console.log(`Suggestion: ${suggestion}`);
    return { suggestion };
  }
};


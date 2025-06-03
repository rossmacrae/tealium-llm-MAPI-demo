module.exports = {
  run({ profile }) {
    const props = profile.properties || {};
    const metrics = profile.metrics || {};
    const flags = profile.flags || {};

    const currentProducts = Object.entries(flags)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.replace("Product Flag ", ""))
      .join(', ') || "None";

    const churnScore = metrics["Customer Propensity Churn"] ?? "N/A";
    const churnLevel = churnScore > 60 ? "High" : "Low";

    const summary = `
Customer First Name: ${props["Customer Firstname"] || "Unknown"}
Customer Last Name:  ${props["Customer Lastname"] || ""}
Email: ${props["Customer Email"] || "N/A"}
Loyalty Tier: ${props["Customer Loyalty Tier"] || "N/A"}
Plan Type: ${props["Customer Plan Type"] || "N/A"}
Last Product Viewed: ${props["Last Category Viewed"] || "N/A"}
Lifetime Value: $${metrics["Customer LTV"] ?? "N/A"}
Days Till Next Renewal: ${metrics["Days Till Next Renewal"] ?? "N/A"}
Tenure: ${metrics["Customer Tenure"] ?? "N/A"} month(s)
Churn Risk Score: ${churnScore} (${churnLevel})
Current Products Held: ${currentProducts}
    `.trim();

    return { summary };

    console.log("Here is the summary: ", summary);

  }
};


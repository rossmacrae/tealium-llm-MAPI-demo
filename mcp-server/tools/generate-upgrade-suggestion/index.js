module.exports = {
  run: ({ topic, planType }) => {
    const normalizedTopic = (topic || "").toLowerCase();
    const normalizedPlan = (planType || "").toLowerCase();

    let recommendationText = "";

    if (normalizedTopic.includes("product") || normalizedTopic.includes("recommendation")) {
      if (normalizedPlan === "prepaid") {
        recommendationText = "Suggest that this customer consider moving to a postpaid plan for the best value. Feel free to make other suggestions in addition as appropriate.";
      } else if (normalizedPlan === "postpaid") {
        recommendationText = "Suggest that this customer considers staying on their postpaid plan for the best value. Feel free to make other suggestions in addition as appropriate.";
      } else {
        recommendationText = "Suggest that in general postpaid plans represent better value. Feel free to make other suggestions in addition as appropriate.";
      }
    }

    return { recommendationText };
  }
};


const callTool = require('../../lib/callTool');

module.exports = {
  async run(input) {
  const {
    attributeId,
    attributeValue,
    userMessage,
    model,
    isConcise,
    includeContext,
    history = [],
    profileApiUrl,           // 👈 new
    collectApiUrl,           // (used later)
    traceId,                 // (used later)
    industryContext,         // (used later)
    recommendationHint       // (used later)
} = input;

    const lastToolResults = {};

    // Step 1: Always interpret the user's message
    const messageInsights = await callTool("interpret-message", { userMessage });
    lastToolResults["interpret-message"] = messageInsights;

//------------------------------- START: short circuit in these special cases ----------------------
// 💡 NEW: If the user intends to evaluate a number plate, branch here
if (messageInsights.intent === "evaluate_plate" || messageInsights.topic === "number plate") {
  const plateTextMatch = userMessage.match(/['"]?([A-Z0-9]{2,8})['"]?/i);
  const plateText = plateTextMatch?.[1] || null;

  if (plateText) {
    const riskResult = await callTool("number-plate-risk-score", {
      plate_text: plateText,
      context: "number_plate",
      industry: industryContext
    });

    await callTool("send-to-tealium", {
      email: attributeValue,
      event_name: "plate_risk_scored",
      plate_text: plateText,
      risk_score: riskResult.score,
      risk_reason: riskResult.reason,
      collectApiUrl,
      traceId
    });

    return {
      llmReply: `✅ Risk Score for "${plateText}": ${riskResult.score}/100\n📝 Reason: ${riskResult.reason}`,
      sentiment: messageInsights.sentiment,
      intent: messageInsights.intent,
      topic: messageInsights.topic
    };
  }
}
//------------------------------- END of Special Cases short circuit ----------------------

    // This is fall-through logic for the normal customer assistant chat scenario
    // Step 2: Enrich with profile data, dependent on includeContext flag
    let profile = null;
    let profileInterpretation = null;

    profile = await callTool("fetch-profile", { 
		attributeId,
                attributeValue,
                includeContext,
                profileApiUrl            // 👈 new
		});
    lastToolResults["fetch-profile"] = profile;

    // Step 3: Interpret the profile - REMOVED IN NEW FLOW, 
    //                                 generic profile intrpetation now happens in base prompt
    // profileInterpretation = await callTool("interpret-profile", profile);
    // lastToolResults["interpret-profile"] = profileInterpretation;


    // Step 4: Generate recommendation input if topic is suitable - REMOVED IN NEW FLOW, 
    //                                                              happenns generically in base prompt
    // let recommendationText = "";
    // const topic = messageInsights.topic || "";
    // const planType = profile.profile.properties?.["Customer Plan Type"] || "";

    //     const recommendation = await callTool("generate-upgrade-suggestion", {
    //     topic,
    //     planType
    //    });
    //    lastToolResults["generate-upgrade-suggestion"] = recommendation;
    //    recommendationText = recommendation.recommendationText || "";


    // Step 5: Construct base prompt

    const constructedPrompt = await callTool("construct-prompt", {
      profile: profile.profile,       // pass full object
      userMessage,
      isConcise,
      industryContext,
      recommendationHint
    });
    lastToolResults["construct-prompt"] = constructedPrompt;



    // Step 6: Generate final LLM response
    const llmOutput = await callTool("generate-response", {
      model,
      basePrompt: constructedPrompt.prompt,
      history
    });

    // Step 7: Always send outcome to Tealium
    await callTool("send-to-tealium", {
      email: attributeValue,
      userMessage,
      llmReply: llmOutput.llmReply,
      sentiment: messageInsights.sentiment,
      intent: messageInsights.intent,
      topic: messageInsights.topic,
      collectApiUrl: input.collectApiUrl,  // <- from UI
      traceId: input.traceId                 // <- from UI
});

//    console.log("--- Agent Tool Logging: \n", lastToolResults)

    // Return the LLM reply 
    return {
      llmReply: llmOutput.llmReply,
      sentiment: messageInsights.sentiment,
      intent: messageInsights.intent,
      topic: messageInsights.topic
    };
  }
};


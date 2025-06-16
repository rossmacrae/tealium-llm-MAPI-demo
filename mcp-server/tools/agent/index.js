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
      history = []
    } = input;

    const lastToolResults = {};

    // Step 1: Always interpret the user's message
    const messageInsights = await callTool("interpret-message", { userMessage });
    lastToolResults["interpret-message"] = messageInsights;


    // Step 2: Enrich with profile data, dependent on includeContext flag
    let profile = null;
    let profileInterpretation = null;

    profile = await callTool("fetch-profile", { 
		attributeId,
                attributeValue,
                includeContext
		});
    lastToolResults["fetch-profile"] = profile;

    // Step 3: Interpret the profile
    profileInterpretation = await callTool("interpret-profile", profile);
    lastToolResults["interpret-profile"] = profileInterpretation;


    // Step 4: Generate recommendation input if topic is suitable
    let recommendationText = "";
    const topic = messageInsights.topic || "";
    const planType = profile.profile.properties?.["Customer Plan Type"] || "";

    const recommendation = await callTool("generate-upgrade-suggestion", {
     topic,
     planType
    });

    lastToolResults["generate-upgrade-suggestion"] = recommendation;
//    recommendationText = recommendation.recommendationText || "";


    // Step 5: Construct base prompt
    const constructedPrompt = await callTool("construct-prompt", {
      profileSummary : profileInterpretation.summary,
      userMessage, 
      isConcise,
      offerSuggestion : recommendation.recommendationText
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
      topic: messageInsights.topic
    });

    console.log("--- Agent Tool Logging: \n", lastToolResults)

    // Return the LLM reply 
    return {
      llmReply: llmOutput.llmReply,
      sentiment: messageInsights.sentiment,
      intent: messageInsights.intent,
      topic: messageInsights.topic
    };
  }
};


const axios = require('axios');

module.exports = {
  async run({
    tealiumVisitorId,
    userMessage,
    llmReply,
    sentiment,
    intent,
    topic,
    collectAnonApiUrl,
    traceId
  }) {
    if (!tealiumVisitorId || !userMessage || !llmReply || !collectAnonApiUrl) {
      throw new Error(
        "Missing required input(s): tealiumVisitorId, userMessage, llmReply, or collectAnonApiUrl"
      );
    }

    const collectAnonUrl = new URL(collectAnonApiUrl);

    collectAnonUrl.searchParams.set("tealium_event", "anon_chat_interaction");
    collectAnonUrl.searchParams.set("tealium_visitor_id", tealiumVisitorId);
    collectAnonUrl.searchParams.set("chat_user_message", userMessage.slice(0, 1000));
    collectAnonUrl.searchParams.set("chat_llm_reply", llmReply.slice(0, 1000));
    collectAnonUrl.searchParams.set("chat_sentiment", sentiment || "unknown");
    collectAnonUrl.searchParams.set("chat_intent", intent || "unknown");
    collectAnonUrl.searchParams.set("chat_topic", topic || "unknown");

    if (traceId) {
      collectAnonUrl.searchParams.set("tealium_trace_id", traceId);
    }

    console.log("📤 Sending anonymous chat data to Tealium:", collectAnonUrl.toString());

    await axios.get(collectAnonUrl.toString());

    return { status: "success" };
  }
};
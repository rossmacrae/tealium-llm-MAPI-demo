const axios = require('axios');

module.exports = {
  async run({ email, userMessage, llmReply, sentiment, intent, topic, collectApiUrl, traceId }) {
    if (!email || !userMessage || !llmReply || !collectApiUrl) {
      throw new Error("Missing required input(s): email, userMessage, llmReply, or collectUrlBase");
    }

    const collectUrl = new URL(collectApiUrl);

    collectUrl.searchParams.set("tealium_event", "chat_interaction_event");
    collectUrl.searchParams.set("chat_email_address", email);
    collectUrl.searchParams.set("chat_user_message", userMessage.slice(0, 1000));
    collectUrl.searchParams.set("chat_llm_reply", llmReply.slice(0, 1000));
    collectUrl.searchParams.set("chat_sentiment", sentiment || "unknown");
    collectUrl.searchParams.set("chat_intent", intent || "unknown");
    collectUrl.searchParams.set("chat_topic", topic || "unknown");

    if (traceId) {
      collectUrl.searchParams.set("tealium_trace_id", traceId);
    }

    console.log("📤 Sending data to Tealium:", collectUrl.toString());

    await axios.get(collectUrl.toString());

    return { status: "success" };
  }
};

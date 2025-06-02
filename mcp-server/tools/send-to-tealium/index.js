const axios = require('axios');

module.exports = {
  async run({ email, userMessage, llmReply, sentiment, intent, topic }) {
    if (!email || !userMessage || !llmReply) {
      throw new Error("Missing required input(s): email, userMessage, or llmReply");
    }

    const collectUrl = new URL("https://collect.tealiumiq.com/event");

    collectUrl.searchParams.set("tealium_account", "csm-ross-macrae");
    collectUrl.searchParams.set("tealium_profile", "demo-telco");
    collectUrl.searchParams.set("tealium_datasource", "31o5i9");
    collectUrl.searchParams.set("tealium_event", "chat_interaction_event");

    collectUrl.searchParams.set("chat_email_address", email);
    collectUrl.searchParams.set("chat_user_message", userMessage.slice(0, 1000));
    collectUrl.searchParams.set("chat_llm_reply", llmReply.slice(0, 1000));
    collectUrl.searchParams.set("chat_sentiment", sentiment || "unknown");
    collectUrl.searchParams.set("chat_intent", intent || "unknown");
    collectUrl.searchParams.set("chat_topic", topic || "unknown");

    await axios.get(collectUrl.toString());

    return { status: "success" };
  }
};


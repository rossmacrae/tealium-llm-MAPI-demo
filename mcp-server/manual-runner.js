// manual-runner.js
const axios = require('axios');

const MCP_BASE = 'http://localhost:3002/tools';

// Sample input
const attributeId = "5036";
const attributeValue = "demo_drainyc@psu.edu";
const userMessage = "I’m thinking about upgrading to a new phone. What are my options?";

async function callTool(name, input = {}) {
  try {
    const response = await axios.post(`${MCP_BASE}/${name}`, input);
    console.log(`✅ ${name} success:\n`, response.data);
    return response.data;
  } catch (err) {
    console.error(`❌ ${name} failed:`, err.response?.data || err.message);
    return null;
  }
}

(async () => {
  console.log("🔍 Starting MCP toolchain sequence...\n");

  // 1. Fetch profile
  const profileResult = await callTool('fetch-profile', { attributeId, attributeValue });
  if (!profileResult?.profile) return;
  const profile = profileResult.profile;
  console.log("➡️ Step 1 complete: profile fetched\n");

  // 2. Interpret profile
  const profileSummaryResult = await callTool('interpret-profile', { profile });
  if (!profileSummaryResult?.summary) return;
  const summary = profileSummaryResult.summary;
  console.log("➡️ Step 2 complete: profile interpreted\n");

  // 2.1. Generate upgrade suggestion
  const upgradeSuggestionResult = await callTool('generate-upgrade-suggestion', {
    profile
  });
  if (!upgradeSuggestionResult?.suggestion) return;
  const upgradeSuggestion = upgradeSuggestionResult.suggestion;
  console.log("📈 Step 2.1 complete: upgrade suggestion generated\n");


  // 3. Interpret user message
  const interpretationResult = await callTool('interpret-message', { userMessage });
  if (!interpretationResult?.sentiment) return;
  const { sentiment, intent, topic } = interpretationResult;
  console.log("➡️ Step 3 complete: user message interpreted\n");
  console.log(`   ↳ Sentiment: ${sentiment}, Intent: ${intent}, Topic: ${topic}\n`);

  // 4. Construct LLM prompt
  const promptResult = await callTool('construct-prompt', {
    profileSummary: summary,
    userMessage,
    concise: false
  });
  if (!promptResult?.prompt) return;
  const prompt = promptResult.prompt;
  console.log("➡️ Step 4 complete: prompt constructed\n");

  // 5. Generate LLM reply
  const responseResult = await callTool('generate-response', {
    model: "anthropic/claude-3-haiku", // or any OpenRouter-supported model
    isConcise: false, // or true if the user toggled "concise"
    basePrompt: prompt,
    history: [
      { role: "user", content: userMessage }
    ],
    interpretedMessage: `Sentiment: ${sentiment}\nIntent: ${intent}\nTopic: ${topic}`,
    profileSummary: summary,
    upgradeSuggestion
  });
  if (!responseResult?.llmReply) return;
  const llmReply = responseResult.llmReply;
  console.log("🧠 Step 5 complete: LLM reply generated\n");


  // 6. Send to Tealium
  const tealiumResult = await callTool('send-to-tealium', {
    email: attributeValue,
    userMessage,
    llmReply,
    sentiment,
    intent,
    topic
  });
  if (!tealiumResult) return;
  console.log("📬 Step 6 complete: data sent to Tealium\n");

  console.log("🎉 MCP toolchain completed successfully!\n");
})();


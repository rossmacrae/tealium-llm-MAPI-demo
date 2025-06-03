const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Utility: Call a local tool by name
async function callTool(toolName, input) {
  const response = await fetch(`http://localhost:${PORT}/tools/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const result = await response.json();
  return result.output || {};
}

const app = express();
app.use(cors());
app.use(express.json());

// Load tool manifest dynamically
const toolsDir = './tools';
const tools = [];

fs.readdirSync(toolsDir).forEach(toolName => {
  const toolPath = path.join(toolsDir, toolName, 'manifest.json');
  if (fs.existsSync(toolPath)) {
    const manifest = JSON.parse(fs.readFileSync(toolPath));
    tools.push({ name: toolName, manifest });
  }
});

// MCP-compatible endpoint for tool discovery
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.json({
    schema_version: "v1",
    name: "tealium-mcp",
    description: "MCP server exposing tools for customer profile fetch and event tracking",
    tools: tools.map(t => t.manifest)
  });
});

// POST endpoint to run a tool
app.post('/tools/:toolName', async (req, res) => {
  const toolName = req.params.toolName;
  const tool = tools.find(t => t.name === toolName);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });

  try {
    const modulePath = path.join(__dirname, 'tools', toolName, 'index.js');
    const toolModule = require(modulePath);
    const output = await toolModule.run(req.body);
    res.json({ output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Execution failed' });
  }
});

//----------------------

app.post('/run', async (req, res) => {
  const { input } = req.body;

  try {
    // Step 1: Fetch profile
    console.log("---> starting fetch-profile");
    const profileResult = await callTool('fetch-profile', {
      attributeId: input.attributeId,
      attributeValue: input.attributeValue
    });
    console.log("🔍 profileResult from fetch-profile:", profileResult);
    if (!profileResult.profile) throw new Error("Missing profile");
    const profile = profileResult.profile;

    // Step 2: Interpret profile
    console.log("---> starting interpret-profile");
    const summaryResult = await callTool('interpret-profile', { profile });
    console.log("🔍 summaryResult from interpret-profile:", summaryResult);
    const profileSummary = summaryResult.summary || "No summary available";

    // Step 3: Interpret message
    console.log("---> starting interpret-message");
    const interpretation = await callTool('interpret-message', {
      profile,
      userMessage: input.userMessage
    });
    console.log("🔍 interpretation from interpret-message:", interpretation);

    // Step 4: Generate suggestion
    console.log("---> starting generate-upgrade-suggestion");
    const suggestionResult = await callTool('generate-upgrade-suggestion', { profile });
    const suggestion = suggestionResult.suggestion || "";
    console.log("🔍 suggestion from generate-upgrade-suggestion:", suggestion);

    // Step 5: construct LLM prompt
    console.log("---> starting construct-prompt");
    const promptResult = await callTool('construct-prompt', {
    profileSummary: profileSummary,
    userMessage: input.userMessage,
    isConcise: input.isConcise,
    offerSuggestion: suggestion
    });
    if (!promptResult?.prompt) return;
    const prompt = promptResult.prompt;
    console.log("🔍 Prompt from construct-prompt", prompt);

    // Step 6: Generate LLM reply
    console.log("---> starting generate-response");
    const responseResult = await callTool('generate-response', {
    model: input.model,
    basePrompt: prompt,
    history: input.messageHistory
    });
    if (!responseResult?.llmReply) return;
    const llmReply = responseResult.llmReply;
    console.log("🔍 LLM reply from generate-response",llmReply);


     // Step 7. Send to Tealium
    console.log("---> starting send-to-tealium");
    const tealiumResult = await callTool('send-to-tealium', {
    email: input.attributeValue,
    userMessage: input.userMessage,
    llmReply,
    sentiment: interpretation.sentiment,
    intent: interpretation.intent,
    topic: interpretation.topic
  });
  if (!tealiumResult) return;
  // console.log("🔍 Send to Tealium completed");
  console.log("🧪 Confirm still alive after tealiumResult check");
  
console.log("🧾 Response payload:", {
  llmReply,
  sentiment: interpretation?.sentiment,
  intent: interpretation?.intent,
  topic: interpretation?.topic
});


  console.log("✅ About to send response to browser");
    try {
  res.json({
    output: {
      llmReply,
      sentiment: interpretation.sentiment,
      intent: interpretation.intent,
      topic: interpretation.topic
    }
  });
  console.log("✅ Response sent successfully");
} catch (err) {
  console.error("❌ Error while sending response:", err);
}


  } catch (err) {
    console.error("❌ MCP orchestration error:", err);
    res.status(500).json({ error: 'MCP orchestration failed.' });
  }
});


//----------------------

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});


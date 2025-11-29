console.log("📢 app.js loaded");

// ==================== Session State ====================
let messageHistory = [];
let lastUserMessage = '';
let previousIncludeContext = true;  // to track change from TRUE to FALSE

// ==================== Model Selection ====================
const availableModels = {
  mistral: 'mistralai/mistral-7b-instruct',
  claude: 'anthropic/claude-3-haiku',
  gpt4: 'openai/gpt-4.1-nano'
};
let selectedModel = availableModels.claude;

document.getElementById('modelSelector').addEventListener('change', (e) => {
  selectedModel = availableModels[e.target.value];
  console.log("✅ Model switched to:", selectedModel);
});

// ==================== UI Events ====================
document.getElementById('userInput').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    await handleChatSubmission();
  }
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  let userMessage = document.getElementById('userInput').value.trim();

  if (!userMessage && lastUserMessage) {
    document.getElementById('userInput').value = lastUserMessage;
    userMessage = lastUserMessage;
  }
  if (!attributeId || !attributeValue || !userMessage) {
    console.warn("⚠️ Cannot refresh: one or more fields are empty.");
    return;
  }
  handleChatSubmission();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('chatLog').innerHTML = '';
  document.getElementById('userInput').value = '';
  messageHistory = [];
  lastUserMessage = '';

  document.getElementById('attributeId').value = '';
  document.getElementById('attributeValue').value = '';
  document.getElementById('includeContext').checked = true;
  document.getElementById('concise').checked = false;

  document.getElementById('profileApiUrl').value = '';
  document.getElementById('collectApiUrl').value = '';
  document.getElementById('traceId').value = '';
  document.getElementById('industryContext').value = '';
  document.getElementById('recommendationHint').value = '';
});

// ==================== UI Helpers ====================
function appendMessage(role, text) {
  const chatLog = document.getElementById('chatLog');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerText = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}

const getVal = (id) => (document.getElementById(id)?.value || '').trim();
const getChecked = (id) => !!document.getElementById(id)?.checked;

// ==================== Main UI Flow ====================
async function handleChatSubmission() {
  const attributeId = getVal('attributeId');
  const attributeValue = getVal('attributeValue');
  const userMessage = getVal('userInput');
  const includeContext = getChecked('includeContext');
  const isConcise = getChecked('concise');

  const profileApiUrl = getVal('profileApiUrl');
  const collectApiUrl = getVal('collectApiUrl');
  const traceId = getVal('traceId');
  const industryContext = getVal('industryContext');
  const recommendationHint = getVal('recommendationHint');

  if (!attributeId || !attributeValue || !userMessage) return;

  appendMessage('user', userMessage);
  messageHistory.push({ role: "user", content: userMessage });

  lastUserMessage = userMessage;
  document.getElementById('userInput').value = '';

  const typingBubble = appendMessage('bot', '...typing...');

  console.log("📤 Sending to MCP:", {
    profileApiUrl,
    collectApiUrl,
    traceId,
    industryContext,
    recommendationHint,
    attributeId,
    attributeValue,
    userMessage,
    model: selectedModel,
    isConcise,
    includeContext,
    messageHistory
  });

  try {
    const mcpResult = await invokeMCPOrchestratedChatInternal({
      attributeId,
      attributeValue,
      userMessage,
      model: selectedModel,
      isConcise,
      includeContext,
      messageHistory,
      profileApiUrl,
      collectApiUrl,
      traceId,
      industryContext,
      recommendationHint
    });

    const llmReply = mcpResult.llmReply || "⚠️ No reply generated.";
    console.log("🧠 llmReply returned from MCP:", llmReply);

    const sentiment = mcpResult.sentiment || "unknown";
    const intent = mcpResult.intent || "unknown";
    const topic = mcpResult.topic || "unknown";

    typingBubble.innerText = llmReply;
    messageHistory.push({ role: "assistant", content: llmReply });

    // Optional: send to Tealium here
    // sendChatToTealium(attributeValue, userMessage, llmReply, sentiment, intent, topic);
  } catch (err) {
    console.error("❌ Error during MCP orchestration:", err);
    typingBubble.innerText = "⚠️ Something went wrong when calling the MCP server.";
  }
}

// ==================== Network Call (renamed) ====================
// Formerly: callMCPOrchestratedChat
async function invokeMCPOrchestratedChatInternal({
  attributeId, attributeValue, userMessage, model, isConcise, includeContext,
  messageHistory,
  profileApiUrl, collectApiUrl, traceId, industryContext, recommendationHint
}) {
  const currentIncludeContext = includeContext;
  if (previousIncludeContext && !currentIncludeContext) {
    console.log("🔄 includeContext changed from true to false — clearing history");
    messageHistory = [{ role: "user", content: userMessage }];
  }
  previousIncludeContext = currentIncludeContext;

  try {
    const AGENT_URL = '/agent';
    const started = performance.now();
//    const response = await fetch('http://localhost:3002/agent', {
    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          attributeId,
          attributeValue,
          userMessage,
          model,
          isConcise,
          includeContext,
          history: messageHistory,
          profileApiUrl,
          collectApiUrl,
          traceId,
          industryContext,
          recommendationHint
        }
      })
    });

    const data = await response.json();
    const elapsed = Math.round(performance.now() - started);

    // Normalize some telemetry on the way out
    const out = data?.output || {};
    out.latencyMs = elapsed;
    return out;

  } catch (err) {
    console.error("MCP server call failed:", err);
    return { llmReply: "⚠️ MCP server error.", sentiment: "unknown", intent: "unknown", topic: "unknown", error: true };
  }
}

// ==================== Widget Bridge (new) ====================
// The floating widget (function mode) will call this:
window.callMCPOrchestratedChat = async function (message, history = [], sessionId = null) {
  // Pull current UI/page parameters if present; fall back gracefully
  const attributeId = getVal('attributeId');
  const attributeValue = getVal('attributeValue');
  const includeContext = getChecked('includeContext');
  const isConcise = getChecked('concise');

  const profileApiUrl = getVal('profileApiUrl');
  const collectApiUrl = getVal('collectApiUrl');
  const traceId = getVal('traceId') || sessionId || ''; // prefer explicit traceId, else session
  const industryContext = getVal('industryContext');
  const recommendationHint = getVal('recommendationHint');

  // Prefer history passed by the widget; otherwise reuse current page state
  const historyToSend = Array.isArray(history) && history.length ? history : messageHistory;

  const started = performance.now();
  const res = await invokeMCPOrchestratedChatInternal({
    attributeId,
    attributeValue,
    userMessage: message,
    model: selectedModel,
    isConcise,
    includeContext,
    messageHistory: historyToSend,
    profileApiUrl,
    collectApiUrl,
    traceId,
    industryContext,
    recommendationHint
  });

  const latency = res?.latencyMs ?? Math.round(performance.now() - started);

  // Return a normalized shape for the widget
  return {
    text: res.llmReply || "⚠️ No reply generated.",
    reply: res.llmReply || "⚠️ No reply generated.",
    model: selectedModel,
    meta: {
      latency,
      sentiment: res.sentiment || "unknown",
      intent: res.intent || "unknown",
      topic: res.topic || "unknown",
      sessionId: traceId || sessionId || null,
      source: "app.js-bridge"
    }
  };
};

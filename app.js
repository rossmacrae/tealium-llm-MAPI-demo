console.log("📢 app.js loaded");


// initialise user and LLM messages
let messageHistory = [];
let lastUserMessage = '';

// ----------------- LLM Model selection ------------------------------
// Define available Models (mapped to OpenRouter model names)
const availableModels = {
  mistral: 'mistralai/mistral-7b-instruct',
  claude: 'anthropic/claude-3-haiku',
  gpt4: 'openai/gpt-4.1-nano'
};

// Set the default model
let selectedModel = availableModels.claude;

// Hook up model selector dropdown
document.getElementById('modelSelector').addEventListener('change', (e) => {
  selectedModel = availableModels[e.target.value];
  console.log("✅ Model switched to:", selectedModel);
});

// Listen for User hitting return after entering message
document.getElementById('userInput').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    await handleChatSubmission();
  }
});


// --------- Main code for handing the chat ---------------------------
// --------- will be called on user message entry ---------------------
// --------- or on press of the Refresh button ------------------------ 
async function handleChatSubmission() {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  const userMessage = document.getElementById('userInput').value.trim();
  const includeContext = document.getElementById('includeContext').checked;
  const isConcise = document.getElementById('concise').checked;

console.log("📢 in handleChatSubmission");


  if (!attributeId || !attributeValue || !userMessage) return;

  appendMessage('user', userMessage);
  messageHistory.push({ role: "user", content: userMessage });

  lastUserMessage = userMessage;
  document.getElementById('userInput').value = '';

  // Visual holding pattern in UI while LLM interaction takes place
  const typingBubble = appendMessage('bot', '...typing...');
  
console.log("📢 about to call MCP server");


  // Call the MCP Server
try {
  const mcpResult = await callMCPOrchestratedChat({
    attributeId,
    attributeValue,
    userMessage,
    model: selectedModel,
    isConcise,
    includeContext,
    messageHistory
  });

  console.log("📢 finished with the MCP server");
  console.log("🧠 MCP result:", mcpResult);

  let llmReply = mcpResult.llmReply || "⚠️ No reply generated.";
  console.log("🧠 llmReply returned from MCP:", llmReply);

  const sentiment = mcpResult.sentiment || "unknown";
  const intent = mcpResult.intent || "unknown";
  const topic = mcpResult.topic || "unknown";

  typingBubble.innerText = llmReply;
  messageHistory.push({ role: "assistant", content: llmReply });

  // Optional: Send to Tealium if you want to here
  // sendChatToTealium(attributeValue, userMessage, llmReply, sentiment, intent, topic);
} catch (err) {
  console.error("❌ Error during MCP orchestration:", err);
  typingBubble.innerText = "⚠️ Something went wrong when calling the MCP server.";
}
}

// Event Listener for Refresh button.
// Collects current User ID and Message from the page
document.getElementById('refreshBtn').addEventListener('click', () => {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  let userMessage = document.getElementById('userInput').value.trim();

  // If the input is empty, use the last message
  // This should be redundant... we may remove this later?
  if (!userMessage && lastUserMessage) {
    document.getElementById('userInput').value = lastUserMessage;
    userMessage = lastUserMessage;
  }
  // Error handling if ID or message are empty
  if (!attributeId || !attributeValue || !userMessage) {
    console.warn("⚠️ Cannot refresh: one or more fields are empty.");
    return;
  }

  // Call shared chat logic
  // refresh the chat based on the current parameters
  handleChatSubmission();
});

// Event Listener for Reset button.
// Resets all user input settings to empty/defaults
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('attributeId').value = '';
  document.getElementById('attributeValue').value = '';
  document.getElementById('userInput').value = '';
  document.getElementById('chatLog').innerHTML = '';
  document.getElementById('includeContext').checked = true;
  document.getElementById('concise').checked = false;
  messageHistory = [];
  lastUserMessage = '';
});


// FUNCTION: Append the user's message to the chat bubble
function appendMessage(role, text) {
  const chatLog = document.getElementById('chatLog');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerText = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}


// Function: Call MCP Server ----- BEGIN -----
async function callMCPOrchestratedChat({ attributeId, attributeValue, userMessage, model, isConcise, includeContext, messageHistory }) {
  
  console.log("📢 I'm in callMCPOrchestratedChat");
  try {
    const response = await fetch('http://localhost:3002/run', {
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
          history: messageHistory
        }
      })
    });

    console.log("📢 Have doen the response fetch");

    const result = await response.json();

    console.log("📢 got past await response");

    if (result?.output?.llmReply) {
      return result.output;
    } else {
      console.warn("⚠️ Unexpected MCP response format:", result);
      return { llmReply: "⚠️ MCP returned no reply.", sentiment: "unknown", intent: "unknown", topic: "unknown" };
    }
  } catch (err) {
    console.error("MCP server call failed:", err);
    return { llmReply: "⚠️ MCP server error.", sentiment: "unknown", intent: "unknown", topic: "unknown" };
  }
}




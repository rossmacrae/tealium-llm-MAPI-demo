let messageHistory = [];
let lastUserMessage = '';


// Available Models (mapped to OpenRouter model names)
const availableModels = {
  mistral: 'mistralai/mistral-7b-instruct',
  claude: 'anthropic/claude-3-haiku',
  gpt4: 'openai/gpt-4-nano'
};

// Default model
let selectedModel = availableModels.claude;

// Hook up model selector dropdown
document.getElementById('modelSelector').addEventListener('change', (e) => {
  selectedModel = availableModels[e.target.value];
  console.log("✅ Model switched to:", selectedModel);
});

document.getElementById('sendBtn').addEventListener('click', async () => {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  const userMessage = document.getElementById('userInput').value.trim();

  if (!attributeId || !attributeValue || !userMessage) return;

  // Append user message
  appendMessage('user', userMessage);
  messageHistory.push({ role: "user", content: userMessage });

  // Fetch visitor profile
  let visitorData = {};
  try {
    const response = await fetch(`http://localhost:3001/api/visitor?attributeId=${attributeId}&attributeValue=${encodeURIComponent(attributeValue)}`);
    visitorData = await response.json();
  } catch (err) {
    appendMessage('bot', 'Error fetching visitor data.');
    return;
  }

  // Show typing placeholder
  const typingBubble = appendMessage('bot', '...typing...');

  // Get LLM reply
  let llmReply = await callOpenRouter(visitorData, messageHistory, selectedModel);

  // ✅ Log the raw reply for debugging
  console.log("🧠 Raw LLM reply:", llmReply);
  // ✅ Pre-process to ensure closing brace if missing
  // This is/was needed for mistralai/mistral-7b-instruct which frequently mis-configured the JSON
  llmReply = llmReply.trim();
  if (!llmReply.endsWith('}')) {
    console.warn("⚠️ LLM reply missing closing brace, auto-fixing.");
    llmReply += '}';
  }

// ✅ Log for diagnostics
// console.log("🧠 Processed LLM reply:", llmReply);

  // Try to extract metadata from JSON block at the end
  let sentiment = "unknown";
  let intent = "unknown";
  let topic = "unknown";
  
  // Match JSON with or without markdown code block
  const jsonMatch = llmReply.match(/```(?:json)?\s*({[\s\S]*?})\s*```|({[^}]*"sentiment"[^}]*"intent"[^}]*"topic"[^}]*})?\s*$/i);

  let rawBlock = jsonMatch?.[1] || jsonMatch?.[2];

if (!rawBlock) {
  console.warn("⚠️ No JSON block detected in LLM reply.");
  typingBubble.innerText = llmReply;
} else {
  rawBlock = rawBlock.trim();


  try {
    const metadata = JSON.parse(rawBlock);
    sentiment = metadata.sentiment || sentiment;
    intent = metadata.intent || intent;
    topic = metadata.topic || topic;

    typingBubble.innerText = llmReply.replace(jsonMatch[0], '').trim();
  } catch (err) {
    console.warn("Could not parse metadata JSON:", err);
    typingBubble.innerText = llmReply;
  }
}


  // Save bot reply to memory (without metadata)
  messageHistory.push({ role: "assistant", content: typingBubble.innerText });

  // Send interaction to Tealium
  sendChatToTealium(attributeValue, userMessage, typingBubble.innerText, sentiment, intent, topic);
  lastUserMessage = userMessage;
  document.getElementById('userInput').value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('attributeId').value = '';
  document.getElementById('attributeValue').value = '';
  document.getElementById('userInput').value = '';
  document.getElementById('chatLog').innerHTML = '';
  messageHistory = [];
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  let userMessage = document.getElementById('userInput').value.trim();

  // If user input is empty, reuse the last message
  if (!userMessage && lastUserMessage) {
    document.getElementById('userInput').value = lastUserMessage;
    userMessage = lastUserMessage;
  }

  if (!attributeId || !attributeValue || !userMessage) {
    console.warn("⚠️ Cannot refresh: one or more fields are empty.");
    return;
  }

  // Simulate send button press with current values
  document.getElementById('sendBtn').click();
});


function appendMessage(role, text) {
  const chatLog = document.getElementById('chatLog');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerText = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}

async function callOpenRouter(visitorData, history, model = 'anthropic/claude-3-haiku') {

  const apiKey = process.env.OPENROUTER_API_KEY;

  const systemPrompt = `
Your name is Terry. You are a friendly and helpful Customer Service Representative at TealTel, a modern telecommunications company.

Your role is to assist customers by responding to their questions, offering plan advice, and helping them make the most of their current services. Be polite, clear, and always personalize your replies based on their customer profile and past messages.

Adjust your tone and intent based on the following:
- If the customer is in a high churn risk category, be especially proactive and reassuring.
- If the customer is in a low churn category with a long tenure or high loyalty tier, be warm and appreciative.
- If the customer is new or has a short tenure, be welcoming and helpful.

Please respond to the user.

- Address the customer by their first name
- Refer to your company as "TealTel".
- Sign off in a friendly tone, e.g. "— Terry @ TealTel"
- Keep your entire response under 1000 characters
- only use plain text in your response

Interpret the user's sentiment, intent and their topic in a single word each.
After your reply, on a new line, include a valid JSON object with exactly these 3 keys:
"sentiment", "intent", and "topic".
The JSON should look like this, with the relevant values for each key:
{
  "sentiment": "sentiment-value",
  "intent": "intent-value",
  "topic": "topic-value"
}
1. Your JSON block must be complete and valid, with a closing curly brace "}".
2. Do not include any explanation, prefix, or suffix — just the JSON.
3. Do not wrap the JSON in backticks or code blocks. Just include the raw JSON object on its own line.
4. Apart from the closing curly brace, do not output anything after the JSON block
`.trim();

  const profileSummary = buildProfileSummary(visitorData);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Visitor Profile:\n${profileSummary}` },
    ...history
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:8000',
      'X-Title': 'Tealium Chat App'
    },
    body: JSON.stringify({ model, messages })
  });

  const data = await response.json();

  if (response.ok && data.choices?.length > 0) {
    return data.choices[0].message.content;
  }

  console.error("OpenRouter error:", data);
  return `OpenRouter error: ${data.error?.message || 'Unknown error'}`;
}

function buildProfileSummary(visitorData) {
  const props = visitorData.properties || {};
  const metrics = visitorData.metrics || {};
  const flags = visitorData.flags || {};

  const currentProducts = Object.entries(flags)
    .filter(([_, value]) => value === true)
    .map(([key]) => key.replace("Product Flag ", ""))
    .join(', ') || "None";

  const churnScore = metrics["Customer Propensity Churn"] ?? "N/A";
  const churnLevel = churnScore > 60 ? "High" : "Low";

  return `
Customer First Name: ${props["Customer Firstname"] || "Unknown"} 
Customer Last Name:  ${props["Customer Lastname"] || ""}
Email: ${props["Customer Email"] || "N/A"}
Loyalty Tier: ${props["Customer Loyalty Tier"] || "N/A"}
Plan Type: ${props["Customer Plan Type"] || "N/A"}
Last Product Viewed: ${props["Last Category Viewed"] || "N/A"}
Lifetime Value: $${metrics["Customer LTV"] ?? "N/A"}
Days Till Next Renewal: ${metrics["Days Till Next Renewal"] ?? "N/A"}
Tenure: ${metrics["Customer Tenure"] ?? "N/A"} month(s)
Churn Risk Score: ${churnScore} (${churnLevel})
Current Products Held: ${currentProducts}
  `.trim();
}

function sendChatToTealium(attributeValue, userMessage, llmReply, sentiment, intent, topic) {
  const collectUrl = new URL("https://collect.tealiumiq.com/event");

  collectUrl.searchParams.set("tealium_account", "csm-ross-macrae");
  collectUrl.searchParams.set("tealium_profile", "demo-telco");
  collectUrl.searchParams.set("tealium_datasource", "31o5i9");
  collectUrl.searchParams.set("tealium_event", "chat_interaction_event");

  collectUrl.searchParams.set("chat_email_address", attributeValue);
  collectUrl.searchParams.set("chat_user_message", userMessage.slice(0, 1000));
  collectUrl.searchParams.set("chat_llm_reply", llmReply.slice(0, 1000));
  collectUrl.searchParams.set("chat_sentiment", sentiment);
  collectUrl.searchParams.set("chat_intent", intent);
  collectUrl.searchParams.set("chat_topic", topic);

  fetch(collectUrl.toString(), { method: "GET" }).catch(err => {
    console.error("Tealium Collect error:", err);
  });
}


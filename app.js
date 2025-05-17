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

  if (!attributeId || !attributeValue || !userMessage) return;

  appendMessage('user', userMessage);
  messageHistory.push({ role: "user", content: userMessage });

  lastUserMessage = userMessage;
  document.getElementById('userInput').value = '';

  // fetch user profile data via Tealium Moments API (MAPI)
  let visitorData = {};
  if (includeContext) {
    try {
      const response = await fetch(`http://localhost:3001/api/visitor?attributeId=${attributeId}&attributeValue=${encodeURIComponent(attributeValue)}`);
      visitorData = await response.json();
    } catch (err) {
      appendMessage('bot', 'Error fetching visitor data.');
      return;
    }
  }

  // Visual holding pattern in UI while LLM interaction takes place
  const typingBubble = appendMessage('bot', '...typing...');
  let llmReply = await callOpenRouter(visitorData, messageHistory, selectedModel, isConcise);

  // Debugging only:
  console.log("🧠 Raw LLM reply:", llmReply);
  console.log("✉️ LLM reply length:", llmReply.length);
  console.log("📝 Word count:", llmReply.split(/\s+/).length);
  console.log("------------ \n",);

  // --------------- JSON Sentiment object in LLM reply------------------------
  // JSON structure correction for mistral model, based on typical observed error
  llmReply = llmReply.trim();
  if (!llmReply.endsWith('}') && selectedModel.includes('mistral')) {
    console.warn("⚠️ LLM reply missing closing brace, auto-fixing.");
    llmReply += '}';
  }

  // initialise sentiment
  let sentiment = "unknown";
  let intent = "unknown";
  let topic = "unknown";

  // parse out returned JSON sentiment object from LLM reply
  const jsonMatch = llmReply.match(/```(?:json)?\s*({[\s\S]*?})\s*```|({[^}]*"sentiment"[^}]*"intent"[^}]*"topic"[^}]*})?\s*$/i);
  let rawBlock = jsonMatch?.[1] || jsonMatch?.[2];

  // Asign JSON sentiment attributes to local variables 
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
  // Push the current message into messageHistory
  messageHistory.push({ role: "assistant", content: typingBubble.innerText });
  // Send the response and the sentiment attributes to Tealium
  sendChatToTealium(attributeValue, userMessage, typingBubble.innerText, sentiment, intent, topic);
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

// FUNCTION: Call the LLM with the user's data, the chat history so far,
//           the model (with default) and the concise flag (with default),
//           and the prompt, which is defined here
async function callOpenRouter(visitorData, history, model = 'anthropic/claude-3-haiku', isConcise = false) {

  const apiKey = OPENROUTER_API_KEY;

  const today = new Date().toLocaleDateString('en-AU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Declare prompt attributes for controlling size of LLM response
const wordLimit = isConcise ? "IMPORTANT: Your response MUST be concise — no more than 60 words.\n\n" : "";
const charLimit = isConcise ? "" : "IMPORTANT: You may be verbose, but keep your response under 1000 characters\n\n";


// BUILD THE LLM PROMPT - THIS IS WHERE THE LLM MAGIC HAPPENS
// Change this if adapting this app for a different industry context
const systemPrompt = `

${wordLimit}
${charLimit}

Your name is Terry. You are a friendly and helpful Customer Service Representative at TealTel, a modern telecommunications company.

Today’s date is ${today}.

Your role is to assist customers by responding to their questions, offering plan advice, and helping them make the most of their current services. Be polite, clear, and always personalize your replies based on their customer profile and past messages.

- Only use plain text in your response.

Adjust your tone and intent based on the following:
- If the customer is in a high churn risk category, be especially proactive and reassuring.
- If the customer is in a low churn category with a long tenure or high loyalty tier, be warm and appreciative.
- If the customer is new or has a short tenure, be welcoming and helpful.
- if the customer is on a prepaid plan, suggest they consider a postpaid plan.

Please respond to the user.

- Address the customer by their first name.
- Refer to your company as "TealTel".
- Sign off in a friendly tone, e.g. "— Terry @ TealTel".

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

// Debugging only:
console.log("🧾 Final system prompt:\n", systemPrompt);


// Use visitorData to build profileSummary
const profileSummary = buildProfileSummary(visitorData);

// Construct the message history to send to the LLM.
// Includes: system prompt, optional visitor profile, and past user/assistant messages
const messages = [
  { role: "system", content: systemPrompt },
  ...(includeContext ? [{ role: "system", content: `Visitor Profile:\n${buildProfileSummary(visitorData)}` }] : []),
  ...history
];

// fetch the response from the LLM
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
// ------------ END OF callOpenRouter function declaration --------------

// FUNCTION: build profile summary from MAPI-returned data 
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


// FUNCTION: send chat result to Tealium
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


let messageHistory = [];

document.getElementById('sendBtn').addEventListener('click', async () => {
  const attributeId = document.getElementById('attributeId').value.trim();
  const attributeValue = document.getElementById('attributeValue').value.trim();
  const userMessage = document.getElementById('userInput').value.trim();

  if (!attributeId || !attributeValue || !userMessage) return;

  // Append user message to chat log
  appendMessage('user', userMessage);

  // Fetch visitor profile
  let visitorData = {};
  try {
    const response = await fetch(`http://localhost:3001/api/visitor?attributeId=${attributeId}&attributeValue=${encodeURIComponent(attributeValue)}`);
    visitorData = await response.json();
  } catch (err) {
    appendMessage('bot', 'Error fetching visitor data.');
    return;
  }

  // Add to conversation memory
  messageHistory.push({ role: "user", content: userMessage });

  // Show typing bubble
  const typingBubble = appendMessage('bot', '...typing...');

  // Get full LLM reply with history
  const llmReply = await callOpenRouter(visitorData, messageHistory);
  typingBubble.innerText = llmReply;

  // Save bot reply to memory
  messageHistory.push({ role: "assistant", content: llmReply });
  // Send chat to Tealium:
  const truncatedReply = llmReply.slice(0, 1000); // trim to max 1000 characters
  sendChatToTealium(attributeValue, userMessage, llmReply);

  document.getElementById('userInput').value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('attributeId').value = '';
  document.getElementById('attributeValue').value = '';
  document.getElementById('userInput').value = '';
  document.getElementById('chatLog').innerHTML = '';
  messageHistory = [];
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

async function callOpenRouter(visitorData, history) {
  const apiKey = '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'; // Replace with your OpenRouter API key
  const model = 'mistralai/mistral-7b-instruct';


  const systemPrompt = `
  Your name is Terry. You are a friendly and helpful Customer Service Representative at TealTel, a modern telecommunications company.
  
  Your role is to assist customers by answering their questions, providing relevant plan or product suggestions, and helping them make the most of their current services. You always personalize your responses based on the customer's profile and recent conversation history.
  
  🟢 Adjust your tone and intent based on the following:
  - If the customer is in a high churn risk category, be especially **proactive and reassuring**, offer valuable reasons to stay, and avoid overwhelming them with upsells.
  - If the customer is in a low churn category with a long tenure or high loyalty tier, be **warm and appreciative**, thank them for their loyalty, and offer suitable value-adds.
  - If the customer is new or has a short tenure, be **welcoming and helpful**, and offer guidance to get started with TealTel services.
  
  ✅ Always refer to your company as "TealTel" (never say "[Your Company Name]").
  ✅ Speak naturally, clearly, and politely.
  ✅ When appropriate, you may suggest plans or products that are **relevant** and **not already held** by the customer.
  ✅ Avoid being overly formal — sound human and supportive.
  ✅ Keep your entire response under 1000 characters.

  Sign off conversationally if appropriate, e.g. "Let me know if you'd like help with anything else — Terry @ TealTel".


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
  const churnLevel = churnScore > 50 ? "High" : "Low";

  return `
Customer Name: ${props["Customer Firstname"] || "Unknown"} ${props["Customer Lastname"] || ""}
Email: ${props["Customer Email"] || "N/A"}
Loyalty Tier: ${props["Customer Loyalty Tier"] || "N/A"}
Plan Type: ${props["Customer Plan Type"] || "N/A"}
Last Product Category Viewed: ${props["Last Category Viewed"] || "N/A"}
Lifetime Value: $${metrics["Customer LTV"] ?? "N/A"}
Days Till Next Renewal: ${metrics["Days Till Next Renewal"] ?? "N/A"}
Tenure: ${metrics["Customer Tenure"] ?? "N/A"} month(s)
Churn Risk Score: ${churnScore} (${churnLevel})
Current Products Held: ${currentProducts}
  `.trim();
}

function sendChatToTealium(attributeValue, userMessage, llmReply) {
  const collectUrl = new URL("https://collect.tealiumiq.com/event");

  collectUrl.searchParams.set("tealium_account", "csm-ross-macrae");
  collectUrl.searchParams.set("tealium_profile", "demo-telco");
  collectUrl.searchParams.set("tealium_datasource", "31o5i9");
  collectUrl.searchParams.set("tealium_event", "chat_interaction_event");

  collectUrl.searchParams.set("chat_email_address", attributeValue);
  collectUrl.searchParams.set("chat_user_message", userMessage);
  collectUrl.searchParams.set("chat_llm_reply", llmReply);

  // Fire and forget
  fetch(collectUrl.toString(), {
    method: "GET"
  }).then(res => {
    if (!res.ok) {
      console.error("Tealium Collect API error:", res.statusText);
    }
  }).catch(err => {
    console.error("Tealium Collect API network error:", err);
  });
}


  
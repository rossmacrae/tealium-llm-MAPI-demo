# Tealium + LLM Demo App

This project demonstrates how to integrate **customer context data from Tealium** with a **Large Language Model (LLM)** to power personalized, intelligent chat experiences.

It includes:
- A browser-based chatbot interface
- Live fetching of customer profiles via the Tealium Moments API
- Dynamic prompt engineering to enrich LLM interactions
- Sentiment, intent, and topic extraction from model responses
- Event tracking via Tealium Collect API

---

## 🔧 How It Works

1. A user provides an identifier (e.g. email or ID) and sends a message.
2. The app calls a local proxy server to fetch the user's profile from Tealium.
3. The user’s message + context data are combined into a structured prompt.
4. The enriched prompt is sent to an LLM (e.g. Claude or GPT) via OpenRouter.
5. The LLM generates a personalized reply **and a metadata JSON block**.
6. The response and metadata are sent to Tealium Collect for tracking.

---

## 📦 Tech Stack

- **HTML + CSS + JS** frontend
- **Node.js + Express** proxy server (`proxy-server.js`)
- **OpenRouter API** for LLM access
- **Tealium Moments API** (profile fetch)
- **Tealium Collect API** (event tracking)

---

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/rossmacrae/tealium-llm-MAPI-demo.git
cd tealium-llm-MAPI-demo
```

### 2. Set up `config.js`

Create a `config.js` file in the root directory and insert your OpenRouter API key:

```js
// config.js
const OPENROUTER_API_KEY = 'sk-or-your-api-key';
```

> 🔒 This file is listed in `.gitignore` and should not be committed.

### 3. Start the local proxy server

Install dependencies and run the server:

```bash
npm install express axios cors
node proxy-server.js
```

> This server acts as a secure proxy for calling the Tealium Moments API.

### 4. Open the chat app

Use a local web server (like VS Code Live Server) and open `index.html` in your browser.

---

## 💬 Features

- Chat UI with alternating message bubbles
- Dynamic model selection (Claude, GPT, Mistral)
- Typing animation for LLM responses
- JSON extraction for `sentiment`, `intent`, and `topic`
- Refresh button to re-request with updated profile data

---

## 🧠 LLM JSON Output Format

The LLM is instructed to append a JSON object like this to its response:

```json
{
  "sentiment": "positive",
  "intent": "info_request",
  "topic": "broadband"
}
```

This block is extracted using regex and passed to Tealium Collect via API.

---

## 📤 Tealium Collect API

Each chat interaction is logged as an event using Tealium Collect. The following data is sent:

- User identifier (e.g. email)
- Message text
- LLM reply
- Extracted sentiment / intent / topic

---

## 🧪 Local Development Tips

- Modify `callOpenRouter()` in `app.js` to change the prompt or model.
- Update `buildProfileSummary()` to adjust how visitor data is passed to the LLM.
- Test with various visitor IDs to simulate different profiles.
- Use the `reset` and `refresh` buttons to control chat flow.

---

## 📄 License

MIT License — free to use, modify, and share.

---

## 👥 Credits

Created by [Ross Macrae](https://github.com/rossmacrae) as a Tealium demo showcasing customer data enrichment with AI.

For internal use and extension by Tealium colleagues and partners.


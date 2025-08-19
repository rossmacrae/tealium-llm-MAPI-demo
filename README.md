# Tealium LLM MAPI Demo

This project demonstrates how to build a personalized AI-powered chat experience by integrating customer data from Tealium with a Large Language Model (LLM). The system uses a modular, tool-based architecture for orchestrating data fetching, prompt construction, LLM interaction, and event tracking — all through a local MCP (Model Context Protocol) server.

---

## 🧠 Features

- Personalized chat assistant ("Tealie") using LLMs (Claude, GPT, Mistral)
- Fetches live customer profiles from Tealium MAPI using the MCP tool `fetch-profile`
- Builds dynamic prompts with real-time behavioral and profile data
- Interprets profile attributes, churn score, and product holdings
- Generates tailored LLM responses via OpenRouter
- Sends interaction outcomes back to Tealium using the Collect API
- Works across multiple industries using configurable context parameters
- Easy to extend and modify tools for new use cases or verticals

---

## 🧰 Tech Stack

- Node.js (MCP server + tools)
- HTML/CSS + Vanilla JS (Frontend UI)
- OpenRouter API (LLM access)
- Tealium MAPI (profile fetch)
- Tealium Collect API (event tracking)

---

## 🗂️ Project Structure

.
├── index.html # Main frontend UI
├── app.js # Client-side interaction logic
├── .env # Environment config (excluded from Git)
├── mcp-server/
│ ├── index.js # Entry point for MCP orchestration
│ ├── lib/ # Tool invocation logic
│ ├── tools/
│ │ ├── agent/ # Main orchestrator tool
│ │ ├── fetch-profile/ # Fetches profile from Tealium MAPI
│ │ ├── interpret-message/ # Analyzes user sentiment, intent, topic
│ │ ├── construct-prompt/ # Builds the LLM prompt
│ │ ├── generate-response/ # Calls the selected LLM model
│ │ ├── send-to-tealium/ # Sends interaction data to Tealium Collect
│ │ └── number-plate-risk-score/ # (Optional) Custom moderation tool


---

## 🧪 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/rossmacrae/tealium-llm-MAPI-demo.git
cd tealium-llm-MAPI-demo

### 2. Install 



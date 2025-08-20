# Tealium LLM MAPI Demo

This project demonstrates how to build a personalized AI-powered chat experience by integrating customer data from Tealium with a Large Language Model (LLM). The system uses a modular, tool-based architecture for orchestrating data fetching, prompt construction, LLM interaction, and event tracking — all through a local MCP (Model Context Protocol) server. In the latest release it uses a deterministic Agent to orchestrates all MCP tools. As it was built as a demo tool, the UI contains a collapsible section to collect parameters from the User to shape the demo e.g. the industry context, the Tealium profile to use, a hint to send to the Agent for product recommendations etc.

---

## What’s New in v3.0.x

- **MCP server + Agent orchestration** — the Agent now manages state, tool invocation, and prompt construction.

- **Number plate risk scoring tool** added (demo of industry-specific use case).

- **Updated install and run instructions** (simpler .env setup).

- **Cleaner UI** — chatbot app is now just a thin client.

## 🧠 Features

- Personalized chat assistant ("Tealie") using LLMs (Claude, GPT, Mistral)
- Fetches live customer profiles from Tealium MAPI using the MCP tool `fetch-profile`
- Builds dynamic prompts with real-time behavioral and profile data
- Interprets profile attributes, churn score, and product holdings
- Generates tailored LLM responses, using OpenRouter to call your selected LLM
- Sends interaction outcomes back to Tealium using the Collect API
- Works across multiple industries using configurable context parameters
- Easy to extend and modify tools for new use cases or verticals

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes bundled with Node.js)


## 🧰 Tech Stack

- Node.js (MCP server + tools)
- HTML/CSS + Vanilla JS (Frontend UI)
- OpenRouter API (LLM access)
- Tealium MAPI (profile fetch)
- Tealium Collect API (event tracking)
- Optional: `ngrok` or a reverse-proxy to enable local MCP tools to be called externally e.g. from a Tealium Function


## 🗂️ Project Structure

```
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
│ │ ├── number-plate-risk-score/ # Custom tool for an inustry-specific demo
│ │ ├── send-plate-score-to-tealium/ # Custom tool for an inustry-specific demo
```


## 🧪 Getting Started

### 1. Clone the Repository
Assuming you have git, do the following
```
git clone https://github.com/rossmacrae/tealium-llm-MAPI-demo.git
cd tealium-llm-MAPI-demo
```
If not, download the repo and unzip it.
### 2. Install dependencies 
From the directory where you unpacked the repo, in a terminal window:
```
npm install
```
(remember, node.js, which includes npm, is a prerequisite, so install it first if you din't have it - see link above)

### 3. Configure environment
Copy the example .env file and then edit it to replace the dummy key in there with your Openrouter API key:
```
cp .env.example .env
```
### 4. Start the MCP server & the front end
To run the demo, we need to start the NCP server, and open the web UI in a browser.  The following command will do both:
```
npm run chatdemo
```
### 5. Open the chatbot UI
Navigate to the demo chatbot UI at http://localhost:3000/.  Enter your demo parameters depending on the context of the demo youre' doing:
- MAPI URL for your chosen Tealium Profile
- Collect API URL for your chosen Tealium profile
- Trace ID (optional)
- Industry context 
- Industry context recommendation hint
- Attribute ID for the Visitor ID Attribute that the MAPI endpoint is using 
- Value for this Visitor ID Attribute (usually an email address) 
- Select your LLM model
- Enter your user message in the Message box
- Experiment with excluding the profile context, and with being concise.  

LLMs can be unruly, as can humans who write stuff - please provide feedback if you're seeing odd things or have suggestions!

---
## 🔧 Development Notes

- The MCP server must be running before the frontend can chat. 
- All tool calls (profile fetch, risk scoring, LLM) flow through the Agent.
- For external demos that wish to access MCP tools via API, expose the MCP server with ngrok or use a reverse proxy. e.g.:
```
ngrok http --url=your-ngrok-url.ngrok-free.app 3002
```

## 📦 Versioning

Current release: v3.0.0 (major update: MCP server + Agent orchestration).

Previous release: v2.2.0
 (pre-MCP, thin client with manual orchestration).

See [Changelog](./CHANGELOG.md) for release history.

## 📄 License

Licensed under the [MIT Licence](./LICENSE)

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const callTool = require('./lib/callTool');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// ✅ Agent endpoint
app.post('/agent', async (req, res) => {
  try {
    const input = req.body.input;
    console.log("📥 /agent endpoint hit. Input:", input);

    const result = await callTool('agent', input);
    console.log("✅ Agent returned:", result);

    res.json({ output: result });
  } catch (err) {
    console.error("❌ Agent failed:", err);
    res.status(500).json({ error: 'Agent failure' });
  }
});

/*
app.post('/agent', (req, res) => {
  console.log("✅ Received call to /agent with input:", req.body);
  res.json({ output: { llmReply: "Temporary stub reply from agent." } });
});
*/



// ✅ Optional: fallback for directly calling other tools (e.g. for testing)
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const input = req.body;

  try {
    const result = await callTool(toolName, input);
    res.json({ output: result });
  } catch (err) {
    console.error(`❌ Failed to run tool "${toolName}"`, err);
    res.status(500).json({ error: `Tool "${toolName}" failed` });
  }
});

// ✅ New external API route for Tealium Functions
app.post('/api/plate-risk', async (req, res) => {
  const { plate_text, context, industry } = req.body;

  if (!plate_text) {
    return res.status(400).json({ error: 'Missing required field: plate_text' });
  }

  try {
    const result = await callTool('number-plate-risk-score', {
      plate_text,
      context: context || "external_api",
      industry: industry || "custom-plates"
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Failed to call plate-risk tool:", err);
    res.status(500).json({ error: 'Failed to evaluate plate risk' });
  }
});


app.listen(PORT, () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});


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

app.listen(PORT, () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});


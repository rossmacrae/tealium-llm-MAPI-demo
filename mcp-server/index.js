const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Load tool manifest dynamically
const toolsDir = './tools';
const tools = [];

fs.readdirSync(toolsDir).forEach(toolName => {
  const toolPath = path.join(toolsDir, toolName, 'manifest.json');
  if (fs.existsSync(toolPath)) {
    const manifest = JSON.parse(fs.readFileSync(toolPath));
    tools.push({ name: toolName, manifest });
  }
});

// MCP-compatible endpoint for tool discovery
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.json({
    schema_version: "v1",
    name: "tealium-mcp",
    description: "MCP server exposing tools for customer profile fetch and event tracking",
    tools: tools.map(t => t.manifest)
  });
});

// POST endpoint to run a tool
app.post('/tools/:toolName', async (req, res) => {
  const toolName = req.params.toolName;
  const tool = tools.find(t => t.name === toolName);
  if (!tool) return res.status(404).json({ error: 'Tool not found' });

  try {
    const modulePath = path.join(__dirname, 'tools', toolName, 'index.js');
    const toolModule = require(modulePath);
    const output = await toolModule.run(req.body);
    res.json(output);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Execution failed' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});


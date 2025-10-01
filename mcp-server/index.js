const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
// You can keep body-parser, or switch to app.use(express.json()) below
const bodyParser = require('body-parser');
const callTool = require('./lib/callTool');
const pkg = require(path.resolve(__dirname, '../package.json'));

const app = express();
// const PORT = process.env.PORT || 3002;
const PORT = parseInt(process.env.PORT, 10) || 3002;

// CORS for both /agent (POST) and /widget (GET via XHR)
app.use(cors({
  origin: true,                                  // reflect request origin (fine for dev)
  methods: ['GET', 'POST', 'OPTIONS'],           // include GET for /widget
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'ngrok-skip-browser-warning'                 // <-- allow the custom header
  ],
  maxAge: 86400
}));
// app.options('*', cors()); // handle all preflights - breaks under Express 5, so:
app.options(/.*/, cors());

/* --- JSON body parsing --- */
app.use(bodyParser.json());
// (alternative) app.use(express.json());

// --- Health (fast + always available) ---
app.get('/health', (_req, res) => res.status(200).send('ok'));

// returns the deployed package.json version (+ timestamp)
app.get('/_version', (_req, res) => {
  res.json({ version: pkg.version, ts: Date.now() });
});

// echo route proves the server sees request bodies
app.post('/_echo', (req, res) => {
  res.json({ got: req.body });
});

// (Optional) simple readiness check (envs/tools present)
app.get('/ready', (_req, res) => {
  const required = ['OPENROUTER_API_KEY']; // add others as needed
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return res.status(503).json({ status: 'degraded', missing });
  }
  return res.status(200).json({ status: 'ready' });
});




/* --- (Optional) serve the widget statically under /widget --- */
app.use('/widget', express.static(path.resolve(__dirname, '../widget')));
// Now your TiQ HOST_BASE can be: https://<ngrok>/widget


/* ✅ Agent endpoint */
// app.post('/agent', async (req, res) => {
//   try {
//     const input = req.body.input;
//     console.log('📥 /agent endpoint hit. Input:', input);
//     const result = await callTool('agent', input);
//     console.log('✅ Agent returned:', result);
//     res.json({ output: result });
//   } catch (err) {
//     console.error('❌ Agent failed:', err);
//     res.status(500).json({ error: 'Agent failure' });
//   }
// });

/* ✅ Agent endpoint - with diagnostics */
app.post('/agent', async (req, res) => {
  try {
    const input = req.body?.input;
    console.log('📥 /agent hit. typeof input =', typeof input, 'keys =', input && Object.keys(input));

    const missing = [];
    if (!process.env.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');
    if (!input) missing.push('input (missing body.input)');
    if (input && !input.userMessage) missing.push('input.userMessage');

    if (missing.length) {
      return res.json({ output: { message: `[diag] Missing: ${missing.join(', ')}` }});
    }

    const result = await callTool('agent', input);
    console.log('✅ Agent returned type:', typeof result, 'value:', result);
    return res.json({ output: result ?? { message: '[diag] agent returned null/undefined' } });
  } catch (err) {
    console.error('❌ Agent failed:', err);
    return res.status(500).json({ error: 'Agent failure' });
  }
});


/* ✅ Optional: other tools */
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

/* ✅ External API route example */
app.post('/api/plate-risk', async (req, res) => {
  const { plate_text, context, industry } = req.body;
  if (!plate_text) return res.status(400).json({ error: 'Missing required field: plate_text' });
  try {
    const result = await callTool('number-plate-risk-score', {
      plate_text,
      context: context || 'external_api',
      industry: industry || 'custom-plates'
    });
    res.json(result);
  } catch (err) {
    console.error('❌ Failed to call plate-risk tool:', err);
    res.status(500).json({ error: 'Failed to evaluate plate risk' });
  }
});

// app.listen(PORT, () => {
//   console.log(`✅ MCP server running at http://localhost:${PORT}`);
// });

app.listen(PORT, '0.0.0.0', () => console.log(`MCP server listening on ${PORT}`));

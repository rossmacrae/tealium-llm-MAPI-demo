// console.log("Starting proxy server...");


const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  console.log(`📨 Incoming to proxy: ${req.method} ${req.path}`);
  next();
});


// Enable CORS for your frontend (or use cors())
app.use(cors());
app.use(express.json());

app.get('/api/visitor', async (req, res) => {
  const { url: baseUrl, attributeId, attributeValue } = req.query;

  if (!baseUrl || !attributeId || !attributeValue) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  const tealiumApiUrl = `${baseUrl}?attributeId=${attributeId}&attributeValue=${attributeValue}`;

  try {
    const response = await axios.get(tealiumApiUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Proxy error' });
  }
});

app.listen(PORT, () => {
  console.log(`Local proxy server running at http://localhost:${PORT}`);
});


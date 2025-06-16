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
  const { attributeId, attributeValue } = req.query;

  const tealiumApiUrl = `https://personalization-api.ap-southeast-2.prod.tealiumapis.com/personalization/accounts/csm-ross-macrae/profiles/demo-telco/engines/93152c19-95f5-443a-9223-6a394d854ff9?attributeId=${attributeId}&attributeValue=${attributeValue}`;

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

